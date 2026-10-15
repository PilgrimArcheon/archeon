$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$steps = @('npm ci', 'npm run verify:release', 'npm run preflight', 'npm run typecheck', 'npm run build', 'npm run verify:invoice-receipts', 'npm run verify:invoice-gmail')
foreach ($step in $steps) {
  Write-Host "`n> $step" -ForegroundColor Cyan
  cmd /c $step
  if ($LASTEXITCODE -ne 0) { throw "Failed: $step (exit $LASTEXITCODE)" }
}
Write-Host 'Archeon web checks passed. Deploy only after reviewing the release guide.' -ForegroundColor Green
