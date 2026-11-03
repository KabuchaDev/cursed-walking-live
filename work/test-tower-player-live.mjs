import {root,settings,read,write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const player='Dogalive67',file='tower-defense-player-verification.json';
const report=read(file);
const status=JSON.parse(await rcon('cw_td inspect',settings));
if(status.phase!=='running'||status.players!==1||!status.active)throw Error('Need active player and wave');
report.liveWave=status;
report.checks.realQueuedWaveDelivered=status.spawned===4&&status.mobs.every(m=>m.tags.includes('cw_job_'));
report.checks.noZombieTarget=status.mobs.every(m=>m.noAI&&m.target===null);
const hpBefore=await rcon(`data get entity ${player} Health`,settings);
report.damageTest=await rcon(`execute in cw_live:defense run damage ${player} 1 minecraft:mob_attack by @e[tag=cw_td,limit=1]`,settings);
const hpAfter=await rcon(`data get entity ${player} Health`,settings);
report.checks.zombieDamageBlocked=hpBefore===hpAfter;
const inventory=await rcon(`data get entity ${player} Inventory`,settings);
if(inventory.includes('bf1:obrez')||inventory.includes('tacz:762x54'))throw Error('Test reward overlaps existing items');
try{
 const response=await fetch('http://127.0.0.1:'+settings.controlPort+'/dispatch',{method:'POST',headers:{'Content-Type':'application/json','X-CW-Token':settings.controlToken},body:JSON.stringify({kind:'reward',reward:'gun_t1',variant:0,player}),signal:AbortSignal.timeout(75000)});
 report.rewardTest=await response.json();
 report.rewardInventory=await rcon(`data get entity ${player} Inventory`,settings);
 report.checks.streamerbotReward=report.rewardTest.ok===true&&report.rewardInventory.includes('bf1:obrez')&&report.rewardInventory.includes('tacz:762x54');
}finally{
 await rcon(`clear ${player} tacz:modern_kinetic_gun{GunId:"bf1:obrez"} 1`,settings);
 await rcon(`clear ${player} tacz:ammo{AmmoId:"tacz:762x54"} 8`,settings);
 const after=await rcon(`data get entity ${player} Inventory`,settings);
 report.checks.testRewardRemoved=!after.includes('bf1:obrez')&&!after.includes('tacz:762x54');
 const latest=JSON.parse(await rcon('cw_td status',settings));
 if(latest.phase==='running')await rcon('cw_td pause',settings);
 write(file,report);
}
console.log(JSON.stringify({checks:report.checks,reward:report.rewardTest,damage:report.damageTest}));
