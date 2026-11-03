import fs from 'node:fs';
import path from 'node:path';
import {root,read,write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
const rules=read('mappings.json');
rules.follow.enabled=false;
rules.likes={enabled:true,threshold:1,entities:['zombies_plus:weak_zombie'],distribution:'weakest'};
rules.zombiePools.weakest=['zombies_plus:weak_zombie'];
rules.zombiePools.giants=['mutantmonsters:mutant_zombie'];
rules.zombiePools.gift_low=[{name:'T1',weight:80,entities:rules.zombiePools.weighted[0].entities},{name:'T2',weight:20,entities:rules.zombiePools.weighted[1].entities}];
rules.maxActiveMobs=120;
rules.gifts=[
 {name:'Rose',coins:1,ids:[5655],kind:'summon',count:5,distribution:'gift_low'},
 {name:'Okay',coins:5,kind:'summon',count:20,distribution:'gift_low'},
 {name:'Rosa',coins:10,ids:[8913],kind:'reward',reward:'boost_t2'},
 {name:'Shamrock',coins:10,kind:'summon',count:50,distribution:'gift_low'},
 {name:'Little Kisses',coins:20,kind:'summon',count:3,distribution:'giants'},
 {name:'Perfume',coins:20,kind:'reward',reward:'boost_t3'},
 {name:'Doughnut',aliases:['Doughhut','Donut'],coins:30,kind:'summon',count:5,distribution:'giants'}
];
const state=read('events-state.json');if(state.flight)throw Error('Resolve pending flight first');
if(state.likes.threshold!==1){
 state.legacyLikeRemainders??=[];state.legacyLikeRemainders.push({threshold:100,remainder:state.likes.remainder,at:new Date().toISOString()});
 state.likes.remainder=0;state.likes.threshold=1;
}
write('events-state.json',state);write('mappings.json',rules);
const rewards=read('rewards.json');
for(const tier of ['T2','T3'])rewards['boost_'+tier.toLowerCase()]={description:tier+' automatic weapon rotation for 180 active seconds',variants:[{kind:'boost',tier,seconds:180}]};
write('rewards.json',rewards);
const file=path.join(root,'bridge.mjs');let source=fs.readFileSync(file,'utf8');
source=source.replace('threshold:100,totalReceived','threshold:rules.likes.threshold,totalReceived').replace('toNext:100-likes.remainder','toNext:rules.likes.threshold-likes.remainder');
source=source.replace('Cursed Walking ready: weighted likes/follow + ','Cursed Walking ready: '+rules.likes.threshold+' like per zombie + ');
fs.writeFileSync(file,source);
const manager=path.join(root,'manage.ps1');fs.writeFileSync(manager,fs.readFileSync(manager,'utf8').replace('100 tim, follow va 9 loai qua','1 tim = 1 zombie va 7 loai qua'));
console.log(JSON.stringify({gifts:rules.gifts,likes:rules.likes,follow:rules.follow.enabled,preservedQueue:state.queue.length}));
