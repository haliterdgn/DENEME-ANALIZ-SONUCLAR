import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Öğrenci numarasındaki başlangıç sıfırları kaldır
export function formatOgrenciNo(ogrenciNo: string | number | null | undefined): string {
  if (!ogrenciNo || ogrenciNo === null || ogrenciNo === undefined || ogrenciNo === '') {
    return ''  // null/undefined/empty ise hiçbir şey yazma
  }
  
  const noStr = ogrenciNo.toString().trim()
  if (!noStr || noStr === '0' || noStr === '00' || noStr === '000') {
    return ''  // Sadece sıfırlardan oluşuyorsa hiçbir şey yazma
  }
  
  const formatted = noStr.replace(/^0+/, '')
  
  // Eğer tüm karakterler sıfırsa boş string döndür
  return formatted || ''
}
