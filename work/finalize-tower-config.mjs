import fs from 'node:fs';
import path from 'node:path';
import {root,read,write} from '../outputs/Cursed-Walking-LIVE/common.mjs';
const rules=read('mappings.json');rules.mode='tower_defense';write('mappings.json',rules);
const commands={
 'VAO-MAP-THU-THANH':'cw_td join',
 'BAT-DAU-HOAC-CHOI-LAI':'cw_td start',
 'TAM-DUNG-HOAC-TIEP-TUC':'cw_td pause',
 'VE-MAP-SINH-TON':'cw_td leave',
 'TRANG-THAI-THU-THANH':'cw_td status'
};
for(const [name,command] of Object.entries(commands))fs.writeFileSync(path.join(root,name+'.cmd'),'@echo off\r\ncd /d "%~dp0"\r\n"%~dp0runtime\\node.exe" "%~dp0rcon.mjs" '+command+'\r\npause\r\n');
fs.writeFileSync(path.join(root,'BAT-THU-THANH.cmd'),'@echo off\r\ncd /d "%~dp0"\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0manage.ps1" start-server\r\nif errorlevel 1 goto end\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0manage.ps1" start-bridge\r\necho Minecraft: 127.0.0.1:25567\r\necho Vao game, go /cw_td join, roi /cw_td start.\r\n:end\r\npause\r\n');
console.log('Tower defense enabled; event totals, gift mappings and pending queue preserved.');
