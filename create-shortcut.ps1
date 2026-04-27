$projectRoot = $PSScriptRoot
$wtPath = Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\wt.exe'
$startMenu = [Environment]::GetFolderPath('Programs')
$shortcutPath = Join-Path $startMenu 'Claude (sungjin_book).lnk'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $wtPath
$shortcut.Arguments = "-d `"$projectRoot`" cmd /k claude --dangerously-skip-permissions"
$shortcut.WorkingDirectory = $projectRoot
$shortcut.IconLocation = "$wtPath,0"
$shortcut.Save()
Write-Host "Created: $shortcutPath"
Write-Host "  -> Target: $wtPath"
Write-Host "  -> Args:   $($shortcut.Arguments)"
