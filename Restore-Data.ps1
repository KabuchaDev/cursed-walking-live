param([Parameter(Mandatory=$true)][string]$AssetsDirectory)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\')
$assets=(Resolve-Path -LiteralPath $AssetsDirectory).ProviderPath
$meta=Get-Content -LiteralPath (Join-Path $root 'release-assets.json') -Raw | ConvertFrom-Json
$manifest=Get-Content -LiteralPath (Join-Path $root 'package-manifest.json') -Raw | ConvertFrom-Json
$temp=Join-Path $assets ('restore-'+[guid]::NewGuid().ToString('N')+'.zip')
try {
 $stream=[IO.File]::Open($temp,[IO.FileMode]::CreateNew)
 try {
  foreach($part in $meta.parts){
   $p=Join-Path $assets $part.file
   if((Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash -ne $part.sha256){throw ('Sai SHA256: '+$part.file)}
   $inputStream=[IO.File]::OpenRead($p);try{$inputStream.CopyTo($stream)}finally{$inputStream.Dispose()}
  }
 } finally {$stream.Dispose()}
 if((Get-FileHash -LiteralPath $temp -Algorithm SHA256).Hash -ne $meta.sha256){throw 'Sai SHA256 cua goi da ghep'}
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $zip=[IO.Compression.ZipFile]::OpenRead($temp)
 try {
  foreach($entry in $zip.Entries){
   $dest=[IO.Path]::GetFullPath((Join-Path $root $entry.FullName))
   if(!$dest.StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Duong dan ZIP khong an toan'}
   $parent=[IO.Path]::GetDirectoryName($dest)
   New-Item -ItemType Directory -Path $parent -Force | Out-Null
   # Refuse existing symbolic links/junctions in the destination chain.
   $check=$parent
   while($check.Length -gt $root.Length){if((Get-Item -LiteralPath $check -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Dich giai nen la lien ket'};$check=[IO.Path]::GetDirectoryName($check)}
   if(Test-Path -LiteralPath $dest){if((Get-Item -LiteralPath $dest -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Tep dich la lien ket'}}
   [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$dest,$true)
  }
 } finally {$zip.Dispose()}
 foreach($f in $manifest.files){
  if($f.storage -eq 'standalone'){
   $dest=[IO.Path]::GetFullPath((Join-Path $root $f.path));if(!$dest.StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Duong dan khong an toan'}
   $src=Join-Path $assets $f.asset
   if((Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash -ne $f.sha256){throw 'Sai SHA256 bo cai'}
   New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($dest)) -Force | Out-Null
   Copy-Item -LiteralPath $src -Destination $dest -Force
  }
  if($f.storage -in @('release','standalone')){if((Get-FileHash -LiteralPath (Join-Path $root $f.path) -Algorithm SHA256).Hash -ne $f.sha256){throw ('Sai SHA256 tep: '+$f.path)}}
 }
 Write-Output 'Khoi phuc va kiem tra du lieu thanh cong. Tiep theo chay Configure-Local.ps1.'
} finally {if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp -Force}}
