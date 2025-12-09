'use client';

import * as React from 'react';
import type { LineItem } from '@/lib/estimate/types';

interface EstimateTableProps {
  items: LineItem[];
  title?: string;
}

export function EstimateTable({ items, title }: EstimateTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="border rounded-lg p-4 text-sm text-gray-500">
        견적 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      {title && (
        <h3 className="text-base font-semibold mb-3">
          {title}
        </h3>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-2 py-2 text-left">공정</th>
              <th className="px-2 py-2 text-left">항목</th>
              <th className="px-2 py-2 text-left">브랜드</th>
              <th className="px-2 py-2 text-left">규격/스펙</th>
              <th className="px-2 py-2 text-right">단위</th>
              <th className="px-2 py-2 text-right">수량</th>
              <th className="px-2 py-2 text-right">재료비</th>
              <th className="px-2 py-2 text-right">노무비</th>
              <th className="px-2 py-2 text-right">합계</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="px-2 py-1 align-top whitespace-nowrap">
                  {row.공정}
                </td>
                <td className="px-2 py-1 align-top whitespace-nowrap">
                  {row.항목}
                </td>
                <td className="px-2 py-1 align-top whitespace-nowrap text-gray-700">
                  {row.브랜드 ?? '-'}
                </td>
                <td className="px-2 py-1 align-top">
                  {row.규격}
                </td>
                <td className="px-2 py-1 align-top text-right whitespace-nowrap">
                  {row.단위}
                </td>
                <td className="px-2 py-1 align-top text-right">
                  {row.수량.toLocaleString()}
                </td>
                <td className="px-2 py-1 align-top text-right">
                  {row.재료비.toLocaleString()}
                </td>
                <td className="px-2 py-1 align-top text-right">
                  {row.노무비.toLocaleString()}
                </td>
                <td className="px-2 py-1 align-top text-right font-semibold">
                  {row.합계.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

