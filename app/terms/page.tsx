'use client'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-argen-50/30 to-roseSoft/40 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-argen-800 mb-8 text-center">
          이용약관
        </h1>

        <div className="space-y-8 text-gray-700">
          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제1조 (목적)</h2>
            <p className="leading-relaxed">
              본 약관은 아르젠 스튜디오(이하 "회사")가 제공하는 인테리봇 서비스(이하 "서비스")의 이용과 관련하여 
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제2조 (용어의 정의)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>"서비스"란 회사가 제공하는 인테리어 견적 및 분석 서비스를 의미합니다.</li>
                <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
                <li>"견적"이란 이용자가 입력한 정보를 바탕으로 AI가 산출한 예상 리모델링 비용을 의미합니다.</li>
                <li>"분석 결과"란 이용자의 성향 및 공간 정보를 분석하여 제공하는 맞춤형 추천 정보를 의미합니다.</li>
              </ul>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
              <p>② 회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며, 
                 변경된 약관은 제1항과 같은 방법으로 공지함으로써 효력이 발생합니다.</p>
              <p>③ 이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.</p>
            </div>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제4조 (서비스의 제공)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 다음과 같은 서비스를 제공합니다.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI 기반 인테리어 리모델링 견적 산출 서비스</li>
                <li>사용자 성향 분석 및 맞춤형 추천 서비스</li>
                <li>4등급(Basic, Standard, ARGEN, Premium) 견적 비교 서비스</li>
                <li>공정별 세부 내역 제공 서비스</li>
              </ul>
              <p>② 회사는 서비스의 품질 향상을 위해 서비스의 내용을 변경할 수 있으며, 
                 변경 사항은 서비스 화면에 공지합니다.</p>
            </div>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제5조 (서비스의 중단)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 다음 각 호에 해당하는 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>시스템 점검, 보수, 교체 등이 필요한 경우</li>
                <li>천재지변, 국가비상사태 등 불가항력적 사유가 발생한 경우</li>
                <li>서비스 제공을 위한 설비의 장애 또는 이용량의 폭주 등으로 정상적인 서비스 제공이 어려운 경우</li>
              </ul>
              <p>② 회사는 제1항의 사유로 서비스 제공이 중단될 경우, 사전에 이를 공지합니다. 
                 다만, 불가피한 사유가 있는 경우 사후에 공지할 수 있습니다.</p>
            </div>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제6조 (견적의 정확성)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 본 서비스에서 제공하는 견적은 AI 알고리즘을 기반으로 산출된 예상 금액이며, 
                 실제 시공 견적과 차이가 있을 수 있습니다.</p>
              <p>② 제공된 견적은 표준 시공 기준이며, 현장 상황(구조, 접근성, 층수 등)에 따라 
                 실제 견적은 ±5~10% 범위에서 변동될 수 있습니다.</p>
              <p>③ 정확한 견적은 현장 방문 상담을 통해 확인하실 수 있습니다.</p>
            </div>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제7조 (이용자의 의무)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 이용자는 서비스 이용 시 정확한 정보를 입력해야 합니다.</p>
              <p>② 이용자는 다음 행위를 하여서는 안 됩니다.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>허위 정보를 입력하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>다른 이용자의 개인정보를 수집, 저장, 공개하는 행위</li>
                <li>회사의 지적재산권을 침해하는 행위</li>
              </ul>
            </div>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제8조 (개인정보 보호)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 이용자의 개인정보를 보호하기 위해 개인정보 처리방침을 수립하고 이를 준수합니다.</p>
              <p>② 개인정보 처리방침에 대한 자세한 내용은 별도의 개인정보 처리방침 페이지에서 확인할 수 있습니다.</p>
            </div>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제9조 (면책사항)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 
                 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</p>
              <p>② 회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 
                 서비스를 통해 얻은 자료로 인한 손해에 대해 책임을 지지 않습니다.</p>
              <p>③ 회사는 이용자가 입력한 정보의 정확성, 신뢰성에 대해 책임을 지지 않습니다.</p>
            </div>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-xl font-bold text-argen-700 mb-4">제10조 (분쟁 해결)</h2>
            <div className="space-y-2 leading-relaxed">
              <p>① 회사와 이용자 간 발생한 분쟁에 대해서는 대한민국 법을 적용합니다.</p>
              <p>② 서비스 이용으로 발생한 분쟁에 대한 소송은 회사의 본사 소재지를 관할하는 법원을 전속 관할로 합니다.</p>
            </div>
          </section>

          {/* 부칙 */}
          <section className="pt-8 border-t-2 border-gray-200">
            <h2 className="text-xl font-bold text-argen-700 mb-4">부칙</h2>
            <p className="leading-relaxed">
              본 약관은 2025년 1월 1일부터 시행됩니다.
            </p>
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











