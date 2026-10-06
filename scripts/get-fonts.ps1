# 从 Google Fonts CSS 中提取 latin 子集的 woff2 并下载（Policygenius 参照字体）
$ErrorActionPreference = 'Stop'
$css = Get-Content "$env:TEMP\pgfonts.css" -Raw
$blocks = $css -split '@font-face' | Select-Object -Skip 1
$dest = Join-Path $PSScriptRoot '..\src\assets\fonts'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

foreach ($b in $blocks) {
  $fam   = if ($b -match "font-family:\s*'([^']+)'") { $Matches[1] } else { $null }
  $style = if ($b -match 'font-style:\s*(\w+)') { $Matches[1] } else { $null }
  $url   = if ($b -match 'url\((https://[^)]+\.woff2)\)') { $Matches[1] } else { $null }
  $latin = $b -match 'unicode-range:\s*U\+0000-00FF'
  if ($fam -and $style -eq 'normal' -and $latin -and $url) {
    $out = Join-Path $dest ("$($fam.ToLower())-latin.woff2")
    Invoke-WebRequest -Uri $url -OutFile $out
    Write-Output "OK $fam -> $out ($((Get-Item $out).Length) bytes)"
  }
}
