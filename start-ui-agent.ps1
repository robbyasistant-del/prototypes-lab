$root = 'C:\Users\robby\.openclaw\workspace'
$venv = Join-Path $root '.venv-ui\Scripts\python.exe'
$loop = Join-Path $root 'ui_agent_loop.py'
$pidFile = Join-Path $root 'outputs\ui\ui-agent.pid'
$logDir = Join-Path $root 'outputs\ui'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

if (Test-Path $pidFile) {
  $old = (Get-Content -Path $pidFile -Raw).Trim()
  if ($old) {
    $p = Get-Process -Id ([int]$old) -ErrorAction SilentlyContinue
    if ($p) {
      Write-Output "UI agent already running with PID $old"
      exit 0
    }
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$proc = Start-Process -FilePath $venv -ArgumentList $loop -WindowStyle Hidden -PassThru
$proc.Id | Set-Content -Path $pidFile -Encoding ascii
Write-Output "UI agent started. PID $($proc.Id)"
