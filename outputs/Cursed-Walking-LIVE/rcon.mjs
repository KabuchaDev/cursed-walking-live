import net from 'node:net';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const lockPath=fileURLToPath(new URL('./rcon-command.lock',import.meta.url));
async function acquireLock(){
  const deadline=Date.now()+30000;
  while(true){
    try{
      const fd=fs.openSync(lockPath,'wx');
      fs.writeFileSync(fd,JSON.stringify({pid:process.pid,at:Date.now()}));
      return ()=>{fs.closeSync(fd);fs.unlinkSync(lockPath);};
    }catch(error){
      if(error.code!=='EEXIST')throw error;
      try{
        const owner=JSON.parse(fs.readFileSync(lockPath,'utf8'));
        try{process.kill(owner.pid,0);}catch(error){if(error.code==='ESRCH'){fs.unlinkSync(lockPath);continue;}}
      }catch{}
      if(Date.now()>deadline)throw new Error('RCON command queue busy; no command sent.');
      await new Promise(resolve=>setTimeout(resolve,15));
    }
  }
}
export async function rcon(command,settings){
  // Minecraft shares one console response buffer across RCON clients. Serialize
  // the monitor, dispatcher and controls, including their delimiter requests.
  const release=await acquireLock();
  try{return await sendCommand(command,settings);}finally{release();}
}
function sendCommand(command, settings) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: settings.rconPort });
    let incoming = Buffer.alloc(0), output = '', authenticated = false, finished = false, delimiterSent = false;
    socket.setNoDelay(true);
    const finish = (error) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      error ? reject(error) : resolve(output);
    };
    const send = (id, type, value) => {
      const body = Buffer.from(value, 'utf8');
      const packet = Buffer.alloc(body.length + 14);
      packet.writeInt32LE(body.length + 10, 0);
      packet.writeInt32LE(id, 4);
      packet.writeInt32LE(type, 8);
      body.copy(packet, 12);
      socket.write(packet);
    };
    socket.setTimeout(15000, () => finish(new Error('Server khong phan hoi trong 15 giay.')));
    socket.on('error', finish);
    socket.on('end', () => finish(new Error('Server dong ket noi truoc khi tra loi.')));
    socket.on('connect', () => send(1, 3, settings.rconPassword));
    socket.on('data', chunk => {
      incoming = Buffer.concat([incoming, chunk]);
      while (incoming.length >= 4) {
        const size = incoming.readInt32LE(0);
        if (size < 10 || size > 4 * 1024 * 1024) return finish(new Error('RCON packet khong hop le.'));
        if (incoming.length < size + 4) return;
        const packet = incoming.subarray(0, size + 4);
        incoming = incoming.subarray(size + 4);
        const id = packet.readInt32LE(4), type = packet.readInt32LE(8);
        if (id === -1) return finish(new Error('Sai mat khau RCON.'));
        if (!authenticated && id === 1 && type === 2) {
          authenticated = true;
          send(2, 2, command.trim());
        } else if (authenticated && id === 2) {
          output += packet.subarray(12, size + 2).toString('utf8');
          if (command.trim() === 'stop') return finish();
          // Wait for a response before sending the delimiter: Minecraft rejects
          // two incoming requests coalesced into a single TCP read.
          if (!delimiterSent) { delimiterSent = true; send(3, 2, 'list'); }
        } else if (authenticated && id === 3) return finish();
      }
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const settings = JSON.parse(fs.readFileSync(new URL('./settings.local.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
  try { console.log(await rcon(process.argv.slice(2).join(' ') || 'list', settings)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
