import fs from 'node:fs';
import {read,write,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const plan=read('tower-map-plan.json');
console.log(await rcon('execute in cw_live:defense run forceload add -112 -96 112 96',settings));
const evidence={started:new Date().toISOString(),parts:[]};
for(const part of plan.parts){
 const response=await rcon('execute in cw_live:defense run function '+part,settings);
 if(!/Executed \d+ command/.test(response))throw new Error(part+': '+response);
 evidence.parts.push({part,response});write('tower-map-install.json',evidence);console.log('Built '+part+' '+response.trim());
}
evidence.installed=await rcon('cw_td install',settings);evidence.finished=new Date().toISOString();write('tower-map-install.json',evidence);console.log(evidence.installed);
