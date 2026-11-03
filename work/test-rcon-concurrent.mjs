import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {root,settings} from '../outputs/Cursed-Walking-LIVE/common.mjs';
import {rcon} from '../outputs/Cursed-Walking-LIVE/rcon.mjs';
import path from 'node:path';
function external(command){return new Promise((resolve,reject)=>{let output='';const p=spawn(process.execPath,[path.join(root,'rcon.mjs'),...command.split(' ')],{windowsHide:true,stdio:['ignore','pipe','pipe']});p.stdout.on('data',x=>output+=x);p.stderr.on('data',x=>output+=x);p.on('exit',code=>code===0?resolve(output):reject(new Error(output)));});}
await Promise.all(Array.from({length:20},async(_,i)=>{const list=i%2===0,command=list?'list':'time query gametime';const reply=await(i%3===0?external(command):rcon(command,settings));assert.ok((list?/^There are \d+ of a max of \d+ players online:/:/^The time is \d+/).test(reply),reply);assert.ok(!reply.includes('Unknown'),reply);}));
console.log('PASS: 20 concurrent RCON requests across independent processes return the matching response; no empty-command errors.');
