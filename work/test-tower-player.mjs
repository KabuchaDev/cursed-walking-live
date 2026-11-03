import fs from 'node:fs';
import path from 'node:path';
import {root,settings,read,write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const player='Dogalive67';
const command=process.argv[2]??'snapshot';
const file='tower-defense-player-verification.json';
async function snapshot(){const result={};for(const key of ['Dimension','Pos','Inventory','SelectedItemSlot','Health','playerGameType'])result[key]=(await rcon(`data get entity ${player} ${key}`,settings)).trim();return result;}
if(command==='snapshot'){
 const status=JSON.parse(await rcon('cw_td status',settings));
 if(status.phase!=='paused'||status.players)throw Error('Expected player outside paused arena');
 const report={at:new Date().toISOString(),player,before:await snapshot(),checks:{}};
 const backup=path.join(root,'server/kubejs/cw-td-players.json');
 report.originalBackups=fs.existsSync(backup)?JSON.parse(fs.readFileSync(backup,'utf8')):null;
 if(report.originalBackups&&Object.values(report.originalBackups).some(b=>b.active))throw Error('Existing active player backup requires inspection');
 write(file,report);
 console.log(JSON.stringify({saved:true,dimension:report.before.Dimension,health:report.before.Health,gameMode:report.before.playerGameType}));
}else if(command==='join'){
 const report=read(file);console.log(await rcon('cw_td join',settings));
 report.join=await snapshot();report.statusAfterJoin=JSON.parse(await rcon('cw_td status',settings));
 report.checks.joined=report.join.Dimension.includes('cw_live:defense')&&report.statusAfterJoin.players===1;
 report.checks.starterGun=report.join.Inventory.includes('bf1:sw_model3');
 report.checks.starterAmmo=report.join.Inventory.includes('tacz:357mag');
 report.checks.selectedFirstSlot=report.join.SelectedItemSlot.endsWith('0');
 write(file,report);console.log(JSON.stringify({checks:report.checks,inventory:report.join.Inventory}));
}else if(command==='leave'){
 const report=read(file);console.log(await rcon('cw_td leave',settings));
 report.leave=await snapshot();
 report.checks.inventoryRestored=report.leave.Inventory===report.before.Inventory;
 report.checks.dimensionRestored=report.leave.Dimension===report.before.Dimension;
 report.checks.slotRestored=report.leave.SelectedItemSlot===report.before.SelectedItemSlot;
 report.checks.gameModePreserved=report.leave.playerGameType===report.before.playerGameType;
 write(file,report);console.log(JSON.stringify({checks:report.checks}));
}else throw Error('snapshot | join | leave');
