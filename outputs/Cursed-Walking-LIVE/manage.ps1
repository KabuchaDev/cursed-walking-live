param([ValidateSet('start-server','start-bridge','stop-server','stop-bridge','status','probe','zombie','feral','mutant','backup')][string]$Action='status')
$ErrorActionPreference='Stop'
$settings=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'settings.local.json') -Raw | ConvertFrom-Json
$node=Join-Path $PSScriptRoot 'runtime\node.exe'
function Test-LocalPort([int]$Port){
 $tcp=New-Object System.Net.Sockets.TcpClient
 try{$t=$tcp.ConnectAsync('127.0.0.1',$Port);return ($t.Wait(600) -and $tcp.Connected)}catch{return $false}finally{$tcp.Dispose()}
}
function Start-Bridge {
 if(-not (Get-Process -Name 'Streamer.bot' -ErrorAction SilentlyContinue)){Start-Process -FilePath $settings.streamerbotExe -WorkingDirectory (Split-Path $settings.streamerbotExe) -WindowStyle Hidden | Out-Null}
 if(-not (Get-Process -Name 'TikFinity' -ErrorAction SilentlyContinue)){Start-Process -FilePath $settings.tikfinityExe -WindowStyle Hidden | Out-Null}
 if(Test-LocalPort $settings.controlPort){Write-Host 'Bo ket noi da chay.';return}
 $p=Start-Process -FilePath $node -ArgumentList ('"'+(Join-Path $PSScriptRoot 'bridge.mjs')+'"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'logs\bridge-console.log') -RedirectStandardError (Join-Path $PSScriptRoot 'logs\bridge-errors.log') -PassThru
 Write-Host 'Da bat bo ket noi: 1 tim = 1 zombie va 7 loai qua. Dung TRANG-THAI.cmd de kiem tra.'
}
switch($Action){
 'start-server' {
   if(Test-LocalPort $settings.serverPort){Write-Host ('Server da chay: 127.0.0.1:'+$settings.serverPort);break}
   $pidFile=Join-Path $PSScriptRoot 'server-process-id.txt'
   if(Test-Path -LiteralPath $pidFile){
     $priorId=[int](Get-Content -LiteralPath $pidFile)
     $prior=Get-CimInstance Win32_Process -Filter "ProcessId=$priorId" -ErrorAction SilentlyContinue
     if($prior -and $prior.ExecutablePath -eq $settings.javaPath -and $prior.CommandLine -match '47\.4\.0/win_args'){throw 'Server dang khoi dong hoac bi loi. Xem logs\server-console.log; khong mo them ban sao.'}
   }
   $p=Start-Process -FilePath $settings.javaPath -ArgumentList '@user_jvm_args.txt','@libraries/net/minecraftforge/forge/1.20.1-47.4.0/win_args.txt','nogui' -WorkingDirectory $settings.serverDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'logs\server-console.log') -RedirectStandardError (Join-Path $PSScriptRoot 'logs\server-errors.log') -PassThru
   $p.Id | Set-Content -LiteralPath $pidFile
   Write-Host 'Dang khoi dong Cursed Walking. Cho thong bao Done; khong can mo them server.'
   for($i=0;$i -lt 180;$i++){
     Start-Sleep -Seconds 2
     if($p.HasExited){throw 'Server da dung. Xem logs\server-console.log.'}
     if(Test-LocalPort $settings.rconPort){
       & $node (Join-Path $PSScriptRoot 'rcon.mjs') list
       if($LASTEXITCODE -eq 0){Write-Host 'SAN SANG. Minecraft -> Multiplayer -> 127.0.0.1:25567';return}
     }
     if(($i % 15) -eq 0){Get-Content -LiteralPath (Join-Path $PSScriptRoot 'logs\server-console.log') -Tail 2}
   }
   throw 'Chua hoan tat sau 6 phut. Xem log truoc khi thu lai.'
 }
 'start-bridge' {Start-Bridge}
 'stop-server' {
   & $node (Join-Path $PSScriptRoot 'control.mjs') stop-server
   if($LASTEXITCODE -ne 0){throw 'Chua xac nhan luu va tat server.'}
   $pidFile=Join-Path $PSScriptRoot 'server-process-id.txt'
   if(Test-Path -LiteralPath $pidFile){
     $runningId=[int](Get-Content -LiteralPath $pidFile)
     Wait-Process -Id $runningId -Timeout 30 -ErrorAction SilentlyContinue
     $remaining=Get-CimInstance Win32_Process -Filter "ProcessId=$runningId" -ErrorAction SilentlyContinue
     if($remaining){
       $shutdownLog=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'logs\server-console.log') -Tail 45
       $listeners=Get-NetTCPConnection -OwningProcess $runningId -State Listen -ErrorAction SilentlyContinue
       if($remaining.ExecutablePath -eq $settings.javaPath -and $remaining.CommandLine -match '47\.4\.0/win_args' -and ($shutdownLog -match 'All dimensions are saved') -and ($shutdownLog -match 'Thread RCON Listener stopped') -and -not $listeners){Stop-Process -Id $runningId}
       else{throw 'Chua xac nhan server da luu va dung het. Khong tat tien trinh Java.'}
     }
   }
   if(Test-LocalPort $settings.serverPort){throw 'Server van dang tat. Doi them; khong tat Windows.'}
   Write-Host 'Da gui lenh luu va tat server.'
 }
 'stop-bridge' {& $node (Join-Path $PSScriptRoot 'control.mjs') stop-bridge}
 'status' {
   try {
     $s=Invoke-RestMethod -Uri ('http://127.0.0.1:'+$settings.controlPort+'/status') -TimeoutSec 5
     Write-Host ('Server Minecraft: '+$(if($s.minecraft.connected){'DA KET NOI'}else{'CHUA KET NOI'}))
     Write-Host ('TikFinity tren may: '+$(if($s.tikfinityLocalSocket){'DA KET NOI'}else{'CHUA KET NOI'}))
     Write-Host ('Streamer.bot: '+$(if($s.streamerbot){'DA KET NOI'}else{'CHUA KET NOI'}))
     Write-Host $s.minecraft.message
     Write-Host ('Tim da nhan: '+$s.likes.totalReceived+' | Tim du: '+$s.likes.remainder+'/'+$s.likes.threshold)
     Write-Host ('Zombie da goi: '+$s.likes.spawned+' | Dang cho: '+$s.likes.pending)
     Write-Host ('Con '+$s.likes.toNext+' tim de them 1 zombie. Ngau nhien trong '+$s.likes.zombieTypes+' loai.')
     Write-Host ('Qua da gan: '+$s.giftsConfigured+' | Follow: '+$s.stats.follows+' | Qua da nhan: '+$s.stats.gifts)
     Write-Host ('Tong zombie da goi: '+$s.stats.zombies+' | Dang cho: '+$s.queue.zombies+' | Goi vat pham dang cho: '+$s.queue.rewards)
     if($s.towerDefense){Write-Host ('THANH TRI 07: '+$s.towerDefense.phase+' | Nha: '+$s.towerDefense.hp+'/'+$s.towerDefense.maxHp+' HP | Zombie tren map: '+$s.towerDefense.active)}
     if(-not $s.likes.lastLikeAt){Write-Host 'Chua nhan tim LIVE trong lan chay nay. Hay ket noi phong LIVE trong TikFinity.'}
     if($s.queue.lastIssue){Write-Host ('Luu y hang cho: '+$s.queue.lastIssue)}
   }catch{Write-Host 'Bo ket noi chua chay. Mo BAT-KET-NOI-TIKTOK.cmd truoc.'}
 }
 'probe' {& $node (Join-Path $PSScriptRoot 'control.mjs') probe}
 'zombie' {& $node (Join-Path $PSScriptRoot 'control.mjs') summon minecraft:zombie 1}
 'feral' {& $node (Join-Path $PSScriptRoot 'control.mjs') summon feralzombie:feral_zombie 1}
 'mutant' {& $node (Join-Path $PSScriptRoot 'control.mjs') summon mutantmonsters:mutant_zombie 1}
 'backup' {
   if(Test-LocalPort $settings.serverPort){throw 'Hay dung TAT-SERVER.cmd va doi server tat xong truoc khi sao luu.'}
   $world=Join-Path $settings.serverDir 'world-cursed-live'
   $archive=Join-Path $PSScriptRoot ('backups\world-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.zip')
   if(-not (Test-Path -LiteralPath $world)){throw 'Chua co world.'}
   Compress-Archive -LiteralPath $world,(Join-Path $settings.serverDir 'kubejs') -DestinationPath $archive
   Write-Host ('Da sao luu: '+$archive)
 }
}
if($LASTEXITCODE -and $LASTEXITCODE -ne 0){exit $LASTEXITCODE}

