const REQUIRED_ENV_VARS = ['OPENAI_API_KEY']

const missingEnv = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  throw new Error(
    `[환경 변수 누락] 다음 값이 필요합니다: ${missingEnv.join(
      ', '
    )}. docs/env.template 파일을 참고해 .env.local 을 설정하세요.`
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig



