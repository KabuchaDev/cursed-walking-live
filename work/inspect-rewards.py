import pathlib,zipfile,json,re
root=pathlib.Path('outputs/Cursed-Walking-LIVE/server')
for jar in (root/'mods').glob('*.jar'):
 with zipfile.ZipFile(jar) as z:
  for f in z.namelist():
   if f.endswith('/lang/en_us.json'):
    try: d=json.loads(z.read(f))
    except:continue
    for k,v in d.items():
     if re.search('modern.?axe|tier.?[12]|\\[t[12]\\]',str(v),re.I):print(jar.name,k,str(v)[:160])
for archive in (root/'config/openloader/data').glob('*.zip'):
 with zipfile.ZipFile(archive) as z:
  for f in z.namelist():
   if re.search('tier|t1|t2|gun',f,re.I) and f.endswith('.json'):print(archive.name,f)
