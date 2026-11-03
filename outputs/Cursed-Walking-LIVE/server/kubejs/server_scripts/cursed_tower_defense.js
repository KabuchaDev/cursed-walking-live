// Thanh Tri 07: scoped to the dedicated arena. Existing survival AI is unchanged.
let TD_LIST = Java.loadClass('net.minecraft.nbt.ListTag');
let TD_TAG = Java.loadClass('net.minecraft.nbt.TagParser');
let TD_WORD = Java.loadClass('com.mojang.brigadier.arguments.StringArgumentType');
let TD_NUMBER = Java.loadClass('com.mojang.brigadier.arguments.DoubleArgumentType');
let TD_CHUNKS=Java.loadClass('net.minecraftforge.common.world.ForgeChunkManager');
let TD_POS=Java.loadClass('net.minecraft.core.BlockPos');
let TD_HORDES=Java.loadClass('net.smileycorp.hordes.config.HordeEventConfig');
let TD_CONFIG = JsonIO.read('kubejs/cw-td-config.json');
let tdState = JsonIO.read('kubejs/cw-td-state.json') || {version:1,phase:'idle',hp:TD_CONFIG.baseMaxHealth,round:0,spawned:0,killed:0,leaked:0,damage:0,serial:0};
let tdPlayerBackups=JsonIO.read('kubejs/cw-td-players.json')||{};
let tdTicks=0,tdBoot=false,tdQa=false,tdSpeed=1,tdQaHordePause=true;
let tdSegments=[];
let tdLength=0;
for(let i=1;i<TD_CONFIG.route.length;i++){
 let a=TD_CONFIG.route[i-1],b=TD_CONFIG.route[i],length=Math.sqrt(Math.pow(b[0]-a[0],2)+Math.pow(b[2]-a[2],2));
 // This arena uses cardinal roads. Store their exact Minecraft yaw to avoid invalid angles.
 let dx=b[0]-a[0],dz=b[2]-a[2],yaw=dx>0?-90:dx<0?90:dz>0?0:180;
 tdSegments.push({a:a,b:b,start:tdLength,length:length,yaw:yaw});tdLength+=length;
}
function tdIn(entity){return String(entity.level.dimension)===String(TD_CONFIG.dimension);}
function tdLevel(server){return server.getLevel(String(TD_CONFIG.dimension));}
function tdPlayers(server){let list=[];server.getPlayerList().getPlayers().forEach(p=>{if(tdIn(p)&&!p.isSpectator())list.push(p);});return list;}
function tdMobs(server){let list=[],level=tdLevel(server);if(level)level.getAllEntities().forEach(e=>{if(e.getTags().contains('cw_td'))list.push(e);});return list;}
function tdSave(){JsonIO.write('kubejs/cw-td-state.json',tdState);}
function tdPoint(distance,lane){
 for(let i=0;i<tdSegments.length;i++){
  let s=tdSegments[i];if(distance<=s.start+s.length||i===tdSegments.length-1){
   let f=Math.max(0,Math.min(1,(distance-s.start)/s.length));
   return {x:s.a[0]+(s.b[0]-s.a[0])*f+lane,y:s.a[1],z:s.a[2]+(s.b[2]-s.a[2])*f+lane,yaw:s.yaw,segment:i};
  }
 }
}
function tdPosition(entity,point){
 entity.setPositionAndRotation(point.x,point.y,point.z,point.yaw,0);
 entity.setYHeadRot(point.yaw);entity.setYBodyRot(point.yaw);
}
function tdFeed(player){
 player.setFoodLevel(20);player.setSaturation(20);player.getFoodData().setExhaustion(0);
}
function tdNotify(server,message){tdPlayers(server).forEach(p=>p.tell(Text.of(message)));}
function tdBoss(server){
 server.runCommandSilent('bossbar set cw_live:base max '+TD_CONFIG.baseMaxHealth);
 server.runCommandSilent('bossbar set cw_live:base value '+Math.max(0,Math.round(tdState.hp)));
 server.runCommandSilent('bossbar set cw_live:base color '+(tdState.hp>500?'green':tdState.hp>200?'yellow':'red'));
 server.runCommandSilent('bossbar set cw_live:base name '+JSON.stringify({text:'THÀNH TRÌ 07  |  '+tdState.hp+'/'+TD_CONFIG.baseMaxHealth+' HP  |  Lượt '+tdState.round,color:'aqua'}));
 server.runCommandSilent('execute in '+TD_CONFIG.dimension+' run bossbar set cw_live:base players @a[distance=0..]');
}
function tdStatus(server,full){
 let mobs=tdMobs(server),rows=[];
 if(full)mobs.forEach(e=>rows.push({type:String(e.type),progress:e.persistentData.getDouble('cwTDProgress'),lane:e.persistentData.getDouble('cwTDLane'),x:e.getX(),y:e.getY(),z:e.getZ(),yaw:e.getYaw(),headYaw:e.getYHeadRot(),bodyYaw:e.yBodyRot,expectedYaw:tdPoint(e.persistentData.getDouble('cwTDProgress'),0).yaw,health:e.getHealth(),noAI:e.isNoAi(),target:e.getTarget()?String(e.getTarget().type):null,tags:String(e.getTags())}));
 let status={version:1,ready:!!TD_CONFIG.buildReady,dimension:String(TD_CONFIG.dimension),phase:tdState.phase,hp:tdState.hp,maxHp:TD_CONFIG.baseMaxHealth,round:tdState.round,players:tdPlayers(server).length,active:mobs.length,spawned:tdState.spawned,killed:tdState.killed,leaked:tdState.leaked,damage:tdState.damage,routeLength:tdLength,testMode:tdQa,mobs:rows};
 JsonIO.write(full?'kubejs/cw-td-inspect.json':'kubejs/cw-td-status.json',status);return status;
}
function tdClear(server){tdMobs(server).forEach(e=>e.discard());}
function tdStarter(player){
 tdArsenalReset(player);
}
function tdMenu(player){
 let name=String(player.getGameProfile().getName());
 player.server.runCommandSilent('tellraw '+name+' '+JSON.stringify([{text:'\nTHÀNH TRÌ 07 — THỦ THÀNH\n',color:'aqua',bold:true},{text:'[ VÀO MAP ] ',color:'green',clickEvent:{action:'run_command',value:'/cw_td join'}},{text:'[ BẮT ĐẦU / CHƠI LẠI ]\n',color:'gold',clickEvent:{action:'run_command',value:'/cw_td start'}},{text:'[ TẠM DỪNG / TIẾP TỤC ] ',color:'yellow',clickEvent:{action:'run_command',value:'/cw_td pause'}},{text:'[ VỀ SINH TỒN ]\n',color:'aqua',clickEvent:{action:'run_command',value:'/cw_td leave'}},{text:'[ GẮN SÚNG VÀO TRỤ ] ',color:'gold',clickEvent:{action:'run_command',value:'/cw_turret'}},{text:'[ ĐỔI SÚNG ĐÃ HẾT ĐẠN ]\\n',color:'green',clickEvent:{action:'run_command',value:'/cw_gun_next'}},{text:'Zombie đi theo đường tới nhà chính. Bắn hạ chúng trước khi đến đích.\n',color:'gray'}]));
}
function tdJoin(player){
 if(!TD_CONFIG.buildReady)throw new Error('Map dang duoc xay, vui long doi.');
 let key=String(player.getGameProfile().getId()),backup=tdPlayerBackups[key];
 if(!backup||!backup.active){
  tdPlayerBackups[key]={active:true,inventory:String(player.getInventory().save(new TD_LIST())),dimension:String(player.level.dimension),x:player.getX(),y:player.getY(),z:player.getZ(),yaw:player.getYaw(),pitch:player.getPitch(),selected:player.getInventory().selected};
  // Store outside the player entity so death, respawn and relog cannot lose the original inventory.
  JsonIO.write('kubejs/cw-td-players.json',tdPlayerBackups);
  player.server.runCommandSilent('save-all');
  tdStarter(player);
 }
 let l=TD_CONFIG.lobby;player.teleportTo(TD_CONFIG.dimension,l[0],l[1],l[2],l[3],l[4]);tdFeed(player);tdArsenalEnter(player);
 player.tell(Text.of('Đã vào THÀNH TRÌ 07. Đồ sinh tồn đã cất riêng. Bấm nút xanh hoặc /cw_td start để bắt đầu.'));
 tdMenu(player);tdBoss(player.server);tdStatus(player.server,false);
}
function tdLeave(player){
 let backup=tdPlayerBackups[String(player.getGameProfile().getId())];
 if(!backup||!backup.active)throw new Error('Ban chua vao che do thu thanh.');
 let tag=TD_TAG.parseTag('{Inventory:'+backup.inventory+'}');
 tdArsenalLeave(player);
 player.teleportTo(backup.dimension,backup.x,backup.y,backup.z,backup.yaw,backup.pitch);
 player.getInventory().clearContent();player.getInventory().load(tag.getList('Inventory',10));player.getInventory().selected=backup.selected;player.inventoryMenu.broadcastChanges();
 player.server.runCommandSilent('save-all');backup.active=false;JsonIO.write('kubejs/cw-td-players.json',tdPlayerBackups);
 player.tell(Text.of('Đã trở về sinh tồn và khôi phục túi đồ.'));tdBoss(player.server);tdStatus(player.server,false);
}
function tdStart(server){
 if(!TD_CONFIG.buildReady)throw new Error('Map chua san sang.');
 if(tdState.phase==='running')throw new Error('Luot dang chay. Khong dat lai mau nha giua luot.');
 if(tdState.phase==='paused'){tdState.phase='running';tdSave();tdStatus(server,false);return;}
 tdClear(server);tdTurretsClear(server);tdState.phase='running';tdState.hp=TD_CONFIG.baseMaxHealth;tdState.round++;tdState.spawned=0;tdState.killed=0;tdState.leaked=0;tdState.damage=0;
 tdPlayers(server).forEach(p=>tdStarter(p));tdNotify(server,'LƯỢT '+tdState.round+' BẮT ĐẦU — bảo vệ 1.000 HP nhà chính!');tdSave();tdBoss(server);tdStatus(server,false);
}
function tdPause(server){
 if(tdState.phase==='running')tdState.phase='paused';else if(tdState.phase==='paused')tdState.phase='running';else throw new Error('Chua co luot dang choi.');
 tdSave();tdNotify(server,tdState.phase==='paused'?'Đã tạm dừng lượt thủ thành.':'Đã tiếp tục lượt thủ thành.');tdStatus(server,false);
}
function tdInit(entity){
 let d=entity.persistentData;
 entity.addTag('cw_td');entity.addTag('cw_live');entity.setNoAi(true);entity.setTarget(null);entity.getNavigation().stop();entity.setPersistenceRequired();
 if(!d.getBoolean('cwTDInitialized')){
  tdState.serial++;d.putBoolean('cwTDInitialized',true);d.putDouble('cwTDProgress',0);d.putDouble('cwTDLane',((tdState.serial%5)-2)*.85);tdState.spawned++;
  let p=tdPoint(0,d.getDouble('cwTDLane'));tdPosition(entity,p);
 }
}
function tdSpawn(server,type,tag){
 if(!TD_CONFIG.types[type])throw new Error('TD_REJECTED unknown zombie');
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(tag))throw new Error('TD_REJECTED invalid job tag');
 let mobs=tdMobs(server);for(let i=0;i<mobs.length;i++)if(mobs[i].getTags().contains(tag))return 'TD_SPAWNED '+tag;
 if(!TD_CONFIG.buildReady||tdState.phase!=='running'||(!tdQa&&!tdPlayers(server).length))return 'TD_WAIT '+tdState.phase;
 if(mobs.length>=TD_CONFIG.maxMobs)return 'TD_WAIT mob_limit';
 let entity=tdLevel(server).createEntity(type);if(!entity)throw new Error('TD_REJECTED entity not found');
 entity.addTag(tag);tdInit(entity);entity.spawn();
 if(entity.isRemoved())throw new Error('TD_REJECTED modpack blocked entity');
 tdStatus(server,false);return 'TD_SPAWNED '+tag;
}
function tdReward(server,name,fn){
 if(!/^[A-Za-z0-9_]{1,16}$/.test(name)||!/^cw_live:rewards\/[a-z0-9_/-]+$/.test(fn))throw new Error('TD_REJECTED reward');
 let player=server.getPlayerList().getPlayerByName(name);
 if(!player||!tdIn(player)||player.isSpectator()||tdState.phase!=='running')return 'TD_WAIT reward';
 let count=server.runCommandSilent('execute as @a[name='+name+',limit=1] at @s run function '+fn);
 if(count<1)throw new Error('TD_REJECTED reward function failed');
 return 'TD_REWARDED';
}
function tdValidateMap(server){
 let level=tdLevel(server),seen={},errors=[],checked=0;
 for(let step=0;step<=tdLength;step++){
  let p=tdPoint(step,0),cx=Math.floor(p.x),cz=Math.floor(p.z);
  for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
   let key=(cx+dx)+','+(cz+dz);if(seen[key])continue;seen[key]=true;checked++;
   let floor=String(level.getBlock(cx+dx,63,cz+dz).id);
   if(floor==='minecraft:air'||floor==='minecraft:water')errors.push('floor '+key+' '+floor);
   for(let y=64;y<=68;y++){let id=String(level.getBlock(cx+dx,y,cz+dz).id);if(id!=='minecraft:air')errors.push('clearance '+key+','+y+' '+id);}
  }
 }
 for(let key in TD_CONFIG.buttons){let p=TD_CONFIG.buttons[key],id=String(level.getBlock(p[0],p[1],p[2]).id);if(id!=='minecraft:stone_button')errors.push('button '+key+' '+id);}
 let report={passed:errors.length===0,checkedColumns:checked,clearHeight:5,errors:errors};JsonIO.write('kubejs/cw-td-map-verification.json',report);return report;
}
EntityEvents.spawned(event=>{
 let e=event.entity;if(!tdIn(e))return;
 if(TD_CONFIG.types[String(e.type)]){
  // Only the event dispatcher may create a wave; block natural hordes and reinforcements.
  if(!e.getTags().contains('cw_td')){event.cancel();return;}
  if(tdState.phase!=='running'&&!(tdState.phase==='paused'&&e.persistentData.getBoolean('cwTDInitialized'))){event.cancel();return;}tdInit(e);
 }else if(e.isMonster())event.cancel();
});
EntityEvents.hurt(event=>{
 if(!event.entity.isPlayer()||!tdIn(event.entity))return;
 let attacker=event.source.getActual();
 if(attacker&&attacker.getTags().contains('cw_td'))event.cancel();
});
EntityEvents.death(event=>{
 let e=event.entity;if(!e.getTags().contains('cw_td'))return;
 if(!e.persistentData.getBoolean('cwTDCounted')){e.persistentData.putBoolean('cwTDCounted',true);tdState.killed++;}
});
LevelEvents.afterExplosion(event=>{if(String(event.level.dimension)===String(TD_CONFIG.dimension))event.removeAllAffectedBlocks();});
BlockEvents.broken(event=>{if(tdIn(event.player)&&!event.player.isCreative())event.cancel();});
BlockEvents.placed(event=>{if(tdIn(event.player)&&!event.player.isCreative())event.cancel();});
BlockEvents.rightClicked('minecraft:stone_button',event=>{
 if(!tdIn(event.player)||String(event.hand)!=='MAIN_HAND')return;
 let b=event.block;
 for(let key in TD_CONFIG.buttons){let p=TD_CONFIG.buttons[key];if(b.x===p[0]&&b.y===p[1]&&b.z===p[2]){
  event.cancel();try{if(key==='start')tdStart(event.server);else if(key==='pause')tdPause(event.server);else tdLeave(event.player);}catch(error){event.player.tell(Text.of(String(error.message)));}return;
 }}
});
PlayerEvents.loggedIn(event=>{event.server.scheduleInTicks(40,()=>tdMenu(event.player));});
PlayerEvents.respawned(event=>{let backup=tdPlayerBackups[String(event.player.getGameProfile().getId())];if(backup&&backup.active)event.server.scheduleInTicks(20,()=>{tdJoin(event.player);tdStarter(event.player);});});
ServerEvents.tick(event=>{
 let server=event.server;tdTicks++;
 if(!tdBoot){
  tdBoot=true;server.runCommandSilent('bossbar add cw_live:base {"text":"THÀNH TRÌ 07"}');
  let level=tdLevel(server),owner=new TD_POS(89,63,75);
  for(let x=-7;x<=7;x++)for(let z=-6;z<=6;z++)TD_CHUNKS['forceChunk(net.minecraft.server.level.ServerLevel,java.lang.String,net.minecraft.core.BlockPos,int,int,boolean,boolean)'](level,'kubejs',owner,x,z,false,true);
  let chunks=TD_CONFIG.tickingChunks;
  for(let i=0;i<chunks.length;i++)TD_CHUNKS['forceChunk(net.minecraft.server.level.ServerLevel,java.lang.String,net.minecraft.core.BlockPos,int,int,boolean,boolean)'](level,'kubejs',owner,chunks[i][0],chunks[i][1],true,true);
  server.runCommandSilent('execute in '+TD_CONFIG.dimension+' run forceload remove all');
  tdBoss(server);
 }
 let players=tdPlayers(server);players.forEach(p=>tdFeed(p));
 let mobs=tdMobs(server),canMove=tdState.phase==='running'&&(tdQa||players.length>0);
 for(let i=0;i<mobs.length;i++){
  let e=mobs[i],d=e.persistentData;
  if(e.getHealth()<=0||e.isDeadOrDying()){
   if(!d.getBoolean('cwTDCounted')){tdState.killed++;d.putBoolean('cwTDCounted',true);}e.discard();continue;
  }
  e.setNoAi(true);e.setTarget(null);e.setMotionX(0);e.setMotionY(0);e.setMotionZ(0);
  if(!canMove){let fixed=tdPoint(d.getDouble('cwTDProgress'),d.getDouble('cwTDLane'));tdPosition(e,fixed);continue;}
  let type=TD_CONFIG.types[String(e.type)];if(!type){e.discard();continue;}
  let distance=d.getDouble('cwTDProgress')+type.speed*(TD_CONFIG.speedMultiplier||1)*tdSpeed;
  if(distance>=tdLength){
   e.discard();tdState.hp=Math.max(0,tdState.hp-type.damage);tdState.leaked++;tdState.damage+=type.damage;
   server.runCommandSilent('execute in '+TD_CONFIG.dimension+' positioned 89 66 75 run particle minecraft:flash ~ ~ ~ 0 0 0 0 1 normal');
   if(tdState.hp<=0){
    tdState.phase='lost';canMove=false;tdClear(server);tdTurretsClear(server);
    server.runCommandSilent('execute in '+TD_CONFIG.dimension+' run title @a[distance=0..] title {"text":"NHÀ CHÍNH ĐÃ THẤT THỦ","color":"red"}');
    tdNotify(server,'Lượt đã kết thúc. Bấm nút BẮT ĐẦU / CHƠI LẠI tại căn cứ hoặc /cw_td start.');tdSave();tdBoss(server);break;
   }
  }else{
   d.putDouble('cwTDProgress',distance);let p=tdPoint(distance,d.getDouble('cwTDLane'));
   tdPosition(e,p);
  }
 }
 tdArsenalTick(server,players,tdMobs(server),canMove);
 if(tdTicks%20===0){tdBoss(server);tdSave();tdStatus(server,false);}
});
function tdCommandPlayer(ctx){let player=ctx.source.player;if(player)return player;let players=ctx.source.server.getPlayerList().getPlayers();if(players.size()===1)return players.get(0);throw new Error('Can mot nguoi choi online.');}
function tdReply(ctx,text){ctx.source.sendSystemMessage(Text.of(String(text)));return 1;}
ServerEvents.commandRegistry(event=>{
 let c=event.commands;
 let root=c.literal('cw_td').executes(ctx=>{tdMenu(tdCommandPlayer(ctx));return 1;});
 root.then(c.literal('join').executes(ctx=>{tdJoin(tdCommandPlayer(ctx));return tdReply(ctx,'TD_JOINED');}));
 root.then(c.literal('leave').executes(ctx=>{tdLeave(tdCommandPlayer(ctx));return tdReply(ctx,'TD_LEFT');}));
 root.then(c.literal('start').executes(ctx=>{tdStart(ctx.source.server);return tdReply(ctx,'TD_RUNNING');}));
 root.then(c.literal('pause').executes(ctx=>{tdPause(ctx.source.server);return tdReply(ctx,'TD_'+tdState.phase);}));
 root.then(c.literal('status').executes(ctx=>tdReply(ctx,JSON.stringify(tdStatus(ctx.source.server,false)))));
 root.then(c.literal('inspect').requires(s=>s.hasPermission(4)).executes(ctx=>tdReply(ctx,JSON.stringify(tdStatus(ctx.source.server,true)))));
 root.then(c.literal('validate').requires(s=>s.hasPermission(4)).executes(ctx=>tdReply(ctx,JSON.stringify(tdValidateMap(ctx.source.server)))));
 root.then(c.literal('debug').requires(s=>s.hasPermission(4)).executes(ctx=>{let level=tdLevel(ctx.source.server),source=level.getChunkSource(),entities={};level.getAllEntities().forEach(e=>{let type=String(e.type);entities[type]=(entities[type]||0)+1;});return tdReply(ctx,JSON.stringify({dimension:String(level.dimension),loaded:source.getLoadedChunksCount(),hasSpawn:source.hasChunk(-7,-5),forced:level.getForcedChunks().size(),chunk:String(level.getChunk(-7,-5).getStatus()),entities:entities}));}));
 root.then(c.literal('install').requires(s=>s.hasPermission(4)).executes(ctx=>{TD_CONFIG.buildReady=true;JsonIO.write('kubejs/cw-td-config.json',TD_CONFIG);tdState.phase='idle';tdSave();tdStatus(ctx.source.server,false);return tdReply(ctx,'TD_INSTALLED');}));
 let spawnTag=c.argument('tag',TD_WORD.word()).executes(ctx=>tdReply(ctx,tdSpawn(ctx.source.server,String(TD_WORD.getString(ctx,'type')),String(TD_WORD.getString(ctx,'tag')))));
 root.then(c.literal('spawn').requires(s=>s.hasPermission(4)).then(c.argument('type',TD_WORD.string()).then(spawnTag)));
 let rewardFunction=c.argument('function',TD_WORD.string()).executes(ctx=>tdReply(ctx,tdReward(ctx.source.server,String(TD_WORD.getString(ctx,'player')),String(TD_WORD.getString(ctx,'function')))));
 root.then(c.literal('reward').requires(s=>s.hasPermission(4)).then(c.argument('player',TD_WORD.word()).then(rewardFunction)));
 let qa=c.literal('qa').requires(s=>s.hasPermission(4));
 qa.then(c.literal('wake').executes(ctx=>{TD_HORDES.pauseEventServer.set(false);return tdReply(ctx,'TD_QA_WORLD_AWAKE');}));
 qa.then(c.literal('sleep').executes(ctx=>{TD_HORDES.pauseEventServer.set(true);return tdReply(ctx,'TD_QA_EMPTY_SERVER_PAUSE_RESTORED');}));
 qa.then(c.literal('begin').executes(ctx=>{if(tdQa||tdMobs(ctx.source.server).length||tdPlayers(ctx.source.server).length)throw new Error('QA requires empty arena and no players');JsonIO.write('kubejs/cw-td-qa-backup.json',tdState);tdQaHordePause=TD_HORDES.pauseEventServer.get();TD_HORDES.pauseEventServer.set(false);tdQa=true;tdSpeed=1;tdState.phase='idle';tdStart(ctx.source.server);return tdReply(ctx,'TD_QA_STARTED');}));
 qa.then(c.literal('speed').then(c.argument('multiplier',TD_NUMBER.doubleArg(1,50)).executes(ctx=>{if(!tdQa)throw new Error('QA only');tdSpeed=TD_NUMBER.getDouble(ctx,'multiplier');return tdReply(ctx,'TD_QA_SPEED '+tdSpeed);})));
 qa.then(c.literal('near_goal').executes(ctx=>{if(!tdQa)throw new Error('QA only');tdMobs(ctx.source.server).forEach(e=>e.persistentData.putDouble('cwTDProgress',tdLength-.01));return tdReply(ctx,'TD_QA_NEAR_GOAL');}));
 qa.then(c.literal('health').then(c.argument('health',TD_NUMBER.doubleArg(1,1000)).executes(ctx=>{if(!tdQa)throw new Error('QA only');tdState.hp=TD_NUMBER.getDouble(ctx,'health');return tdReply(ctx,'TD_QA_HEALTH '+tdState.hp);})));
 qa.then(c.literal('clear').executes(ctx=>{if(!tdQa)throw new Error('QA only');tdClear(ctx.source.server);return tdReply(ctx,'TD_QA_CLEARED');}));
 qa.then(c.literal('end').executes(ctx=>{if(!tdQa)throw new Error('QA not active');tdClear(ctx.source.server);tdState=JsonIO.read('kubejs/cw-td-qa-backup.json');TD_HORDES.pauseEventServer.set(tdQaHordePause);tdQa=false;tdSpeed=1;tdSave();tdBoss(ctx.source.server);tdStatus(ctx.source.server,false);return tdReply(ctx,'TD_QA_ENDED');}));
 root.then(qa);event.register(root);
});

