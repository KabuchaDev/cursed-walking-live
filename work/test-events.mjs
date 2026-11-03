import assert from 'node:assert/strict';
import {read} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {initialState,receiveEvent,prepareFlight,settleFlight,chooseZombie} from '../outputs/Cursed-Walking-LIVE/events.mjs';
const rules=read('mappings.json'),rewards=read('rewards.json');
const event=(kind,data)=>({event:kind,data});
const gift=(name,count=1,extra={})=>event('gift',{giftName:name,repeatCount:count,msgId:crypto.randomUUID(),...extra});
let s=initialState();
receiveEvent(s,event('like',{likeCount:99,msgId:'l1',userId:'a'}),rules);
receiveEvent(s,event('like',{likeCount:251,msgId:'l2',userId:'b',totalLikeCount:500000}),rules);
receiveEvent(s,event('like',{likeCount:251,msgId:'l2'}),rules);
assert.equal(s.likes.totalLikes,350);assert.equal(s.likes.pending,3);assert.equal(s.likes.remainder,50);
const follow=event('follow',{msgId:'f1',userId:'first'});
receiveEvent(s,follow,rules);receiveEvent(s,follow,rules);
assert.equal(s.stats.follows,1);assert.equal(s.queue.find(j=>j.source==='follow').remaining,5);
for(const [name,count] of [['Rose',10],['Finger Heart',30],['Rosa',50],['Little kisses',100]]){
 const x=initialState();receiveEvent(x,gift(name,1),rules);assert.equal(x.queue[0].remaining,count);assert.equal(x.queue[0].distribution,'uniform');
}
// A Rose combo of 3 gifts emits updates 1,2,3 and then a final 3: only 30 zombies.
const combo=initialState();
for(const n of [1,2,3])receiveEvent(combo,gift('Rose',n,{giftType:1,repeatEnd:false,groupId:'abc',userId:'v'}),rules);
assert.equal(combo.queue.length,0);
for(let i=0;i<2;i++)receiveEvent(combo,gift('Rose',3,{giftType:1,repeatEnd:true,groupId:'abc',userId:'v'}),rules);
assert.equal(combo.queue[0].remaining,30);assert.equal(combo.stats.gifts,3);
const nonStreak=initialState();
receiveEvent(nonStreak,gift('Perfume',1,{giftType:0,repeatEnd:false,groupId:0}),rules);
receiveEvent(nonStreak,gift('Perfume',1,{giftType:0,repeatEnd:false,groupId:'0',diamondCount:0}),rules);
assert.equal(nonStreak.queue[0].remaining,2);
for(const name of ["You’re awesome",'Okay','Spinning Soccer','Shamrock','Perfume'])receiveEvent(s,gift(name,2,{groupId:0}),rules);
assert.equal(s.queue.filter(j=>j.kind==='reward').reduce((n,j)=>n+j.remaining,0),10);
receiveEvent(s,gift('Rose',1,{diamondCount:999}),rules);assert.ok(s.lastIssue.includes('price'));
receiveEvent(s,gift('Not a mapped gift',1),rules);
// The 80/18/2 boundary uses integer draws and every member is selectable.
for(const [roll,name] of [[0,'weak'],[79,'weak'],[80,'medium'],[97,'medium'],[98,'strong'],[99,'strong']]){
 let calls=0;const chosen=chooseZombie(rules,'weighted',n=>calls++===0?roll:n-1);
 assert.ok(rules.zombiePools.weighted.find(g=>g.name===name).entities.includes(chosen));
}
const selected=new Set(Array.from({length:18},(_,i)=>chooseZombie(rules,'uniform',()=>i)));assert.equal(selected.size,18);
// Reward priority and partial batch progress survive restart without replaying credited mobs.
let f=prepareFlight(s,rules,rewards,()=>0);assert.equal(f.payload.kind,'reward');settleFlight(s,{accepted:1,safeRetry:false});assert.equal(s.stats.rewards,1);
const wave=initialState();receiveEvent(wave,gift('Little kisses',1),rules);
f=prepareFlight(wave,rules,rewards,()=>0);assert.equal(f.units,10);assert.equal(f.payload.entities.length,10);
assert.equal(settleFlight(wave,{accepted:3,safeRetry:false}),'uncertain');assert.equal(wave.queue[0].remaining,97);
assert.equal(settleFlight(wave,{accepted:3,safeRetry:false}),'uncertain');assert.equal(wave.queue[0].remaining,97);
const resumed=JSON.parse(JSON.stringify(wave));assert.equal(settleFlight(resumed,{accepted:10,safeRetry:true}),'done');assert.equal(resumed.queue[0].remaining,90);
while(resumed.queue.length){const batch=prepareFlight(resumed,rules,rewards,()=>0);settleFlight(resumed,{accepted:batch.units,safeRetry:true});}
assert.equal(resumed.stats.zombies,100);
const failed=initialState();receiveEvent(failed,follow,rules);prepareFlight(failed,rules,rewards,()=>0);settleFlight(failed,{accepted:0,safeRetry:true,error:'offline'});assert.equal(failed.queue[0].remaining,5);assert.equal(failed.flight,null);
const originalDraw=failed.queue[0].reservedEntities.slice();const retried=prepareFlight(failed,rules,rewards,()=>{throw new Error('Do not reroll failed zombies');});assert.deepEqual(retried.payload.entities,originalDraw);
settleFlight(failed,{accepted:2,safeRetry:true});const partialDraw=prepareFlight(failed,rules,rewards,()=>{throw new Error('Do not reroll pending zombies');});assert.deepEqual(partialDraw.payload.entities,originalDraw.slice(2));
const actualGuns=read('server/kubejs/cursed-live-guns.json');
for(const tier of ['t1','t2'])for(const g of rewards['gun_'+tier].variants){
 const actual=actualGuns.guns.find(x=>x.id===g.id);assert.ok(actual);assert.equal(g.ammo,actual.ammo);assert.equal(g.capacity,actual.capacity);assert.equal(g.ammoCount,g.capacity*(tier==='t1'?2:3));assert.ok(actualGuns.ammo.includes(g.ammo));
}
assert.equal(rewards.gun_t1.variants.length,12);assert.equal(rewards.gun_t2.variants.length,39);
console.log('PASS: likes carry-over, follow dedup, all 9 gift rules, corrected 50/100 waves, combos without double counting, zero group IDs, 80/18/2 selection, reward priority, partial/uncertain recovery, exact 100 wave, all 51 gun/ammo bundles.');
