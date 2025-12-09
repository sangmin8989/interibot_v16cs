'use client'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-argen-800 mb-8 text-center">
          개인정보 처리방침
        </h1>

        <div className="space-y-8 text-gray-700">
          {/* 서문 */}
          <section>
            <p className="leading-relaxed">
              아르젠 스튜디오(이하 "회사")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 
              이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </section>

          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제1조 (개인정보의 처리 목적)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
                 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              
              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">1. 서비스 제공</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>맞춤형 인테리어 견적 산출</li>
                  <li>사용자 성향 분석 및 추천</li>
                  <li>견적 결과 저장 및 조회</li>
                  <li>고객 상담 및 문의 응대</li>
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">2. 서비스 개선</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>서비스 이용 통계 분석</li>
                  <li>AI 알고리즘 개선</li>
                  <li>신규 서비스 개발</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제2조 (처리하는 개인정보 항목)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
              
              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">1. 필수 항목</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>공간 정보: 평수, 주거 형태, 지역, 방 개수, 욕실 개수</li>
                  <li>선택 영역: 리모델링 희망 공간</li>
                  <li>성향 정보: 요리 빈도, 정리정돈 성향, 청소 성향, 조명 취향, 예산 감각</li>
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">2. 선택 항목 (바이브 모드)</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>MBTI 유형</li>
                  <li>혈액형</li>
                  <li>별자리</li>
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">3. 자동 수집 항목</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>서비스 이용 기록</li>
                  <li>접속 로그</li>
                  <li>쿠키</li>
                  <li>접속 IP 정보</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제3조 (개인정보의 처리 및 보유 기간)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 
                 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              
              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>서비스 이용 정보: 서비스 이용 종료 시까지 (단, 브라우저 세션 종료 시 자동 삭제)</li>
                  <li>견적 결과: 생성 후 30일간 보관 (sessionStorage 기반)</li>
                  <li>접속 로그: 3개월</li>
                </ul>
              </div>

              <p className="mt-4">② 다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지 보유합니다.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우: 해당 수사·조사 종료 시까지</li>
                <li>서비스 이용에 따른 채권·채무관계 잔존 시: 해당 채권·채무관계 정산 시까지</li>
              </ul>
            </div>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제4조 (개인정보의 제3자 제공)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 원칙적으로 이용자의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 
                 이용자의 사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.</p>
              <p>② 다만, 다음의 경우에는 예외로 합니다.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </div>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제5조 (개인정보 처리의 위탁)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-800 mb-2">위탁받는 자: Vercel Inc.</p>
                <p className="text-sm">위탁하는 업무의 내용: 서비스 호스팅 및 데이터 저장</p>
              </div>

              <p className="mt-4">② 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 
                 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 
                 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
            </div>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
              <ul className="list-decimal list-inside space-y-1 ml-4">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
              <p className="mt-4">② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며 
                 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
            </div>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제7조 (개인정보의 파기)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
                 지체 없이 해당 개인정보를 파기합니다.</p>
              <p>② 개인정보 파기의 절차 및 방법은 다음과 같습니다.</p>
              
              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">1. 파기절차</h3>
                <p className="ml-4">회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 
                   개인정보를 파기합니다.</p>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-gray-800 mb-2">2. 파기방법</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>전자적 파일 형태: 복구 및 재생되지 않도록 안전하게 삭제</li>
                  <li>기록물, 인쇄물, 서면 등: 분쇄하거나 소각</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제8조 (개인정보의 안전성 확보조치)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
                <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 
                   고유식별정보 등의 암호화, 보안프로그램 설치</li>
                <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
              </ul>
            </div>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제9조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 
                 '쿠키(cookie)'를 사용합니다.</p>
              <p>② 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 
                 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.</p>
              <p>③ 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹브라우저에서 
                 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 
                 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>
            </div>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제10조 (개인정보 보호책임자)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 
                 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              
              <div className="mt-4 p-6 bg-argen-50 rounded-lg border-2 border-argen-200">
                <h3 className="font-bold text-argen-800 mb-4">▶ 개인정보 보호책임자</h3>
                <ul className="space-y-2">
                  <li><span className="font-semibold">성명:</span> 아르젠 스튜디오 대표</li>
                  <li><span className="font-semibold">연락처:</span> 031-8043-7966</li>
                  <li><span className="font-semibold">이메일:</span> busup@naver.com</li>
                  <li><span className="font-semibold">주소:</span> 경기도 수원시 권선로 681 지하1층</li>
                </ul>
              </div>

              <p className="mt-4">② 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 
                 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 
                 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.</p>
            </div>
          </section>

          {/* 제11조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제11조 (개인정보 열람청구)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>정보주체는 「개인정보 보호법」 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다. 
                 회사는 정보주체의 개인정보 열람청구가 신속하게 처리되도록 노력하겠습니다.</p>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-800 mb-2">▶ 개인정보 열람청구 접수·처리 부서</p>
                <ul className="space-y-1 text-sm">
                  <li>부서명: 아르젠 스튜디오 고객지원팀</li>
                  <li>연락처: 031-8043-7966</li>
                  <li>이메일: busup@naver.com</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 제12조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제12조 (권익침해 구제방법)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 
                 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
              
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-bold text-blue-900 mb-2">▶ 개인정보분쟁조정위원회</p>
                  <ul className="text-sm space-y-1">
                    <li>전화: (국번없이) 1833-6972</li>
                    <li>홈페이지: www.kopico.go.kr</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-bold text-green-900 mb-2">▶ 개인정보침해신고센터 (한국인터넷진흥원 운영)</p>
                  <ul className="text-sm space-y-1">
                    <li>전화: (국번없이) 118</li>
                    <li>홈페이지: privacy.kisa.or.kr</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="font-bold text-purple-900 mb-2">▶ 대검찰청 사이버범죄수사단</p>
                  <ul className="text-sm space-y-1">
                    <li>전화: 02-3480-3573</li>
                    <li>홈페이지: www.spo.go.kr</li>
                  </ul>
                </div>

                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="font-bold text-pink-900 mb-2">▶ 경찰청 사이버안전국</p>
                  <ul className="text-sm space-y-1">
                    <li>전화: (국번없이) 182</li>
                    <li>홈페이지: cyberbureau.police.go.kr</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 제13조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제13조 (개인정보 처리방침 변경)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 이 개인정보 처리방침은 2025년 1월 1일부터 적용됩니다.</p>
              <p>② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.</p>
              <p className="ml-4 text-sm text-gray-600">- 해당사항 없음 (최초 제정)</p>
            </div>
          </section>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-12 flex justify-center gap-4">
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
          >
            닫기
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-argen-500 text-white rounded-xl hover:bg-argen-600 transition-all font-semibold"
          >
            홈으로
          </a>
        </div>
      </div>
    </main>
  )
}











