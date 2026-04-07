'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number         // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  label?: string
  sublabel?: string
  className?: string
  animate?: boolean
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#6366F1',
  trackColor = '#1E293B',
  label,
  sublabel,
  className,
  animate = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value))
  const offset = circumference - (progress / 100) * circumference

  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate && inView ? offset : circumference}
          style={{
            transition: animate ? 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
          }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-lg font-bold text-[#F8FAFC] tabular-nums leading-none">{label}</span>}
        {sublabel && <span className="text-[10px] text-[#64748B] mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}

// ─── Animated counter number ───────────────────────────────────────────────────

interface AnimatedNumberProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
}

export function AnimatedNumber({ value, className, prefix, suffix, decimals = 0, duration = 1.5 }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView) {
      motionValue.set(value)
    }
  }, [inView, value, motionValue])

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix ?? ''}${v.toFixed(decimals)}${suffix ?? ''}`
      }
    })
    return unsubscribe
  }, [spring, prefix, suffix, decimals])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix ?? ''}{(0).toFixed(decimals)}{suffix ?? ''}
    </span>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number     // 0-100
  color?: string
  trackColor?: string
  height?: number
  className?: string
  animate?: boolean
  rounded?: boolean
  showLabel?: boolean
}

export function ProgressBar({
  value,
  color = '#6366F1',
  trackColor = '#1E293B',
  height = 6,
  className,
  animate = true,
  rounded = true,
  showLabel = false,
}: ProgressBarProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const progress = Math.min(100, Math.max(0, value))

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div
        className={cn(rounded && 'rounded-full overflow-hidden')}
        style={{ height, backgroundColor: trackColor }}
      >
        <div
          className={cn(rounded && 'rounded-full')}
          style={{
            height: '100%',
            backgroundColor: color,
            width: animate && inView ? `${progress}%` : '0%',
            transition: animate ? 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#94A3B8] mt-1 block tabular-nums">
          {progress.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
