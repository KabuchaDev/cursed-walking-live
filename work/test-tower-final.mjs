import assert from 'node:assert/strict';
import {read,write,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
const cmd=c=>rcon(c,settings),wait=ms=>new Promise(r=>setTimeout(r,ms));
const evidence={started:new Date().toISOString(),checks:[]};let qa=false;
async function inspect(){await cmd('cw_td inspect');return read('server/kubejs/cw-td-inspect.json');}
try{
 assert.match(await cmd('cw_td qa wake'),/TD_QA_WORLD_AWAKE/);await wait(1000);
 const map=JSON.parse(await cmd('cw_td validate'));assert.equal(map.passed,true);evidence.checks.push({name:'Entire path and all three physical buttons exist after restart',map});
 const debug=JSON.parse(await cmd('cw_td debug'));assert.equal(debug.entities['minecraft:text_display'],17);evidence.checks.push({name:'All 17 map signs loaded from saved world',debug});
 assert.match(await cmd('cw_td qa begin'),/TD_QA_STARTED/);qa=true;
 await cmd('execute in cw_live:defense run summon minecraft:zombie -99.5 64 -64.5 {Tags:["qa_untracked"]}');
 await wait(500);assert.equal((await inspect()).active,0);assert.match(await cmd('execute in cw_live:defense if entity @e[tag=qa_untracked]'),/Test failed/);
 evidence.checks.push({name:'Natural hordes and untracked zombies cannot add unrequested waves'});
 for(const [i,type] of ['minecraft:zombie','feralzombie:spitter_zombie','mutantmonsters:mutant_zombie'].entries())assert.match(await cmd('cw_td spawn '+JSON.stringify(type)+' qa_final_'+i),/TD_SPAWNED/);
 await wait(1000);const wave=await inspect();assert.equal(wave.active,3);assert.ok(wave.mobs.every(m=>m.progress>0&&m.noAI&&m.target===null));evidence.checks.push({name:'Tagged event zombies still move normally',wave});
 const starter=read('server/kubejs/cw-td-config.json').starter;
 const gun=read('server/kubejs/cursed-live-guns.json').guns.find(g=>g.id===starter.gun);assert.ok(gun);assert.equal(gun.ammo,starter.ammo);assert.equal(gun.capacity,starter.capacity);evidence.checks.push({name:'Starter pistol and matching ammo registered in actual server',starter});
 evidence.passed=true;console.log('PASS Final map, loaded signs, natural-spawn guard, event waves and starter registry.');
}catch(error){evidence.passed=false;evidence.error=error.stack;console.error(error.stack);process.exitCode=1;}
finally{
 if(qa)evidence.cleanup=await cmd('cw_td qa end');
 evidence.emptyServerPause=await cmd('cw_td qa sleep');
 evidence.final=await inspect();evidence.finished=new Date().toISOString();write('tower-defense-final-verification.json',evidence);
}
