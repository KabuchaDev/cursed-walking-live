import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {root,read,write,settings as baseSettings,log,catalog} from './common.mjs';
import {rcon} from './rcon.mjs';
import {initialState,receiveEvent,prepareFlight,settleFlight} from './events.mjs';
const rules=read('mappings.json');
const rewards=read('rewards.json');
const testMode=process.argv.includes('--test');
const settings=testMode?{...baseSettings,controlPort:21216,tikfinityUrl:'ws://127.0.0.1:21214/'}:baseSettings;
const stateFile=testMode?'test-events-state.json':'events-state.json';
if(testMode&&!read('server/kubejs/cw-live-test-backup.json').active)throw new Error('Start the Minecraft test backup first');
const state=fs.existsSync(path.join(root,stateFile))?read(stateFile):initialState(!testMode&&fs.existsSync(path.join(root,'likes-state.json'))?read('likes-state.json'):undefined);
const likes=state.likes;
const saveState=()=>write(stateFile,state);
if(state.version!==2||!Number.isInteger(likes.pending)||likes.pending<0||!Array.isArray(state.queue))throw new Error('Invalid saved event state; inspect backup before restarting');
const pool=rules.likes?.entities??[];
if(rules.likes?.enabled&&(!pool.length||pool.some(id=>!catalog().some(e=>e.id===id))||!Number.isSafeInteger(rules.likes.threshold)||rules.likes.threshold<1))throw new Error('Invalid likes configuration');
let stopping=false,tk,sb,tkReady=false,sbReady=false,busy=false;
let lastEvent=null,eventCounts={},lastResult=null;
let minecraft={connected:false,message:'Starting'};
let queueRunning=false,nextSpawnAt=0;
const pending=new Map(),timers=new Set();
for(const url of [settings.tikfinityUrl,settings.streamerbotUrl]){const u=new URL(url);if(u.protocol!=='ws:'||u.hostname!=='127.0.0.1')throw new Error('Connections must stay on localhost');}
function later(fn){const timer=setTimeout(()=>{timers.delete(timer);if(!stopping)fn();},5000);timers.add(timer);}
function request(body){return new Promise((resolve,reject)=>{
 if(sb?.readyState!==WebSocket.OPEN)return reject(new Error('Streamer.bot offline'));
 const id=randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(new Error('Streamer.bot timeout'));},5000);
 pending.set(id,{resolve,reject,timer});sb.send(JSON.stringify({...body,id}));
});}
function connectSb(){
 sb=new WebSocket(settings.streamerbotUrl);
 sb.addEventListener('open',async()=>{try{const r=await request({request:'GetActions'});sbReady=r.actions?.some(a=>a.name===settings.actionName&&a.enabled)===true;if(!sbReady)throw new Error('Cursed Walking action missing');log('Streamer.bot connected; Cursed Walking action ready.');}catch(e){log(e.message);sb.close();}});
 sb.addEventListener('message',e=>{try{const r=JSON.parse(e.data),p=pending.get(r.id);if(p){clearTimeout(p.timer);pending.delete(r.id);r.status==='error'?p.reject(new Error(r.error??'Action rejected')):p.resolve(r);}}catch{}});
 sb.addEventListener('error',()=>{});
 sb.addEventListener('close',()=>{sbReady=false;for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Streamer.bot disconnected'));}pending.clear();later(connectSb);});
}
function connectTk(){
 tk=new WebSocket(settings.tikfinityUrl);
 tk.addEventListener('open',()=>{tkReady=true;log('TikFinity connected: likes, follow, and '+rules.gifts.length+' gift mappings ready.');});
 tk.addEventListener('message',e=>{if(typeof e.data!=='string'||e.data.length>1048576)return;try{
   const data=JSON.parse(e.data),kind=String(data.event??data.type??'unknown').slice(0,40);
   eventCounts[kind]=(eventCounts[kind]??0)+1;lastEvent={kind,at:new Date().toISOString()};
   if(receiveEvent(state,data,rules)){saveState();log('Accepted '+kind+' event; queued effects='+state.queue.reduce((sum,j)=>sum+j.remaining,0));}
 }catch(error){log('Event error: '+error.message);}});
 tk.addEventListener('error',()=>{});tk.addEventListener('close',()=>{tkReady=false;later(connectTk);});
}
async function checkMinecraft(){try{const reply=await rcon('list',settings);minecraft={connected:/There are \d+/.test(reply),message:reply};}catch(e){minecraft={connected:false,message:e.message};}}
function towerStatus(){
 if(rules.mode!=='tower_defense')return null;
 try{const file='server/kubejs/cw-td-status.json',status=read(file);return {...status,fresh:Date.now()-fs.statSync(path.join(root,file)).mtimeMs<5000};}
 catch{return {ready:false,fresh:false,phase:'unavailable',players:0};}
}
function authorized(req){const incoming=Buffer.from(req.headers['x-cw-token']??''),expected=Buffer.from(settings.controlToken);return incoming.length===expected.length&&timingSafeEqual(incoming,expected);}
async function dispatch(payload,id=randomUUID()){
 if(busy)throw new Error('Another test is running');if(!sbReady)throw new Error('Streamer.bot is not connected');
 if(payload.kind==='summon'){
   const entities=payload.entities??(Number.isInteger(payload.count)&&payload.count>0&&payload.count<=10?Array(payload.count).fill(payload.entity):[]);
   if(!Array.isArray(entities)||entities.length<1||entities.length>10||entities.some(id=>!catalog().some(e=>e.id===id)))throw new Error('Invalid summon');
 }
 if(payload.kind==='reward'&&(!rewards[payload.reward]||!Number.isInteger(payload.variant)||!rewards[payload.reward].variants[payload.variant]))throw new Error('Invalid reward');
 if(!['probe','summon','reward'].includes(payload.kind))throw new Error('Invalid job');
 busy=true;
 try{
   write('spool/'+id+'.json',{...payload,createdAt:Date.now()});
   await request({request:'DoAction',action:{name:settings.actionName},args:{cwJobId:id}});
   const file=path.join(root,'spool',id+'.result.json');
   for(let i=0;i<600&&!stopping;i++){
     if(fs.existsSync(file)){lastResult=read('spool/'+id+'.result.json');log('Action result '+JSON.stringify(lastResult));return {id,...lastResult};}
     await new Promise(resolve=>setTimeout(resolve,100));
   }
   throw new Error('Result is uncertain. Inspect spool/'+id+'.result.json; do not automatically retry.');
 }finally{busy=false;}
}
async function pumpEvents(){
 if(stopping||queueRunning||busy||Date.now()<nextSpawnAt||!rules.liveEnabled)return;
 queueRunning=true;
 try{
   if(state.flight){
     const file='spool/'+state.flight.id+'.result.json';
     if(fs.existsSync(path.join(root,file))){
       const outcome=settleFlight(state,read(file));saveState();
       if(outcome==='uncertain'){nextSpawnAt=Date.now()+5000;return;}
       nextSpawnAt=Date.now()+(outcome==='done'?rules.batchDelayMs:5000);return;
     }
     // The UUID survives restarts. Never resend an action whose outcome is unknown.
     if(Date.now()-state.flight.createdAt>75000){state.lastIssue='Dang doi ket qua cu; tam giu hang cho de tranh goi trung.';saveState();}
     return;
   }
   if(!state.queue.length||!sbReady||!minecraft.connected||!/^There are [1-9]\d*/.test(minecraft.message))return;
   const tower=towerStatus();
   if(tower&&(!tower.fresh||!tower.ready||tower.testMode||tower.phase!=='running'||tower.players<1))return;
   const flight=prepareFlight(state,rules,rewards);saveState();
   try{
     const result=await dispatch(flight.payload,flight.id);
     const outcome=settleFlight(state,result);saveState();
     nextSpawnAt=Date.now()+(outcome==='done'?rules.batchDelayMs:5000);
   }catch(e){
     // If no job was written, nothing could have reached Streamer.bot.
     if(state.flight&&!fs.existsSync(path.join(root,'spool',state.flight.id+'.json')))state.flight=null;
     state.lastIssue=e.message;saveState();nextSpawnAt=Date.now()+5000;log('Event queue: '+e.message);
   }
 }finally{queueRunning=false;}
}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.headers.origin||!['127.0.0.1:'+settings.controlPort,'localhost:'+settings.controlPort].includes(req.headers.host)){res.writeHead(403);return res.end('{}');}
 if(req.method==='GET'&&req.url==='/status')return res.end(JSON.stringify({stage:'ready',testMode,mode:rules.mode??'classic',towerDefense:towerStatus(),liveMappingsEnabled:rules.liveEnabled,tikfinityLocalSocket:tkReady,streamerbot:sbReady,minecraft,likes:{enabled:rules.likes?.enabled,threshold:rules.likes.threshold,totalReceived:likes.totalLikes,remainder:likes.remainder,toNext:rules.likes.threshold-likes.remainder,pending:likes.pending,spawned:likes.spawned,zombieTypes:pool.length,lastLikeAt:state.lastLikeAt},follow:rules.follow,giftsConfigured:rules.gifts.length,queue:{zombies:state.queue.filter(j=>j.kind==='summon').reduce((n,j)=>n+j.remaining,0),rewards:state.queue.filter(j=>j.kind==='reward').reduce((n,j)=>n+j.remaining,0),inFlight:!!state.flight,lastIssue:state.lastIssue},stats:state.stats,lastEvent,eventCounts,busy,lastResult}));
 if(req.method!=='POST'||!authorized(req)){res.writeHead(403);return res.end('{}');}
 try{
   let raw='';for await(const c of req){raw+=c;if(raw.length>4096)throw new Error('Request too large');}
   if(req.url==='/dispatch'){const result=await dispatch(JSON.parse(raw));res.end(JSON.stringify(result));return;}
   if(req.url==='/stop'){res.end('{"ok":true}');shutdown();return;}
   res.writeHead(404);res.end('{}');
 }catch(e){res.writeHead(400);res.end(JSON.stringify({ok:false,error:e.message}));}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Bridge already running':e.message);process.exit(1);});
await new Promise(resolve=>server.listen(settings.controlPort,'127.0.0.1',resolve));
saveState();
write(testMode?'test-bridge-process.json':'bridge-process.json',{pid:process.pid});
connectSb();connectTk();await checkMinecraft();
const check=setInterval(checkMinecraft,10000);
const queueCheck=setInterval(()=>pumpEvents().catch(e=>log('Queue error: '+e.message)),500);
log('Cursed Walking ready: 1 like per zombie + '+rules.gifts.length+' gift rules; '+pool.length+' zombie types.');
function shutdown(){if(stopping)return;stopping=true;clearInterval(check);clearInterval(queueCheck);saveState();for(const timer of timers)clearTimeout(timer);tk?.close();sb?.close();server.close();setTimeout(()=>process.exit(0),700);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
