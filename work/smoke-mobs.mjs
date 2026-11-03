import fs from 'node:fs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
import {settings,read,write,catalog} from '../outputs/Cursed-Walking-LIVE/common.mjs';
const check=await rcon('list',settings);
if(!check.includes('There are 0 of'))throw new Error('Smoke test requires an empty server');
const entities=catalog().filter(e=>e.id==='minecraft:zombie'||e.id.startsWith('feralzombie:')||e.id.startsWith('zombies_plus:')||['mutantmonsters:mutant_zombie','mutantmonsters:mutant_skeleton','mutantmonsters:mutant_creeper','mutantmonsters:mutant_enderman'].includes(e.id));
const results=[];
try{
 for(const e of entities){
   const response=await rcon(`summon ${e.id} 0 90 0 {NoAI:1b,NoGravity:1b,Invulnerable:1b,Silent:1b,Tags:["cw_probe"]}`,settings);
   const exists=await rcon(`execute if entity @e[type=${e.id},tag=cw_probe]`,settings);
   const cleanup=await rcon('cw_clean_test',settings);
   const passed=response.includes('Summoned new')&&exists.includes('Test passed');
   results.push({entity:e.id,passed,response:response.trim(),exists:exists.trim(),cleanup:cleanup.trim()});
   console.log(e.id+': '+(passed?'PASS':'BLOCKED')+' '+response.trim());
 }
}finally{
 await rcon('cw_clean_test',settings);
 await rcon('forceload remove 0 0',settings);
 write('mob-smoke-results.json',{at:new Date().toISOString(),dimension:'minecraft:overworld',results});
}
console.log(`Verified ${results.filter(r=>r.passed).length}/${results.length}`);
