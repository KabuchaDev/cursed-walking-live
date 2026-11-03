import pathlib,re,json
root=pathlib.Path('outputs/Cursed-Walking-LIVE/server')
runtime=json.loads((root/'kubejs/cursed-live-guns.json').read_text(encoding='utf8'))
loaded={g['id']:g for g in runtime['guns']}
quests=(root/'config/ftbquests/quests/chapters/ballistics_division.snbt').read_text(encoding='utf8')
guns={};langs={};data={};ammo=set()
for pack in (root/'tacz').iterdir():
 if not pack.is_dir():continue
 for f in pack.glob('assets/*/lang/en_us.json'):langs.update(json.loads(f.read_text(encoding='utf8')))
 for f in pack.glob('data/*/index/guns/*.json'):
  try:guns[f.parts[-4]+':'+f.stem]=json.loads(f.read_text(encoding='utf8'))
  except:
   match=re.search(r'"name"\s*:\s*"([^"]+)"',f.read_text(encoding='utf8'))
   if match:guns[f.parts[-4]+':'+f.stem]={'name':match[1]}
 for f in pack.glob('data/*/data/guns/*.json'):
  try:data[f.parts[-4]+':'+f.stem]=json.loads(f.read_text(encoding='utf8'))
  except Exception as e:print('Skipped malformed data:',f.name,str(e))
 for f in pack.glob('data/*/index/ammo/*.json'):ammo.add(f.parts[-4]+':'+f.stem)
out=[]
for block in re.findall(r'^\t\t\{.*?^\t\t\}',quests,re.M|re.S):
 title=re.search(r'\btitle: "(T[12] [^"]+)"',block)
 if not title:continue
 for id in dict.fromkeys(re.findall(r'GunId: "([^"]+)"',block)):
  index=guns.get(id);gdata=data.get(index.get('data','')) if index else None
  if id not in loaded:print('NOT LOADED',title[1],id);continue
  actual=loaded[id]
  if not index:print('MISSING INDEX',id);continue
  questtag=re.search(r'GunFireMode: "([^"]+)"\s+GunId: "'+re.escape(id)+'"',block)
  row={'tier':title[1][:2],'category':title[1],'id':id,'name':langs.get(index['name'],index['name']),'ammo':actual['ammo'],'capacity':actual['capacity'],'mode':gdata['fire_mode'][0].upper() if gdata else questtag[1],'ammoIndexFound':actual['ammo'] in runtime['ammo']}
  out.append(row);print(json.dumps(row,ensure_ascii=False))
pathlib.Path('work/gun-tiers.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
