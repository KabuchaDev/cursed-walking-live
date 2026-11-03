import json, math, pathlib, random
from PIL import Image, ImageDraw, ImageFont
root=pathlib.Path('outputs/Cursed-Walking-LIVE'); data=root/'server/kubejs/data/cw_live'
worldpack=root/'server/world-cursed-live/datapacks/cw_tower_defense'
worldpack.mkdir(parents=True,exist_ok=True)
(worldpack/'pack.mcmeta').write_text(json.dumps({'pack':{'pack_format':15,'description':'Thanh Tri 07 - Cursed Walking Tower Defense'}}),encoding='utf8')
def jp(path,value):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf8')
jp(worldpack/'data/cw_live/dimension_type/defense.json',{'ultrawarm':False,'natural':True,'coordinate_scale':1,'has_skylight':True,'has_ceiling':False,'ambient_light':0.12,'fixed_time':13000,'piglin_safe':False,'bed_works':True,'respawn_anchor_works':False,'has_raids':False,'logical_height':384,'min_y':-64,'height':384,'infiniburn':'#minecraft:infiniburn_overworld','effects':'minecraft:overworld','monster_spawn_block_light_limit':0,'monster_spawn_light_level':0})
jp(worldpack/'data/cw_live/dimension/defense.json',{'type':'cw_live:defense','generator':{'type':'minecraft:flat','settings':{'biome':'minecraft:the_void','lakes':False,'features':False,'structure_overrides':[],'layers':[{'height':1,'block':'minecraft:air'}]}}})
route=[[-99.5,64,-64.5],[-49.5,64,-64.5],[-49.5,64,5.5],[14.5,64,5.5],[14.5,64,-64.5],[68.5,64,-64.5],[68.5,64,40.5],[5.5,64,40.5],[5.5,64,75.5],[82.5,64,75.5]]
rules=json.loads((root/'mappings.json').read_text(encoding='utf-8-sig'))
weak=rules['zombiePools']['weighted'][0]['entities']; strong=rules['zombiePools']['weighted'][2]['entities']
types={}
for id in rules['zombiePools']['uniform']:
 speed=.18;damage=15
 if id in weak:speed=.15;damage=10
 if id in strong:speed=.12;damage=40
 if id in ['zombies_plus:runner_zombie','zombies_plus:leaper_zombie','feralzombie:zombie_dog']:speed=.25;damage=12
 if id=='zombies_plus:crawler_zombie':speed=.13;damage=12
 types[id]={'speed':speed,'damage':damage}
config={'version':1,'dimension':'cw_live:defense','name':'THÀNH TRÌ 07','baseMaxHealth':1000,'maxMobs':200,'speedMultiplier':.5,'route':route,'types':types,'lobby':[95.5,64,57.5,-90,0],'bounds':[-112,112,-96,96],'starter':{'gun':'bf1:sw_model3','ammo':'tacz:357mag','capacity':6,'reserve':96},'buttons':{'start':[98,65,59],'pause':[101,65,59],'leave':[104,65,59]},'buildReady':False}
jp(root/'server/kubejs/cw-td-config.json',config)
commands=[]; fills=[];rng=random.Random(7026)
def fill(x1,y1,z1,x2,y2,z2,b):
 x1,x2=sorted([int(x1),int(x2)]);y1,y2=sorted([int(y1),int(y2)]);z1,z2=sorted([int(z1),int(z2)])
 if (x2-x1+1)*(y2-y1+1)*(z2-z1+1)>30000:
  if x2-x1>=z2-z1:
   m=(x1+x2)//2;fill(x1,y1,z1,m,y2,z2,b);fill(m+1,y1,z1,x2,y2,z2,b)
  else:
   m=(z1+z2)//2;fill(x1,y1,z1,x2,y2,m,b);fill(x1,y1,m+1,x2,y2,z2,b)
  return
 commands.append(f'fill {x1} {y1} {z1} {x2} {y2} {z2} minecraft:{b}')
 fills.append([x1,y1,z1,x2,y2,z2,b])
def block(x,y,z,b):fill(x,y,z,x,y,z,b)
def box(x,z,w,d,h,wall='light_gray_concrete',roof='deepslate_tiles'):
 fill(x,63,z,x+w,63,z+d,'polished_andesite')
 fill(x,64,z,x+w,64+h,z+d,wall)
 fill(x+1,64,z+1,x+w-1,63+h,z+d-1,'air')
 fill(x-1,64+h,z-1,x+w+1,64+h,z+d+1,roof)
 for xx in [x,x+w]:
  for zz in [z,z+d]:fill(xx,64,zz,xx,64+h,zz,'polished_deepslate')
 for xx in range(x+3,x+w-1,5):
  for zz in [z,z+d]:fill(xx,67,zz,min(xx+2,x+w-1),69,zz,'cyan_stained_glass')
 for zz in range(z+3,z+d-1,5):
  for xx in [x,x+w]:fill(xx,67,zz,xx,69,min(zz+2,z+d-1),'cyan_stained_glass')
def label(x,y,z,text,color='white',scale=1.3):
 t=json.dumps({'text':text,'color':color,'bold':True},ensure_ascii=False,separators=(',',':'))
 snbt="{Tags:[\"cw_td_decor\"],billboard:\"center\",alignment:\"center\",line_width:300,background:1140850688,text:'"+t.replace('\\','\\\\').replace("'","\\'")+"',transformation:{scale:["+','.join([str(scale)+'f']*3)+']}}'
 commands.append(f'summon minecraft:text_display {x} {y} {z} {snbt}')
def tree(x,z,h=6):
 fill(x,64,z,x,64+h,z,'dark_oak_log');fill(x-2,66+h,z-2,x+2,68+h,z+2,'dark_oak_leaves[persistent=true]');fill(x-3,64+h,z-2,x+3,66+h,z+2,'dark_oak_leaves[persistent=true]');fill(x-1,69+h,z-1,x+1,69+h,z+1,'dark_oak_leaves[persistent=true]')
def light(x,z):
 block(x,64,z,'polished_deepslate');fill(x,65,z,x,70,z,'iron_bars');fill(x-1,71,z,x+1,71,z,'dark_oak_slab[type=top]');block(x,70,z-1,'sea_lantern');block(x,70,z+1,'sea_lantern')
def crate(x,z):
 fill(x,64,z,x+2,66,z+2,'barrel');block(x+1,67,z+1,'chain[axis=y]')
def container(x,z,color):
 fill(x,64,z,x+16,69,z+6,color+'_concrete')
 for xx in range(x+1,x+16,3):fill(xx,65,z,xx,68,z,'iron_bars');fill(xx,65,z+6,xx,68,z+6,'iron_bars')
 fill(x+16,64,z+1,x+16,68,z+5,'iron_block');fill(x,70,z,x+16,70,z+6,'polished_andesite_slab')
def truck(x,z,color='green'):
 fill(x,65,z,x+5,68,z+11,color+'_terracotta');fill(x,69,z+1,x+5,69,z+4,color+'_concrete');fill(x+1,67,z,x+4,68,z,'light_blue_stained_glass')
 for xx in [x-1,x+6]:
  for zz in [z+2,z+8]:fill(xx,64,zz,xx,65,zz+1,'black_concrete');block(xx,65,zz,'polished_blackstone_button[face=wall,facing='+('west' if xx<x else 'east')+']')
 for xx in [x+1,x+4]:block(xx,66,z-1,'sea_lantern')
def pad(x,z,n):
 fill(x-4,63,z-4,x+4,63,z+4,'smooth_stone');fill(x-3,63,z-3,x+3,63,z+3,'orange_terracotta');fill(x-2,63,z-2,x+2,63,z+2,'polished_deepslate');block(x,63,z,'sea_lantern')
 for xx,zz in [(x-4,z-4),(x+4,z-4),(x-4,z+4),(x+4,z+4)]:block(xx,64,zz,'stone_brick_wall')
 label(x,68,z,'ĐIỂM BẮN '+str(n),'gold',.7)
# Foundation, textured paving, enclosed perimeter.
fill(-112,58,-96,112,60,96,'bedrock');fill(-112,61,-96,112,62,96,'stone');fill(-112,63,-96,112,63,96,'gravel')
for x in range(-108,109,8):
 for z in range(-92,93,8):fill(x,63,z,min(x+6,108),63,min(z+6,92),rng.choice(['andesite','gray_concrete','coarse_dirt','andesite']))
for z in [-96,96]:
 fill(-112,64,z,112,71,z,'stone_bricks');fill(-112,72,z,112,72,z,'polished_deepslate_slab')
 for x in range(-112,113,12):fill(x,64,z-1,x+1,73,z+1,'polished_deepslate');block(x,74,z,'sea_lantern')
for x in [-112,112]:
 fill(x,64,-96,x,71,96,'stone_bricks');fill(x,72,-96,x,72,96,'polished_deepslate_slab')
 for z in range(-96,97,12):fill(x-1,64,z,x+1,73,z+1,'polished_deepslate');block(x,74,z,'sea_lantern')
for x in [-106,100]:
 for z in [-90,84]:
  box(x,z,7,7,16,'gray_concrete','stone_brick_slab');fill(x+1,76,z+1,x+6,78,z+6,'cyan_stained_glass');fill(x+2,76,z+2,x+5,78,z+5,'air');fill(x+3,64,z-1,x+3,79,z-1,'ladder[facing=north]');block(x+3,81,z+3,'sea_lantern')
# Road: broad lanes, contrasting curbs, yellow dashes and embedded runway lights.
for a,b in zip(route,route[1:]):
 x1,z1=int(math.floor(a[0])),int(math.floor(a[2]));x2,z2=int(math.floor(b[0])),int(math.floor(b[2]));
 fill(min(x1,x2)-7,63,min(z1,z2)-7,max(x1,x2)+7,63,max(z1,z2)+7,'smooth_stone')
 fill(min(x1,x2)-5,63,min(z1,z2)-5,max(x1,x2)+5,63,max(z1,z2)+5,'gray_concrete')
 dx=0 if x1==x2 else (1 if x2>x1 else -1);dz=0 if z1==z2 else (1 if z2>z1 else -1);length=abs(x2-x1)+abs(z2-z1)
 for i in range(7,length-5,12):
  x,z=x1+dx*i,z1+dz*i
  for j in range(3):block(x+dx*j,63,z+dz*j,'yellow_concrete')
  for side in [-6,6]:block(x+dz*side,63,z+dx*side,'sea_lantern')
 for i in range(20,length-5,28):
  x,z=x1+dx*i,z1+dz*i
  for j in range(3):
   block(x-dx*j+dz*j,63,z-dz*j+dx*j,'white_concrete');block(x-dx*j-dz*j,63,z-dz*j-dx*j,'white_concrete')
# Entry checkpoint.
for z in [-73,-57]:fill(-106,64,z,-94,74,z,'polished_deepslate');fill(-106,68,z,-94,69,z,'red_concrete')
fill(-105,75,-74,-94,77,-56,'deepslate_tiles');fill(-104,74,-72,-95,74,-58,'red_stained_glass');label(-99,79,-65,'CỔNG KIỂM DỊCH\nLỐI VÀO ZOMBIE','red',1.2)
for x in [-92,-89,-86]:
 for z in [-73,-57]:fill(x,64,z,x,65,z,'yellow_concrete');block(x,66,z,'redstone_lamp[lit=true]')
# Abandoned station and warehouse.
box(-99,-44,31,29,13,'gray_terracotta','deepslate_tiles');fill(-91,64,-15,-78,69,-15,'air');fill(-98,75,-43,-69,75,-16,'orange_terracotta')
for x,z in [(-95,-38),(-85,-30),(-72,-40)]:fill(x,69,z,x+3,76,z+2,'air')
fill(-90,64,-12,-85,64,-9,'mossy_cobblestone');label(-83,79,-27,'GA BỎ HOANG','gray',1)
for x in [-96,-82,-70]:crate(x,-5)
container(-101,23,'blue');container(-101,36,'red');container(-101,49,'yellow');container(-79,49,'cyan');truck(-91,66);truck(-75,22,'gray')
for x,z in [(-100,16),(-76,65),(-67,77)]:crate(x,z)
label(-87,77,46,'BÃI HÀNG 02','aqua',1)
# Garden memorial: water, overgrowth, paths and benches.
fill(-35,63,-50,-3,63,-17,'moss_block');fill(-33,63,-48,-5,63,-19,'grass_block');fill(-22,63,-49,-17,63,-18,'stone_bricks');fill(-34,63,-36,-4,63,-31,'stone_bricks')
fill(-25,64,-39,-14,64,-28,'stone_bricks');fill(-24,64,-38,-15,64,-29,'water');fill(-21,65,-35,-18,67,-32,'chiseled_stone_bricks');block(-20,68,-34,'sea_lantern')
for x,z in [(-31,-45),(-8,-44),(-31,-22),(-8,-22)]:tree(x,z,5)
for x in [-31,-10]:fill(x,64,-36,x,64,-32,'dark_oak_stairs[facing='+('east' if x<-20 else 'west')+']')
label(-19,74,-33,'QUẢNG TRƯỜNG TƯỞNG NIỆM','green',.75)
# Power station with chimneys, copper pipes and transformers.
box(31,-49,20,28,9,'bricks','cut_copper_slab')
for x in [35,45]:fill(x,74,-44,x+2,88,-42,'polished_deepslate');fill(x-1,87,-45,x+3,88,-41,'deepslate_bricks');block(x+1,89,-43,'campfire[lit=true,signal_fire=true]')
for z in [-15,-10]:fill(32,64,z,50,64,z+2,'iron_block');fill(33,65,z,49,65,z+2,'exposed_cut_copper');fill(35,66,z,35,68,z,'lightning_rod[facing=up]');fill(46,66,z,46,68,z,'lightning_rod[facing=up]')
label(41,78,-30,'TRẠM ĐIỆN','gold',.9)
# Forward observation structures, cover and defence pads.
box(-33,22,20,9,4,'mossy_stone_bricks','smooth_stone_slab');fill(-30,65,22,-16,66,22,'iron_bars');fill(-24,64,31,-21,66,31,'air')
box(28,19,18,8,4,'mossy_stone_bricks','smooth_stone_slab');fill(30,65,19,44,66,19,'iron_bars');fill(34,64,27,38,66,27,'air')
for n,(x,z) in enumerate([(-66,-51),(-32,17),(1,-51),(84,-47),(49,53),(-10,72)],1):pad(x,z,n)
# East residential shell and communications mast.
box(88,-25,15,36,17,'white_terracotta','dark_prismarine_slab')
for z in [-20,-12,-4,4]:fill(87,73,z,104,73,z+2,'stone_brick_slab');fill(88,74,z,103,76,z,'cyan_stained_glass')
fill(94,64,-25,98,70,-25,'air');fill(90,79,-18,95,82,-14,'air')
fill(99,82,2,99,97,2,'iron_bars');fill(95,93,2,103,93,2,'iron_bars');block(99,98,2,'redstone_block')
# Main base: wide entrance, armory, glass command room and protected energy core.
box(78,63,27,25,13,'light_gray_concrete','polished_deepslate_slab')
fill(78,64,70,78,70,81,'air');fill(79,63,70,92,63,81,'polished_deepslate');fill(79,64,70,85,70,81,'air')
fill(87,64,73,91,68,77,'cyan_stained_glass');fill(88,64,74,90,66,76,'sea_lantern');block(89,67,75,'beacon')
for z in [66,85]:fill(81,71,z,102,71,z,'cyan_concrete');fill(80,76,z,103,76,z,'sea_lantern')
for x in [96,99,102]:fill(x,64,86,x+1,65,87,'barrel')
fill(93,64,66,102,64,68,'quartz_stairs[facing=south]');fill(94,65,65,102,67,65,'black_stained_glass')
fill(82,78,67,100,78,83,'gray_concrete');fill(87,78,69,95,78,81,'yellow_concrete');fill(89,78,69,93,78,81,'gray_concrete');fill(87,78,74,95,78,76,'yellow_concrete')
label(91,84,76,'THÀNH TRÌ 07','aqua',1.7);label(81,70,75,'ĐÍCH ĐẾN\nBẢO VỆ LÕI NĂNG LƯỢNG','yellow',.8)
# Entry lobby and usable control buttons.
fill(88,63,50,107,63,60,'smooth_stone');fill(96,64,60,106,67,60,'polished_deepslate');fill(97,68,60,105,68,60,'sea_lantern')
for name,(x,y,z) in config['buttons'].items():block(x,y,z,'stone_button[face=wall,facing=north]')
label(98,67,58.7,'BẮT ĐẦU / CHƠI LẠI','green',.36);label(101,67,58.7,'TẠM DỪNG','yellow',.36);label(104,67,58.7,'VỀ SINH TỒN','aqua',.36)
label(95,72,54,'BẢNG ĐIỀU KHIỂN\n/cw_td để mở menu','white',.7)
# Lamps, urban greenery, rubble and intact path visibility.
for x,z in [(-84,-80),(-60,-48),(-36,15),(0,-11),(28,-77),(81,-78),(81,20),(54,54),(-10,54),(-36,60),(-60,76),(93,44)]:light(x,z)
for x,z in [(-37,-78),(-19,-80),(42,-80),(99,26),(99,38),(-30,81),(-16,83),(27,59),(46,59)]:tree(x,z,5+rng.randrange(3))
for x,z in [(-102,-2),(-63,13),(26,-56),(52,-55),(-36,47),(28,86),(64,89)]:
 fill(x,64,z,x+4,64,z+3,'mossy_cobblestone');block(x+1,65,z+1,'cobblestone_slab');block(x+3,65,z+2,'moss_block')
# Keep the entire route volume clear; no props can obstruct a Mutant Zombie.
for a,b in zip(route,route[1:]):
 x1,z1=int(a[0]-.5),int(a[2]-.5);x2,z2=int(b[0]-.5),int(b[2]-.5)
 # Clearing only the playable inner width leaves gate roofs and street furniture intact.
 fill(min(x1,x2)-3,64,min(z1,z2)-3,max(x1,x2)+3,68,max(z1,z2)+3,'air')
commands.insert(0,'kill @e[type=minecraft:text_display,tag=cw_td_decor]')
fn=data/'functions/td/build';fn.mkdir(parents=True,exist_ok=True)
parts=[]
for i in range(0,len(commands),100):
 name=f'part_{i//100:03d}';(fn/(name+'.mcfunction')).write_text('\n'.join(commands[i:i+100])+'\n',encoding='utf8');parts.append('cw_live:td/build/'+name)
jp(root/'tower-map-plan.json',{'name':config['name'],'dimension':config['dimension'],'bounds':config['bounds'],'route':route,'routeLength':sum(math.dist(a,b) for a,b in zip(route,route[1:])),'commands':len(commands),'parts':parts,'fills':fills})
# An accurate overhead block-plan preview, rendered from the same fill operations.
palette={'air':None,'bedrock':'#343c42','stone':'#717b80','gravel':'#48504d','andesite':'#566365','gray_concrete':'#303b40','coarse_dirt':'#5a5545','smooth_stone':'#afbeb9','polished_deepslate':'#273038','yellow_concrete':'#e4b642','sea_lantern':'#9bf1e6','stone_bricks':'#82938f','light_gray_concrete':'#a8b8b5','grass_block':'#526b47','moss_block':'#52683a','water':'#267f8b','bricks':'#986455','cyan_stained_glass':'#43abb5','deepslate_tiles':'#25333d','dark_oak_leaves':'#3c5945','red_concrete':'#a44d47','blue_concrete':'#385c91','cyan_concrete':'#368a8a','orange_terracotta':'#b27546','white_terracotta':'#ae9f87','gray_terracotta':'#796c61'}
columns={}
for x1,y1,z1,x2,y2,z2,b in fills:
 color=palette.get(b.split('[')[0],'#7a8684')
 for x in range(max(x1,-112),min(x2,112)+1):
  for z in range(max(z1,-96),min(z2,96)+1):
   key=(x,z)
   if b=='air':
    if key in columns:
     for y in list(columns[key]):
      if y1<=y<=y2:del columns[key][y]
   else:
    columns.setdefault(key,{})[y2]=color
im=Image.new('RGB',(1280,1160),'#101b21');d=ImageDraw.Draw(im)
fontpath='C:/Windows/Fonts/arial.ttf';font=ImageFont.truetype(fontpath,23);small=ImageFont.truetype(fontpath,17);big=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',42)
d.text((54,28),'THÀNH TRÌ 07',font=big,fill='#edf6f1');d.text((56,88),'CURSED WALKING · TOWER DEFENSE',font=font,fill='#64d9cc')
scale=5;ox,oz=78,160
for (x,z),ys in columns.items():
 if ys:d.rectangle((ox+(x+112)*scale,oz+(z+96)*scale,ox+(x+113)*scale-1,oz+(z+97)*scale-1),fill=ys[max(ys)])
for i,a in enumerate(route):
 px,pz=ox+(a[0]+112)*scale,oz+(a[2]+96)*scale;d.ellipse((px-8,pz-8,px+8,pz+8),fill='#ffd165');d.text((px+9,pz-12),str(i+1),font=small,fill='white',stroke_width=2,stroke_fill='#162228')
d.text((56,1133),f'225 × 193 blocks   |   Tuyến zombie {sum(math.dist(a,b) for a,b in zip(route,route[1:])):.0f} blocks   |   Nhà chính 1.000 HP',font=small,fill='#b6ccc6')
im.save(root/'SO-DO-THU-THANH.png')
print(f'Created {len(commands)} build commands in {len(parts)} parts; route {sum(math.dist(a,b) for a,b in zip(route,route[1:])):.0f} blocks.')
