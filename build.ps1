param(
  [switch]$Force,
  [int]$From = 0,
  [int]$To = 4512,
  [string]$Out = 'out\the-hidden-zero.mp4',
  [int]$Crf = 19,
  [switch]$NoEncode
)
$ErrorActionPreference = 'Stop'
$FF = 'F:\deepseek harness\tools\ffmpeg\bin\ffmpeg.exe'
$root = 'F:\deepseek harness\vibe-zero'
Set-Location $root
$t0 = Get-Date
Write-Host "[1/3] rendering frames $From..$To" -ForegroundColor Cyan
$args2 = @('render.mjs','--frames',"--from=$From","--to=$To")
if ($Force) { $args2 += '--force' }
& node @args2
if ($LASTEXITCODE -ne 0) { throw 'render failed' }
$n = (Get-ChildItem 'frames\*.jpg').Count
Write-Host "      frames on disk: $n"
if ($n -lt $To) { throw "missing frames: $n < $To" }
if ($NoEncode) { Write-Host 'skip encode'; exit 0 }
Write-Host '[2/3] encoding' -ForegroundColor Cyan
$enc = @(
  '-y','-hide_banner','-v','warning','-stats',
  '-framerate','30','-i','frames\f%05d.jpg',
  '-i','audio\bed_150.wav',
  '-c:v','libx264','-crf',"$Crf",'-preset','medium','-pix_fmt','yuv420p',
  '-profile:v','high','-movflags','+faststart',
  '-c:a','aac','-b:a','320k','-shortest',
  $Out
)
& $FF @enc
if ($LASTEXITCODE -ne 0) { throw 'encode failed' }
Write-Host '[3/3] verifying' -ForegroundColor Cyan
& 'F:\deepseek harness\tools\ffmpeg\bin\ffprobe.exe' -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of json $Out
$mb = [math]::Round((Get-Item $Out).Length / 1MB, 1)
$secs = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
Write-Host "DONE  $Out  $mb MB  $secs s" -ForegroundColor Green
