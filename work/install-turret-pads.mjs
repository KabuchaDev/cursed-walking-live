import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
import {settings,read,write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
const config=read('server/kubejs/cw-td-arsenal.json'),commands=[];
for(const p of config.pads){
 const x=Math.floor(p.x),z=Math.floor(p.z),ax=p.padX,az=p.padZ;
 commands.push(`fill ${Math.min(x,ax)-1} 63 ${Math.min(z,az)-1} ${Math.max(x,ax)+1} 63 ${Math.max(z,az)+1} minecraft:smooth_stone`);
 commands.push(`fill ${Math.min(x,ax)} 63 ${Math.min(z,az)} ${Math.max(x,ax)} 63 ${Math.max(z,az)} minecraft:orange_concrete`);
 commands.push(`setblock ${x} 63 ${z} minecraft:sea_lantern`);
 commands.push(`setblock ${x} 64 ${z} minecraft:polished_deepslate_wall`);
 commands.push(`kill @e[tag=cw_mount_label_${p.id}]`);
 const label=JSON.stringify({text:`TRỤ ${p.id}\nCầm súng • Bấm E\n10 block | 5 phút`,color:'gold'});
 commands.push(`summon minecraft:text_display ${p.x} 67 ${p.z} {Tags:["cw_mount_label_${p.id}"],text:${JSON.stringify(label)},billboard:"center",background:1073741824,transformation:{scale:[0.5f,0.5f,0.5f]},view_range:0.6f}`);
}
const evidence=[];
for(const c of commands){const result=await rcon('execute in cw_live:defense run '+c,settings);if(/unexpected error|Incorrect argument|Expected|Unknown/.test(result))throw Error(result);evidence.push({command:c,result});}
write('turret-pads-installation.json',{at:new Date().toISOString(),evidence});console.log('Installed six gun mounts and paths');
