from pathlib import Path
import json,uuid,shutil,subprocess,datetime
root=Path('outputs/Cursed-Walking-LIVE').resolve()
actions=Path(r'C:\Users\PHAT\Downloads\Streamer.bot-x64-1.0.7\data\actions.json')
running=subprocess.run(['powershell.exe','-NoProfile','-Command',"[bool](Get-Process -Name 'Streamer.bot' -ErrorAction SilentlyContinue)"],capture_output=True,text=True,check=True).stdout.strip()
if running!='False':raise RuntimeError('Close Streamer.bot before editing its actions file')
data=json.loads(actions.read_text(encoding='utf-8-sig'))
shutil.copy2(actions,root/'backups/streamerbot-actions.before-cursed-walking.json')
id=str(uuid.uuid4())
action={'id':id,'queue':'00000000-0000-0000-0000-000000000000','enabled':True,'excludeFromHistory':False,'excludeFromPending':False,
 'name':'Cursed Walking - Dispatch','group':'Cursed Walking LIVE','alwaysRun':False,'randomAction':False,'concurrent':False,'triggers':[],
 'subActions':[{'command':str(root/'runtime/node.exe'),'arguments':'"'+str(root/'dispatch.mjs')+'" %cwJobId%',
 'workingDir':str(root),'envVars':{},'waitForExit':70,'id':str(uuid.uuid4()),'weight':0.0,'type':6,'parentId':None,'enabled':True,'index':0}],'collapsedGroups':[]}
if not any(a['name']==action['name'] for a in data['actions']):data['actions'].append(action)
actions.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
(root/'streamerbot-action.json').write_text(json.dumps(action,indent=2),encoding='utf8')
buttons={'BAT-SERVER':'start-server','BAT-KET-NOI-TIKTOK':'start-bridge','TAT-SERVER':'stop-server','TAT-KET-NOI-TIKTOK':'stop-bridge','TRANG-THAI':'status','KIEM-TRA-STREAMERBOT':'probe','THU-1-ZOMBIE':'zombie','THU-1-FERAL-ZOMBIE':'feral','THU-1-MUTANT-ZOMBIE':'mutant','SAO-LUU':'backup'}
for name,command in buttons.items():
 (root/(name+'.cmd')).write_text('@echo off\ncd /d "%~dp0"\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0manage.ps1" -Action '+command+'\npause\n',encoding='ascii')
print('Added Cursed Walking action, backed up existing actions, created',len(buttons),'launchers.')
