import {settings,read} from './common.mjs';
import {randomInt} from 'node:crypto';
import {rcon} from './rcon.mjs';
const command=process.argv[2]??'status';
async function api(route,payload){const reply=await fetch('http://127.0.0.1:'+settings.controlPort+route,{method:payload?'POST':'GET',headers:{'Content-Type':'application/json','X-CW-Token':settings.controlToken},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(75000)});const data=await reply.json();if(!reply.ok)throw new Error(data.error??'Request failed');return data;}
try{
 let result;
 if(command==='status')result=await api('/status');
 else if(command==='probe')result=await api('/dispatch',{kind:'probe'});
 else if(command==='summon')result=await api('/dispatch',{kind:'summon',entity:process.argv[3]??'minecraft:zombie',count:Number(process.argv[4]??1),player:process.argv[5]??''});
 else if(command==='reward'){
   const reward=read('rewards.json')[process.argv[3]];if(!reward)throw new Error('Unknown reward');
   result=await api('/dispatch',{kind:'reward',reward:process.argv[3],variant:process.argv[4]===undefined?randomInt(reward.variants.length):Number(process.argv[4]),player:process.argv[5]??''});
 }
 else if(command==='stop-bridge')result=await api('/stop',{});
 else if(command==='stop-server'){
   try{await api('/stop',{});}catch{}
   await rcon('save-all flush',settings);result=await rcon('stop',settings);
 }else throw new Error('Use: status | probe | summon <entity> [count] [player] | reward <key> [variant] [player] | stop-bridge | stop-server');
 console.log(typeof result==='string'?result:JSON.stringify(result,null,2));
 if(result?.ok===false)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=1;}
