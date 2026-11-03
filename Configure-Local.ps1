$ErrorActionPreference='Stop'
$root=$PSScriptRoot
function New-Secret { $b=New-Object byte[] 24;$rng=[Security.Cryptography.RandomNumberGenerator]::Create();try{$rng.GetBytes($b)}finally{$rng.Dispose()};return -join ($b | ForEach-Object {$_.ToString('x2')}) }
$java=Get-Command java -ErrorAction SilentlyContinue
if(!$java){$java=Get-ChildItem 'C:\Program Files\Microsoft','C:\Program Files\Eclipse Adoptium','C:\Program Files\Java' -Filter java.exe -Recurse -ErrorAction SilentlyContinue | Where-Object {$_.FullName -match '\\bin\\java.exe$'} | Select-Object -First 1}
$node=Get-Command node -ErrorAction SilentlyContinue
foreach($example in Get-ChildItem -LiteralPath $root -Filter settings.example.json -File -Recurse){
 $target=Join-Path $example.DirectoryName 'settings.local.json'
 if(Test-Path -LiteralPath $target){Write-Output ('Giu cau hinh da co: '+$target);continue}
 $obj=Get-Content -LiteralPath $example.FullName -Raw | ConvertFrom-Json
 foreach($p in $obj.PSObject.Properties){
  if($p.Name -match '(?i)password|token|serverTapKey|apiKey|secret'){$p.Value=New-Secret}
  elseif($p.Name -eq 'javaPath'){if($java){$p.Value=if($java.Source){$java.Source}else{$java.FullName}}else{$p.Value='java';Write-Warning 'Can cai Java 17 va dien javaPath'}}
  elseif($p.Name -eq 'nodePath'){if($node){$p.Value=$node.Source}else{$p.Value='node';Write-Warning 'Can cai Node.js'}}
  elseif($p.Name -eq 'serverDir'){$p.Value=Join-Path $example.DirectoryName 'server'}
  elseif($p.Name -eq 'clientDir'){$p.Value=Join-Path $env:APPDATA '.minecraft'}
  elseif($p.Name -in @('streamerbotExe','tikfinityExe')){$p.Value=''}
 }
 $obj | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $target -Encoding UTF8
 $prop=Join-Path $example.DirectoryName 'server\server.properties.example'
 if(Test-Path -LiteralPath $prop){
  $actual=Join-Path $example.DirectoryName 'server\server.properties'
  if(!(Test-Path -LiteralPath $actual)){
   $text=Get-Content -LiteralPath $prop -Raw
   $password=if($obj.PSObject.Properties.Name -contains 'rconPassword'){$obj.rconPassword}else{New-Secret}
   $text=[regex]::Replace($text,'(?m)^rcon\.password=.*$',('rcon.password='+$password))
   Set-Content -LiteralPath $actual -Value $text -Encoding UTF8
  }
 }
 $tap=Join-Path $example.DirectoryName 'server\plugins\ServerTap\config.example.yml'
 if((Test-Path -LiteralPath $tap) -and ($obj.PSObject.Properties.Name -contains 'serverTapKey')){
  $actual=Join-Path $example.DirectoryName 'server\plugins\ServerTap\config.yml'
  if(!(Test-Path -LiteralPath $actual)){$text=Get-Content -LiteralPath $tap -Raw;$text=[regex]::Replace($text,'(?m)^(\s*key\s*:\s*).*$',('${1}'+$obj.serverTapKey));Set-Content -LiteralPath $actual -Value $text -Encoding UTF8}
 }
 Write-Output ('Da tao cau hinh rieng: '+$target)
}
Write-Output 'Khong khoi chay ung dung. Xem README va huong dan goc trong outputs.'
