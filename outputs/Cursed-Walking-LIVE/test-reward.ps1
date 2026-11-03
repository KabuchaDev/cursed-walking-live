$ErrorActionPreference='Stop'
Write-Host 'Vao map thu thanh va bat dau/tiep tuc luot truoc khi thu:'
Write-Host '1. Rosa: Sung T2 luan phien trong 3 phut, 10 bang moi khau'
Write-Host '2. Perfume: Sung T3 luan phien trong 3 phut, 10 bang moi khau'
$choice=Read-Host 'Nhap 1-2 (Enter de huy)'
$rewardKey=switch($choice){'1'{'boost_t2'} '2'{'boost_t3'} default{''}}
if($rewardKey){& (Join-Path $PSScriptRoot 'runtime\node.exe') (Join-Path $PSScriptRoot 'control.mjs') reward $rewardKey}
