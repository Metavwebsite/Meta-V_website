Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Sanitize-FileName([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) { return '' }
  $safe = $name.Trim()
  # Windows-invalid characters: <>:"/\|?*
  $safe = $safe -replace '[<>:"/\\|?*]', ' '
  $safe = $safe -replace '\s+', ' '
  return $safe.Trim()
}

function Normalize-ForMatch([string]$s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return '' }
  $t = $s.Normalize([Text.NormalizationForm]::FormD)
  $t = [regex]::Replace($t, '\p{Mn}+', '') # strip diacritics
  $t = $t.ToLowerInvariant()
  $t = $t -replace '[^a-z0-9]+', ' '
  $t = $t -replace '\s+', ' '
  return $t.Trim()
}

function Tokens([string]$s) {
  $n = Normalize-ForMatch $s
  if (-not $n) { return @() }
  # Keep reasonably distinctive tokens; drop 1-char noise.
  return @($n.Split(' ') | Where-Object { $_ -and $_.Length -ge 2 })
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$srcImageDir = Join-Path $repoRoot 'public\photo\EINHELL'
$dstBaseDir  = Join-Path $repoRoot 'public\photo\Einhell'
$publicDir = Join-Path $repoRoot 'public'
$materialParent = Get-ChildItem -LiteralPath $publicDir -Directory -ErrorAction Stop |
  Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'Einhell') } |
  Select-Object -First 1

if (-not $materialParent) {
  throw "Could not locate the Matériel directory under public/ (expected a folder that contains an 'Einhell' subfolder)."
}

$materialDir = Join-Path $materialParent.FullName 'Einhell'

if (-not (Test-Path -LiteralPath $srcImageDir)) {
  throw "Source image folder not found: $srcImageDir"
}
if (-not (Test-Path -LiteralPath $materialDir)) {
  throw "Material JSON folder not found: $materialDir"
}

New-Item -ItemType Directory -Path $dstBaseDir -Force | Out-Null

$images = @(Get-ChildItem -LiteralPath $srcImageDir -File -ErrorAction Stop)

$categories = @(Get-ChildItem -LiteralPath $materialDir -Directory -ErrorAction Stop)

[int]$copied = 0
[int]$skipped = 0
[int]$missing = 0

foreach ($cat in $categories) {
  $catName = $cat.Name
  $jsonFiles = @(Get-ChildItem -LiteralPath $cat.FullName -File -Filter '*.json' -ErrorAction SilentlyContinue)
  if ($jsonFiles.Count -eq 0) { continue }

  $categoryImages = @($images | Where-Object { $_.Name -like "$catName*" })
  if ($categoryImages.Count -eq 0) { $categoryImages = $images }

  $dstDir = Join-Path $dstBaseDir $catName
  New-Item -ItemType Directory -Path $dstDir -Force | Out-Null

  foreach ($jsonFile in $jsonFiles) {
    $raw = Get-Content -LiteralPath $jsonFile.FullName -Raw -Encoding UTF8
    $items = $raw | ConvertFrom-Json
    if (-not $items) { continue }

    foreach ($it in $items) {
      $productName = [string]$it.name
      $safeName = Sanitize-FileName $productName
      if ([string]::IsNullOrWhiteSpace($safeName)) { continue }

      $dstPathJpeg = Join-Path $dstDir ($safeName + '.jpeg')
      $dstPathJpg  = Join-Path $dstDir ($safeName + '.jpg')
      $dstPathPng  = Join-Path $dstDir ($safeName + '.png')
      if ((Test-Path -LiteralPath $dstPathJpeg) -or (Test-Path -LiteralPath $dstPathJpg) -or (Test-Path -LiteralPath $dstPathPng)) {
        $skipped++
        continue
      }

      $tokens = Tokens $productName
      $subtitle = [string]$it.subtitle
      $subtitleTokens = Tokens $subtitle

      $matches = @()
      if ($tokens.Count -gt 0) {
        $matches = @(
          $categoryImages | Where-Object {
            $n = Normalize-ForMatch $_.Name
            foreach ($tok in $tokens) { if (-not $n.Contains($tok)) { return $false } }
            return $true
          }
        )
      }

      if ($matches.Count -eq 0 -and $subtitleTokens.Count -gt 0) {
        $matches = @(
          $categoryImages | Where-Object {
            $n = Normalize-ForMatch $_.Name
            foreach ($tok in $subtitleTokens) { if (-not $n.Contains($tok)) { return $false } }
            return $true
          }
        )
      }

      if ($matches.Count -eq 0) {
        $missing++
        continue
      }

      # Prefer the shortest filename (usually closest to the product)
      $best = $matches | Sort-Object { $_.Name.Length } | Select-Object -First 1
      $dstPath = Join-Path $dstDir ($safeName + $best.Extension)
      Copy-Item -LiteralPath $best.FullName -Destination $dstPath -Force
      $copied++
    }
  }
}

"Done. Copied=$copied Skipped(existing)=$skipped Missing(no match)=$missing"
