// E mounts the held gun only while a nearby arena turret is available.
let CW_TD_MC=Java.loadClass('net.minecraft.client.Minecraft');
let CW_TD_GLFW=Java.loadClass('org.lwjgl.glfw.GLFW');
let CW_TD_INVENTORY=Java.loadClass('net.minecraft.client.gui.screens.inventory.InventoryScreen');
let cwTdHint={ready:false,at:0},cwTdHeld=false,cwTdCloseUntil=0;
NetworkEvents.dataReceived('cw_td_mount_hint',event=>{cwTdHint={ready:event.data.getBoolean('ready'),at:Date.now()};});
ClientEvents.loggedOut(event=>{cwTdHint={ready:false,at:0};cwTdHeld=false;});
ClientEvents.tick(event=>{
 let mc=CW_TD_MC.getInstance();if(!mc.player){cwTdHeld=false;return;}
 let down=CW_TD_GLFW.glfwGetKey(mc.getWindow().getWindow(),69)===1;
 if(down&&!cwTdHeld&&cwTdHint.ready&&Date.now()-cwTdHint.at<1500&&String(mc.player.level.dimension)==='cw_live:defense'&&(!mc.screen||mc.screen instanceof CW_TD_INVENTORY)){
  mc.player.sendData('cw_td_mount',{});cwTdCloseUntil=Date.now()+250;cwTdHint.ready=false;
 }
 // Vanilla E may open the inventory before the end-of-tick handler runs.
 if(Date.now()<cwTdCloseUntil&&mc.screen instanceof CW_TD_INVENTORY)mc.setScreen(null);
 cwTdHeld=down;
});
