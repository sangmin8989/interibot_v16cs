'use client'

'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, Check } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { ProcessGroup, SpaceId, ProcessCategory } from '@/types/spaceProcess'

interface SpaceAccordionProps {
  spaceId: SpaceId
  spaceName: string
  spaceIcon: string
  processGroups: ProcessGroup[]
  selections: Record<ProcessCategory, string | string[] | null>
  onSelectionChange: (category: ProcessCategory, value: string | string[] | null) => void
  defaultOpen?: boolean
}

export default function SpaceAccordion({
  spaceId,
  spaceName,
  spaceIcon,
  processGroups,
  selections,
  onSelectionChange,
  defaultOpen = false,
}: SpaceAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // defaultOpen이 변경되면 상태 업데이트
  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true)
    }
  }, [defaultOpen])

  const handleSingleSelect = (category: ProcessCategory, optionId: string) => {
    const currentValue = selections[category]
    if (currentValue === optionId) {
      // 이미 선택된 경우 해제
      onSelectionChange(category, null)
    } else {
      onSelectionChange(category, optionId)
    }
  }

  const handleMultipleSelect = (category: ProcessCategory, optionId: string) => {
    const currentValue = selections[category]
    const currentArray = Array.isArray(currentValue) ? currentValue : []
    
    if (currentArray.includes(optionId)) {
      // 이미 선택된 경우 제거
      const newArray = currentArray.filter(id => id !== optionId)
      onSelectionChange(category, newArray.length > 0 ? newArray : null)
    } else {
      // 추가
      onSelectionChange(category, [...currentArray, optionId])
    }
  }

  const getSelectedCount = (): number => {
    let count = 0
    Object.values(selections).forEach(value => {
      if (value !== null) {
        if (Array.isArray(value)) {
          count += value.length
        } else {
          count += 1
        }
      }
    })
    return count
  }

  return (
    <Accordion.Root 
      type="single" 
      collapsible 
      className="w-full"
      value={isOpen ? spaceId : undefined}
      onValueChange={(value) => setIsOpen(value === spaceId)}
    >
      <Accordion.Item value={spaceId} className="mb-4">
        <Accordion.Header>
          <Accordion.Trigger className="w-full flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-argen-300 transition-all duration-200 text-left group">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{spaceIcon}</span>
              <div>
                <div className="font-bold text-lg text-gray-900">{spaceName}</div>
                {getSelectedCount() > 0 && (
                  <div className="text-sm text-argen-500 font-medium">
                    {getSelectedCount()}개 공정 선택됨
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Accordion.Trigger>
        </Accordion.Header>
        
        <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <div className="p-4 bg-gray-50 rounded-b-xl border-x-2 border-b-2 border-gray-200">
            <div className="space-y-6">
              {processGroups.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  이 공간에 적용 가능한 공정이 없습니다.
                </div>
              ) : (
                processGroups.map((group) => {
                  console.log(`🎯 Rendering process group: ${group.name} (${group.category}) for ${spaceName}`)
                  const currentValue = selections[group.category]
                  const isSelected = (optionId: string) => {
                    if (group.type === 'multiple') {
                      return Array.isArray(currentValue) && currentValue.includes(optionId)
                    } else {
                      return currentValue === optionId
                    }
                  }

                  return (
                    <div key={group.category} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-900">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        )}
                      </div>

                      <div className={group.type === 'multiple' ? 'space-y-2' : 'grid grid-cols-2 md:grid-cols-3 gap-2'}>
                        {group.options.map((option) => {
                          const selected = isSelected(option.id)
                          
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                if (group.type === 'multiple') {
                                  handleMultipleSelect(group.category, option.id)
                                } else {
                                  handleSingleSelect(group.category, option.id)
                                }
                              }}
                              className={`
                                relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                                ${selected
                                  ? 'border-argen-500 bg-argen-500 text-white shadow-md'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-argen-300 hover:bg-argen-50'
                                }
                                ${group.type === 'multiple' ? 'w-full' : ''}
                              `}
                            >
                              {selected && (
                                <div className="absolute top-2 right-2">
                                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                </div>
                              )}
                              <div className={`font-medium ${selected ? 'text-white' : 'text-gray-900'}`}>
                                {option.name}
                              </div>
                              {option.description && (
                                <div className={`text-xs mt-1 ${selected ? 'text-argen-100' : 'text-gray-600'}`}>
                                  {option.description}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
