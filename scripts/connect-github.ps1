# GitHub 연결 스크립트
# 사용법: PowerShell에서 실행
# .\scripts\connect-github.ps1

Write-Host "`n=== GitHub 연결 스크립트 ===" -ForegroundColor Cyan
Write-Host ""

# GitHub 저장소 URL 입력 받기
$githubUrl = Read-Host "GitHub 저장소 URL을 입력하세요 (예: https://github.com/계정명/interibot.git)"

if ([string]::IsNullOrWhiteSpace($githubUrl)) {
    Write-Host "`n❌ URL이 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/3] 원격 저장소 연결 중..." -ForegroundColor Yellow

# 기존 원격 저장소가 있으면 제거
git remote remove origin 2>$null

# 새 원격 저장소 추가
git remote add origin $githubUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ 원격 저장소 연결 완료" -ForegroundColor Green
} else {
    Write-Host "  ❌ 원격 저장소 연결 실패" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] 원격 저장소 확인 중..." -ForegroundColor Yellow
git remote -v

Write-Host "`n[3/3] GitHub에 업로드 중..." -ForegroundColor Yellow
Write-Host "  (처음 업로드이므로 시간이 걸릴 수 있습니다...)" -ForegroundColor Gray

git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ GitHub 연결 및 업로드 완료!" -ForegroundColor Green
    Write-Host "`n저장소 주소: $githubUrl" -ForegroundColor Cyan
    Write-Host "`n이제 매일 작업 후 다음 명령어로 백업하세요:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m '작업 내용'" -ForegroundColor White
    Write-Host "  git push" -ForegroundColor White
} else {
    Write-Host "`n❌ GitHub 업로드 실패" -ForegroundColor Red
    Write-Host "`n가능한 원인:" -ForegroundColor Yellow
    Write-Host "  1. GitHub 인증이 필요할 수 있습니다" -ForegroundColor White
    Write-Host "  2. 저장소 URL이 올바른지 확인하세요" -ForegroundColor White
    Write-Host "  3. 인터넷 연결을 확인하세요" -ForegroundColor White
    Write-Host "`nGitHub 인증 방법:" -ForegroundColor Yellow
    Write-Host "  - Personal Access Token 사용 (권장)" -ForegroundColor White
    Write-Host "  - GitHub Desktop 앱 사용" -ForegroundColor White
}

Write-Host "`n"
