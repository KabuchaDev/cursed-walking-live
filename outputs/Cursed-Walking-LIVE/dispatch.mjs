// Streamer.bot receives a locally-created job UUID, never shell or Minecraft commands from viewers.
import fs from 'node:fs';
import path from 'node:path';
import {root,read,write,settings,catalog} from './common.mjs';
import {rcon} from './rcon.mjs';
const id=process.argv[2];
if(process.argv.length!==3||!(/^[0-9a-f]{8}-[0-9a-f-]{27}$/).test(id??''))throw new Error('Invalid job ID');
const rel='spool/'+id;
let lock;
try{lock=fs.openSync(path.join(root,rel+'.lock'),'wx');}catch{process.exit(0);}
let accepted=0,safeRetry=true;
try{
 const job=read(rel+'.json');
 if(!Number.isFinite(job.createdAt)||Math.abs(Date.now()-job.createdAt)>30000)throw new Error('Job expired; no replay');
 if(job.kind==='probe'){
   const reply=await rcon('time query daytime',settings);
   if(!/The time is \d+/.test(reply))throw new Error(reply||'No Minecraft reply');
   write(rel+'.result.json',{ok:true,kind:'probe',response:reply});
 }else if(['summon','reward'].includes(job.kind)){
   const rules=read('mappings.json');
   const entities=job.entities??(Number.isInteger(job.count)&&job.count>0&&job.count<=10?Array(job.count).fill(job.entity):[]);
   if(job.kind==='summon'&&(!Array.isArray(entities)||entities.length<1||entities.length>Math.min(10,rules.maxPerEvent)||entities.some(id=>!catalog().some(e=>e.id===id))))throw new Error('Invalid summon batch');
   if(job.player&&!/^[A-Za-z0-9_]{1,16}$/.test(job.player))throw new Error('Invalid Minecraft player name');
   const players=await rcon('list',settings);
   const online=(players.split(': ').slice(1).join(': ').trim()).split(', ').filter(Boolean);
   const target=job.player||rules.targetPlayer||(online.length===1?online[0]:'');
   if(!target||!online.includes(target)||!/^[A-Za-z0-9_]{1,16}$/.test(target))throw new Error('Join the server first. Choose targetPlayer if multiple players are online.');
   const selector='@a[name='+target+',gamemode=!spectator,limit=1]';
   const base='execute as '+selector+' at @s rotated ~ 0 ';
   const tower=rules.mode==='tower_defense';
   if(tower){
     const present=await rcon('execute in cw_live:defense if entity @a[name='+target+',gamemode=!spectator,distance=0..,limit=1]',settings);
     if(!present.includes('Test passed'))throw new Error('Enter the tower defense map first; effects stay queued');
   }
   if(job.kind==='reward'){
     const rewards=read('rewards.json');
     const reward=rewards[job.reward];
     if(!reward||!Number.isInteger(job.variant)||!reward.variants[job.variant])throw new Error('Unknown reward');
     const variant=reward.variants[job.variant];
     if(variant.kind==='boost'){
       if(!tower||!['T2','T3'].includes(variant.tier)||variant.seconds!==180)throw new Error('Invalid boost');
       safeRetry=false;
       const reply=await rcon('cw_td_boost '+target+' '+variant.tier+' '+variant.seconds+' '+id,settings);
       if(reply.includes('TD_BOOSTED'))accepted=1;else if(reply.includes('TD_WAIT'))safeRetry=true;
       write(rel+'.result.json',{ok:accepted===1,accepted,safeRetry,reward:job.reward,tier:variant.tier,seconds:variant.seconds,response:reply});
     }else{
     if(!/^cw_live:rewards\/[a-z0-9_/-]+$/.test(variant.function))throw new Error('Invalid reward function');
     safeRetry=false;
     const reply=await rcon(tower?'cw_td reward '+target+' '+JSON.stringify(variant.function):base+'run function '+variant.function,settings);
     if(tower?reply.includes('TD_REWARDED'):/Executed \d+ command\(s\) from function|Executed \d+ commands? from function/.test(reply))accepted=1;
     else if(/No entity was found|Test failed|TD_WAIT/.test(reply))safeRetry=true;
     write(rel+'.result.json',{ok:accepted===1,accepted,safeRetry,reward:job.reward,variant:job.variant,gun:variant.id,ammo:variant.ammo,ammoCount:variant.ammoCount,response:reply});
     }
   }else if(tower){
     let response='';
     for(let i=0;i<entities.length;i++){
       safeRetry=false;
       response=await rcon('cw_td spawn '+JSON.stringify(entities[i])+' cw_job_'+id+'_'+i,settings);
       if(response.includes('TD_SPAWNED')){accepted++;safeRetry=true;}
       else if(response.includes('TD_WAIT')){safeRetry=true;break;}
       else throw new Error(response||'Unconfirmed tower defense spawn');
     }
     write(rel+'.result.json',{ok:accepted===entities.length,accepted,safeRetry,requested:entities.length,entities:entities.slice(0,accepted),response});
   }else{
   // Only count living tagged mobs in loaded chunks of the player's dimension.
   const countReply=await rcon(base+'if entity @e[tag=cw_live,nbt=!{Health:0.0f}]',settings);
   const active=Number(countReply.match(/Test passed, count: (\d+)/)?.[1]??0);
   const available=Math.max(0,Math.min(200,rules.maxActiveMobs)-active);
   if(!available)throw new Error('LIVE mob limit reached; remaining zombies stay queued');
   const spots=[[6,0],[0,6],[-6,0],[0,-6],[5,5],[-5,5],[5,-5],[-5,-5],[8,2],[-8,-2],[2,8],[-2,-8]];
   const offset=parseInt(id.slice(0,8),16)%spots.length;
   const jobTag='cw_job_'+id;
   const deadline=Date.now()+25000;
   for(let i=0;i<Math.min(entities.length,available);i++){
     const entity=entities[i],entry=catalog().find(e=>e.id===entity);
     const uniqueTag=jobTag+'_'+i;
     const nbt='{Tags:["cw_live","'+jobTag+'","'+uniqueTag+'"],PersistenceRequired:1b}';
     const span=Math.max(0,Math.ceil((entry.width-1)/2));
     const height=Math.max(2,Math.ceil(entry.height));
     let success=false;
     for(let attempt=0;attempt<spots.length&&!success;attempt++){
       const [x,z]=spots[(offset+i+attempt)%spots.length];
       for(const y of [0,1,-1,2,-2]){
         if(Date.now()>deadline)throw new Error('Spawn search timed out; move to an open area');
         const checks=[];
         for(let dx=-span;dx<=span;dx++)for(let dz=-span;dz<=span;dz++)for(let dy=0;dy<height;dy++)checks.push(`if block ~${dx||''} ~${dy||''} ~${dz||''} minecraft:air `);
         const position=base+`positioned ~${x} ~${y||''} ~${z||''} `;
         const ground='unless block ~ ~-1 ~ minecraft:air unless block ~ ~-1 ~ minecraft:water unless block ~ ~-1 ~ minecraft:lava ';
         let cmd=position+checks.join('')+ground+'run summon '+entity+' ~ ~ ~ '+nbt;
         // Vanilla RCON reads a bounded request buffer. A large zombie's air
         // volume can exceed it: verify that volume in short read-only groups.
         if(Buffer.byteLength(cmd,'utf8')>1300){
           let clear=true;
           for(let start=0;start<checks.length;start+=12){
             const reply=await rcon((position+checks.slice(start,start+12).join('')).trimEnd(),settings);
             if(!/^Test passed(?:\r?\n|$)/.test(reply.trim())){clear=false;break;}
           }
           if(!clear)continue;
           cmd=position+ground+'run summon '+entity+' ~ ~ ~ '+nbt;
         }
         // A transport failure after sending summon must not trigger a second summon.
         safeRetry=false;
         const reply=await rcon(cmd,settings);
         if(reply.includes('Summoned new')){
           const check=await rcon(base+'if entity @e[tag='+uniqueTag+']',settings);
           const total=Number(check.match(/Test passed, count: (\d+)/)?.[1]??0);
           if(total<1){safeRetry=true;throw new Error('The modpack blocked this entity in the current dimension');}
           accepted++;safeRetry=true;success=true;break;
         }
         safeRetry=true;
       }
     }
     if(!success)break;
   }
   write(rel+'.result.json',{ok:accepted===entities.length,accepted,safeRetry:true,requested:entities.length,entities:entities.slice(0,accepted),response:accepted?`Summoned ${accepted}/${entities.length}`:'No clear spawn space nearby. Move to an open area.'});
   }
 }else throw new Error('Unsupported job kind');
}catch(e){write(rel+'.result.json',{ok:false,accepted,safeRetry,error:e.message});process.exitCode=1;}
finally{fs.closeSync(lock);}
