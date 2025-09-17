import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return `${n}${(s as any)[(v - 20) % 10] || (s as any)[v] || s[0]}`
}

export function getIstEndMs(end?: string) {
  if (!end) return Date.now()
  try {
    const s = String(end).replace('T', ' ').trim()
    const m = s.match(/^(\d{4})[-\/]?(\d{2}|\d{1})[-\/]?(\d{2}|\d{1})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (m) {
      const y = Number(m[1])
      const mo = Number(m[2]) - 1
      const d = Number(m[3])
      const hh = Number(m[4])
      const mm = Number(m[5])
      const ss = m[6] ? Number(m[6]) : 0
      return Date.UTC(y, mo, d, hh - 5, mm - 30, ss)
    }
    return new Date(end).getTime()
  } catch {
    return new Date(end).getTime()
  }
}
