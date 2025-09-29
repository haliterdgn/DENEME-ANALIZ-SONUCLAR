'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import StudentAnalysis from '@/components/admin/student-analysis'

export default function StudentAnalysisPage() {
  const searchParams = useSearchParams()
  const [examId, setExamId] = useState<string>('')

  useEffect(() => {
    const urlExamId = searchParams.get('examId')
    if (urlExamId) {
      setExamId(urlExamId)
    }
  }, [searchParams])

  if (!examId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Öğrenci Bazlı Analiz</h1>
          <p className="text-muted-foreground">Lütfen analiz edilecek sınavı seçin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Öğrenci Bazlı Analiz</h1>
        <p className="text-muted-foreground">Öğrencilerin sınav performansını detaylı analiz edin</p>
      </div>
      
      <StudentAnalysis examId={examId} />
    </div>
  )
}
