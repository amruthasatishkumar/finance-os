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
        className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
        aria-label="More information"
      >
        <Info className="w-full h-full" />
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
