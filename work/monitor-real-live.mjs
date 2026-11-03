import {write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {createHash} from 'node:crypto';
const evidence={started:new Date().toISOString(),source:'Actual local TikFinity WebSocket 127.0.0.1:21213; no synthetic events injected',events:[],status:[]};
let socket,stopping=false;
const save=()=>write('live-source-verification.json',evidence);
function connect(){
 socket=new WebSocket('ws://127.0.0.1:21213/');
 socket.addEventListener('open',()=>console.log('Listening to actual TikFinity events.'));
 socket.addEventListener('message',async e=>{
  try{
   const envelope=JSON.parse(e.data),d=envelope.data??{},kind=envelope.event;
   if(!['like','follow','gift','liveStatusChange','streamEnd','connected','disconnected'].includes(kind))return;
   const row={at:new Date().toISOString(),event:kind,keys:Object.keys(d)};
   for(const key of ['likeCount','totalLikeCount','giftId','giftName','diamondCount','giftType','repeatEnd','repeatCount','status','connected','isLive'])if(['number','boolean','string'].includes(typeof d[key]))row[key]=d[key];
   if(d.msgId)row.messageHash=createHash('sha256').update(String(d.msgId)).digest('hex').slice(0,12);
   evidence.events.push(row);save();console.log(JSON.stringify(row));
  }catch(error){console.error(error.message);}
 });
 socket.addEventListener('error',()=>{});
 socket.addEventListener('close',()=>{if(!stopping)setTimeout(connect,5000);});
}
connect();
let previous='';
const timer=setInterval(async()=>{try{
 const s=await fetch('http://127.0.0.1:21215/status').then(r=>r.json());
 const row={at:new Date().toISOString(),minecraft:s.minecraft,streamerbot:s.streamerbot,tikfinity:s.tikfinityLocalSocket,likes:s.likes,stats:s.stats,queue:s.queue,lastResult:s.lastResult};
 const key=JSON.stringify({likes:s.likes.totalReceived,stats:s.stats,queue:s.queue});
 if(key!==previous){previous=key;evidence.status.push(row);save();console.log('PRODUCTION '+JSON.stringify({likes:s.likes.totalReceived,remainder:s.likes.remainder,stats:s.stats,queue:s.queue}));}
}catch{}},1500);
function end(){if(stopping)return;stopping=true;clearInterval(timer);socket?.close();evidence.finished=new Date().toISOString();save();setTimeout(()=>process.exit(0),300);}
process.on('SIGINT',end);process.on('SIGTERM',end);setTimeout(end,20*60*1000);
