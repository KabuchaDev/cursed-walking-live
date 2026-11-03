import {read,write,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const players=await rcon('list',settings);
if(!players.startsWith('There are 0 '))throw new Error('Run this validation only while server is empty');
const results=[];
// Console has no @s player: validates all loaded function definitions without giving anything.
for(const [key,reward] of Object.entries(read('rewards.json')))for(const v of reward.variants){
 const reply=await rcon('function '+v.function,settings);
 const count=Number(reply.match(/Executed (\d+) command/)?.[1]??0);
 results.push({reward:key,gun:v.id??null,function:v.function,expectedCommands:v.items.length,loadedCommands:count,passed:count===v.items.length});
}
write('reward-validation.json',{at:new Date().toISOString(),method:'Empty-server function parse/load checks; runtime gun/ammo registry cross-checks are in test-events.mjs. Player inventory delivery not tested.',results});
if(results.some(r=>!r.passed))throw new Error(JSON.stringify(results.filter(r=>!r.passed)));
console.log('PASS: all '+results.length+' reward functions loaded with expected commands; no items granted to players.');
