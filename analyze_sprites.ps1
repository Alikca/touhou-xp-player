Add-Type -AssemblyName System.Drawing
$imagePath = (Resolve-Path "reimu_sprites.png").Path
$bmp = New-Object System.Drawing.Bitmap($imagePath)
$w = $bmp.Width
$h = $bmp.Height

# Get background color at top-left pixel (0,0)
$bgColor = $bmp.GetPixel(0, 0)
$bgR = $bgColor.R
$bgG = $bgColor.G
$bgB = $bgColor.B

Write-Host "Image size: $w x $h"
Write-Host "Background color: R=$bgR, G=$bgG, B=$bgB"

# Helper to check if pixel is background (with tolerance)
function IsBg($x, $y) {
    $pixel = $bmp.GetPixel($x, $y)
    $diff = [Math]::Abs($pixel.R - $bgR) + [Math]::Abs($pixel.G - $bgG) + [Math]::Abs($pixel.B - $bgB)
    return $diff -lt 25
}

# 1. Project rows
$rowHasContent = New-Object bool[] $h
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        if (-not (IsBg $x $y)) {
            $rowHasContent[$y] = $true
            break
        }
    }
}

# Group rows
$rows = New-Object System.Collections.Generic.List[PSCustomObject]
$inRow = $false
$startY = 0
for ($y = 0; $y -lt $h; $y++) {
    $hasContent = $rowHasContent[$y]
    if ($hasContent -and -not $inRow) {
        $startY = $y
        $inRow = $true
    } elseif (-not $hasContent -and $inRow) {
        $rows.Add([PSCustomObject]@{ startY = $startY; endY = $y - 1 })
        $inRow = $false
    }
}
if ($inRow) {
    $rows.Add([PSCustomObject]@{ startY = $startY; endY = $h - 1 })
}

Write-Host "Detected $($rows.Count) rows of sprites."

# 2. Project columns in each row
$sprites = New-Object System.Collections.Generic.List[PSCustomObject]
$rowIndex = 0
foreach ($row in $rows) {
    $colHasContent = New-Object bool[] $w
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = $row.startY; $y -le $row.endY; $y++) {
            if (-not (IsBg $x $y)) {
                $colHasContent[$x] = $true
                break
            }
        }
    }

    $inCol = $false
    $startX = 0
    $colsInRow = New-Object System.Collections.Generic.List[PSCustomObject]
    for ($x = 0; $x -lt $w; $x++) {
        $hasContent = $colHasContent[$x]
        if ($hasContent -and -not $inCol) {
            $startX = $x
            $inCol = $true
        } elseif (-not $hasContent -and $inCol) {
            $colsInRow.Add([PSCustomObject]@{ startX = $startX; endX = $x - 1 })
            $inCol = $false
        }
    }
    if ($inCol) {
        $colsInRow.Add([PSCustomObject]@{ startX = $startX; endX = $w - 1 })
    }

    $colIndex = 0
    foreach ($col in $colsInRow) {
        $minX = $col.startX; $maxX = $col.endX
        $minY = $row.startY; $maxY = $row.endY

        # Trim top
        while ($minY -le $maxY) {
            $empty = $true
            for ($x = $minX; $x -le $maxX; $x++) {
                if (-not (IsBg $x $minY)) { $empty = $false; break; }
            }
            if ($empty) { $minY++ } else { break; }
        }
        # Trim bottom
        while ($maxY -ge $minY) {
            $empty = $true
            for ($x = $minX; $x -le $maxX; $x++) {
                if (-not (IsBg $x $maxY)) { $empty = $false; break; }
            }
            if ($empty) { $maxY-- } else { break; }
        }
        # Trim left
        while ($minX -le $maxX) {
            $empty = $true
            for ($y = $minY; $y -le $maxY; $y++) {
                if (-not (IsBg $minX $y)) { $empty = $false; break; }
            }
            if ($empty) { $minX++ } else { break; }
        }
        # Trim right
        while ($maxX -ge $minX) {
            $empty = $true
            for ($y = $minY; $y -le $maxY; $y++) {
                if (-not (IsBg $maxX $y)) { $empty = $false; break; }
            }
            if ($empty) { $maxX-- } else { break; }
        }

        if ($maxX -ge $minX -and $maxY -ge $minY) {
            $sprites.Add([PSCustomObject]@{
                index = $sprites.Count
                row = $rowIndex
                col = $colIndex
                x = $minX
                y = $minY
                w = ($maxX - $minX) + 1
                h = ($maxY - $minY) + 1
            })
            $colIndex++
        }
    }
    $rowIndex++
}

# Clean resources
$bmp.Dispose()

$spritesJson = $sprites | ConvertTo-Json -Compress
$spritesJson | Out-File -FilePath "sprites_coords.json" -Encoding utf8
Write-Host "Analysis complete. Detected $($sprites.Count) sprites. Saved to sprites_coords.json"
