'use client'

import Hero from '@/components/Hero'
import FeaturesSection from '@/components/landing/FeaturesSection'
import TrustSection from '@/components/landing/TrustSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-argen-50">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. AI 기능 소개 섹션 */}
      <FeaturesSection />

      {/* 3. 신뢰/CTA 섹션 */}
      <TrustSection />

      {/* 5. Contact Us 섹션 */}
      <section className="bg-gradient-to-br from-argen-50 via-white to-purple-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-argen-800 mb-4">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600">
              아르젠 스튜디오가 함께합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Office */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-argen-100 hover:border-argen-400">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-argen-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🏢</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-argen-800 mb-3">Office</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    경기도 화성시 동탄첨단산업 1로 58 2층
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">본사 · 사무실</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Studio */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-argen-100 hover:border-argen-400">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎨</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-argen-800 mb-3">Studio</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    경기도 수원시 권선로 681 지하1층
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">쇼룸 · 전시장</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 연락처 */}
          <div className="bg-gradient-to-r from-argen-600 via-purple-600 to-argen-700 rounded-2xl p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-4xl">📞</span>
                </div>
                <div className="text-white">
                  <p className="text-sm opacity-90 mb-1">전화 문의</p>
                  <p className="text-3xl md:text-4xl font-bold tracking-wider">
                    031-8043-7966
                  </p>
                </div>
              </div>
              <a
                href="tel:03180437966"
                className="px-8 py-4 bg-white text-argen-700 rounded-xl hover:bg-argen-50 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                전화 걸기
              </a>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-argen-100">
              <div className="text-3xl mb-3">⏰</div>
              <h4 className="font-bold text-argen-800 mb-2">운영 시간</h4>
              <p className="text-gray-600 text-sm">
                평일 10:00 - 20:00<br />
                주말 10:00 - 19:00
              </p>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-argen-100">
              <div className="text-3xl mb-3">📧</div>
              <h4 className="font-bold text-argen-800 mb-2">이메일</h4>
              <a 
                href="mailto:busup@naver.com"
                className="text-argen-600 hover:text-argen-700 text-sm font-medium"
              >
                busup@naver.com
              </a>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-argen-100">
              <div className="text-3xl mb-3">🌐</div>
              <h4 className="font-bold text-argen-800 mb-2">웹사이트</h4>
              <a 
                href="https://www.argen-studio.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-argen-600 hover:text-argen-700 text-sm font-medium"
              >
                argen-studio.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-argen-800 text-white py-12 border-t border-argen-700">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* 회사 정보 */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Argen InteriBot</h3>
              <p className="text-argen-300 text-base">
                AI 기반 인테리어 컨설팅 플랫폼
              </p>
            </div>

            {/* 링크 */}
            <div>
              <h4 className="font-semibold mb-4 text-white text-base">링크</h4>
              <ul className="space-y-3 text-base text-argen-300">
                <li>
                  <a 
                    href="/terms" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block py-1"
                  >
                    이용약관
                  </a>
                </li>
                <li>
                  <a 
                    href="/privacy" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block py-1"
                  >
                    개인정보 처리방침
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.argen-studio.com/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-block py-1"
                  >
                    문의하기
                  </a>
                </li>
              </ul>
            </div>

            {/* SNS */}
            <div>
              <h4 className="font-semibold mb-4 text-white text-base">소셜 미디어</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center hover:bg-argen-500 transition-colors"
                  aria-label="Facebook"
                >
                  <span className="text-xl">📘</span>
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center hover:bg-argen-500 transition-colors"
                  aria-label="Instagram"
                >
                  <span className="text-xl">📷</span>
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center hover:bg-argen-500 transition-colors"
                  aria-label="YouTube"
                >
                  <span className="text-xl">📺</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-argen-700 pt-8 text-center text-sm md:text-base text-argen-300">
            <p>© 2024 Argen Studio · Argen InteriBot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
