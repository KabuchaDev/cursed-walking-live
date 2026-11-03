// Temporary administrator-only fixtures; removed after validating movement and food.
function cwMovementFixtures(server){let a=[];server.getLevel('cw_live:defense').getAllEntities().forEach(e=>{if(e.getTags().contains('cw_motion_probe'))a.push(e);});return a;}
ServerEvents.commandRegistry(event=>{
 let c=event.commands,number=Java.loadClass('com.mojang.brigadier.arguments.DoubleArgumentType');
 let root=c.literal('cw_motion_probe').requires(s=>s.hasPermission(4));
 root.then(c.literal('setup').executes(ctx=>{
  let server=ctx.source.server,status=JsonIO.read('kubejs/cw-td-status.json'),config=JsonIO.read('kubejs/cw-td-config.json');
  if(status.phase!=='paused'||status.active)throw new Error('Need paused empty arena');
  let i=0;
  for(let type in config.types){let e=server.getLevel('cw_live:defense').createEntity(type);e.addTag('cw_td');e.addTag('cw_motion_probe');e.setInvulnerable(true);e.setSilent(true);e.persistentData.putBoolean('cwTDInitialized',true);e.persistentData.putDouble('cwTDProgress',49.4);e.persistentData.putDouble('cwTDLane',((i++%5)-2)*.8);e.setPositionAndRotation(-50.1,64,-64.5,-90,0);e.spawn();}
  server.scheduleInTicks(2400,()=>cwMovementFixtures(server).forEach(e=>e.discard()));
  ctx.source.sendSystemMessage(Text.of('Fixtures '+cwMovementFixtures(server).length));return 1;
 }));
 root.then(c.literal('position').then(c.argument('distance',number.doubleArg(0,580)).executes(ctx=>{let distance=number.getDouble(ctx,'distance');cwMovementFixtures(ctx.source.server).forEach(e=>e.persistentData.putDouble('cwTDProgress',distance));return 1;})));
 root.then(c.literal('hunger').executes(ctx=>{ctx.source.server.getPlayerList().getPlayers().forEach(p=>{if(String(p.level.dimension)==='cw_live:defense'){p.setFoodLevel(6);p.setSaturation(0);p.getFoodData().setExhaustion(3);}});return 1;}));
 root.then(c.literal('foodcheck').executes(ctx=>{let factory=Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory'),p=factory.getMinecraft(ctx.source.server.getLevel('cw_live:defense'));p.setFoodLevel(6);p.setSaturation(0);p.getFoodData().setExhaustion(3);tdFeed(p);let result={food:p.getFoodLevel(),saturation:p.getSaturation(),exhaustion:p.nbt.getFloat('foodExhaustionLevel'),syntheticPlayer:true};JsonIO.write('kubejs/cw-td-food-check.json',result);ctx.source.sendSystemMessage(Text.of(JSON.stringify(result)));return 1;}));
 root.then(c.literal('measure').executes(ctx=>{let server=ctx.source.server,initial={};cwMovementFixtures(server).forEach(e=>initial[String(e.type)]=e.persistentData.getDouble('cwTDProgress'));server.scheduleInTicks(40,()=>{let rows=[];cwMovementFixtures(server).forEach(e=>rows.push({type:String(e.type),distance:e.persistentData.getDouble('cwTDProgress')-initial[String(e.type)]}));JsonIO.write('kubejs/cw-td-speed-check.json',{ticks:40,rows:rows});});return 1;}));
 root.then(c.literal('clear').executes(ctx=>{cwMovementFixtures(ctx.source.server).forEach(e=>e.discard());return 1;}));
 event.register(root);
});
