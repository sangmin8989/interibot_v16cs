"""
InteriBot 세부 내역서 생성 스크립트
ARGEN 2025 Standard 기준 상세 견적서 생성
"""

import pandas as pd
from typing import Dict, List, Optional


class InteriorDB:
    """
    Database containing Unit Prices and Specs based on ARGEN 2025 Standard.
    Prices are separated into (Material, Labor).
    """
    
    # 1. Indirect Cost Rates
    RATES = {
        "insurance": 0.0457,  # 산재/고용보험료: 노무비의 4.57%
        "overhead": 0.030,    # 공과잡비: 직접공사비의 3.00%
        "management": 0.050   # 현장관리/감리비: 직접공사비의 5.00%
    }
    
    # 2. Itemized Prices (Standard Grade Basis)
    # Format: "key": {"mat": material_cost, "lab": labor_cost, "spec": "description", "unit": "unit"}
    ITEMS = {
        # --- 철거 (Demolition) ---
        "demo_sink": {"mat": 0, "lab": 150000, "spec": "-", "unit": "식"},
        "demo_bath": {"mat": 0, "lab": 250000, "spec": "-", "unit": "식"},
        "demo_floor": {"mat": 0, "lab": 400000, "spec": "마루/장판 철거", "unit": "식"},
        "waste_2_5t": {"mat": 0, "lab": 550000, "spec": "2.5톤 트럭 반출", "unit": "대"},
        
        # --- 욕실 (Bath) ---
        "bath_waterproof_3rd": {"mat": 300000, "lab": 500000, "spec": "[필수] 아르젠 3차 책임방수", "unit": "식"},
        "bath_toilet": {"mat": 600000, "lab": 0, "spec": "이누스/대림 치마형", "unit": "개"},
        "bath_basin": {"mat": 300000, "lab": 0, "spec": "일체형 반다리", "unit": "개"},
        "bath_faucet": {"mat": 250000, "lab": 0, "spec": "무광 니켈(SUS304)", "unit": "식"},
        "bath_cabinet": {"mat": 180000, "lab": 0, "spec": "1200 슬라이드장", "unit": "개"},
        "bath_labor": {"mat": 0, "lab": 700000, "spec": "타일공 1.5품 + 설비 0.5품", "unit": "식"},
        
        # --- 타일 (Tile) ---
        "tile_wall": {"mat": 40000, "lab": 0, "spec": "300x600각 포세린/도기질", "unit": "m2"},
        "tile_sub": {"mat": 150000, "lab": 0, "spec": "접착제/줄눈/코너비드", "unit": "식"},
        "tile_labor_general": {"mat": 0, "lab": 400000, "spec": "주방/현관/발코니 시공(1품)", "unit": "식"},
        
        # --- 주방 (Kitchen) ---
        "kitchen_furniture": {"mat": 500000, "lab": 0, "spec": "E0 PET 무광 (m당)", "unit": "m"},
        "kitchen_countertop": {"mat": 300000, "lab": 0, "spec": "LG 하이막스 오로라 (m당)", "unit": "m"},
        
        # --- 전기 (Electric) ---
        "elec_basic": {"mat": 800000, "lab": 500000, "spec": "나노 스위치/콘센트/배선", "unit": "식"},
        "elec_induction": {"mat": 150000, "lab": 250000, "spec": "4sq 전용선/차단기", "unit": "식"},
        
        # --- 마감 (Finish) ---
        "finish_wallpaper": {"mat": 35000, "lab": 15000, "spec": "LG/신한 실크벽지", "unit": "m2"},
        "finish_floor": {"mat": 100000, "lab": 30000, "spec": "강마루 (철거별도)", "unit": "py"},
        "finish_film_paint": {"mat": 900000, "lab": 1000000, "spec": "문틀/샷시 필름+탄성코트", "unit": "식"},
    }


class EstimateCalculator:
    def __init__(self):
        self.rows: List[Dict] = []  # Stores detailed line items
    
    def add_row(self, process: str, item_key: str, qty: float, note: str = ""):
        """
        공정별 항목을 세부 내역에 추가
        
        Args:
            process: 공정명 (예: "철거", "욕실", "타일")
            item_key: InteriorDB.ITEMS의 키
            qty: 수량
            note: 비고
        """
        data = InteriorDB.ITEMS.get(item_key, {})
        if not data:
            print(f"⚠️ 경고: {item_key}를 찾을 수 없습니다.")
            return
        
        mat_cost = int(data['mat'] * qty)
        lab_cost = int(data['lab'] * qty)
        
        # 항목명을 읽기 쉽게 변환
        item_name = item_key.replace("_", " ").title()
        
        self.rows.append({
            "공정": process,
            "항목": item_name,
            "규격 및 상세 스펙": data['spec'],
            "단위": data['unit'],
            "수량": qty,
            "재료비": mat_cost,
            "노무비": lab_cost,
            "합계": mat_cost + lab_cost,
            "비고": note
        })
    
    def generate_24py_standard_estimate(self):
        """
        24평 아파트 올 리모델링 (ARGEN Standard) 상세 견적서 생성
        """
        # 1. 철거 (Demolition)
        self.add_row("철거", "demo_sink", 1, "싱크대 철거")
        self.add_row("철거", "demo_bath", 1, "욕실 철거")
        self.add_row("철거", "demo_floor", 1, "마루/장판")
        self.add_row("철거", "waste_2_5t", 1.5, "폐기물 반출")
        
        # 2. 욕실 (Bath - Includes 3rd Waterproofing)
        self.add_row("욕실", "bath_waterproof_3rd", 1, "누수보증")
        self.add_row("욕실", "bath_toilet", 1, "변기")
        self.add_row("욕실", "bath_basin", 1, "세면대")
        self.add_row("욕실", "bath_faucet", 1, "수전")
        self.add_row("욕실", "bath_cabinet", 1, "욕실장")
        self.add_row("욕실", "bath_labor", 1, "시공 인건비")
        
        # 3. 타일 (Tile)
        self.add_row("타일", "tile_wall", 34, "욕실+주방 벽면")  # Bath + Kitchen walls
        self.add_row("타일", "tile_sub", 1, "부자재")
        self.add_row("타일", "tile_labor_general", 1, "타일공 시공")
        
        # 4. 주방 (Kitchen)
        self.add_row("주방", "kitchen_furniture", 3, "상하부장")
        self.add_row("주방", "kitchen_countertop", 3, "상판")
        
        # 5. 전기 (Electric)
        self.add_row("전기", "elec_basic", 1, "기본 배선")
        self.add_row("전기", "elec_induction", 1, "인덕션 전용선")
        
        # 6. 마감 (Finish)
        self.add_row("마감", "finish_wallpaper", 60, "도배")  # Approx m2 for 24py
        self.add_row("마감", "finish_floor", 18, "마루")     # Approx py for 24py
        self.add_row("마감", "finish_film_paint", 1, "필름+도장")
        
        # Create DataFrame
        df = pd.DataFrame(self.rows)
        
        # Calculate Indirect Costs
        total_mat = df['재료비'].sum()
        total_lab = df['노무비'].sum()
        total_direct = total_mat + total_lab
        
        insurance = int(total_lab * InteriorDB.RATES['insurance'])
        overhead = int(total_direct * InteriorDB.RATES['overhead'])
        management = int(total_direct * InteriorDB.RATES['management'])
        total_indirect = insurance + overhead + management
        
        # Output Generation
        print("\n" + "="*80)
        print("## 🏗️ 24평 아파트 올 리모델링 (ARGEN Standard) 상세 견적서")
        print("="*80 + "\n")
        
        # 세부 내역 테이블 출력
        print(df.to_markdown(index=False, floatfmt=",.0f"))
        
        print("\n" + "-"*80)
        print("### 💰 간접비 및 총계")
        print("-"*80)
        print(f"- 직접공사비 소계: {total_direct:,.0f} 원")
        print(f"  - 재료비: {total_mat:,.0f} 원")
        print(f"  - 노무비: {total_lab:,.0f} 원")
        print(f"- 산재/고용보험료 (노무비의 4.57%): {insurance:,.0f} 원")
        print(f"- 공과잡비 (직접공사비의 3%): {overhead:,.0f} 원")
        print(f"- 현장관리/감리비 (직접공사비의 5%): {management:,.0f} 원")
        print(f"- 간접비 합계: {total_indirect:,.0f} 원")
        print(f"\n**🏆 최종 합계 (VAT 별도): {total_direct + total_indirect:,.0f} 원**")
        print("="*80 + "\n")


def main():
    """메인 실행 함수"""
    calc = EstimateCalculator()
    calc.generate_24py_standard_estimate()


if __name__ == "__main__":
    main()

