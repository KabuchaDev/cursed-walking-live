// Explicit, temporary verification mode. Production events are unaffected when inactive.
const CwTestListTag = Java.loadClass('net.minecraft.nbt.ListTag');
const CwTestTagParser = Java.loadClass('net.minecraft.nbt.TagParser');
const CwTestGameType = Java.loadClass('net.minecraft.world.level.GameType');
const CwTestRegistry = Java.loadClass('net.minecraftforge.registries.ForgeRegistries');
function cwTestPlayer(server) {
  const backup=JsonIO.read('kubejs/cw-live-test-backup.json');
  if(!backup||!backup.active)return null;
  return server.getPlayerList().getPlayerByName(String(backup.name));
}
function cwTestReport(server) {
  const player=cwTestPlayer(server);if(!player)throw new Error('Test player is not online');
  let inv=[];for(let i=0;i<player.getInventory().getContainerSize();i++){
    let item=player.getInventory().getItem(i);
    if(!item.isEmpty())inv.push({slot:i,id:String(item.id),count:item.getCount(),tag:item.nbt?String(item.nbt):''});
  }
  let mobs=[];server.getAllLevels().forEach(level=>level.getAllEntities().forEach(entity=>{
    if(entity.getTags().contains('cw_probe')){let tags=[];entity.getTags().forEach(t=>tags.push(String(t)));mobs.push({id:String(entity.type),tags:tags,x:entity.getX(),y:entity.getY(),z:entity.getZ()});}
  }));
  const report={player:String(player.getGameProfile().getName()),x:player.getX(),y:player.getY(),z:player.getZ(),inventory:inv,mobs:mobs};
  JsonIO.write('kubejs/cw-live-test-report.json',report);return report;
}
EntityEvents.spawned(event=>{
  if(!event.entity.getTags().contains('cw_live'))return;
  const backup=JsonIO.read('kubejs/cw-live-test-backup.json');
  if(!backup||!backup.active)return;
  event.entity.addTag('cw_probe');event.entity.setNoAi(true);event.entity.setInvulnerable(true);event.entity.setSilent(true);
});
ServerEvents.commandRegistry(event=>{
  event.register(event.commands.literal('cw_test_begin').requires(s=>s.hasPermission(4)).executes(ctx=>{
    const existing=JsonIO.read('kubejs/cw-live-test-backup.json');
    if(existing&&existing.active)throw new Error('An active test backup already exists');
    const players=ctx.source.server.getPlayerList().getPlayers();
    if(players.size()!==1)throw new Error('Exactly one real player must be online');
    const player=players.get(0);
    const inventory=player.getInventory().save(new CwTestListTag());
    JsonIO.write('kubejs/cw-live-test-backup.json',{active:true,name:String(player.getGameProfile().getName()),uuid:String(player.getGameProfile().getId()),mode:String(player.gameMode.getGameModeForPlayer().getName()),selected:player.getInventory().selected,inventory:String(inventory)});
    player.setGameMode(CwTestGameType.CREATIVE);
    ctx.source.sendSystemMessage(Text.of('Test started: inventory backed up, creative enabled, LIVE test mobs frozen.'));return 1;
  }));
  event.register(event.commands.literal('cw_test_snapshot').requires(s=>s.hasPermission(4)).executes(ctx=>{
    const report=cwTestReport(ctx.source.server);
    ctx.source.sendSystemMessage(Text.of('Test snapshot: '+report.inventory.length+' item stacks, '+report.mobs.length+' mobs.'));return 1;
  }));
  event.register(event.commands.literal('cw_test_clear').requires(s=>s.hasPermission(4)).executes(ctx=>{
    const player=cwTestPlayer(ctx.source.server);if(!player)throw new Error('Test not active');
    player.getInventory().clearContent();
    let targets=[];ctx.source.server.getAllLevels().forEach(level=>level.getAllEntities().forEach(entity=>{if(entity.getTags().contains('cw_probe'))targets.push(entity);}));
    targets.forEach(entity=>entity.discard());
    ctx.source.sendSystemMessage(Text.of('Cleared test inventory and '+targets.length+' test mobs.'));return 1;
  }));
  event.register(event.commands.literal('cw_test_end').requires(s=>s.hasPermission(4)).executes(ctx=>{
    const backup=JsonIO.read('kubejs/cw-live-test-backup.json');
    const player=cwTestPlayer(ctx.source.server);if(!player)throw new Error('Test player must be online to restore');
    let targets=[];ctx.source.server.getAllLevels().forEach(level=>level.getAllEntities().forEach(entity=>{if(entity.getTags().contains('cw_probe'))targets.push(entity);}));
    targets.forEach(entity=>entity.discard());
    const tag=CwTestTagParser.parseTag('{Inventory:'+String(backup.inventory)+'}');
    player.getInventory().clearContent();player.getInventory().load(tag.getList('Inventory',10));player.getInventory().selected=Number(backup.selected);
    player.inventoryMenu.broadcastChanges();player.setGameMode(CwTestGameType.byName(String(backup.mode)));
    backup.active=false;JsonIO.write('kubejs/cw-live-test-backup.json',backup);
    ctx.source.sendSystemMessage(Text.of('Test ended: inventory/game mode restored; test mobs removed.'));return 1;
  }));
});
