// Local LIVE preparation: export actual registered summonable living entity types.
const CwRegistries = Java.loadClass('net.minecraftforge.registries.ForgeRegistries');
function cwExportCatalog() {
  let rows = [];
  CwRegistries.ENTITY_TYPES.getKeys().forEach(id => {
    let type = CwRegistries.ENTITY_TYPES.getValue(id);
    rows.push({id: String(id), category: String(type.getCategory().getName()), summonable: type.canSummon(), width: type.getWidth(), height: type.getHeight()});
  });
  JsonIO.write('kubejs/cursed-live-entities.json', {entities: rows});
  let items = [];
  CwRegistries.ITEMS.getKeys().forEach(id => items.push(String(id)));
  JsonIO.write('kubejs/cursed-live-items.json', {items: items});
  const tacz = Java.loadClass('com.tacz.guns.api.TimelessAPI');
  let guns = [], ammo = [];
  tacz.getAllCommonGunIndex().forEach(entry => {
    let data = entry.getValue().getGunData();
    let modes=[];data.getFireModeSet().forEach(mode=>modes.push(String(mode)));
    let bullet=data.getBulletData(),damage=bullet.getDamageAmount(),extra=bullet.getExtraDamage();
    if(extra&&extra.getDamageAdjust()&&!extra.getDamageAdjust().isEmpty())damage=extra.getDamageAdjust().getFirst().getDamage();
    guns.push({id:String(entry.getKey()),ammo:String(data.getAmmoId()),capacity:data.getAmmoAmount(),rpm:data.getRoundsPerMinute(),modes:modes,bolt:String(data.getBolt()),damage:damage,projectiles:bullet.getBulletAmount()});
  });
  tacz.getAllCommonAmmoIndex().forEach(entry => ammo.push(String(entry.getKey())));
  JsonIO.write('kubejs/cursed-live-guns.json', {guns: guns, ammo: ammo});
  console.info('[Cursed LIVE] Exported ' + rows.length + ' entity types.');
}
ServerEvents.loaded(event => cwExportCatalog());
ServerEvents.commandRegistry(event => {
  event.register(event.commands.literal('cw_catalog').requires(source => source.hasPermission(4)).executes(ctx => {
    cwExportCatalog();
    ctx.source.sendSystemMessage(Text.of('Cursed LIVE catalog exported'));
    return 1;
  }));
  event.register(event.commands.literal('cw_clean_test').requires(source => source.hasPermission(4)).executes(ctx => {
    let removed = 0;
    ctx.source.server.getAllLevels().forEach(level => {
      let targets = [];
      level.getAllEntities().forEach(entity => {
        if (entity.getTags().contains('cw_probe')) targets.push(entity);
      });
      targets.forEach(entity => { entity.discard(); removed++; });
    });
    ctx.source.sendSystemMessage(Text.of('Removed test entities: ' + removed));
    return removed;
  }));
});
