// Server-authoritative gun rotation, paid tier timers and six fixed turrets.
function taRead(path){return JSON.parse(String(JsonIO.readString(path)));}
let TA_CONFIG=taRead('kubejs/cw-td-arsenal.json');
let TA_STATE=taRead('kubejs/cw-td-arsenal-state.json');
let TA_IGUN=Java.loadClass('com.tacz.guns.api.item.IGun');
let TA_UUID=Java.loadClass('java.util.UUID');
let TA_ATTRIBUTES=Java.loadClass('net.minecraft.world.entity.ai.attributes.Attributes');
let TA_MODIFIER=Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier');
let TA_OPERATION=Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier$Operation');

let TA_PARTICLES=Java.loadClass('net.minecraft.core.particles.ParticleTypes');
let TA_SPEED_ID=TA_UUID.fromString('153a2bab-9c9f-4eac-9090-1727e98be123');
let TA_RUNTIME={ticks:0,displays:{},dirty:false};
function taSave(){JsonIO.write('kubejs/cw-td-arsenal-state.json',TA_STATE);TA_RUNTIME.dirty=false;}
function taPlayerKey(p){return String(p.getGameProfile().getId());}
function taState(p){let key=taPlayerKey(p);if(!TA_STATE.players[key]){TA_STATE.players[key]={t2:0,t3:0,indices:{T1:0,T2:0,T3:0},token:'',tier:'',version:2};TA_RUNTIME.dirty=true;}return TA_STATE.players[key];}
function taTier(s){return s.t3>0?'T3':s.t2>0?'T2':'T1';}
function taGun(stack){if(stack.isEmpty()||String(stack.id)!=='tacz:modern_kinetic_gun')return null;return TA_CONFIG.guns[String(stack.nbt.getString('GunId'))]||null;}
function taManaged(stack){return !stack.isEmpty()&&String(stack.id)==='tacz:modern_kinetic_gun'&&stack.nbt&&stack.nbt.getBoolean('cwTDManaged');}
function taFind(p,s){let inv=p.getInventory(),found=null;for(let i=0;i<inv.getContainerSize();i++){let stack=inv.getItem(i);if(taManaged(stack)){if(String(stack.nbt.getString('cwTDToken'))===s.token&&!found)found={slot:i,item:stack};else inv.setItem(i,Item.empty);}}return found;}
function taGive(p,s,reason){
 let tier=taTier(s),pool=TA_CONFIG.pools[tier],old=taFind(p,s),slot=old?old.slot:0;
 if(!old&&!p.getInventory().getItem(slot).isEmpty()){
  slot=-1;for(let i=0;i<36;i++)if(p.getInventory().getItem(i).isEmpty()){slot=i;break;}
  if(slot<0){p.setStatusMessage(Text.of('Cần một ô túi đồ trống để nhận súng mới.'));return false;}
 }
 let index=s.indices[tier]%pool.length,gun=TA_CONFIG.guns[pool[index]],magazines=TA_CONFIG.magazines[tier];
 let token=String(TA_UUID.randomUUID()),closed=String(gun.bolt).toLowerCase()==='closed_bolt';
 let stack=Item.of('tacz:modern_kinetic_gun','{GunId:"'+gun.id+'",GunFireMode:"AUTO",GunCurrentAmmoCount:'+(gun.capacity-(closed?1:0))+',HasBulletInBarrel:'+(closed?'1b':'0b')+',cwTDManaged:1b,cwTDToken:"'+token+'",cwTDTier:"'+tier+'"}');
 let api=TA_IGUN.getIGunOrNull(stack);api.setDummyAmmoAmount(stack,(magazines-1)*gun.capacity);api.setMaxDummyAmmoAmount(stack,(magazines-1)*gun.capacity);
 s.indices[tier]=(index+1)%pool.length;s.token=token;s.tier=tier;s.gun=gun.id;s.emptyTicks=0;
 p.getInventory().setItem(slot,stack);p.getInventory().selected=Math.min(slot,8);p.inventoryMenu.broadcastChanges();TA_RUNTIME.dirty=true;
 p.tell(Text.of(tier+' — '+gun.name+' | '+magazines+' băng đạn. '+(reason||'')));return true;
}
function tdArsenalReset(p){
 let s=taState(p);p.getInventory().clearContent();s.token='';s.version=2;taGive(p,s,'Hết toàn bộ đạn sẽ tự đổi khẩu.');taSave();
}
function tdArsenalEnter(p){
 let s=taState(p);if(!taFind(p,s)){
  // Migrate only old arena firearms and ammo; survival inventory is backed up separately.
  let inv=p.getInventory();for(let i=0;i<inv.getContainerSize();i++){let id=String(inv.getItem(i).id);if(id==='tacz:modern_kinetic_gun'||id==='tacz:ammo')inv.setItem(i,Item.empty);}
  taGive(p,s,'');taSave();
 }
}
function taSpeed(p,inside){let attribute=p.getAttribute(TA_ATTRIBUTES.MOVEMENT_SPEED),current=attribute.getModifier(TA_SPEED_ID);if(inside&&!current)attribute.addTransientModifier(new TA_MODIFIER(TA_SPEED_ID,'Thanh Tri movement',TA_CONFIG.runSpeedMultiplier,TA_OPERATION.MULTIPLY_TOTAL));else if(!inside&&current)attribute.removeModifier(TA_SPEED_ID);}
function tdArsenalLeave(p){taSpeed(p,false);p.sendData('cw_td_mount_hint',{ready:false});taSave();}
function tdArsenalBoost(server,name,tier,seconds,receipt){
 if(!/^[A-Za-z0-9_]{1,16}$/.test(name)||!/^[-a-zA-Z0-9_]{1,100}$/.test(receipt)||!['T2','T3'].includes(tier)||seconds!==180)throw new Error('Invalid tier boost');
 if(TA_STATE.receipts.indexOf(receipt)>=0)return 'TD_BOOSTED duplicate';
 let p=server.getPlayerList().getPlayerByName(name);if(!p||!tdIn(p)||tdState.phase!=='running')return 'TD_WAIT boost';
 return taApplyBoost(p,tier,seconds,receipt);
}
function taApplyBoost(p,tier,seconds,receipt){
 if(TA_STATE.receipts.indexOf(receipt)>=0)return 'TD_BOOSTED duplicate';
 let s=taState(p),previous=taTier(s);s[tier==='T3'?'t3':'t2']+=seconds*20;
 TA_STATE.receipts.push(receipt);if(TA_STATE.receipts.length>8192)TA_STATE.receipts.shift();
 if(taTier(s)!==previous)taGive(p,s,'Đã kích hoạt súng thưởng.');
 p.tell(Text.of(tier+' +3 phút'+(tier==='T2'&&s.t3>0?' — giữ lại để dùng sau T3.':'.')));taSave();return 'TD_BOOSTED';
}
function taNearby(p){let best=null,dist=TA_CONFIG.mountRange*TA_CONFIG.mountRange;for(let i=0;i<TA_CONFIG.pads.length;i++){let pad=TA_CONFIG.pads[i],d=Math.pow(p.getX()-pad.x,2)+Math.pow(p.getY()-pad.y,2)+Math.pow(p.getZ()-pad.z,2);if(d<=dist){best=pad;dist=d;}}return best;}
function taDisplay(server,pad,turret){
 let cached=TA_RUNTIME.displays[pad.id];if(cached&&!cached.isRemoved())return cached;
 let level=server.getLevel('cw_live:defense'),tag='cw_turret_'+pad.id,found=null;
 level.getAllEntities().forEach(e=>{if(e.getTags().contains(tag))found=e;});
 if(!found){
  found=level.createEntity('minecraft:item_display');found.addTag('cw_td_turret');found.addTag(tag);
  found.mergeNbt('{item:{id:"tacz:modern_kinetic_gun",Count:1b,tag:'+turret.gunNbt+'},item_display:"thirdperson_righthand",transformation:{scale:[1.5f,1.5f,1.5f]}}');
  found.setPositionAndRotation(pad.x,pad.y+1.4,pad.z,0,0);found.spawn();
 }
 TA_RUNTIME.displays[pad.id]=found;return found;
}
function taRemoveTurret(server,id){let tag='cw_turret_'+id;server.getLevel('cw_live:defense').getAllEntities().forEach(e=>{if(e.getTags().contains(tag))e.discard();});delete TA_RUNTIME.displays[id];delete TA_STATE.turrets[id];TA_RUNTIME.dirty=true;}
function tdTurretsClear(server){for(let id in TA_STATE.turrets)taRemoveTurret(server,id);taSave();}
function tdTurretMount(p){
 if(!tdIn(p)||tdState.phase!=='running')throw new Error('Bắt đầu hoặc tiếp tục lượt trước khi gắn súng.');
 let pad=taNearby(p);if(!pad)throw new Error('Đứng gần bệ gắn súng của điểm bắn.');
 if(TA_STATE.turrets[pad.id])throw new Error('Trụ này đang hoạt động.');
 let item=p.getMainHandItem(),gun=taGun(item);if(!gun)throw new Error('Cầm một khẩu súng trên tay chính.');
 let s=taState(p),now=Date.now();if(s.lastMount&&now-s.lastMount<800)throw new Error('Vui lòng chờ một chút.');s.lastMount=now;
 let turret={owner:taPlayerKey(p),gun:gun.id,gunNbt:String(item.nbt),ticks:TA_CONFIG.turretSeconds*20,credit:0,shots:0};
 TA_STATE.turrets[pad.id]=turret;taSave();
 p.getInventory().setItem(p.getInventory().selected,Item.empty);p.inventoryMenu.broadcastChanges();
 taDisplay(p.server,pad,turret);if(taManaged(item))taGive(p,s,'Đã gắn súng cũ vào trụ.');
 p.tell(Text.of('Trụ '+pad.id+': '+gun.name+' — tự bắn trong 5 phút, tầm 10 block.'));taSave();return 'TD_MOUNTED '+pad.id;
}
function taTurretTick(server,mobs,running){
 let level=server.getLevel('cw_live:defense');
 for(let i=0;i<TA_CONFIG.pads.length;i++){
  let pad=TA_CONFIG.pads[i],t=TA_STATE.turrets[pad.id];if(!t)continue;
  if(tdState.phase==='lost'){taRemoveTurret(server,pad.id);continue;}
  let display=taDisplay(server,pad,t);if(!running)continue;
  if(--t.ticks<=0){taRemoveTurret(server,pad.id);continue;}TA_RUNTIME.dirty=true;
  let target=null,progress=-1;
  for(let j=0;j<mobs.length;j++){let e=mobs[j];if(e.isRemoved()||e.getHealth()<=0)continue;let dx=e.getX()-pad.x,dz=e.getZ()-pad.z,dy=e.getY()-pad.y;
   if(dx*dx+dy*dy+dz*dz<=TA_CONFIG.turretRange*TA_CONFIG.turretRange&&e.persistentData.getDouble('cwTDProgress')>progress){target=e;progress=e.persistentData.getDouble('cwTDProgress');}}
  let gun=TA_CONFIG.guns[t.gun];if(!target||!gun){t.credit=0;continue;}
  let dx=target.getX()-pad.x,dz=target.getZ()-pad.z;
  let yaw=Math.atan2(-dx,dz)*57.29577951308232;display.setPositionAndRotation(pad.x,pad.y+1.4,pad.z,yaw,0);
  t.credit+=gun.rpm/1200;
  while(t.credit>=1&&target.getHealth()>0&&!target.isRemoved()){
   t.credit--;target.invulnerableTime=0;target.attack(level.damageSources().generic(),Math.max(.1,gun.damage)*Math.max(1,gun.projectiles));t.shots++;
  }
  if(TA_RUNTIME.ticks%4===0){for(let point=1;point<=3;point++){let f=point/4;level.sendParticles(TA_PARTICLES.CRIT,pad.x+dx*f,pad.y+1.4,pad.z+dz*f,1,0,0,0,0);}}
  if(TA_RUNTIME.ticks%10===0)server.runCommandSilent('execute in cw_live:defense positioned '+pad.x+' '+(pad.y+1.4)+' '+pad.z+' run playsound minecraft:entity.firework_rocket.blast player @a[distance=..24] ~ ~ ~ 0.15 2');
 }
}
function tdArsenalTick(server,players,mobs,running){
 TA_RUNTIME.ticks++;
 if(TA_RUNTIME.ticks%20===0)server.getPlayerList().getPlayers().forEach(p=>taSpeed(p,tdIn(p)&&!p.isSpectator()));
 for(let i=0;i<players.length;i++){
  let p=players[i],s=taState(p);if(running){if(s.t3>0){s.t3--;TA_RUNTIME.dirty=true;}else if(s.t2>0){s.t2--;TA_RUNTIME.dirty=true;}}
  if(TA_RUNTIME.ticks%5===0){let found=taFind(p,s),tier=taTier(s);
   if(!found||tier!==s.tier){taGive(p,s,tier!==s.tier?'Đã chuyển hạng súng.':'');}
   else{let api=TA_IGUN.getIGunOrNull(found.item),empty=api.getCurrentAmmoCount(found.item)<=0&&!api.hasBulletInBarrel(found.item)&&api.getDummyAmmoAmount(found.item)<=0;
    s.emptyTicks=empty?(s.emptyTicks||0)+5:0;if(s.emptyTicks>=10)taGive(p,s,'Đã dùng hết đạn.');}
  }
  if(TA_RUNTIME.ticks%10===0){let pad=taNearby(p),held=taGun(p.getMainHandItem()),ready=!!(pad&&held&&!TA_STATE.turrets[pad.id]&&tdState.phase==='running');
   let text=taTier(s)+' | '+(TA_CONFIG.guns[s.gun]?TA_CONFIG.guns[s.gun].name:'');
   if(s.t3>0||s.t2>0)text+=' | '+Math.ceil((s.t3>0?s.t3:s.t2)/20)+' giây'+(s.t3>0&&s.t2>0?' | T2 chờ '+Math.ceil(s.t2/20)+'s':'');
   if(ready)text+=' | Bấm E để súng tự động bắn';else if(pad&&TA_STATE.turrets[pad.id])text+=' | Trụ '+pad.id+': '+Math.ceil(TA_STATE.turrets[pad.id].ticks/20)+'s';
   p.setStatusMessage(Text.of(text));p.sendData('cw_td_mount_hint',{ready:ready,pad:pad?pad.id:0});
  }
 }
 taTurretTick(server,mobs,running);
 if(TA_RUNTIME.ticks%20===0){if(TA_RUNTIME.dirty)taSave();JsonIO.write('kubejs/cw-td-arsenal-status.json',{players:TA_STATE.players,turrets:TA_STATE.turrets,poolSizes:{T1:TA_CONFIG.pools.T1.length,T2:TA_CONFIG.pools.T2.length,T3:TA_CONFIG.pools.T3.length}});}
}
NetworkEvents.dataReceived('cw_td_mount',event=>{try{tdTurretMount(event.player);}catch(error){event.player.tell(Text.of(String(error.message)));}});
PlayerEvents.loggedIn(event=>event.server.scheduleInTicks(30,()=>{if(tdIn(event.player))tdArsenalEnter(event.player);}));
ServerEvents.commandRegistry(event=>{
 let c=event.commands,word=Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType'),num=Java.loadClass('com.mojang.brigadier.arguments.IntegerArgumentType');
 event.register(c.literal('cw_turret').executes(ctx=>tdReply(ctx,tdTurretMount(tdCommandPlayer(ctx)))));
 event.register(c.literal('cw_gun_next').executes(ctx=>{let p=tdCommandPlayer(ctx);if(!tdIn(p))throw new Error('Vào map thủ thành trước.');let s=taState(p),found=taFind(p,s);if(found){let api=TA_IGUN.getIGunOrNull(found.item);if(api.getCurrentAmmoCount(found.item)>0||api.hasBulletInBarrel(found.item)||api.getDummyAmmoAmount(found.item)>0)throw new Error('Súng vẫn còn đạn.');}taGive(p,s,'');taSave();return 1;}));
 let receipt=c.argument('receipt',word.word()).executes(ctx=>tdReply(ctx,tdArsenalBoost(ctx.source.server,String(word.getString(ctx,'player')),String(word.getString(ctx,'tier')),num.getInteger(ctx,'seconds'),String(word.getString(ctx,'receipt')))));
 event.register(c.literal('cw_td_boost').requires(s=>s.hasPermission(4)).then(c.argument('player',word.word()).then(c.argument('tier',word.word()).then(c.argument('seconds',num.integer(180,180)).then(receipt)))));
});





