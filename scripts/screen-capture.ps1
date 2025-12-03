# PowerShell Screen Capture Script
param(
    [int]$X = 0,
    [int]$Y = 0,
    [int]$Width = 1920,
    [int]$Height = 1080,
    [string]$OutputPath = "capture.png"
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Get screen bounds
$Screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

# Create bitmap
$Bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
$Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)

# Capture screen region
$Graphics.CopyFromScreen($X, $Y, 0, 0, [System.Drawing.Size]::new($Width, $Height))

# Save as PNG
$Bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$Graphics.Dispose()
$Bitmap.Dispose()

Write-Output "Screen captured: $OutputPath"