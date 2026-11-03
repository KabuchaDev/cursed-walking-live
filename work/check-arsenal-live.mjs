import assert from 'node:assert/strict';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
import {settings,read,write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const evidence={checks:[],at:new Date().toISOString()};
async function cmd(s){let r=await rcon(s,settings);if(/unexpected error|Unknown or incomplete|Expected whitespace/.test(r))throw Error(s+': '+r);return r;}
async function snapshot(){await cmd('cw_arsenal_test snapshot');return read('server/kubejs/cw-arsenal-test-report.json');}
function pass(name,data){evidence.checks.push({name,data});console.log('PASS',name);write('arsenal-verification.json',evidence);}
try{
 await cmd('cw_td qa begin');await cmd('cw_arsenal_test begin');
 let first=await snapshot();assert.equal(first.state.tier,'T1');assert.equal(first.ammo+Number(first.barrel)+first.reserve,80);pass('T1 starts with five magazines');
 await cmd('cw_arsenal_test empty');assert.equal((await snapshot()).state.gun,'bf1:smg0818');pass('T1 automatic rotation');
 await cmd('cw_arsenal_test boost_t3');await cmd('cw_arsenal_test boost_t2');let queued=await snapshot();assert.equal(queued.state.t3,3600);assert.equal(queued.state.t2,3600);assert.equal(queued.state.tier,'T3');pass('Rosa preserves T3 and queues full three minutes T2');
 await cmd('cw_arsenal_test mount');await cmd('cw_arsenal_test expire_t3');await cmd('cw_arsenal_test speed');
 let s=await snapshot();assert.equal(s.state.tier,'T2');assert.equal(s.ammo+Number(s.barrel)+s.reserve,250);pass('T3 expiry activates queued T2, ten magazines',s.state);
 await cmd('cw_arsenal_test empty');s=await snapshot();assert.equal(s.state.gun,'tacz:hk416d');pass('T2 rotates automatically when total ammo is exhausted',s.state.gun);
 let t=s.state.t2;await cmd('cw_arsenal_test boost_t2');s=await snapshot();assert.equal(s.state.t2,t);pass('Repeated gift receipt cannot extend boost twice');
 await cmd('cw_td spawn "mutantmonsters:mutant_zombie" arsenal_target');
 await cmd('cw_arsenal_test near_turret');
 await wait(1200);await cmd('cw_td inspect');let arena=read('server/kubejs/cw-td-inspect.json');s=await snapshot();
 assert.ok(s.turrets['1'].shots>0);assert.ok(!arena.mobs.length||arena.mobs[0].health<1000);pass('Mounted gun fires on nearby giant zombie',{turret:s.turrets['1'],mobs:arena.mobs});
 const yaw=await cmd('execute in cw_live:defense run data get entity @e[tag=cw_turret_1,limit=1] Rotation');assert.ok(!yaw.includes('NaN'));pass('Mounted gun faces its target with finite rotation',yaw);
 await cmd('cw_td pause');let a=(await snapshot()).turrets['1'];await wait(500);let b=(await snapshot()).turrets['1'];assert.equal(a.ticks,b.ticks);assert.equal(a.shots,b.shots);pass('Pause freezes turret time and shots');
 await cmd('cw_td pause');await cmd('cw_td qa clear');let shots=(await snapshot()).turrets['1'].shots;
 await cmd('cw_td spawn "mutantmonsters:mutant_zombie" arsenal_outside');await wait(700);assert.equal((await snapshot()).turrets['1'].shots,shots);pass('Turret does not shoot zombies outside ten blocks');
 await cmd('cw_arsenal_test expire_turret');await wait(250);assert.deepEqual((await snapshot()).turrets,{});pass('Expired turret removes gun display and stops firing');
 await cmd('cw_arsenal_test expire_t2');assert.equal((await snapshot()).state.tier,'T1');pass('Expired T2 returns to T1');
 evidence.speed=read('server/kubejs/cw-td-speed-player-test.json');assert.ok(Math.abs(evidence.speed.during/evidence.speed.before-1.6)<.0001);assert.equal(evidence.speed.before,evidence.speed.after);pass('Player speed increases sixty percent and restores outside arena');
 evidence.passed=true;
}catch(e){evidence.error=e.stack;evidence.passed=false;console.error(e.stack);process.exitCode=1;}
finally{console.log(await cmd('cw_arsenal_test end'));console.log(await cmd('cw_td qa end'));write('arsenal-verification.json',evidence);}
