from pathlib import Path
import json, secrets, shutil, hashlib
root=Path('outputs/Cursed-Walking-LIVE').resolve()
server=root/'server'
old=Path(r'C:\Users\PHAT\Documents\Codex\2026-10-04\l\outputs\Zeefski-JJK-3.2.1')
prior=json.loads((old/'settings.local.json').read_text(encoding='utf-8-sig'))
settings={
 'javaPath':prior['javaPath'], 'nodePath':prior['nodePath'],
 'serverDir':str(server), 'clientDir':r'C:\Users\PHAT\AppData\Roaming\.minecraft\versions\Cursed Walking - A Modern Zombie Apocalypse Cursed Walking-v3.3 (patch)',
 'serverPort':25567,'rconPort':25577,'rconPassword':secrets.token_hex(24),
 'controlPort':21215,'controlToken':secrets.token_hex(24),
 'tikfinityUrl':'ws://127.0.0.1:21213/','streamerbotUrl':'ws://127.0.0.1:8080/',
 'actionName':'Cursed Walking - Dispatch',
 'streamerbotExe':r'C:\Users\PHAT\Downloads\Streamer.bot-x64-1.0.7\Streamer.bot.exe',
 'tikfinityExe':r'C:\Users\PHAT\AppData\Local\Programs\tikfinity\TikFinity.exe'
}
if not (root/'settings.local.json').exists():
 (root/'settings.local.json').write_text(json.dumps(settings,indent=2),encoding='utf8')
else: settings=json.loads((root/'settings.local.json').read_text())
(root/'backups').mkdir(exist_ok=True)
shutil.copy2(server/'server.properties',root/'backups/server.properties.author-original')
props={}
for line in (server/'server.properties').read_text().splitlines():
 if '=' in line and not line.startswith('#'):
  key,val=line.split('=',1);props[key]=val
props.update({'server-ip':'127.0.0.1','server-port':'25567','enable-rcon':'true','rcon.port':'25577','rcon.password':settings['rconPassword'],
 'broadcast-rcon-to-ops':'false','broadcast-console-to-ops':'false','online-mode':'false','enforce-secure-profile':'false',
 'max-players':'4','view-distance':'6','simulation-distance':'4','motd':'Cursed Walking LIVE - KabuchaDev','spawn-protection':'0',
 'level-name':'world-cursed-live','difficulty':'normal','allow-flight':'true'})
(server/'server.properties').write_text('\n'.join(k+'='+v for k,v in props.items())+'\n',encoding='ascii')
# Preserve the user's EULA acceptance already recorded in their existing server.
shutil.copy2(old/'server/eula.txt',server/'eula.txt')
(server/'user_jvm_args.txt').write_text('-Xms1G\n-Xmx4G\n-XX:+UseG1GC\n-Dfile.encoding=UTF-8\n',encoding='ascii')
shutil.copy2(old/'rcon.mjs',root/'rcon.mjs')
for folder in ['logs','spool','runtime']:(root/folder).mkdir(exist_ok=True)
shutil.copy2(settings['nodePath'],root/'runtime/node.exe')
settings['nodePath']=str(root/'runtime/node.exe')
(root/'settings.local.json').write_text(json.dumps(settings,indent=2),encoding='utf8')
(root/'mappings.json').write_text(json.dumps({'liveEnabled':False,'targetPlayer':'','maxPerEvent':10,'maxActiveMobs':40,'gifts':[],'comments':[]},indent=2),encoding='utf8')
(server/'kubejs/server_scripts/cursed_live_catalog.js').write_text('''// Local LIVE preparation: export actual registered summonable living entity types.
const CwRegistries = Java.loadClass('net.minecraftforge.registries.ForgeRegistries');
ServerEvents.loaded(event => {
  let rows = [];
  CwRegistries.ENTITY_TYPES.getKeys().forEach(id => {
    let type = CwRegistries.ENTITY_TYPES.getValue(id);
    rows.push({id: String(id), category: String(type.getCategory().getName()), summonable: type.canSummon(), width: type.getWidth(), height: type.getHeight()});
  });
  JsonIO.write('kubejs/cursed-live-entities.json', rows);
  console.info('[Cursed LIVE] Exported ' + rows.length + ' entity types.');
});
''',encoding='utf8')
(root/'source-and-versions.json').write_text(json.dumps({'pack':'Cursed Walking v3.3 (patch)','minecraft':'1.20.1','forge':'47.4.0','serverModCount':219,
 'source':'https://www.curseforge.com/minecraft/modpacks/cursed-walking-a-modern-zombie-apocalypse/files/8712048',
 'serverArchiveSHA256':hashlib.sha256(Path('work/cursed-walking-server-3.3-patch.zip').read_bytes()).hexdigest(),
 'localOnly':True,'authentication':'offline, matching existing personal localhost server','liveGiftMappings':'pending user requirements'},indent=2),encoding='utf8')
print('Prepared local server and independent runtime; secrets saved locally, not printed.')
