import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {root,read,write,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const resume=process.argv.includes('--resume');
const original=read(resume?'server/kubejs/cw-td-qa-backup.json':'server/kubejs/cw-td-state.json');
const evidence=resume?read('tower-defense-restart-verification.json'):{started:new Date().toISOString()};
const cmd=c=>rcon(c,settings);
async function manage(action){
 const child=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',root+'/manage.ps1',action],{cwd:root,windowsHide:true,stdio:'ignore'});
 await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('manage '+action+' failed; inspect server log')));});
}
async function inspect(){await cmd('cw_td inspect');return read('server/kubejs/cw-td-inspect.json');}
let begun=resume,stopped=resume,finished=false;
try{
 if(!resume){
 assert.match(await cmd('list'),/There are 0 /);
 assert.equal((await inspect()).active,0);
 assert.match(await cmd('cw_td qa begin'),/TD_QA_STARTED/);begun=true;
 for(const [i,type] of ['minecraft:zombie','mutantmonsters:mutant_zombie'].entries())assert.match(await cmd('cw_td spawn '+JSON.stringify(type)+' qa_restart_'+i),/TD_SPAWNED/);
 await wait(700);await cmd('cw_td pause');evidence.before=await inspect();assert.equal(evidence.before.active,2);
 await cmd('save-all flush');assert.match(await cmd('list'),/There are 0 /);
 await manage('stop-server');stopped=true;console.log('Server saved and stopped for restart verification.');
 }
 // Give the old Java process time to finish unloading chunks and close its ports.
 await wait(7000);
 await manage('start-server');
 stopped=false;console.log('Server restarted.');
 // Hordes freezes all world ticks while empty, including entity loading. Wake only for QA.
 await cmd('cw_td qa wake');
 for(let i=0;i<30;i++){await wait(500);evidence.after=await inspect();if(evidence.after.active===2)break;}
 assert.equal(evidence.after.phase,'paused');assert.equal(evidence.after.active,2);
 assert.deepEqual(evidence.after.mobs.map(m=>[m.type,m.progress,m.x,m.z]).sort(),evidence.before.mobs.map(m=>[m.type,m.progress,m.x,m.z]).sort());
 assert.equal(evidence.after.hp,evidence.before.hp);
 console.log('PASS Paused zombies, exact progress, HP and custom dimension survive full server restart.');
 for(let i=0;i<2;i++)await cmd('execute in cw_live:defense run kill @e[tag=qa_restart_'+i+']');
 await wait(400);write('server/kubejs/cw-td-state.json',original);await cmd('reload');await wait(2500);
 evidence.cleanup=await inspect();assert.equal(evidence.cleanup.active,0);assert.equal(evidence.cleanup.phase,original.phase);assert.equal(evidence.cleanup.hp,original.hp);assert.equal(evidence.cleanup.testMode,false);
 evidence.map=JSON.parse(await cmd('cw_td validate'));assert.equal(evidence.map.passed,true);
 evidence.passed=true;delete evidence.error;finished=true;console.log('PASS Map and original round state restored, no test zombies left.');
}catch(error){evidence.passed=false;evidence.error=error.stack;console.error(error.stack);process.exitCode=1;}
finally{
 if(begun&&!stopped&&!finished){try{await cmd('execute in cw_live:defense run kill @e[tag=cw_td]');write('server/kubejs/cw-td-state.json',original);await cmd('reload');}catch(error){evidence.cleanupError=error.message;}}
 if(!stopped)try{await cmd('cw_td qa sleep');}catch(error){evidence.sleepError=error.message;}
 evidence.finished=new Date().toISOString();write('tower-defense-restart-verification.json',evidence);
}
