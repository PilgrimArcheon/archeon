# Run from the root of archeon-nextjs, after backing up your work.
# Removes only the retired developer browser-extension assets.
$paths = @(
  "browser-extension",
  "public/downloads/tackboard-chrome-developer.zip",
  "public/downloads/tackboard-firefox-developer.zip",
  "src/app/app/tackboard/ExtensionInstallClient.tsx",
  "src/app/app/tackboard/extension-install.module.css"
)
foreach ($p in $paths) {
  if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Recurse -Force; Write-Host "Removed $p" }
}
Write-Host 'The existing Neon pairing endpoint is retained for TackBoard Desktop.'
