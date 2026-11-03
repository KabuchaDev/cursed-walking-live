import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../outputs/Cursed-Walking-LIVE/',import.meta.url));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cw-like-test-'));
for(const folder of ['spool','logs','server/kubejs'])fs.mkdirSync(path.join(tmp,folder),{recursive:true});
for(const file of ['bridge.mjs','common.mjs','likes.mjs','events.mjs','mappings.json','rewards.json'])fs.copyFileSync(path.join(source,file),path.join(tmp,file));
const tower=process.argv.includes('--tower');
const rules=JSON.parse(fs.readFileSync(path.join(tmp,'mappings.json')));rules.mode=tower?'tower_defense':'classic';fs.writeFileSync(path.join(tmp,'mappings.json'),JSON.stringify(rules));
const tdFile=path.join(tmp,'server/kubejs/cw-td-status.json');
let td={ready:true,phase:'idle',players:1,testMode:false},heartbeat;
const saveTd=()=>fs.writeFileSync(tdFile,JSON.stringify(td));if(tower)saveTd();
fs.copyFileSync(path.join(source,'server/kubejs/cursed-live-entities.json'),path.join(tmp,'server/kubejs/cursed-live-entities.json'));
const net=await import('node:net');
const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
fs.writeFileSync(path.join(tmp,'settings.local.json'),JSON.stringify({controlPort:port,controlToken:'isolated-test-token',tikfinityUrl:'ws://127.0.0.1:1',streamerbotUrl:'ws://127.0.0.1:2',actionName:'Cursed Walking - Dispatch'}));
fs.writeFileSync(path.join(tmp,'rcon.mjs'),`import fs from 'node:fs';export async function rcon(){return fs.existsSync('online')?'There are 1 of a max of 4 players online: TestPlayer':'There are 0 of a max of 4 players online: ';}`);
const fixtures=[{event:'like',data:{likeCount:350,msgId:'likes'}},{event:'follow',data:{msgId:'follow'}}];
for(const rule of JSON.parse(fs.readFileSync(path.join(tmp,'mappings.json'),'utf8')).gifts)fixtures.push({event:'gift',data:{giftName:rule.name,repeatCount:1,giftType:1,repeatEnd:true,msgId:'gift-'+rule.name,diamondCount:rule.coins}});
fixtures.push(fixtures.at(-1));fs.writeFileSync(path.join(tmp,'fixtures.json'),JSON.stringify(fixtures));
fs.writeFileSync(path.join(tmp,'mock.mjs'),`import fs from 'node:fs';
class MockSocket extends EventTarget {
 static OPEN=1;readyState=1;
 constructor(url){super();this.url=url;setTimeout(()=>{this.dispatchEvent(new Event('open'));if(url.endsWith(':1')&&!fs.existsSync('sent')){fs.writeFileSync('sent','1');JSON.parse(fs.readFileSync('fixtures.json')).forEach((event,i)=>setTimeout(()=>this.emit(event),40+i*40));}},50);}
 emit(obj){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(obj)}));}
 send(raw){const q=JSON.parse(raw);if(q.request==='GetActions')setTimeout(()=>this.emit({id:q.id,status:'ok',actions:[{name:'Cursed Walking - Dispatch',enabled:true}]}),10);else if(q.request==='DoAction'){const id=q.args.cwJobId;fs.appendFileSync('actions',id+'\\n');setTimeout(()=>this.emit({id:q.id,status:'ok'}),10);setTimeout(()=>{const job=JSON.parse(fs.readFileSync('spool/'+id+'.json'));fs.writeFileSync('spool/'+id+'.result.json',JSON.stringify({ok:true,accepted:job.entities?.length??1,safeRetry:true}));},120);}}
 close(){this.readyState=3;this.dispatchEvent(new Event('close'));}
}globalThis.WebSocket=MockSocket;`);
let child;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const status=()=>fetch('http://127.0.0.1:'+port+'/status').then(r=>r.json());
async function start(){child=spawn(process.execPath,['--import','./mock.mjs','bridge.mjs'],{cwd:tmp,stdio:'ignore'});for(let i=0;i<60;i++){try{await status();return;}catch{await wait(100);}}throw new Error('Mock bridge failed to start');}
async function stop(){const exited=new Promise(r=>child.once('exit',r));await fetch('http://127.0.0.1:'+port+'/stop',{method:'POST',headers:{'X-CW-Token':'isolated-test-token'},body:'{}'});await exited;child=null;}
try{
 await start();await wait(1200);let s=await status();assert.equal(s.likes.totalReceived,350);assert.equal(s.likes.pending,350);assert.equal(s.likes.remainder,0);assert.equal(s.likes.spawned,0);
 assert.equal(s.queue.zombies,433);assert.equal(s.queue.rewards,2);assert.equal(s.stats.gifts,7);
 await stop();await start();await wait(1000);s=await status();assert.equal(s.likes.pending,350);assert.equal(s.likes.remainder,0);
 fs.writeFileSync(path.join(tmp,'online'),'1');
 if(tower){
   await stop();await start();
   for(const phase of ['idle','paused','lost']){td.phase=phase;saveTd();await wait(800);s=await status();assert.equal(s.stats.zombies,0);assert.equal(s.stats.rewards,0);}
   td.phase='running';td.players=0;saveTd();await wait(800);assert.equal((await status()).stats.zombies,0);
   td.players=1;td.testMode=true;saveTd();await wait(800);assert.equal((await status()).stats.zombies,0);
   td.testMode=false;saveTd();fs.utimesSync(tdFile,new Date(0),new Date(0));await wait(800);assert.equal((await status()).stats.zombies,0);
   saveTd();heartbeat=setInterval(saveTd,500);
 }
 for(let i=0;i<100;i++){await wait(500);s=await status();if(s.stats.zombies===433&&s.stats.rewards===2)break;}
 assert.equal(s.likes.spawned,350);assert.equal(s.likes.pending,0);assert.equal(s.likes.remainder,0);assert.equal(s.queue.inFlight,false);assert.equal(s.stats.zombies,433);assert.equal(s.stats.rewards,2);assert.equal(s.queue.zombies,0);assert.equal(s.queue.rewards,0);
 const actions=fs.readFileSync(path.join(tmp,'actions'),'utf8').trim().split('\n');assert.equal(actions.length,47);assert.equal(new Set(actions).size,47);
 const first=JSON.parse(fs.readFileSync(path.join(tmp,'spool',actions[0]+'.json')));assert.equal(first.kind,'reward');
 await stop();console.log('PASS: bridge receives all event types, persists 433 zombies + 2 boosts + 0 spare likes through restart, then delivers exactly 47 unique batches with rewards first; duplicate gift ignored.');
}finally{clearInterval(heartbeat);if(child)child.kill();console.log('Isolated evidence ('+(tower?'tower defense':'classic')+'): '+tmp);}

