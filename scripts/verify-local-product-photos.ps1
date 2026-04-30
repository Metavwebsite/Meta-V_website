Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Strip-Quotes([string]$s) {
  if ($null -eq $s) { return '' }
  return $s.Trim().Trim('"')
}

function Unique([string[]]$items) {
  $set = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($it in $items) {
    if ([string]::IsNullOrWhiteSpace($it)) { continue }
    [void]$set.Add($it)
  }
  return $set
}

function Build-Stems([string]$raw) {
  $raw = [string]$raw
  $raw = $raw.Trim()
  if (-not $raw) { return @() }

  $safeSpaces = ($raw -replace '[<>:"/\\|?*]', ' ') -replace '\s+', ' '
  $safeSpaces = $safeSpaces.Trim()

  $pipeUnderscore = ($raw -replace '\|', '_').Trim()

  $slashRemoved = ($raw -replace '[\/\\]', '')
  $slashRemoved = ($slashRemoved -replace '[<>:"|?*]', ' ') -replace '\s+', ' '
  $slashRemoved = $slashRemoved.Trim()

  $stems = @($raw, $pipeUnderscore, $safeSpaces, $slashRemoved)
  $set = Unique $stems
  $out = @()
  foreach ($x in $set) { $out += $x }
  return $out
}

function Has-AnyImage([System.Collections.Generic.HashSet[string]]$fileSet, [string]$productName) {
  $stems = @(Build-Stems $productName)
  if ($stems.Count -eq 0) { return $false }

  $exts = @('avif','webp','jpg','jpeg','png','gif','svg')
  $suffixes = @('','-1','-2','-3','-4','-5')

  foreach ($stem in $stems) {
    foreach ($suf in $suffixes) {
      foreach ($ext in $exts) {
        $fn = "$stem$suf.$ext"
        if ($fileSet.Contains($fn)) { return $true }
      }
    }
  }

  return $false
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$msPath = Join-Path $repoRoot 'src\data\materialSources.ts'
if (-not (Test-Path -LiteralPath $msPath)) {
  throw "materialSources.ts not found: $msPath"
}

$raw = Get-Content -LiteralPath $msPath -Raw -Encoding UTF8

# Extract in-order arrays; materialSources objects always contain id/jsonUrl/photoDir.
$ids = [regex]::Matches($raw, '"id"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$jsonUrls = [regex]::Matches($raw, '"jsonUrl"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$photoDirs = [regex]::Matches($raw, '"photoDir"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }

if ($ids.Count -ne $jsonUrls.Count -or $ids.Count -ne $photoDirs.Count) {
  throw "Parse mismatch: ids=$($ids.Count) jsonUrls=$($jsonUrls.Count) photoDirs=$($photoDirs.Count)"
}

$publicRoot = Join-Path $repoRoot 'public'
$missingSources = @()

$totalProducts = 0
$totalWithImage = 0

$perSource = @()

for ($i = 0; $i -lt $ids.Count; $i++) {
  $id = $ids[$i]
  $jsonUrl = $jsonUrls[$i]
  $photoDirUrl = $photoDirs[$i]

  $jsonPath = Join-Path $publicRoot ($jsonUrl.TrimStart('/') -replace '/', '\\')
  $photoPath = Join-Path $publicRoot ($photoDirUrl.TrimStart('/') -replace '/', '\\')

  if (-not (Test-Path -LiteralPath $jsonPath)) {
    $missingSources += "MISSING JSON: $jsonUrl ($id)"
    continue
  }
  if (-not (Test-Path -LiteralPath $photoPath)) {
    $missingSources += "MISSING PHOTO DIR: $photoDirUrl ($id)"
    continue
  }

  $jsonText = Get-Content -LiteralPath $jsonPath -Raw -Encoding UTF8
  $items = $null
  try {
    $items = $jsonText | ConvertFrom-Json
  } catch {
    $missingSources += "BAD JSON: $jsonUrl ($id)"
    continue
  }

  if (-not $items) { continue }

  $files = @(Get-ChildItem -LiteralPath $photoPath -File -ErrorAction SilentlyContinue)
  $fileSet = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
  foreach ($f in $files) { [void]$fileSet.Add($f.Name) }

  $count = 0
  $with = 0
  $missing = New-Object 'System.Collections.Generic.List[string]'

  foreach ($it in $items) {
    $name = [string]$it.name
    if (-not $name) { continue }
    $count++

    if (Has-AnyImage $fileSet $name) {
      $with++
    } else {
      $missing.Add($name)
    }
  }

  $totalProducts += $count
  $totalWithImage += $with

  $perSource += [pscustomobject]@{
    id = $id
    jsonUrl = $jsonUrl
    photoDir = $photoDirUrl
    products = $count
    withImage = $with
    missing = ($count - $with)
    missingExamples = ($missing | Select-Object -First 10)
  }
}

$reportDir = Join-Path $repoRoot 'reports'
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$reportPath = Join-Path $reportDir 'missing-product-photos.txt'

$lines = New-Object 'System.Collections.Generic.List[string]'
$lines.Add("Total products: $totalProducts")
$lines.Add("Products with >=1 local image: $totalWithImage")
$lines.Add("Products missing local image: $($totalProducts - $totalWithImage)")
$lines.Add('')

if ($missingSources.Count -gt 0) {
  $lines.Add('Sources with missing JSON or photoDir:')
  foreach ($m in $missingSources) { $lines.Add("- $m") }
  $lines.Add('')
}

$worst = $perSource | Sort-Object missing -Descending | Select-Object -First 25
foreach ($s in $worst) {
  if ($s.missing -le 0) { continue }
  $lines.Add("[$($s.id)] missing $($s.missing)/$($s.products) :: $($s.photoDir)")
  foreach ($ex in $s.missingExamples) { $lines.Add("  - $ex") }
  $lines.Add('')
}

Set-Content -LiteralPath $reportPath -Value $lines -Encoding UTF8

"OK. Report written to: $reportPath"
"Coverage: $totalWithImage/$totalProducts products have a local image"
