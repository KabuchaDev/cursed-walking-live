import assert from 'node:assert/strict';
import {read,write,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms)),config=read('server/kubejs/cw-td-config.json');
const report={startedAt:new Date().toISOString(),corners:[],passed:false};
async function cmd(command){let result=await rcon(command,settings);if(/unexpected error|Unknown or incomplete|Incorrect argument/.test(result))throw Error(command+': '+result);return result;}
async function inspect(){await cmd('cw_td inspect');return read('server/kubejs/cw-td-inspect.json');}
let begun=false;
try{
 report.before=await inspect();assert.equal(report.before.active,0);assert.equal(report.before.players,0);
 await cmd('cw_td qa begin');begun=true;
 await cmd('cw_td pause');await cmd('cw_motion_probe setup');await wait(100);
 let state=await inspect();assert.equal(state.active,18);
 assert.ok(state.mobs.every(m=>[m.yaw,m.headYaw,m.bodyYaw].every(v=>v===-90)));
 await cmd('cw_td start');await cmd('cw_motion_probe measure');await wait(2300);await cmd('cw_td pause');
 report.speed=read('server/kubejs/cw-td-speed-check.json');assert.equal(report.speed.rows.length,18);
 for(const row of report.speed.rows){const perTick=config.types[row.type].speed*config.speedMultiplier;assert.ok(Math.abs(row.distance-perTick*40)<=perTick*1.1,row.type+' speed');}
 let distance=0;
 for(let i=1;i<config.route.length-1;i++){
  const a=config.route[i-1],b=config.route[i],c=config.route[i+1];distance+=Math.hypot(b[0]-a[0],b[2]-a[2]);
  const dx=c[0]-b[0],dz=c[2]-b[2],expected=dx>0?-90:dx<0?90:dz>0?0:180;
  await cmd('cw_motion_probe position '+(distance-.3));await wait(80);await cmd('cw_td start');await wait(800);await cmd('cw_td pause');await wait(100);
  state=await inspect();assert.equal(state.active,18);
  for(const mob of state.mobs){assert.ok(mob.progress>distance);assert.ok(mob.noAI&&mob.target===null);for(const key of ['yaw','headYaw','bodyYaw','expectedYaw'])assert.equal(mob[key],expected,`${mob.type} corner ${i} ${key}`);}
  report.corners.push({corner:i,distance,expectedYaw:expected,typesChecked:18});
 }
 report.food=JSON.parse(await cmd('cw_motion_probe foodcheck'));assert.equal(report.food.food,20);assert.equal(report.food.saturation,20);assert.equal(report.food.exhaustion,0);
 report.passed=true;
}catch(error){report.error=error.stack;process.exitCode=1;}
finally{
 try{await cmd('cw_motion_probe clear');if(begun)await cmd('cw_td qa end');report.after=await inspect();}catch(error){report.cleanupError=error.stack;report.passed=false;process.exitCode=1;}
 report.finishedAt=new Date().toISOString();write('tower-defense-movement-food-verification.json',report);
 console.log(JSON.stringify({passed:report.passed,corners:report.corners,speed:report.speed,food:report.food,error:report.error,after:report.after}));
}
