Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Unique([string[]]$items) {
  $set = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($it in $items) {
    if ([string]::IsNullOrWhiteSpace($it)) { continue }
    [void]$set.Add($it)
  }
  return $set
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
  return @(
    $n.Split(' ') |
      Where-Object {
        if (-not $_) { return $false }
        if ($_.Length -ge 2) { return $true }
        if ($_ -match '^[0-9]+$') { return $true }
        if ($_ -match '^[a-z]$' -and @('w','x','t') -contains $_) { return $true }
        return $false
      }
  )
}

function Sanitize-Stem([string]$raw) {
  $raw = [string]$raw
  $raw = $raw.Trim()
  if (-not $raw) { return '' }

  $safeSpaces = ($raw -replace '[<>:"/\\|?*]', ' ') -replace '\s+', ' '
  $safeSpaces = $safeSpaces.Trim()
  return $safeSpaces
}

function Build-Stems([string]$raw) {
  $raw = [string]$raw
  $raw = $raw.Trim()
  if (-not $raw) { return @() }

  $safeSpaces = Sanitize-Stem $raw
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

function Has-AnyImageInRoot([System.Collections.Generic.HashSet[string]]$fileSet, [string]$productName) {
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

function Score-Match([string[]]$tokens, [int[]]$weights, [string]$candidateNorm) {
  if ($tokens.Count -eq 0) { return 0.0 }
  [double]$matched = 0
  [double]$total = 0
  for ($i = 0; $i -lt $tokens.Count; $i++) {
    $tok = $tokens[$i]
    $w = $weights[$i]
    $total += $w
    if ($candidateNorm.Contains($tok)) {
      $matched += $w
    }
  }
  if ($total -le 0) { return 0.0 }
  return $matched / $total
}

function Weights-ForTokens([string[]]$tokens) {
  $weights = New-Object 'System.Collections.Generic.List[int]'
  foreach ($t in $tokens) {
    if ($t -match '^[0-9]+$') {
      $weights.Add(3) | Out-Null
    } elseif ($t.Length -eq 1) {
      $weights.Add(2) | Out-Null
    } elseif ($t.Length -ge 4) {
      $weights.Add(2) | Out-Null
    } else {
      $weights.Add(1) | Out-Null
    }
  }
  return @($weights)
}

function Ensure-Dir([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$msPath = Join-Path $repoRoot 'src\data\materialSources.ts'
if (-not (Test-Path -LiteralPath $msPath)) {
  throw "materialSources.ts not found: $msPath"
}

$raw = Get-Content -LiteralPath $msPath -Raw -Encoding UTF8
$ids = [regex]::Matches($raw, '"id"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$jsonUrls = [regex]::Matches($raw, '"jsonUrl"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$photoDirs = [regex]::Matches($raw, '"photoDir"\s*:\s*"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }

if ($ids.Count -ne $jsonUrls.Count -or $ids.Count -ne $photoDirs.Count) {
  throw "Parse mismatch: ids=$($ids.Count) jsonUrls=$($jsonUrls.Count) photoDirs=$($photoDirs.Count)"
}

$publicRoot = Join-Path $repoRoot 'public'
$reportDir = Join-Path $repoRoot 'reports'
Ensure-Dir $reportDir
$reportPath = Join-Path $reportDir 'restore-local-product-photos.txt'

$extOk = @('.avif','.webp','.jpg','.jpeg','.png','.gif','.svg')

[int]$totalCreated = 0
[int]$totalSkipped = 0
[int]$totalUnmatched = 0
[int]$totalAlreadyOk = 0

$lines = New-Object 'System.Collections.Generic.List[string]'
$lines.Add("Restore started: $(Get-Date -Format s)")
$lines.Add('')

for ($i = 0; $i -lt $ids.Count; $i++) {
  $id = $ids[$i]
  $jsonUrl = $jsonUrls[$i]
  $photoDirUrl = $photoDirs[$i]

  $jsonPath = Join-Path $publicRoot ($jsonUrl.TrimStart('/') -replace '/', '\\')
  $photoPath = Join-Path $publicRoot ($photoDirUrl.TrimStart('/') -replace '/', '\\')

  if (-not (Test-Path -LiteralPath $jsonPath)) {
    $lines.Add("SKIP (missing JSON): $jsonUrl :: $id")
    continue
  }
  if (-not (Test-Path -LiteralPath $photoPath)) {
    $lines.Add("SKIP (missing photoDir): $photoDirUrl :: $id")
    continue
  }

  $rootFiles = @(Get-ChildItem -LiteralPath $photoPath -File -ErrorAction SilentlyContinue)
  $rootSet = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal)
  foreach ($f in $rootFiles) { [void]$rootSet.Add($f.Name) }

  $allImages = @(Get-ChildItem -LiteralPath $photoPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $e = $_.Extension.ToLowerInvariant()
    ($extOk -contains $e)
  })

  # Precompute normalized names for scoring.
  $norms = New-Object 'System.Collections.Generic.List[string]'
  foreach ($img in $allImages) {
    $base = [IO.Path]::GetFileNameWithoutExtension($img.Name)
    $norms.Add((Normalize-ForMatch $base)) | Out-Null
  }

  $jsonText = Get-Content -LiteralPath $jsonPath -Raw -Encoding UTF8
  $items = $null
  try { $items = $jsonText | ConvertFrom-Json } catch { $items = $null }
  if (-not $items) {
    $lines.Add("SKIP (bad/empty JSON): $jsonUrl :: $id")
    continue
  }

  [int]$created = 0
  [int]$skipped = 0
  [int]$unmatched = 0
  [int]$alreadyOk = 0

  foreach ($it in $items) {
    $name = [string]$it.name
    if (-not $name) { continue }

    if (Has-AnyImageInRoot $rootSet $name) {
      $alreadyOk++
      continue
    }

    $destStem = Sanitize-Stem $name
    if (-not $destStem) {
      $unmatched++
      continue
    }

    $tokensFull = @(Tokens $name)
    $tokensShort = @($tokensFull | Select-Object -First 6)
    $tokensNoBigNums = @($tokensFull | Where-Object { $_ -notmatch '^[0-9]{3,}$' })

    $weightsFull = Weights-ForTokens $tokensFull
    $weightsShort = Weights-ForTokens $tokensShort
    $weightsNoBigNums = Weights-ForTokens $tokensNoBigNums

    $subtitle = [string]$it.subtitle
    $subtitleTokens = @(Tokens $subtitle)
    $subtitleWeights = Weights-ForTokens $subtitleTokens

    [double]$bestScore = 0
    $bestIndex = -1

    for ($k = 0; $k -lt $allImages.Count; $k++) {
      $candNorm = $norms[$k]
      if (-not $candNorm) { continue }

      $score = 0.0
      if ($tokensFull.Count -gt 0) {
        $score = [Math]::Max($score, (Score-Match $tokensFull $weightsFull $candNorm))
      }
      if ($tokensNoBigNums.Count -gt 0) {
        $score = [Math]::Max($score, (Score-Match $tokensNoBigNums $weightsNoBigNums $candNorm))
      }
      if ($tokensShort.Count -gt 0) {
        $score = [Math]::Max($score, (Score-Match $tokensShort $weightsShort $candNorm))
      }
      if ($score -lt 0.01 -and $subtitleTokens.Count -gt 0) {
        $score = Score-Match $subtitleTokens $subtitleWeights $candNorm
        $score = $score * 0.85
      }

      if ($score -gt $bestScore) {
        $bestScore = $score
        $bestIndex = $k
      }
    }

    # Threshold: require a reasonably confident match.
    if ($bestIndex -lt 0 -or $bestScore -lt 0.55) {
      $unmatched++
      continue
    }

    $best = $allImages[$bestIndex]
    $destName = "$destStem$($best.Extension)"
    $destPath = Join-Path $photoPath $destName

    if (Test-Path -LiteralPath $destPath) {
      $skipped++
      continue
    }

    try {
      New-Item -ItemType HardLink -Path $destPath -Target $best.FullName -ErrorAction Stop | Out-Null
    } catch {
      Copy-Item -LiteralPath $best.FullName -Destination $destPath -Force
    }

    [void]$rootSet.Add($destName)
    $created++
  }

  $totalCreated += $created
  $totalSkipped += $skipped
  $totalUnmatched += $unmatched
  $totalAlreadyOk += $alreadyOk

  $lines.Add("[$id] created=$created skipped(existing)=$skipped alreadyOk=$alreadyOk unmatched=$unmatched :: $photoDirUrl")
}

$lines.Add('')
$lines.Add("Totals: created=$totalCreated skipped(existing)=$totalSkipped alreadyOk=$totalAlreadyOk unmatched=$totalUnmatched")
$lines.Add("Restore finished: $(Get-Date -Format s)")

Set-Content -LiteralPath $reportPath -Value $lines -Encoding UTF8

"OK. Restore report written to: $reportPath"
"Totals: created=$totalCreated skipped=$totalSkipped alreadyOk=$totalAlreadyOk unmatched=$totalUnmatched"
