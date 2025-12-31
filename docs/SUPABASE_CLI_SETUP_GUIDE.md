# Supabase CLI 설정 가이드

## 🎯 목표
Supabase CLI를 설치하고 설정하여, 터미널에서 Supabase 명령어를 실행할 수 있게 합니다.

---

## 📋 Step 1: Supabase CLI 설치

### 방법 1: npm으로 설치 (권장)

PowerShell에서 다음 명령어 실행:

```powershell
npm install -g supabase
```

**설치 확인:**
```powershell
supabase --version
```

성공하면 버전 번호가 표시됩니다 (예: `1.123.0`)

---

## 📋 Step 2: Supabase에 로그인

### 2-1. Supabase Access Token 발급

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 로그인

2. **Access Token 발급**
   - 우측 상단 프로필 아이콘 클릭
   - **"Account Settings"** 클릭
   - 왼쪽 메뉴에서 **"Access Tokens"** 클릭
   - **"Generate new token"** 클릭
   - 이름 입력: `interibot-cli` (아무거나 가능)
   - **"Generate token"** 클릭
   - **토큰 복사** (한 번만 보여줌! 복사해두세요)

### 2-2. CLI로 로그인

PowerShell에서:

```powershell
supabase login
```

프롬프트가 나오면:
1. 위에서 복사한 **Access Token** 붙여넣기
2. Enter 키 누르기

**성공 메시지:**
```
✅ Logged in as: your-email@example.com
```

---

## 📋 Step 3: 프로젝트 초기화 (선택사항)

### 로컬 개발 환경 설정 (선택)

로컬에서 Supabase를 실행하려면:

```powershell
# 프로젝트 루트에서 실행
cd c:\interibot
supabase init
```

이 명령어는:
- `supabase/` 폴더 생성
- `config.toml` 파일 생성
- 로컬 개발 환경 설정

**⚠️ 주의:** 이미 Supabase 클라우드를 사용 중이면 이 단계는 건너뛰어도 됩니다.

---

## 📋 Step 4: 프로젝트 연결

### 4-1. Supabase 프로젝트 ID 확인

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 인테리봇 프로젝트 선택

2. **프로젝트 설정 열기**
   - 왼쪽 메뉴 → **"Settings"** (톱니바퀴 아이콘)
   - **"General"** 탭
   - **"Reference ID"** 복사 (예: `abcdefghijklmnop`)

### 4-2. 프로젝트 연결

PowerShell에서:

```powershell
# 프로젝트 루트에서 실행
cd c:\interibot
supabase link --project-ref YOUR_PROJECT_REF_ID
```

`YOUR_PROJECT_REF_ID`를 위에서 복사한 Reference ID로 교체하세요.

**성공 메시지:**
```
✅ Linked to project: abcdefghijklmnop
```

---

## 📋 Step 5: 사용 가능한 명령어 확인

이제 다음 명령어들을 사용할 수 있습니다:

### 데이터베이스 관련

```powershell
# SQL 파일 실행
supabase db push

# 마이그레이션 생성
supabase migration new migration_name

# 원격 데이터베이스 상태 확인
supabase db remote commit
```

### 함수 관련

```powershell
# 함수 목록 확인
supabase functions list

# 함수 배포
supabase functions deploy function_name
```

### 프로젝트 상태 확인

```powershell
# 연결된 프로젝트 정보 확인
supabase projects list

# 현재 프로젝트 상태 확인
supabase status
```

---

## 🚀 실제 사용 예시

### 예시 1: SQL 파일을 Supabase에 적용

```powershell
# 1. SQL 파일을 supabase/migrations 폴더에 넣기
# 2. 마이그레이션 적용
supabase db push
```

### 예시 2: 원격 데이터베이스에서 스키마 가져오기

```powershell
# 원격 데이터베이스의 현재 상태를 로컬로 가져오기
supabase db pull
```

### 예시 3: SQL 쿼리 직접 실행

```powershell
# SQL 파일 실행
supabase db execute --file docs/supabase-schema-required-tables.sql
```

---

## ⚠️ 주의사항

1. **Access Token 보안**
   - Access Token은 절대 공개하지 마세요
   - `.gitignore`에 추가되어 있는지 확인

2. **프로젝트 ID**
   - 프로젝트 ID는 공개되어도 괜찮지만, 보안을 위해 공유하지 않는 것이 좋습니다

3. **환경 변수**
   - `.env.local` 파일에 이미 Supabase URL과 Key가 설정되어 있으면
   - CLI는 별도로 연결 설정이 필요합니다

---

## 🐛 문제 해결

### 문제 1: `supabase: command not found`

**원인:** Supabase CLI가 설치되지 않음

**해결:**
```powershell
npm install -g supabase
```

설치 후 PowerShell을 재시작하세요.

---

### 문제 2: `You are not logged in`

**원인:** 로그인하지 않음

**해결:**
```powershell
supabase login
```

Access Token을 입력하세요.

---

### 문제 3: `Project not found`

**원인:** 잘못된 프로젝트 ID 또는 권한 없음

**해결:**
1. Supabase Dashboard에서 프로젝트 ID 다시 확인
2. 해당 프로젝트에 접근 권한이 있는지 확인
3. `supabase link` 명령어 다시 실행

---

## ✅ 완료 확인

다음 명령어로 모든 설정이 완료되었는지 확인:

```powershell
# 1. CLI 버전 확인
supabase --version

# 2. 로그인 상태 확인
supabase projects list

# 3. 연결된 프로젝트 확인
supabase status
```

모든 명령어가 성공하면 설정 완료! 🎉

---

## 📚 참고 자료

- [Supabase CLI 공식 문서](https://supabase.com/docs/reference/cli/introduction)
- [Supabase CLI GitHub](https://github.com/supabase/cli)




