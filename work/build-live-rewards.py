import pathlib,json
root=pathlib.Path('outputs/Cursed-Walking-LIVE')
read=lambda p:json.loads((root/p).read_text(encoding='utf-8-sig'))
rules=read('mappings.json')
weak=['minecraft:zombie','feralzombie:drone_zombie','zombies_plus:weak_zombie','zombies_plus:slow_zombie']
strong=['feralzombie:warrior_zombie','mutantmonsters:mutant_zombie','zombies_plus:brute_zombie']
pool=rules['likes']['entities']
medium=[id for id in pool if id not in weak+strong]
rules.update(maxPerEvent=10,maxActiveMobs=200,batchDelayMs=500)
rules['zombiePools']={'uniform':pool,'weighted':[{'name':'weak','weight':80,'entities':weak},{'name':'medium','weight':18,'entities':medium},{'name':'strong','weight':2,'entities':strong}]}
rules['likes']['distribution']='weighted'
rules['follow']={'enabled':True,'count':5,'distribution':'weighted'}
rules['gifts']=[
 {'name':'Rose','coins':1,'ids':[5655],'kind':'summon','count':10,'distribution':'uniform'},
 {'name':"You're awesome",'coins':1,'kind':'reward','reward':'gun_t1'},
 {'name':'Finger Heart','coins':5,'ids':[5487],'kind':'summon','count':30,'distribution':'uniform'},
 {'name':'Okay','coins':5,'kind':'reward','reward':'iron_armor'},
 {'name':'Spinning Soccer','coins':5,'kind':'reward','reward':'modern_axe'},
 {'name':'Rosa','coins':10,'ids':[8913],'kind':'summon','count':50,'distribution':'uniform'},
 {'name':'Shamrock','coins':10,'kind':'reward','reward':'sledgehammer'},
 {'name':'Little kisses','coins':20,'kind':'summon','count':100,'distribution':'uniform'},
 {'name':'Perfume','coins':20,'kind':'reward','reward':'gun_t2'}]
(root/'mappings.json').write_text(json.dumps(rules,ensure_ascii=False,indent=2),encoding='utf8')
items=set(read('server/kubejs/cursed-live-items.json')['items'])
guns=json.loads(pathlib.Path('work/gun-tiers.json').read_text(encoding='utf8'))
rewards={}
functions=root/'server/kubejs/data/cw_live/functions/rewards'
functions.mkdir(parents=True,exist_ok=True)
for tier,mags in [('T1',2),('T2',3)]:
 variants=[]
 for g in [g for g in guns if g['tier']==tier]:
  assert g['ammoIndexFound'] and g['capacity']>0
  variant=g.copy();variant['magazines']=mags;variant['ammoCount']=g['capacity']*mags
  variant['function']='cw_live:rewards/'+tier.lower()+'/'+g['id'].replace(':','/')
  gun_nbt='{GunId:'+json.dumps(g['id'])+',GunFireMode:'+json.dumps(g['mode'])+',GunCurrentAmmoCount:'+str(g['capacity'])+',HasBulletInBarrel:1b}'
  ammo_nbt='{AmmoId:'+json.dumps(g['ammo'])+'}'
  variant['items']=[{'id':'tacz:modern_kinetic_gun','nbt':gun_nbt,'count':1},{'id':'tacz:ammo','nbt':ammo_nbt,'count':variant['ammoCount']}]
  variants.append(variant)
 rewards['gun_'+tier.lower()]={'description':f'1 random {tier} gun, loaded, plus {mags} matching magazines worth of ammo','variants':variants}
for key,ids in [('iron_armor',['minecraft:iron_helmet','minecraft:iron_chestplate','minecraft:iron_leggings','minecraft:iron_boots']),('modern_axe',['marbledsmelees:modern_axe']),('sledgehammer',['marbledsmelees:sledgehammer'])]:
 rewards[key]={'variants':[{'function':'cw_live:rewards/'+key,'items':[{'id':id,'count':1,'nbt':''} for id in ids]}]}
for reward in rewards.values():
 for v in reward['variants']:
  file=root/'server/kubejs/data/cw_live/functions'/ (v['function'].split(':')[1]+'.mcfunction')
  file.parent.mkdir(parents=True,exist_ok=True)
  for item in v['items']:assert item['id'] in items
  # TaCZ reports a base max stack size of 1 to /give; counts above 100
  # are rejected even though its NBT-specific ammo can stack in inventory.
  lines=[]
  for i in v['items']:
   remaining=i['count']
   while remaining:
    count=min(64,remaining)
    lines.append('give @s '+i['id']+i['nbt']+' '+str(count))
    remaining-=count
  file.write_text('\n'.join(lines)+'\n',encoding='utf8')
(root/'rewards.json').write_text(json.dumps(rewards,ensure_ascii=False,indent=2),encoding='utf8')
print('Created rewards:',{key:len(value['variants']) for key,value in rewards.items()})
print('Zombie groups:',len(weak),len(medium),len(strong),'probabilities 80/18/2; gift counts 10/30/50/100.')
