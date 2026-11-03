import {randomUUID,randomInt} from 'node:crypto';
import {initialState as initialLikes,receiveLikes} from './likes.mjs';
export function initialState(oldLikes=initialLikes()){
 if(oldLikes.flight)throw new Error('Resolve the old likes job before upgrading');
 const state={version:2,likes:oldLikes,queue:[],seen:[],flight:null,lastIssue:null,stats:{follows:0,gifts:0,zombies:0,rewards:0},lastLikeAt:null};
 if(oldLikes.pending)enqueue(state,{kind:'summon',source:'likes',distribution:'weighted',remaining:oldLikes.pending});
 return state;
}
function enqueue(state,job){
 const last=state.queue.at(-1);
 if(last&&last.source===job.source&&last.kind===job.kind&&last.distribution===job.distribution&&last.reward===job.reward)last.remaining+=job.remaining;
 else state.queue.push({...job,id:randomUUID(),createdAt:Date.now()});
}
const normalized=value=>String(value??'').normalize('NFKC').replace(/[’‘`]/g,"'").trim().toLowerCase().replace(/\s+/g,' ');
function once(state,key){
 if(!key)return true;
 if(state.seen.includes(key))return false;
 state.seen.push(key);if(state.seen.length>8192)state.seen.splice(0,state.seen.length-8192);
 return true;
}
export function receiveEvent(state,envelope,rules){
 const kind=envelope?.event,d=envelope?.data;
 if(!rules.liveEnabled||!d)return false;
 if(kind==='like'&&rules.likes.enabled){
   const result=receiveLikes(state.likes,envelope,rules.likes.threshold);
   if(result.earned)enqueue(state,{kind:'summon',source:'likes',distribution:rules.likes.distribution??'weighted',remaining:result.earned});
   if(result.changed)state.lastLikeAt=new Date().toISOString();
   return result.changed;
 }
 const msg=d.msgId??d.common?.msgId??envelope.msgId;
 const user=d.userId??d.user?.userId??d.uniqueId??d.user?.uniqueId;
 const time=d.createTime??d.common?.createTime;
 if(kind==='follow'&&rules.follow.enabled){
   const key=msg?'follow:'+msg:(user&&time?'follow:'+user+':'+time:null);
   if(!once(state,key))return false;
   enqueue(state,{kind:'summon',source:'follow',distribution:rules.follow.distribution??'weighted',remaining:rules.follow.count});state.stats.follows++;return true;
 }
 if(kind!=='gift')return false;
 // TikTok emits progress plus a final event for combo gifts. Only final totals count.
 const ended=d.repeatEnd===true||d.repeatEnd===1||d.repeatEnd==='true';
 const giftType=d.giftType??d.gift?.gift_type;
 if(Number(giftType)===1&&!ended)return false;
 if(giftType===undefined&&(d.repeatEnd===false||d.repeatEnd===0||d.repeatEnd==='false'))return false;
 const name=d.giftName??d.gift?.name??d.extendedGiftInfo?.name;
 const giftId=Number(d.giftId??d.gift?.id);
 const rule=rules.gifts.find(r=>r.ids?.includes(giftId)||[r.name,...(r.aliases??[])].some(n=>normalized(n)===normalized(name)));
 if(!rule)return false;
 const price=d.diamondCount??d.gift?.diamond_count??d.extendedGiftInfo?.diamond_count;
 if(Number(price)>0&&Number(price)!==rule.coins){state.lastIssue='Gift price differs from configured rule: '+rule.name;return true;}
 const repeats=Number(d.repeatCount??1);
 if(!Number.isSafeInteger(repeats)||repeats<1||repeats>1000000)return false;
 const rawGroup=d.groupId??d.group_id;
 const group=rawGroup&&!/^0+$/.test(String(rawGroup))?rawGroup:null;
 const key=group&&user?'giftgroup:'+user+':'+(giftId||normalized(name))+':'+group:msg?'gift:'+msg:time&&user?'gift:'+user+':'+normalized(name)+':'+time:null;
 if(!once(state,key))return false;
 if(rule.kind==='summon')enqueue(state,{kind:'summon',source:'gift:'+rule.name,distribution:rule.distribution??'uniform',remaining:rule.count*repeats});
 else enqueue(state,{kind:'reward',source:'gift:'+rule.name,reward:rule.reward,remaining:repeats});
 state.stats.gifts+=repeats;return true;
}
export function chooseZombie(rules,distribution,rng=randomInt){
 let pool=rules.zombiePools[distribution]??rules.zombiePools.uniform;
 if(Array.isArray(pool)&&pool.length&&typeof pool[0]==='object'){
   const groups=pool;let roll=rng(groups.reduce((sum,g)=>sum+g.weight,0));
   for(const group of groups){if(roll<group.weight){pool=group.entities;break;}roll-=group.weight;}
 }
 return pool[rng(pool.length)];
}
export function prepareFlight(state,rules,rewards,rng=randomInt){
 // Helpful gifts remain deliverable while a large zombie wave is queued.
 const job=state.queue.find(j=>j.kind==='reward')??state.queue[0];
 if(!job)return null;
 const units=job.kind==='summon'?Math.min(job.remaining,rules.maxPerEvent):1;
 let payload;
 if(job.kind==='summon'){
   job.reservedEntities??=[];
   while(job.reservedEntities.length<units)job.reservedEntities.push(chooseZombie(rules,job.distribution,rng));
   payload={kind:'summon',entities:job.reservedEntities.slice(0,units)};
 }else{
   job.reservedVariant??=rng(rewards[job.reward].variants.length);
   payload={kind:'reward',reward:job.reward,variant:job.reservedVariant};
 }
 state.flight={id:randomUUID(),queueId:job.id,source:job.source,units,credited:0,createdAt:Date.now(),payload};
 return state.flight;
}
export function settleFlight(state,result){
 const f=state.flight;if(!f)return 'idle';
 const job=state.queue.find(j=>j.id===f.queueId);
 if(!job)throw new Error('In-flight queue entry missing');
 if(!Number.isInteger(result.accepted)||result.accepted<f.credited||result.accepted>f.units){state.lastIssue='Invalid action result; queue held.';return 'uncertain';}
 const delta=result.accepted-f.credited;
 job.remaining-=delta;f.credited=result.accepted;
 if(job.kind==='summon'){
   // Keep the original random draw when space is unavailable. Rerolling would
   // silently favor smaller zombies over large ones such as Mutant Zombie.
   job.reservedEntities=f.payload.entities.slice(result.accepted);
   state.stats.zombies+=delta;if(job.source==='likes'){state.likes.pending-=delta;state.likes.spawned+=delta;}
 }else{state.stats.rewards+=delta;if(delta)delete job.reservedVariant;}
 if(result.accepted===f.units||result.safeRetry===true){
   if(job.remaining===0)state.queue=state.queue.filter(j=>j!==job);
   state.flight=null;state.lastIssue=result.accepted===f.units?null:result.error??result.response;
   return result.accepted===f.units?'done':'retry';
 }
 state.lastIssue='Ket qua chua chac chan; giu hang cho de tranh goi trung / nhan trung vat pham.';
 return 'uncertain';
}
