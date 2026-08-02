Add-Type -AssemblyName System.Drawing
$imgPath = "C:\Users\AlexG3\.gemini\antigravity\brain\5954e57e-eb78-44b4-9900-3ef0f3dc96f5\nexussport_hd_app_icon_1785639720205.jpg"
$src = [System.Drawing.Bitmap]::FromFile($imgPath)

function Resize-Img($bmp, [int]$w, [int]$h, [string]$dest) {
    $b = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($b)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($bmp, 0, 0, $w, $h)
    $b.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $b.Dispose()
}

Resize-Img $src 512 512 "d:\AntigravitDev\Athletix OS\public\pwa-512x512.png"
Resize-Img $src 192 192 "d:\AntigravitDev\Athletix OS\public\pwa-192x192.png"
Resize-Img $src 180 180 "d:\AntigravitDev\Athletix OS\public\apple-touch-icon.png"
Resize-Img $src 64 64 "d:\AntigravitDev\Athletix OS\public\favicon.png"
$src.Dispose()
Write-Host "HD Icons generated successfully!"
