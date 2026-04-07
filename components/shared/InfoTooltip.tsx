'use client'

import { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  text: string
  className?: string
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#64748B] hover:border-[#94A3B8] bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-all focus:outline-none shrink-0"
        aria-label="More information"
      >
        <Info className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 pointer-events-none">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 shadow-xl">
            <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1E293B] border-r border-b border-[#334155] rotate-45 -mt-1" />
        </div>
      )}
    </div>
  )
}
