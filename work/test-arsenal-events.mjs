import assert from 'node:assert/strict';
import {initialState,receiveEvent,chooseZombie,prepareFlight} from '../outputs/Cursed-Walking-LIVE/events.mjs';
import {read,write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
const rules=read('mappings.json'),rewards=read('rewards.json'),s=initialState();
const gift=(name,price,count=1,id=name)=>({event:'gift',data:{giftName:name,diamondCount:price,repeatCount:count,giftType:1,repeatEnd:true,msgId:id}});
receiveEvent(s,{event:'like',data:{likeCount:1,msgId:'one'}},rules);assert.equal(s.likes.pending,1);assert.equal(s.queue[0].distribution,'weakest');
receiveEvent(s,{event:'like',data:{likeCount:1,msgId:'one'}},rules);assert.equal(s.likes.pending,1);
for(const e of [{event:'follow',data:{msgId:'off'}},gift("You're awesome",1),gift('Finger Heart',5),gift('Spinning Soccer',5)])assert.equal(receiveEvent(s,e,rules),false);
for(const [name,price,count,expected] of [['Rose',1,2,10],['Okay',5,1,20],['Shamrock',10,1,50],['Little Kisses',20,1,3],['Doughhut',30,1,5]]){receiveEvent(s,gift(name,price,count),rules);assert.equal(s.queue.at(-1).remaining,expected);}
receiveEvent(s,gift('Rosa',10),rules);receiveEvent(s,gift('Perfume',20),rules);assert.equal(prepareFlight(s,rules,rewards,()=>0).payload.reward,'boost_t2');
let weak=0,medium=0;
for(let roll=0;roll<100;roll++){let calls=0;const id=chooseZombie(rules,'gift_low',()=>calls++===0?roll:0);if(rules.zombiePools.gift_low[0].entities.includes(id))weak++;else medium++;}
assert.equal(weak,80);assert.equal(medium,20);assert.equal(chooseZombie(rules,'weakest',()=>0),'zombies_plus:weak_zombie');assert.equal(chooseZombie(rules,'giants',()=>0),'mutantmonsters:mutant_zombie');
const before=s.queue.reduce((n,j)=>n+j.remaining,0);receiveEvent(s,gift('Doughhut',30),rules);assert.equal(s.queue.reduce((n,j)=>n+j.remaining,0),before);
write('event-rules-verification.json',{passed:true,at:new Date().toISOString(),checks:['one like -> one weakest zombie','duplicate likes and gifts ignored','disabled follows and old gifts ignored','all seven gift mappings','80/20 weak/medium distribution','Mutant-only giant gifts','boost jobs prioritized over zombie backlog']});
console.log('PASS: new event rules, disabled effects, gift aliases, duplicates, distribution and reward priority');
