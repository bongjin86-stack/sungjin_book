# sungjin 프로젝트 환경 — 새 PC 한 줄 셋업
#
# 사용법 (새 PC에서 PowerShell):
#   iwr -useb https://raw.githubusercontent.com/bongjin86-stack/sungjin_book/main/bootstrap.ps1 | iex
#
# 사전 조건 (이 셋 처음 한 번만 직접 설치):
#   1. Git for Windows         https://git-scm.com/
#   2. GitHub CLI (gh) + 로그인  https://cli.github.com/  (설치 후 `gh auth login`)
#   3. Claude Code             https://claude.ai/code
#
# 이 스크립트가 자동으로:
#   - C:\projects 폴더 생성
#   - sungjin_book + sungjin_wla 레포 clone (있으면 pull)
#   - 두 프로젝트 시작메뉴 단축키 등록 ("Claude (sungjin_book)", "Claude (sungjin_wla)")
#   - Typst 설치 + PATH 등록 (sungjin_book 컴파일용)

$ErrorActionPreference = 'Stop'

Write-Host "=== sungjin 프로젝트 환경 셋업 ===" -ForegroundColor Cyan
Write-Host ""

# --- 0. 사전 조건 확인 ---
$missing = @()
foreach ($cmd in @("git", "gh")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    $missing += $cmd
  }
}
if ($missing.Count -gt 0) {
  Write-Host "ERROR: 다음 도구 설치 필요: $($missing -join ', ')" -ForegroundColor Red
  Write-Host "  - git: https://git-scm.com/" -ForegroundColor Red
  Write-Host "  - gh:  https://cli.github.com/  (설치 후 'gh auth login')" -ForegroundColor Red
  return
}

# gh 인증 상태 확인
$ghStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: GitHub CLI 인증 필요. 먼저 'gh auth login' 실행." -ForegroundColor Red
  return
}

# --- 1. C:\projects 폴더 ---
$projects = "C:\projects"
New-Item -ItemType Directory -Force -Path $projects | Out-Null
Write-Host "OK 폴더: $projects" -ForegroundColor Green

# --- 2. 두 레포 clone (또는 pull) ---
$repos = @("sungjin_book", "sungjin_wla")
foreach ($r in $repos) {
  $path = "$projects\$r"
  if (Test-Path "$path\.git") {
    Write-Host "-> [$r] 이미 있음, pull..." -ForegroundColor Yellow
    Push-Location $path
    git pull
    Pop-Location
  } else {
    Write-Host "-> [$r] clone..." -ForegroundColor Yellow
    git clone "https://github.com/bongjin86-stack/$r.git" $path
  }
}

# --- 3. 시작메뉴 단축키 등록 ---
foreach ($r in $repos) {
  $script = "$projects\$r\create-shortcut.ps1"
  if (Test-Path $script) {
    Write-Host "-> [$r] 시작메뉴 단축키..." -ForegroundColor Yellow
    & $script
  }
}

# --- 4. Typst 설치 (sungjin_book PDF 컴파일용) ---
$typstExe = "$env:USERPROFILE\bin\typst\typst.exe"
if (-not (Test-Path $typstExe)) {
  Write-Host "-> Typst 설치..." -ForegroundColor Yellow
  $dest = Split-Path $typstExe -Parent
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $tmp = "$env:TEMP\typst.zip"
  $api = "https://api.github.com/repos/typst/typst/releases/latest"
  $rel = Invoke-RestMethod -Uri $api -Headers @{"User-Agent"="ps"}
  $asset = $rel.assets | Where-Object { $_.name -match "x86_64-pc-windows-msvc.zip$" } | Select-Object -First 1
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmp -UseBasicParsing
  $extract = "$env:TEMP\typst-extract"
  if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
  Expand-Archive -Path $tmp -DestinationPath $extract -Force
  $exe = Get-ChildItem -Recurse -Path $extract -Filter "typst.exe" | Select-Object -First 1
  Copy-Item -Path $exe.FullName -Destination $typstExe -Force
  Write-Host "   OK $typstExe ($($rel.tag_name))" -ForegroundColor Green
} else {
  $ver = & $typstExe --version
  Write-Host "-> Typst 이미 있음: $ver" -ForegroundColor Yellow
}

# --- 5. PATH 등록 ---
$current = [Environment]::GetEnvironmentVariable("PATH", "User")
$add = "$env:USERPROFILE\bin\typst"
if ($current -notlike "*$add*") {
  [Environment]::SetEnvironmentVariable("PATH", "$current;$add", "User")
  Write-Host "-> PATH에 추가: $add" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 셋업 완료 ===" -ForegroundColor Cyan
Write-Host "윈도우키 -> 'claude' 검색 -> 'Claude (sungjin_book)' 또는 'Claude (sungjin_wla)' 실행"
Write-Host "또는 각 폴더의 cc.bat 더블클릭"
