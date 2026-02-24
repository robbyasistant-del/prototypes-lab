$root = 'C:\Users\robby\.openclaw\workspace'
$pidFile = Join-Path $root 'outputs\ui\ui-agent.pid'
if (-not (Test-Path $pidFile)) {
  Write-Output 'UI agent not running (no pid file).'
  exit 0
}
$pidVal = (Get-Content -Path $pidFile -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($pidVal)) {
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  Write-Output 'Empty pid file removed.'
  exit 0
}
try {
  Stop-Process -Id ([int]$pidVal) -Force -ErrorAction Stop
  Write-Output ("UI agent stopped. PID $pidVal")
} catch {
  Write-Output ("Process $pidVal was not running or could not be terminated.")
}
Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
