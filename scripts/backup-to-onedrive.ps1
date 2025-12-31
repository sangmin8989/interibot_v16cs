# 원드라이브 백업 스크립트
# 사용법: PowerShell에서 .\scripts\backup-to-onedrive.ps1 실행

$sourceDir = "c:\interibot"
$backupDir = "$env:USERPROFILE\OneDrive\interibot-backup"

# 백업 폴더 생성
Write-Host "`n=== 인테리봇 원드라이브 백업 시작 ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 중요 파일 복사
Write-Host "`n[1/5] 환경 변수 파일 백업 중..." -ForegroundColor Yellow
Copy-Item "$sourceDir\.env.local" "$backupDir\" -Force -ErrorAction SilentlyContinue
Copy-Item "$sourceDir\.env" "$backupDir\" -Force -ErrorAction SilentlyContinue

if (Test-Path "$backupDir\.env.local") {
    Write-Host "  ✓ .env.local 백업 완료" -ForegroundColor Green
} else {
    Write-Host "  ⚠ .env.local 파일이 없습니다 (정상일 수 있음)" -ForegroundColor Yellow
}

Write-Host "`n[2/5] 패키지 설정 파일 백업 중..." -ForegroundColor Yellow
Copy-Item "$sourceDir\package.json" "$backupDir\" -Force
Copy-Item "$sourceDir\package-lock.json" "$backupDir\" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ package.json 백업 완료" -ForegroundColor Green

Write-Host "`n[3/5] 데이터베이스 스키마 백업 중..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$backupDir\prisma" -Force | Out-Null
Copy-Item "$sourceDir\prisma\schema.prisma" "$backupDir\prisma\" -Force -ErrorAction SilentlyContinue
if (Test-Path "$backupDir\prisma\schema.prisma") {
    Write-Host "  ✓ schema.prisma 백업 완료" -ForegroundColor Green
} else {
    Write-Host "  ⚠ schema.prisma 파일이 없습니다" -ForegroundColor Yellow
}

Write-Host "`n[4/5] 문서 폴더 백업 중..." -ForegroundColor Yellow
Copy-Item "$sourceDir\docs" "$backupDir\docs" -Recurse -Force
Write-Host "  ✓ docs 폴더 백업 완료" -ForegroundColor Green

# 백업 완료 시간 기록
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$backupInfo = @"
인테리봇 백업 로그
==================
마지막 백업 시간: $timestamp
백업 위치: $backupDir

백업된 파일:
- .env.local (환경 변수)
- .env (환경 변수)
- package.json (의존성)
- prisma/schema.prisma (DB 스키마)
- docs/ (문서 폴더)

다음 백업 예정: 매주 금요일 권장
"@

$backupInfo | Out-File "$backupDir\backup-log.txt" -Encoding UTF8

Write-Host "`n[5/5] 백업 로그 생성 완료" -ForegroundColor Yellow

# 백업 결과 요약
Write-Host "`n=== 백업 완료! ===" -ForegroundColor Green
Write-Host "백업 시간: $timestamp" -ForegroundColor Cyan
Write-Host "백업 위치: $backupDir" -ForegroundColor Cyan
Write-Host "`n백업된 파일 목록:" -ForegroundColor Yellow
Get-ChildItem -Path $backupDir -File | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}
Write-Host "`n다음 단계: 원드라이브 동기화 확인" -ForegroundColor Yellow
Write-Host "`n"
