import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.dirname(fileURLToPath(import.meta.url));
export const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
export const settings=read('settings.local.json');
export function write(p,data){const dest=path.join(root,p);fs.writeFileSync(dest+'.tmp',JSON.stringify(data,null,2));fs.renameSync(dest+'.tmp',dest);}
export function log(message){const file=path.join(root,'logs/bridge.log');if(fs.existsSync(file)&&fs.statSync(file).size>2e6)fs.renameSync(file,file+'.previous');const line=new Date().toISOString()+' '+message;fs.appendFileSync(file,line+'\n');console.log(line);}
export function catalog(){return read('server/kubejs/cursed-live-entities.json').entities.filter(e=>e.summonable&&e.category!=='misc');}
