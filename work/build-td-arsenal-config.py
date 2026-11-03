import json,pathlib,re,math
root=pathlib.Path('outputs/Cursed-Walking-LIVE');server=root/'server'
guns={g['id']:g for g in json.loads((server/'kubejs/cursed-live-guns.json').read_text())['guns']}
quests=(server/'config/ftbquests/quests/chapters/ballistics_division.snbt').read_text()
tiers={};names={};indexes={}
for pack in (server/'tacz').iterdir():
 if not pack.is_dir():continue
 for f in pack.glob('assets/*/lang/en_us.json'):
  try:names.update(json.loads(f.read_text()))
  except:pass
 for f in pack.glob('data/*/index/guns/*.json'):
  try:indexes[f.parts[-4]+':'+f.stem]=json.loads(f.read_text())
  except:pass
for block in re.findall(r'^\t\t\{.*?^\t\t\}',quests,re.M|re.S):
 t=re.search(r'\btitle: "(T[123] [^"]+)"',block)
 if t:
  for id in re.findall(r'GunId: "([^"]+)"',block):tiers.setdefault(id,t[1][:2])
catalog={}
for id,g in guns.items():
 index=indexes.get(id,{})
 catalog[id]={**g,'tier':tiers.get(id,'OTHER'),'name':names.get(index.get('name'),id)}
pools={tier:[id for id,g in catalog.items() if g['tier']==tier and 'AUTO' in g['modes'] and g['rpm']>=500 and g['capacity']>=10] for tier in ['T1','T2','T3']}
assert all(len(v)>=2 for v in pools.values()),pools
# Mounts extend from the six existing firing pads toward the road, without blocking its inner lanes.
pads=[{'id':1,'x':-66.5,'y':64,'z':-58.5,'padX':-66,'padZ':-51}, {'id':2,'x':-31.5,'y':64,'z':11.5,'padX':-32,'padZ':17}, {'id':3,'x':8.5,'y':64,'z':-50.5,'padX':1,'padZ':-51}, {'id':4,'x':74.5,'y':64,'z':-46.5,'padX':84,'padZ':-47}, {'id':5,'x':49.5,'y':64,'z':46.5,'padX':49,'padZ':53}, {'id':6,'x':-.5,'y':64,'z':72.5,'padX':-10,'padZ':72}]
config={'version':2,'pools':pools,'guns':catalog,'magazines':{'T1':5,'T2':10,'T3':10},'boostSeconds':180,'turretSeconds':300,'turretRange':10,'mountRange':3.5,'runSpeedMultiplier':.6,'pads':pads}
(server/'kubejs/cw-td-arsenal.json').write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding='utf-8')
td=json.loads((server/'kubejs/cw-td-config.json').read_text())
td['maxMobs']=120;td['types']['mutantmonsters:mutant_zombie']['speed']=.07
chunks=set()
for a,b in zip(td['route'],td['route'][1:]):
 length=math.dist(a,b)
 for step in range(math.ceil(length)+1):
  f=min(1,step/length);x=a[0]+(b[0]-a[0])*f;z=a[2]+(b[2]-a[2])*f
  for dx in [-2,2]:
   for dz in [-2,2]:chunks.add((math.floor((x+dx)/16),math.floor((z+dz)/16)))
for p in pads:chunks.add((math.floor(p['x']/16),math.floor(p['z']/16)))
td['tickingChunks']=[list(c) for c in sorted(chunks)]
(server/'kubejs/cw-td-config.json').write_text(json.dumps(td,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pools':{k:[(id,catalog[id]['rpm']) for id in v] for k,v in pools.items()},'tickingChunks':len(chunks)},ensure_ascii=False))
