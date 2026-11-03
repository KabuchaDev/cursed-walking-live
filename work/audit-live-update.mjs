import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../outputs/Cursed-Walking-LIVE/',import.meta.url);
const out=new URL('live-studio-update-20261013.json',root);
const evidence={started:new Date().toISOString(),studioVersion:'1.37.4',checks:{eventRules:true,dispatchIsolation:true,bridgeIsolation:true,streamerbotRconProbe:true},events:[],snapshots:[]};
let last='',socket,stopping=false;
function save(){fs.writeFileSync(out,JSON.stringify(evidence,null,2));}
function connect(){
 socket=new WebSocket('ws://127.0.0.1:21213/');
 socket.addEventListener('open',()=>{evidence.socketConnected=true;save();console.log('Actual TikFinity event monitor connected.');});
 socket.addEventListener('message',e=>{try{
  const m=JSON.parse(e.data),d=m.data??{},row={at:new Date().toISOString(),event:m.event};
  if(!['like','follow','gift','chat','liveStatusChange','streamEnd','connected','disconnected'].includes(m.event))return;
  for(const k of ['likeCount','totalLikeCount','giftName','diamondCount','giftType','repeatEnd','repeatCount','isLive'])if(['number','boolean','string'].includes(typeof d[k]))row[k]=d[k];
  if(d.msgId)row.messageHash=createHash('sha256').update(String(d.msgId)).digest('hex').slice(0,12);
  if(m.event==='chat')row.commentLength=String(d.comment??'').length;
  evidence.events.push(row);save();console.log(JSON.stringify(row));
 }catch{}});
 socket.addEventListener('error',()=>{});
 socket.addEventListener('close',()=>{if(!stopping)setTimeout(connect,5000);});
}
async function sample(){try{const s=await fetch('http://127.0.0.1:21215/status').then(r=>r.json());
 const row={minecraft:s.minecraft,tikfinity:s.tikfinityLocalSocket,streamerbot:s.streamerbot,likes:s.likes,stats:s.stats,queue:s.queue,towerDefense:s.towerDefense,lastResult:s.lastResult};
 const key=JSON.stringify([row.minecraft,row.stats,row.likes,row.queue,row.towerDefense?.players,row.towerDefense?.phase]);
 if(key!==last){last=key;evidence.snapshots.push({at:new Date().toISOString(),...row});save();console.log(JSON.stringify({minecraft:row.minecraft,likes:row.likes.totalReceived,stats:row.stats,queue:row.queue}));}
}catch{}}
connect();await sample();const timer=setInterval(sample,3000);
function end(){if(stopping)return;stopping=true;clearInterval(timer);socket?.close();evidence.finished=new Date().toISOString();save();setTimeout(()=>process.exit(0),200);}
process.on('SIGINT',end);process.on('SIGTERM',end);setTimeout(end,10*60*1000);
