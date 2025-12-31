# Deprecated API 교체 가이드

> **작성일**: 2025-12-31  
> **목적**: Node.js deprecated API를 WHATWG URL API로 교체

---

## 📋 개요

Node.js의 `url.parse()`는 deprecated되었으며, WHATWG URL API를 사용해야 합니다.

---

## ⚠️ 빌드 경고

```
(node:892) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized 
and prone to errors that have security implications. Use the WHATWG URL API instead.
```

---

## 🔄 교체 방법

### Before: url.parse()

```typescript
import * as url from 'url'

const parsed = url.parse('https://example.com/path?query=value')
console.log(parsed.hostname) // 'example.com'
console.log(parsed.pathname) // '/path'
console.log(parsed.query) // 'query=value'
```

### After: WHATWG URL API

```typescript
const parsed = new URL('https://example.com/path?query=value')
console.log(parsed.hostname) // 'example.com'
console.log(parsed.pathname) // '/path'
console.log(parsed.searchParams.get('query')) // 'value'
```

---

## 📝 주요 변경사항

### 1. URL 파싱

**Before:**
```typescript
import * as url from 'url'
const parsed = url.parse('https://example.com')
```

**After:**
```typescript
const parsed = new URL('https://example.com')
```

---

### 2. 쿼리 파라미터

**Before:**
```typescript
const parsed = url.parse('https://example.com?key=value', true)
const query = parsed.query // { key: 'value' }
```

**After:**
```typescript
const parsed = new URL('https://example.com?key=value')
const query = parsed.searchParams.get('key') // 'value'
// 또는
const params = Object.fromEntries(parsed.searchParams) // { key: 'value' }
```

---

### 3. 상대 URL 해석

**Before:**
```typescript
const resolved = url.resolve('https://example.com/path', '../other')
```

**After:**
```typescript
const base = new URL('https://example.com/path')
const resolved = new URL('../other', base).href
```

---

### 4. URL 포맷팅

**Before:**
```typescript
const formatted = url.format({
  protocol: 'https',
  hostname: 'example.com',
  pathname: '/path',
})
```

**After:**
```typescript
const url = new URL('/path', 'https://example.com')
const formatted = url.href
```

---

## 🔍 현재 상태

현재 코드베이스에서 `url.parse()` 직접 사용은 발견되지 않았습니다.

경고가 발생하는 경우:
1. **의존성 패키지**에서 발생할 수 있음
2. **동적 import**로 사용될 수 있음
3. **빌드 타임**에만 나타날 수 있음

---

## ✅ 확인 방법

### 1. 코드 검색

```bash
# 직접 사용 검색
grep -r "url\.parse" --include="*.ts" --include="*.tsx" --include="*.js"

# require 검색
grep -r "require.*url" --include="*.ts" --include="*.tsx" --include="*.js"

# import 검색
grep -r "from.*url" --include="*.ts" --include="*.tsx"
```

### 2. 의존성 확인

```bash
npm list | grep url
```

### 3. 빌드 로그 확인

```bash
npm run build 2>&1 | grep -i "deprecation\|url.parse"
```

---

## 🛠️ 대응 방법

### 의존성에서 발생하는 경우

1. **의존성 업데이트**
   ```bash
   npm update <package-name>
   ```

2. **대체 패키지 사용**
   - deprecated API를 사용하는 패키지가 있다면 대체 패키지 검토

3. **패치 적용**
   - `patch-package`를 사용하여 의존성 패치

---

## 📚 참고 자료

- [Node.js URL API 문서](https://nodejs.org/api/url.html#url_the_whatwg_url_api)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)

---

## ✅ 체크리스트

- [ ] 코드베이스에서 `url.parse()` 직접 사용 확인
- [ ] 의존성에서 deprecated API 사용 확인
- [ ] 발견된 경우 WHATWG URL API로 교체
- [ ] 빌드 경고 제거 확인

---

**작성 완료** ✅
