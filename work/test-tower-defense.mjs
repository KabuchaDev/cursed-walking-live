import assert from 'node:assert/strict';
import {read,write,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const config=read('server/kubejs/cw-td-config.json');
const evidence={started:new Date().toISOString(),checks:[]};
const save=()=>write('tower-defense-verification.json',evidence);
async function cmd(value){const result=await rcon(value,settings);if(/unexpected error|Unknown or incomplete|Incorrect argument|Expected whitespace/.test(result))throw new Error(value+': '+result);return result;}
async function inspect(){await cmd('cw_td inspect');return read('server/kubejs/cw-td-inspect.json');}
function pass(name,details){evidence.checks.push({name,passed:true,details});save();console.log('PASS '+name);}
const types=Object.keys(config.types);
let begun=false;
try{
 assert.ok((await cmd('cw_td qa begin')).includes('TD_QA_STARTED'));begun=true;
 for(let i=0;i<types.length;i++)assert.ok((await cmd('cw_td spawn '+JSON.stringify(types[i])+' qa_'+i)).includes('TD_SPAWNED'));
 await wait(1800);let s=await inspect();assert.equal(s.active,18);assert.ok(s.mobs.every(m=>m.noAI&&m.target===null&&m.progress>0));pass('All 18 modded zombie types spawn, move and have no attack target',s.mobs);
 assert.ok((await cmd('cw_td spawn '+JSON.stringify(types[0])+' qa_0')).includes('TD_SPAWNED'));assert.equal((await inspect()).active,18);pass('Repeated job tag cannot spawn a duplicate');
 await cmd('cw_td pause');const paused=await inspect();await wait(1200);const still=await inspect();assert.deepEqual(still.mobs.map(m=>m.progress),paused.mobs.map(m=>m.progress));pass('Pause freezes route progress');
 await cmd('cw_td pause');await cmd('cw_td qa speed 30');
 let samples=[];
 for(let i=0;i<200;i++){
  await wait(250);s=await inspect();samples.push({hp:s.hp,active:s.active,mobs:s.mobs.map(m=>({type:m.type,progress:m.progress,x:m.x,y:m.y,z:m.z,lane:m.lane}))});
  for(const mob of s.mobs){
   let rem=mob.progress,expected;
   for(let j=1;j<config.route.length;j++){const a=config.route[j-1],b=config.route[j],len=Math.hypot(b[0]-a[0],b[2]-a[2]);if(rem<=len){const f=rem/len;expected=[a[0]+(b[0]-a[0])*f+mob.lane,a[1],a[2]+(b[2]-a[2])*f+mob.lane];break;}rem-=len;}
   assert.ok(expected);assert.ok(Math.abs(mob.x-expected[0])<.02&&Math.abs(mob.z-expected[2])<.02,'zombie remains on route');
  }
  if(!s.active)break;
 }
 assert.equal(s.active,0);assert.equal(s.leaked,18);const damage=types.reduce((n,t)=>n+config.types[t].damage,0);assert.equal(s.hp,config.baseMaxHealth-damage);pass('Entire route and exact one-time base damage for all 18 types',{damage,hp:s.hp,samples});
 await wait(1200);assert.equal((await inspect()).hp,s.hp);pass('Arrived zombies cannot damage the base twice');
 const beforeKill=await inspect();await cmd('cw_td spawn "mutantmonsters:mutant_zombie" qa_kill');await cmd('execute in cw_live:defense run damage @e[tag=qa_kill,limit=1] 99999 minecraft:generic');await wait(600);s=await inspect();assert.equal(s.active,0);assert.equal(s.killed,beforeKill.killed+1);assert.equal(s.hp,beforeKill.hp);pass('A killed Mutant Zombie is removed and cannot damage the base');
 await cmd('cw_td qa health 5');await cmd('cw_td spawn "minecraft:zombie" qa_loss');await cmd('cw_td qa near_goal');await wait(300);s=await inspect();assert.equal(s.phase,'lost');assert.equal(s.hp,0);assert.equal(s.active,0);assert.ok((await cmd('cw_td spawn "minecraft:zombie" qa_after_loss')).includes('TD_WAIT'));pass('Defeat stops and cleans the wave, and rejects new spawns');
 await cmd('cw_td start');s=await inspect();assert.equal(s.hp,1000);assert.equal(s.phase,'running');assert.equal(s.leaked,0);pass('Restart resets HP, round counters and wave');
 await cmd('cw_td qa speed 1');
 for(let i=0;i<200;i++)await cmd('cw_td spawn '+JSON.stringify(types[i%18])+' qa_stress_'+i);
 s=await inspect();assert.equal(s.active,200);assert.ok((await cmd('cw_td spawn "minecraft:zombie" qa_over_cap')).includes('TD_WAIT mob_limit'));await wait(2500);s=await inspect();assert.equal(s.active,200);assert.ok(s.mobs.every(m=>m.progress>0&&m.noAI&&m.target===null));pass('200 zombies progress with the server cap enforced',{active:s.active});
 const tps=await cmd('forge tps');pass('Server performance with 200 active zombies',tps);
 evidence.passed=true;
}catch(error){evidence.passed=false;evidence.error=error.stack;console.error(error.stack);process.exitCode=1;}
finally{if(begun){try{evidence.cleanup=await cmd('cw_td qa end');}catch(e){evidence.cleanupError=e.message;}}evidence.finished=new Date().toISOString();save();}
