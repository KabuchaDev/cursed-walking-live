// Temporary QA against the real TaCZ API and a Forge fake player.
function catPlayer(server){return Java.loadClass('net.minecraftforge.common.util.FakePlayerFactory').getMinecraft(server.getLevel('cw_live:defense'));}
function catSnapshot(server){let p=catPlayer(server),s=taState(p),f=taFind(p,s),api=f?TA_IGUN.getIGunOrNull(f.item):null;let out={state:s,item:f?String(f.item.nbt):null,ammo:api?api.getCurrentAmmoCount(f.item):0,barrel:api?api.hasBulletInBarrel(f.item):false,reserve:api?api.getDummyAmmoAmount(f.item):0,dummy:api?api.useDummyAmmo(f.item):false,turrets:TA_STATE.turrets};JsonIO.write('kubejs/cw-arsenal-test-report.json',out);return out;}
ServerEvents.commandRegistry(event=>{
 let c=event.commands,root=c.literal('cw_arsenal_test').requires(s=>s.hasPermission(4));
 root.then(c.literal('begin').executes(ctx=>{JsonIO.write('kubejs/cw-arsenal-test-backup.json',TA_STATE);let p=catPlayer(ctx.source.server);p.setPositionAndRotation(-66.5,64,-58.5,0,0);tdArsenalReset(p);catSnapshot(ctx.source.server);return 1;}));
 root.then(c.literal('snapshot').executes(ctx=>{catSnapshot(ctx.source.server);return 1;}));
 root.then(c.literal('debug').executes(ctx=>{let p=catPlayer(ctx.source.server),s=taState(p),f=taFind(p,s),api=TA_IGUN.getIGunOrNull(f.item);let out={ticks:TA_RUNTIME.ticks,mod:TA_RUNTIME.ticks%5,empty:api.getCurrentAmmoCount(f.item)<=0&&!api.hasBulletInBarrel(f.item)&&api.getDummyAmmoAmount(f.item)<=0,before:s.emptyTicks};for(let i=0;i<15;i++)tdArsenalTick(ctx.source.server,[p],[],false);out.after=taState(p).emptyTicks;out.ticksAfter=TA_RUNTIME.ticks;JsonIO.write('kubejs/cw-debug.json',out);return 1;}));
 root.then(c.literal('empty').executes(ctx=>{let p=catPlayer(ctx.source.server),f=taFind(p,taState(p)),api=TA_IGUN.getIGunOrNull(f.item);api.setCurrentAmmoCount(f.item,0);api.setBulletInBarrel(f.item,false);api.setDummyAmmoAmount(f.item,0);for(let i=0;i<15;i++)tdArsenalTick(ctx.source.server,[p],[],false);catSnapshot(ctx.source.server);return 1;}));
 for(let tier of ['T2','T3']){let selected=tier;root.then(c.literal('boost_'+selected.toLowerCase()).executes(ctx=>{let p=catPlayer(ctx.source.server);taApplyBoost(p,selected,180,'test_'+selected);catSnapshot(ctx.source.server);return 1;}));}
 root.then(c.literal('tick').executes(ctx=>{let p=catPlayer(ctx.source.server);tdArsenalTick(ctx.source.server,[p],[],true);catSnapshot(ctx.source.server);return 1;}));
 root.then(c.literal('near_turret').executes(ctx=>{tdMobs(ctx.source.server).forEach(e=>{e.persistentData.putDouble('cwTDProgress',33);e.persistentData.putDouble('cwTDLane',0);tdPosition(e,tdPoint(33,0));});return 1;}));
 root.then(c.literal('expire_t2').executes(ctx=>{let p=catPlayer(ctx.source.server);taState(p).t2=1;for(let i=0;i<10;i++)tdArsenalTick(ctx.source.server,[p],[],true);catSnapshot(ctx.source.server);return 1;}));
 root.then(c.literal('expire_t3').executes(ctx=>{let p=catPlayer(ctx.source.server);taState(p).t3=1;for(let i=0;i<10;i++)tdArsenalTick(ctx.source.server,[p],[],true);catSnapshot(ctx.source.server);return 1;}));
 root.then(c.literal('mount').executes(ctx=>{tdTurretMount(catPlayer(ctx.source.server));catSnapshot(ctx.source.server);return 1;}));
 root.then(c.literal('expire_turret').executes(ctx=>{for(let id in TA_STATE.turrets)TA_STATE.turrets[id].ticks=1;return 1;}));
 root.then(c.literal('speed').executes(ctx=>{let p=catPlayer(ctx.source.server),a=p.getAttribute(TA_ATTRIBUTES.MOVEMENT_SPEED),before=a.getValue();taSpeed(p,true);let during=a.getValue();taSpeed(p,false);JsonIO.write('kubejs/cw-td-speed-player-test.json',{before:before,during:during,after:a.getValue()});return 1;}));
 root.then(c.literal('worlds').executes(ctx=>{let rows=[];ctx.source.server.getAllLevels().forEach(l=>{let n=0;l.getAllEntities().forEach(e=>n++);rows.push({dimension:String(l.dimension),chunks:l.getChunkSource().getLoadedChunksCount(),entities:n,vanillaForced:l.getForcedChunks().size()});});JsonIO.write('kubejs/cw-td-worlds-test.json',rows);ctx.source.sendSystemMessage(Text.of(JSON.stringify(rows)));return 1;}));
 root.then(c.literal('end').executes(ctx=>{tdTurretsClear(ctx.source.server);let p=catPlayer(ctx.source.server);taSpeed(p,false);p.getInventory().clearContent();TA_STATE=taRead('kubejs/cw-arsenal-test-backup.json');taSave();return 1;}));event.register(root);
});


