'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  text: string
  className?: string
}

export function InfoTooltip({ text, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function updateCoords() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setCoords({
      top: rect.top + window.scrollY - 8,   // above the button
      left: rect.left + window.scrollX + rect.width / 2,
    })
  }

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => { updateCoords(); setOpen((v) => !v) }}
        onMouseEnter={() => { updateCoords(); setOpen(true) }}
        onMouseLeave={() => setOpen(false)}
        className="flex items-center justify-center w-[18px] h-[18px] rounded-full border border-[#64748B] hover:border-[#94A3B8] bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-all focus:outline-none shrink-0"
        aria-label="More information"
      >
        <Info className="w-3 h-3" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={ref}
          style={{ top: coords.top, left: coords.left }}
          className="fixed z-[9999] w-56 -translate-x-1/2 -translate-y-full pointer-events-none"
        >
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-3 shadow-2xl mb-2">
            <p className="text-xs text-[#CBD5E1] leading-relaxed">{text}</p>
          </div>
          {/* Arrow */}
          <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F172A] border-r border-b border-[#334155] rotate-45" />
        </div>,
        document.body
      )}
    </div>
  )
}
