# 자동 백업 스크립트 (Git + 원드라이브)
# 사용법: PowerShell에서 .\scripts\auto-backup.ps1 실행
# 또는 작업 스케줄러에 등록하여 매일 자동 실행

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   인테리봇 자동 백업 시작" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

cd c:\interibot

# 1. Git 백업
Write-Host "[1/2] Git 백업 시작..." -ForegroundColor Yellow
Write-Host "변경사항 확인 중..." -ForegroundColor Gray

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "변경된 파일 발견! 커밋합니다..." -ForegroundColor Yellow
    
    git add .
    $commitMessage = "자동 백업: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Git 커밋 완료" -ForegroundColor Green
        
        # GitHub에 푸시
        Write-Host "GitHub에 업로드 중..." -ForegroundColor Gray
        git push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ GitHub 업로드 완료" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ GitHub 업로드 실패 (인터넷 연결 확인 필요)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠ Git 커밋 실패" -ForegroundColor Red
    }
} else {
    Write-Host "  ℹ 변경된 파일이 없습니다" -ForegroundColor Gray
}

Write-Host "`n[2/2] 원드라이브 백업 시작..." -ForegroundColor Yellow

# 원드라이브 백업 스크립트 실행
$backupScript = "c:\interibot\scripts\backup-to-onedrive.ps1"
if (Test-Path $backupScript) {
    & $backupScript
} else {
    Write-Host "  ⚠ 원드라이브 백업 스크립트를 찾을 수 없습니다" -ForegroundColor Red
    Write-Host "  경로: $backupScript" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   자동 백업 완료!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
