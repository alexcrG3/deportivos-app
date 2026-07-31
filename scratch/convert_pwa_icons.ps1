Add-Type -AssemblyName System.Drawing

$sourceIcon = "d:\AntigravitDev\Athletix OS\logos nexus sport\nexus sport favicon.ico"
$publicDir = "d:\AntigravitDev\Athletix OS\public"

function Resize-Img($src, $dest, $w, $h) {
    $img = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

Resize-Img $sourceIcon "$publicDir\favicon.png" 64 64
Resize-Img $sourceIcon "$publicDir\apple-touch-icon.png" 180 180
Resize-Img $sourceIcon "$publicDir\pwa-192x192.png" 192 192
Resize-Img $sourceIcon "$publicDir\pwa-512x512.png" 512 512

Write-Host "PWA icons created successfully!"
