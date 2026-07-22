$ErrorActionPreference = 'Stop'

$serenaPort = 9121
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$existingListener = Get-NetTCPConnection -State Listen -LocalPort $serenaPort -ErrorAction SilentlyContinue

if ($existingListener) {
  Write-Output "Serena singleton already listening at http://127.0.0.1:$serenaPort/mcp"
  exit 0
}

$uvx = Get-Command uvx -ErrorAction SilentlyContinue
if (-not $uvx) {
  throw 'uvx was not found. Install uv first.'
}

$arguments = @(
  '-p', '3.13',
  '--from', 'serena-agent',
  'serena', 'start-mcp-server',
  '--transport', 'streamable-http',
  '--host', '127.0.0.1',
  '--port', $serenaPort.ToString(),
  '--project', $projectPath,
  '--context=codex',
  '--open-web-dashboard', 'False'
)

Start-Process `
  -FilePath $uvx.Source `
  -ArgumentList $arguments `
  -WorkingDirectory $projectPath `
  -WindowStyle Hidden | Out-Null

for ($attempt = 0; $attempt -lt 60; $attempt++) {
  Start-Sleep -Seconds 1
  $listener = Get-NetTCPConnection -State Listen -LocalPort $serenaPort -ErrorAction SilentlyContinue
  if ($listener) {
    Write-Output "Serena singleton started at http://127.0.0.1:$serenaPort/mcp"
    exit 0
  }
}

throw "Serena did not start on port $serenaPort."
