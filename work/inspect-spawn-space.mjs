import {settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const spots=[[6,0],[0,6],[-6,0],[0,-6],[5,5],[-5,5],[5,-5],[-5,-5],[8,2],[-8,-2],[2,8],[-2,-8]];
for(const [x,z] of spots){
 const checks=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(let dy=0;dy<4;dy++)checks.push(`if block ~${dx||''} ~${dy||''} ~${dz||''} minecraft:air `);
 for(const y of [0,1,-1,2,-2]){
  const position=`execute as @a[name=Dogalive,limit=1] at @s rotated ~ 0 positioned ~${x} ~${y||''} ~${z||''} `;
  const ground=await rcon(position+'unless block ~ ~-1 ~ minecraft:air unless block ~ ~-1 ~ minecraft:water unless block ~ ~-1 ~ minecraft:lava',settings);
  if(!ground.includes('Test passed'))continue;
  const results=[];for(let start=0;start<checks.length;start+=12)results.push(await rcon(position+checks.slice(start,start+12).join(''),settings));
  console.log(JSON.stringify({x,y,z,ground,air:results}));
 }
}
