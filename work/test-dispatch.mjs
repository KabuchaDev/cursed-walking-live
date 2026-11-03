import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const source=fileURLToPath(new URL('../outputs/Cursed-Walking-LIVE/',import.meta.url)),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cw-dispatch-test-'));
for(const d of ['spool','server/kubejs'])fs.mkdirSync(path.join(tmp,d),{recursive:true});
for(const f of ['dispatch.mjs','common.mjs','mappings.json','rewards.json'])fs.copyFileSync(path.join(source,f),path.join(tmp,f));
const rules=JSON.parse(fs.readFileSync(path.join(tmp,'mappings.json')));rules.mode='classic';fs.writeFileSync(path.join(tmp,'mappings.json'),JSON.stringify(rules));
fs.copyFileSync(path.join(source,'server/kubejs/cursed-live-entities.json'),path.join(tmp,'server/kubejs/cursed-live-entities.json'));fs.writeFileSync(path.join(tmp,'settings.local.json'),'{}');
fs.writeFileSync(path.join(tmp,'rcon.mjs'),`import fs from 'node:fs';let spawned=0;const scenario=JSON.parse(fs.readFileSync('scenario.json'));export async function rcon(command){
fs.appendFileSync('commands',command+'\\n');
if(command==='list')return scenario.offline?'There are 0 of a max of 4 players online: ':'There are 1 of a max of 4 players online: TestPlayer';
if(command.startsWith('execute in cw_live:defense'))return scenario.outside?'Test failed':'Test passed, count: 1';
if(command.startsWith('cw_td spawn ')){if(scenario.timeout)throw new Error('RCON timeout');if(scenario.wait||spawned>=(scenario.available??200))return 'TD_WAIT mob_limit';spawned++;return 'TD_SPAWNED '+command.split(' ').at(-1);}
if(command.startsWith('cw_td reward ')){if(scenario.timeout)throw new Error('RCON timeout');return scenario.wait?'TD_WAIT reward':'TD_REWARDED';}
if(command.includes('run function')){if(scenario.timeout)throw new Error('RCON timeout');return "Executed 2 command(s) from function 'cw_live:rewards/test'";}
if(command.includes('tag=cw_live,nbt='))return 'Test passed, count: '+(scenario.active??0);
if(command.includes('run summon')){spawned++;if(scenario.timeout)throw new Error('RCON timeout');return 'Summoned new zombie';}
if(command.includes('if entity @e[tag=cw_job_'))return 'Test passed, count: '+(scenario.blockAt===spawned?0:1);
if(command.includes('if block')&&!command.includes('run summon'))return command.endsWith(' ')?'Unknown or incomplete command':'Test passed';
throw new Error('Unexpected command: '+command);}`);
function run(payload,scenario={}){
 const id=crypto.randomUUID();fs.writeFileSync(path.join(tmp,'scenario.json'),JSON.stringify(scenario));fs.writeFileSync(path.join(tmp,'commands'),'');fs.writeFileSync(path.join(tmp,'spool',id+'.json'),JSON.stringify({...payload,createdAt:Date.now()}));
 spawnSync(process.execPath,['dispatch.mjs',id],{cwd:tmp,encoding:'utf8'});
 return {result:JSON.parse(fs.readFileSync(path.join(tmp,'spool',id+'.result.json'))),commands:fs.readFileSync(path.join(tmp,'commands'),'utf8').trim().split('\n'),id};
}
const payload={kind:'summon',entities:Array(10).fill('minecraft:zombie')};
let r=run(payload);assert.equal(r.result.accepted,10);assert.equal(r.commands.filter(x=>x.includes('run summon')).length,10);
assert.equal(new Set(r.commands.filter(x=>x.includes('if entity @e[tag=cw_job_'))).size,10);
r=run(payload,{active:197});assert.equal(r.result.accepted,3);assert.equal(r.result.safeRetry,true);
r=run(payload,{active:200});assert.equal(r.result.accepted,0);assert.equal(r.result.safeRetry,true);assert.equal(r.commands.filter(x=>x.includes('run summon')).length,0);
r=run(payload,{blockAt:4});assert.equal(r.result.accepted,3);assert.equal(r.result.safeRetry,true);
r=run(payload,{timeout:true});assert.equal(r.result.accepted,0);assert.equal(r.result.safeRetry,false);
r=run(payload,{offline:true});assert.equal(r.result.accepted,0);assert.equal(r.result.safeRetry,true);
r=run({kind:'summon',entities:['mutantmonsters:mutant_zombie']});assert.equal(r.result.accepted,1);assert.ok(r.commands.some(x=>x.includes('if block')&&!x.includes('run summon')));assert.ok(r.commands.every(x=>Buffer.byteLength(x,'utf8')<=1300),'RCON commands fit the server request buffer');
r=run({kind:'reward',reward:'gun_t1',variant:0});assert.equal(r.result.accepted,1);assert.ok(r.commands.at(-1).includes('run function cw_live:rewards/t1/bf1/obrez'));
r=run({kind:'reward',reward:'gun_t2',variant:0},{timeout:true});assert.equal(r.result.safeRetry,false);
r=run({kind:'reward',reward:'not_allowed',variant:0});assert.equal(r.result.accepted,0);assert.equal(r.commands.filter(x=>x.includes('run function')).length,0);
console.log('PASS: dispatcher mixed batch, 200 limit, partial progress, unique spawn tags, blocked mob, uncertain transport holds, offline retry, gun reward, invalid reward rejected.');
rules.mode='tower_defense';fs.writeFileSync(path.join(tmp,'mappings.json'),JSON.stringify(rules));
r=run(payload);assert.equal(r.result.accepted,10);assert.equal(r.commands.filter(c=>c.startsWith('cw_td spawn')).length,10);assert.ok(!r.commands.some(c=>c.includes('run summon')));
r=run(payload,{available:3});assert.equal(r.result.accepted,3);assert.equal(r.result.safeRetry,true);
r=run(payload,{wait:true});assert.equal(r.result.accepted,0);assert.equal(r.result.safeRetry,true);
r=run(payload,{outside:true});assert.equal(r.result.accepted,0);assert.equal(r.commands.length,2);
r=run(payload,{timeout:true});assert.equal(r.result.accepted,0);assert.equal(r.result.safeRetry,false);
r=run({kind:'reward',reward:'gun_t1',variant:0});assert.equal(r.result.accepted,1);assert.ok(r.commands.at(-1).startsWith('cw_td reward'));
r=run({kind:'reward',reward:'gun_t1',variant:0},{wait:true});assert.equal(r.result.accepted,0);assert.equal(r.result.safeRetry,true);
r=run({kind:'reward',reward:'gun_t1',variant:0},{timeout:true});assert.equal(r.result.safeRetry,false);
console.log('PASS: tower defense routes every summon to the gate, queues paused/capped/outside cases, delivers atomic reward, holds uncertain transport.');
console.log('Isolated evidence: '+tmp);
