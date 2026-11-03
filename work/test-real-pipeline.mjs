import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {root,read,write,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
import {initialState} from '../outputs/Cursed-Walking-LIVE/events.mjs';
const require=createRequire(import.meta.url);
require('C:/Users/PHAT/AppData/Roaming/TikFinity/res/websocketserver.js');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const rules=read('mappings.json'), rewards=read('rewards.json');
const evidence={started:new Date().toISOString(),source:'Simulated TikFinity-format events; actual Streamer.bot and Minecraft server with Dogalive online',cases:[],restored:false};
const record=()=>write('real-pipeline-verification.json',evidence);
const api=async(route,body)=>{const res=await fetch('http://127.0.0.1:21216'+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-CW-Token':settings.controlToken},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(75000)});const data=await res.json();if(!res.ok)throw new Error(JSON.stringify(data));return data;};
async function mc(command){const reply=await rcon(command,settings);if(/unexpected error|Unknown or incomplete/.test(reply))throw new Error(command+': '+reply);return reply;}
async function snapshot(){await mc('cw_test_snapshot');return read('server/kubejs/cw-live-test-report.json');}
function verifyReward(report,key,variant){
 const v=rewards[key].variants[variant];
 assert.equal(report.inventory.reduce((n,i)=>n+i.count,0),v.items.reduce((n,i)=>n+i.count,0),'total item count');
 for(const item of v.items){
  const actual=report.inventory.filter(i=>i.id===item.id);
  assert.equal(actual.reduce((n,i)=>n+i.count,0),item.count,item.id+' count');
  if(item.id==='tacz:modern_kinetic_gun'){
   assert.equal(actual.length,1);assert.ok(actual[0].tag.includes('GunId:"'+v.id+'"'),'gun ID');
   assert.ok(new RegExp('GunCurrentAmmoCount:'+v.capacity+'(?:[,}])').test(actual[0].tag),'loaded magazine');
  }
  if(item.id==='tacz:ammo')assert.ok(actual.every(i=>i.tag.includes('AmmoId:"'+v.ammo+'"')),'matching ammo');
 }
}
let child,wsServer;
try{
 assert.equal(read('server/kubejs/cw-live-test-backup.json').active,true,'backup must exist before testing');
 evidence.original=await snapshot();record();
 if(fs.existsSync(path.join(root,'test-events-state.json')))fs.copyFileSync(path.join(root,'test-events-state.json'),path.join(root,'test-events-state.previous.json'));
 write('test-events-state.json',initialState());
 wsServer=new process.WebSocketServer({host:'127.0.0.1',port:21214});
 await new Promise((resolve,reject)=>{wsServer.once('listening',resolve);wsServer.once('error',reject);});
 const out=fs.openSync(path.join(root,'logs/test-bridge.log'),'a');
 child=spawn(process.execPath,[path.join(root,'bridge.mjs'),'--test'],{cwd:root,windowsHide:true,stdio:['ignore',out,out]});
 for(let i=0;i<80;i++){await wait(250);try{const s=await api('/status');if(s.streamerbot&&s.tikfinityLocalSocket&&s.minecraft.connected&&/^There are 1 /.test(s.minecraft.message))break;}catch{}if(i===79)throw new Error('Test bridge not ready');}
 console.log('READY: actual Streamer.bot and Minecraft connected; temporary test source isolated.');
 function send(event){for(const socket of wsServer.clients)socket.send(JSON.stringify(event));}
 let serial=0;
 async function run(label,event,expected){
  await mc('cw_test_clear');const before=await api('/status');
  event.data.msgId??='real-test-'+Date.now()+'-'+(++serial);
  send(event);const started=Date.now();let status;
  for(let i=0;i<360;i++){
   await wait(500);status=await api('/status');
   if(!status.queue.inFlight&&!status.queue.zombies&&!status.queue.rewards&&(expected.none||status.stats.zombies>=before.stats.zombies+(expected.zombies??0)&&status.stats.rewards>=before.stats.rewards+(expected.reward?1:0)))break;
   if(i%30===29)console.log('Waiting '+label+': '+JSON.stringify({queue:status.queue,result:status.lastResult}));
   if(i===359)throw new Error(label+' timeout: '+JSON.stringify(status.queue));
  }
  await wait(400);const report=await snapshot();
  assert.equal(report.mobs.length,expected.zombies??0,label+' actual mob count');
  assert.ok(report.mobs.every(m=>rules.zombiePools.uniform.includes(m.id)),'only configured zombie types');
  if(expected.reward)verifyReward(report,expected.reward,status.lastResult.variant);
  if(expected.remainder!==undefined)assert.equal(status.likes.remainder,expected.remainder);
  const entry={label,pass:true,elapsedMs:Date.now()-started,event,expected,actual:report,result:status.lastResult,stats:status.stats};evidence.cases.push(entry);record();
  console.log('PASS '+label+': '+report.mobs.length+' real zombies, '+report.inventory.length+' item stacks.');
  return event;
 }
 if(!process.argv.includes('--catalogue')){
 await run('99 likes, no spawn',{event:'like',data:{likeCount:99}},{none:true,remainder:99});
 await run('100th like, one zombie',{event:'like',data:{likeCount:1}},{zombies:1,remainder:0});
 await run('Follow, five zombies',{event:'follow',data:{userId:'cw-test-viewer'}},{zombies:5});
 for(const rule of rules.gifts){
  await run(rule.name,{event:'gift',data:{giftName:rule.name,giftId:rule.ids?.[0],giftType:1,repeatEnd:true,repeatCount:1,diamondCount:rule.coins,userId:'cw-test-viewer'}},rule.kind==='summon'?{zombies:rule.count}:{reward:rule.reward});
 }
 await run('Rose combo progress ignored',{event:'gift',data:{giftName:'Rose',giftId:5655,giftType:1,repeatEnd:false,repeatCount:2,diamondCount:1,userId:'cw-test-viewer',groupId:'cw-test-combo'}},{none:true});
 const combo=await run('Rose combo final x2',{event:'gift',data:{giftName:'Rose',giftId:5655,giftType:1,repeatEnd:true,repeatCount:2,diamondCount:1,userId:'cw-test-viewer',groupId:'cw-test-combo'}},{zombies:20});
 await run('Repeated combo final ignored',combo,{none:true});
 await run('Non-combo gift accepted',{event:'gift',data:{giftName:'Shamrock',giftType:0,repeatEnd:false,repeatCount:1,diamondCount:10,userId:'cw-test-viewer'}},{reward:'sledgehammer'});
 }
 for(const [key,reward] of Object.entries(rewards))for(let variant=0;variant<reward.variants.length;variant++){
  await mc('cw_test_clear');const result=await api('/dispatch',{kind:'reward',reward:key,variant});
  assert.equal(result.accepted,1,key+' '+variant+' dispatch');
  const report=await snapshot();verifyReward(report,key,variant);
  evidence.cases.push({label:'Catalogue '+key+'/'+variant,pass:true,actual:report.inventory,result});record();
  console.log('PASS catalogue '+key+'/'+variant+' '+(result.gun??key));
 }
 evidence.finalStatus=await api('/status');evidence.passed=true;record();
}catch(error){evidence.passed=false;evidence.error=error.stack;record();console.error(error.stack);process.exitCode=1;}
finally{
 if(child){try{await api('/stop',{});}catch{}await wait(900);if(child.exitCode===null)child.kill();}
 if(wsServer){for(const socket of wsServer.clients)socket.terminate();await new Promise(r=>wsServer.close(r));}
 try{evidence.restoreReply=await mc('cw_test_end');evidence.restored=read('server/kubejs/cw-live-test-backup.json').active===false;console.log(evidence.restoreReply);}catch(error){evidence.restoreError=error.message;process.exitCode=1;}
 evidence.finished=new Date().toISOString();record();
 console.log('Evidence: '+path.join(root,'real-pipeline-verification.json'));
}
