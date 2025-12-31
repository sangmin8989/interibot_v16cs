# Supabase CLI 빠른 시작 가이드

## 🚀 3단계로 시작하기

---

## Step 1: Supabase CLI 설치

**PowerShell에서 이 명령어를 실행하세요:**

```powershell
npm install -g supabase
```

**설치 확인:**
```powershell
supabase --version
```

버전 번호가 나오면 성공! ✅

---

## Step 2: Supabase 로그인

### 2-1. Access Token 발급

1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인
3. 우측 상단 프로필 아이콘 클릭 → **"Account Settings"**
4. 왼쪽 메뉴 **"Access Tokens"** 클릭
5. **"Generate new token"** 클릭
6. 이름 입력: `interibot-cli`
7. **"Generate token"** 클릭
8. **토큰 복사** (중요! 한 번만 보여줌)

### 2-2. CLI 로그인

**PowerShell에서:**
```powershell
supabase login
```

프롬프트가 나오면 복사한 토큰을 붙여넣고 Enter

**성공 메시지:**
```
✅ Logged in as: your-email@example.com
```

---

## Step 3: 프로젝트 연결

### 3-1. 프로젝트 ID 확인

1. Supabase Dashboard에서 인테리봇 프로젝트 선택
2. 왼쪽 메뉴 **"Settings"** (톱니바퀴) 클릭
3. **"General"** 탭
4. **"Reference ID"** 복사 (예: `abcdefghijklmnop`)

### 3-2. 프로젝트 연결

**PowerShell에서:**
```powershell
cd c:\interibot
supabase link --project-ref YOUR_PROJECT_REF_ID
```

`YOUR_PROJECT_REF_ID`를 위에서 복사한 Reference ID로 교체하세요.

**성공 메시지:**
```
✅ Linked to project: abcdefghijklmnop
```

---

## ✅ 완료!

이제 다음 명령어들을 사용할 수 있습니다:

```powershell
# 프로젝트 상태 확인
supabase status

# SQL 파일 실행
supabase db push

# 원격 데이터베이스에서 스키마 가져오기
supabase db pull
```

---

## 🆘 문제 해결

### `supabase: command not found`
→ PowerShell 재시작 후 다시 시도

### `You are not logged in`
→ `supabase login` 다시 실행

### `Project not found`
→ 프로젝트 ID 다시 확인하고 `supabase link` 재실행




