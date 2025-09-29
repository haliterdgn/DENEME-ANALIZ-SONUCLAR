'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { AlertCircle, CheckCircle, XCircle, Users, FileText, TrendingUp, TrendingDown, Award, Target, User, BookOpen, Clock, Home, Search, Filter, Download } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useExamStore } from '@/lib/stores/exam-store'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface StudentAnalysisProps {
  examId?: string
  studentId?: string
}

interface StudentAnalysisData {
  message: string
  examInfo: {
    examId: string
    examName: string
    optikFormId: string
    optikFormName: string
  }
  studentInfo: {
    tcKimlikNo: string
    ogrenciAdi: string
    ogrenciNo: string
    cinsiyet: string
    kt: string
    sinif: string
    sube: string
    telefon: string
  }
  studentPerformance: {
    totalScore: number
    totalCorrect: number
    totalWrong: number
    totalEmpty: number
    totalQuestions: number
    subjectScores: Array<{
      subjectName: string
      correct: number
      wrong: number
      empty: number
      score: number
      answers: Array<{
        questionNumber: number
        studentAnswer: string
        correctAnswer: string
        isCorrect: boolean
        isEmpty: boolean
        topic: string
      }>
    }>
    detailedAnswers: Array<{
      questionNumber: number
      studentAnswer: string
      correctAnswer: string
      isCorrect: boolean
      isEmpty: boolean
      topic: string
    }>
  }
  classComparison: {
    classAverage: number
    studentRank: number
    totalStudents: number
    studentPercentile: number
  }
  subjectComparison: Array<{
    subjectName: string
    studentScore: number
    classAverage: number
    difference: number
    performance: string
  }>
}

const StudentAnalysis = ({ examId, studentId }: StudentAnalysisProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedExam } = useExamStore()
  const [analysisData, setAnalysisData] = useState<StudentAnalysisData | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('all')

  // Get active exam ID (either from props or store)
  const activeExamId = examId || selectedExam?.id

  // Filtering logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === 'all' || selectedClass === '' || `${student.class}/${student.section}` === selectedClass
    return matchesSearch && matchesClass
  })

  // Get unique classes
  const availableClasses = [...new Set(students.map(student => `${student.class}/${student.section}`))]
    .filter(cls => cls !== '/')
    .sort()

  // Load students list
  useEffect(() => {
    if (activeExamId) {
      loadStudents()
    }
  }, [activeExamId])

  // Load analysis when student selected
  useEffect(() => {
    if (activeExamId && (studentId || selectedStudent)) {
      loadStudentAnalysis()
    }
  }, [activeExamId, studentId, selectedStudent])

  // Reset student selection if filtered out
  useEffect(() => {
    if (selectedStudent) {
      const isStudentVisible = filteredStudents.some(student => student.id === selectedStudent)
      if (!isStudentVisible) {
        setSelectedStudent('')
        setAnalysisData(null)
      }
    }
  }, [filteredStudents, selectedStudent])

  const loadStudents = async () => {
    if (!activeExamId) return

    try {
      console.log('👥 Loading ALL students for exam:', activeExamId)
      
      // API client will now automatically handle pagination to get all results
      const results = await apiClient.getStudentResults(activeExamId)
      
      if (results && Array.isArray(results)) {
        const studentList = results.map((result: any) => ({
          id: result.id || result._id,
          name: result.studentInfo?.ogrenciAdi || 'Bilinmeyen Öğrenci',
          studentNo: result.studentInfo?.ogrenciNo || '',
          class: result.studentInfo?.sinif || '',
          section: result.studentInfo?.sube || ''
        }))
        
        setStudents(studentList)
        console.log('✅ Students loaded:', studentList.length, 'students total')
        console.log('📋 Sample students:', studentList.slice(0, 5).map(s => s.name))
        
        // Only auto-select if studentId prop provided and valid
        if (studentId) {
          const studentExists = studentList.find(s => s.id === studentId)
          if (studentExists) {
            setSelectedStudent(studentId)
            console.log('✅ Valid studentId found, auto-selecting:', studentId)
          } else {
            console.warn('⚠️ Invalid studentId provided:', studentId)
            console.log('📋 Available student IDs:', studentList.slice(0, 5).map(s => s.id))
            // Don't auto-select, let user choose
            setSelectedStudent('')
          }
        }
        // Don't auto-select first student, let user choose
      } else {
        console.error('❌ No results or invalid results format:', results)
        setError(`Öğrenci verisi bulunamadı. API yanıtı: ${JSON.stringify(results)}`)
      }
    } catch (error) {
      console.error('❌ Error loading students:', error)
      setError('Öğrenci listesi yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    }
  }

  const loadStudentAnalysis = async () => {
    const activeStudentId = studentId || selectedStudent
    if (!activeExamId || !activeStudentId) return

    setLoading(true)
    setError(null)

    try {
      console.log('📊 Loading student analysis:', { examId: activeExamId, studentId: activeStudentId })
      
      // Call student analysis API
      const analysis = await apiClient.getStudentAnalysis(activeExamId, activeStudentId)
      
      console.log('✅ Student analysis loaded:', analysis)
      setAnalysisData(analysis)
    } catch (error: any) {
      console.error('❌ Error loading student analysis:', error)
      setError('Öğrenci analizi yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Navigation handler
  const handleGoHome = () => {
    router.push('/admin')
  }

  const getPerformanceBadge = (performance: string) => {
    const colors = {
      'Çok İyi': 'bg-green-100 text-green-800',
      'İyi': 'bg-blue-100 text-blue-800', 
      'Orta': 'bg-yellow-100 text-yellow-800',
      'Kötü': 'bg-red-100 text-red-800'
    }
    return <Badge className={colors[performance as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{performance}</Badge>
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 55) return 'text-yellow-600'
    return 'text-red-600'
  }

  // PDF Export Functions
  const exportToPDF = async (includeFiltered: boolean = false) => {
    if (!analysisData) return
    
    try {
      // Create PDF with student analysis data
      const pdf = new jsPDF()
      const pageHeight = pdf.internal.pageSize.height
      const pageWidth = pdf.internal.pageSize.width
      let currentY = 20

      // Helper function to handle Turkish characters for this PDF
      const cleanTextForPDF = (text) => {
        if (!text) return ''
        const turkishChars = {
          'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
          'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
        }
        let cleanedText = text.toString()
        Object.keys(turkishChars).forEach(turkishChar => {
          const regex = new RegExp(turkishChar, 'g')
          cleanedText = cleanedText.replace(regex, turkishChars[turkishChar])
        })
        return cleanedText.replace(/[^\x20-\x7E]/g, '')
      }

      // Title
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text(cleanTextForPDF('Öğrenci Bazlı Analiz Raporu'), 20, currentY)
      currentY += 10

      // Student Info
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'normal')
      pdf.text(cleanTextForPDF(`Ogrenci: ${analysisData.studentInfo.ogrenciAdi}`), 20, currentY)
      currentY += 7
      pdf.text(cleanTextForPDF(`Ogrenci No: ${analysisData.studentInfo.ogrenciNo}`), 20, currentY)
      currentY += 7
      pdf.text(cleanTextForPDF(`Sinif: ${analysisData.studentInfo.sinif}/${analysisData.studentInfo.sube}`), 20, currentY)
      currentY += 7
      pdf.text(cleanTextForPDF(`Sinav: ${analysisData.examInfo.examName}`), 20, currentY)
      currentY += 15

      // Overall Performance
      pdf.setFont(undefined, 'bold')
      pdf.text(cleanTextForPDF('Genel Performans'), 20, currentY)
      currentY += 10
      pdf.setFont(undefined, 'normal')
      pdf.text(cleanTextForPDF(`Toplam Puan: ${analysisData.studentPerformance.totalScore}`), 20, currentY)
      currentY += 7
      pdf.text(cleanTextForPDF(`Dogru: ${analysisData.studentPerformance.totalCorrect}`), 20, currentY)
      currentY += 7
      pdf.text(cleanTextForPDF(`Yanlis: ${analysisData.studentPerformance.totalWrong}`), 20, currentY)
      currentY += 7
      pdf.text(cleanTextForPDF(`Bos: ${analysisData.studentPerformance.totalEmpty}`), 20, currentY)
      currentY += 7
      pdf.text(cleanTextForPDF(`Sinif Siralamasi: ${analysisData.classComparison.studentRank}/${analysisData.classComparison.totalStudents}`), 20, currentY)
      currentY += 15

      // Subject Performance
      pdf.setFont(undefined, 'bold')
      pdf.text(cleanTextForPDF('Ders Bazli Performans'), 20, currentY)
      currentY += 10

      analysisData.studentPerformance.subjectScores.forEach((subject) => {
        if (currentY > pageHeight - 30) {
          pdf.addPage()
          currentY = 20
        }
        
        pdf.setFont(undefined, 'bold')
        pdf.text(cleanTextForPDF(subject.subjectName), 20, currentY)
        currentY += 7
        pdf.setFont(undefined, 'normal')
        pdf.text(cleanTextForPDF(`Dogru: ${subject.correct} | Yanlis: ${subject.wrong} | Bos: ${subject.empty} | Puan: ${subject.score}`), 25, currentY)
        currentY += 10
      })

      // Save PDF
      const cleanStudentName = cleanTextForPDF(analysisData.studentInfo.ogrenciAdi).replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = includeFiltered ? 
        `${cleanStudentName}_Analiz_Filtreli.pdf` :
        `${cleanStudentName}_Analiz.pdf`
      
      pdf.save(fileName)
      
    } catch (error) {
      console.error('PDF export error:', error)
      setError('PDF çıktısı alınırken hata oluştu')
    }
  }

  const exportDetailedToPDF = async () => {
    if (!analysisData) return
    
    try {
      const element = document.getElementById('detailed-analysis-content')
      if (!element) return

      // Convert to canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      
      // Clean Turkish characters for filename
      const cleanName = analysisData.studentInfo.ogrenciAdi.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => {
        const turkishChars = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' }
        return turkishChars[char] || char
      }).replace(/[^a-zA-Z0-9]/g, '_')
      
      const fileName = `${cleanName}_Detayli_Analiz.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('Detailed PDF export error:', error)
      setError('Detaylı PDF çıktısı alınırken hata oluştu')
    }
  }

  // Export all students summary to PDF
  const exportAllStudentsToPDF = async () => {
    if (!activeExamId || students.length === 0) return
    
    // Calculate basic performance from answers using answer key
    const calculateBasicPerformance = (student, examContent) => {
      if (!student.subjectAnswers || !Array.isArray(student.subjectAnswers)) {
        return {
          totalScore: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalEmpty: 0
        }
      }

      let totalCorrect = 0
      let totalWrong = 0
      let totalEmpty = 0
      let hasAnswerKey = false
      
      // Create answer key map for quick lookup
      const answerKeyMap = {}
      if (examContent?.questions) {
        examContent.questions.forEach((question, index) => {
          const correctAnswer = question.correctAnswer || question.dogruCevap
          if (correctAnswer && correctAnswer.trim() !== '') {
            answerKeyMap[index + 1] = correctAnswer.trim().toUpperCase()
            hasAnswerKey = true
          }
        })
      }
      
      if (hasAnswerKey) {
        // Use answer key to calculate correct/wrong answers
        student.subjectAnswers.forEach(subject => {
          const studentAnswers = subject.answers || ''
          const startPos = subject.startPosition || 1
          
          for (let i = 0; i < studentAnswers.length; i++) {
            const studentAnswer = studentAnswers[i]?.toUpperCase()
            const questionNumber = startPos + i
            const correctAnswer = answerKeyMap[questionNumber]
            
            if (!studentAnswer || studentAnswer === ' ') {
              totalEmpty++
            } else if (correctAnswer && studentAnswer === correctAnswer) {
              totalCorrect++
            } else if (correctAnswer) {
              totalWrong++
            }
          }
        })
      } else {
        // No answer key available - just count answered vs empty
        console.warn('⚠️ Bu sınav için cevap anahtarı bulunamadı. Sadece cevaplanmış/boş istatistiği hesaplanıyor.')
        
        student.subjectAnswers.forEach(subject => {
          const studentAnswers = subject.answers || ''
          
          for (let i = 0; i < studentAnswers.length; i++) {
            const studentAnswer = studentAnswers[i]
            
            if (!studentAnswer || studentAnswer === ' ') {
              totalEmpty++
            } else {
              // Count as "answered" - we can't determine if correct without answer key
              totalWrong++ // Use wrong as "answered but unknown correctness"
            }
          }
        })
      }
      
      // Simple scoring: correct answers worth 2.5 points each, wrong -0.83
      const totalScore = hasAnswerKey ? Math.max(0, (totalCorrect * 2.5) - (totalWrong * 0.83)) : 0
      
      return {
        totalScore: Math.round(totalScore * 100) / 100,
        totalCorrect,
        totalWrong: hasAnswerKey ? totalWrong : 0, // Show 0 wrong if no answer key
        totalEmpty,
        hasAnswerKey // Add this info for display
      }
    }
    
    try {
      setLoading(true)
      
      // Get exam content and student results
      console.log('📊 Sınav içeriği ve öğrenci verileri çekiliyor...')
      const [examContent, allResults] = await Promise.all([
        apiClient.getExamContent(activeExamId),
        apiClient.getStudentResults(activeExamId)
      ])
      
      if (!allResults || !Array.isArray(allResults)) {
        throw new Error('Öğrenci verileri alınamadı')
      }
      
      if (!examContent || !examContent.questions) {
        throw new Error('Sınav içeriği alınamadı')
      }

      console.log(`🎯 PDF için ${allResults.length} öğrenci verisi alındı`)
      console.log(`📝 ${examContent.questions.length} soru cevap anahtarı yüklendi`)
      
      // Get performance data for each student
      const studentsWithPerformance = allResults.map((student) => { // All students
        // Use basic performance calculation directly for faster PDF generation
        console.log(`📝 Calculating performance for: ${student.studentInfo?.ogrenciAdi}`)
        const basicPerf = calculateBasicPerformance(student, examContent)
        return {
          ...student,
          performance: basicPerf
        }
      })
      
      // Check if we have answer key for proper headers
      const hasAnswerKey = studentsWithPerformance.length > 0 && studentsWithPerformance[0].performance.hasAnswerKey
      
      // Create PDF with proper Turkish character support
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      let currentY = 20
      
      // Get exam info
      const examInfo = allResults[0]?.examInfo || { examName: 'Sınav', optikFormName: 'Form' }
      
      // Helper function to handle Turkish characters for PDF display
      const cleanText = (text) => {
        if (!text) return ''
        // Türkçe karakter dönüşüm tablosu
        const turkishChars = {
          'ç': 'c', 'Ç': 'C',
          'ğ': 'g', 'Ğ': 'G', 
          'ı': 'i', 'İ': 'I',
          'ö': 'o', 'Ö': 'O',
          'ş': 's', 'Ş': 'S',
          'ü': 'u', 'Ü': 'U'
        }
        
        let cleanedText = text.toString()
        
        // Türkçe karakterleri ASCII karşılıklarıyla değiştir
        Object.keys(turkishChars).forEach(turkishChar => {
          const regex = new RegExp(turkishChar, 'g')
          cleanedText = cleanedText.replace(regex, turkishChars[turkishChar])
        })
        
        // Sadece ASCII karakterleri ve bazı özel karakterleri tut
        cleanedText = cleanedText.replace(/[^\x20-\x7E]/g, '')
        
        return cleanedText.substring(0, 25)
      }
      
      // Helper function to add page header
      const addPageHeader = () => {
        pdf.addPage()
        currentY = 20
        
        // Header
        pdf.setFontSize(12)
        pdf.setFont(undefined, 'bold')
        pdf.text('SINAV SONUCLARI LISTESI', pageWidth / 2, currentY, { align: 'center' })
        currentY += 8
        
        pdf.setFontSize(10)
        pdf.setFont(undefined, 'normal')
        pdf.text(`${examInfo.examName || 'Sinav'} - ${examInfo.optikFormName || 'Form'}`, pageWidth / 2, currentY, { align: 'center' })
        currentY += 15
        
        drawTableHeader()
      }
      
      // Helper function to draw table header
      const drawTableHeader = () => {
        pdf.setFontSize(9)
        pdf.setFont(undefined, 'bold')
        
        // Header background
        pdf.setFillColor(240, 240, 240)
        pdf.rect(margin, currentY - 5, pageWidth - 2 * margin, 8, 'F')
        
        // Column headers with proper spacing
        const headerY = currentY
        pdf.text('SIRA', margin + 2, headerY)
        pdf.text('ADI SOYADI', margin + 20, headerY)
        pdf.text('NO', margin + 70, headerY)
        pdf.text('SINIF', margin + 95, headerY)
        
        if (hasAnswerKey) {
          pdf.text('DOGRU', margin + 120, headerY)
          pdf.text('YANLIS', margin + 140, headerY)
          pdf.text('BOS', margin + 160, headerY)
          pdf.text('PUAN', margin + 175, headerY)
        } else {
          pdf.text('CEVAPLANDI', margin + 120, headerY)
          pdf.text('BOS', margin + 155, headerY)
          pdf.text('TOPLAM', margin + 175, headerY)
        }
        
        // Header borders
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, currentY + 3, pageWidth - margin, currentY + 3)
        
        currentY += 10
      }
      
      // Initial page setup
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')
      pdf.text('SINAV SONUCLARI LISTESI', pageWidth / 2, currentY, { align: 'center' })
      currentY += 12
      
      // Exam details
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Sinav: ${examInfo.examName || 'Bilinmeyen Sinav'}`, pageWidth / 2, currentY, { align: 'center' })
      currentY += 6
      pdf.text(`Optik Form: ${examInfo.optikFormName || 'Bilinmeyen Form'}`, pageWidth / 2, currentY, { align: 'center' })
      currentY += 6
      pdf.text(`Toplam Ogrenci: ${studentsWithPerformance.length}`, pageWidth / 2, currentY, { align: 'center' })
      currentY += 6
      
      if (!hasAnswerKey) {
        pdf.setFontSize(10)
        pdf.setTextColor(200, 0, 0)
        pdf.text('UYARI: Bu sinav icin cevap anahtari tanimlanmamis.', pageWidth / 2, currentY, { align: 'center' })
        currentY += 4
        pdf.text('Sadece cevaplanmis/bos istatistigi gosterilmektedir.', pageWidth / 2, currentY, { align: 'center' })
        pdf.setTextColor(0, 0, 0)
        currentY += 6
        pdf.setFontSize(12)
      }
      
      pdf.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth / 2, currentY, { align: 'center' })
      currentY += 15
      
      // Draw initial table header
      drawTableHeader()
      
      // Sort students by score
      const sortedStudents = studentsWithPerformance.sort((a, b) => {
        const aScore = a.performance?.totalScore || 0
        const bScore = b.performance?.totalScore || 0
        return bScore - aScore
      })
      
      // Student rows
      pdf.setFontSize(8)
      pdf.setFont(undefined, 'normal')
      
      sortedStudents.forEach((student, index) => {
        // Check for new page
        if (currentY > pageHeight - 30) {
          addPageHeader()
        }
        
        const rank = index + 1
        const info = student.studentInfo || {}
        const perf = student.performance || {}
        
        // Alternate row colors
        if (index % 2 === 0) {
          pdf.setFillColor(252, 252, 252)
          pdf.rect(margin, currentY - 4, pageWidth - 2 * margin, 7, 'F')
        }
        
        // Extract data with proper formatting
        const studentName = cleanText(info.ogrenciAdi || 'Bilinmeyen')
        const studentNo = cleanText(info.ogrenciNo || '-')
        const classInfo = `${info.sinif || '-'}/${info.sube || '-'}`
        const correct = (perf.totalCorrect || 0).toString()
        const wrong = (perf.totalWrong || 0).toString()
        const empty = (perf.totalEmpty || 0).toString()
        const answered = ((perf.totalCorrect || 0) + (perf.totalWrong || 0)).toString()
        const total = ((perf.totalCorrect || 0) + (perf.totalWrong || 0) + (perf.totalEmpty || 0)).toString()
        const score = (perf.totalScore || 0).toFixed(1)
        
        // Draw student data with proper spacing
        pdf.setTextColor(0, 0, 0)
        pdf.text(rank.toString(), margin + 2, currentY)
        pdf.text(studentName, margin + 20, currentY)
        pdf.text(studentNo, margin + 70, currentY)
        pdf.text(classInfo, margin + 95, currentY)
        
        if (hasAnswerKey) {
          pdf.text(correct, margin + 125, currentY)
          pdf.text(wrong, margin + 145, currentY)
          pdf.text(empty, margin + 165, currentY)
          
          // Color-coded score
          const scoreNum = parseFloat(score)
          if (scoreNum >= 85) pdf.setTextColor(0, 150, 0)
          else if (scoreNum >= 70) pdf.setTextColor(0, 100, 200)
          else if (scoreNum >= 50) pdf.setTextColor(200, 100, 0)
          else pdf.setTextColor(200, 0, 0)
          
          pdf.text(score, margin + 175, currentY)
        } else {
          pdf.text(answered, margin + 125, currentY)
          pdf.text(empty, margin + 160, currentY)
          pdf.text(total, margin + 175, currentY)
        }
        
        pdf.setTextColor(0, 0, 0)
        
        currentY += 7
        
        // Separator every 10 rows
        if ((index + 1) % 10 === 0 && index < sortedStudents.length - 1) {
          pdf.setDrawColor(220, 220, 220)
          pdf.line(margin + 10, currentY, pageWidth - margin - 10, currentY)
          currentY += 2
        }
      })
      
      // Summary section
      if (currentY > pageHeight - 80) {
        pdf.addPage()
        currentY = 30
      } else {
        currentY += 15
      }
      
      pdf.setFontSize(14)
      pdf.setFont(undefined, 'bold')
      pdf.text('OZET ISTATISTIKLER', pageWidth / 2, currentY, { align: 'center' })
      currentY += 15
      
      // Calculate summary statistics
      const scores = sortedStudents.map(s => s.performance?.totalScore || 0)
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const maxScore = Math.max(...scores)
      const minScore = Math.min(...scores)
      const passCount = scores.filter(score => score >= 50).length
      
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      
      const summaryData = [
        ['Toplam Ogrenci Sayisi:', studentsWithPerformance.length.toString()],
        ['En Yuksek Puan:', maxScore.toFixed(1)],
        ['En Dusuk Puan:', minScore.toFixed(1)],
        ['Ortalama Puan:', avgScore.toFixed(2)],
        ['Gecen Ogrenci (>=50):', `${passCount} (%${((passCount/studentsWithPerformance.length)*100).toFixed(1)})`],
        ['Kalan Ogrenci (<50):', `${studentsWithPerformance.length - passCount} (%${(((studentsWithPerformance.length-passCount)/studentsWithPerformance.length)*100).toFixed(1)})`]
      ]
      
      summaryData.forEach(([label, value]) => {
        pdf.setFont(undefined, 'bold')
        pdf.text(label, margin + 20, currentY)
        pdf.setFont(undefined, 'normal')
        pdf.text(value, margin + 90, currentY)
        currentY += 8
      })
      
      // Footer
      pdf.setFontSize(8)
      pdf.setTextColor(100, 100, 100)
      const footerText = `Bu rapor ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')} tarihinde olusturulmustur.`
      pdf.text(cleanText(footerText), pageWidth / 2, pageHeight - 15, { align: 'center' })
      
      // Save PDF
      const cleanExamName = cleanText(examInfo.examName).replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = `${cleanExamName}_Sonuclari_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      console.log(`✅ Düzenli PDF raporu oluşturuldu: ${studentsWithPerformance.length} öğrenci`)
      
    } catch (error) {
      console.error('❌ PDF export error:', error)
      setError('PDF çıktısı alınırken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const subjectChartData = analysisData?.subjectComparison?.map(subject => ({
    name: subject.subjectName,
    öğrenci: subject.studentScore,
    sınıfOrtalama: subject.classAverage,
    fark: subject.difference
  })) || []

  const topicPerformanceData = analysisData?.studentPerformance.subjectScores?.map(subject => {
    // Group answers by topic
    const topicGroups: any = {}
    subject.answers.forEach(answer => {
      if (!topicGroups[answer.topic]) {
        topicGroups[answer.topic] = { correct: 0, total: 0 }
      }
      topicGroups[answer.topic].total++
      if (answer.isCorrect) {
        topicGroups[answer.topic].correct++
      }
    })

    return Object.keys(topicGroups).map(topic => ({
      subject: subject.subjectName,
      topic: topic,
      success: (topicGroups[topic].correct / topicGroups[topic].total) * 100
    }))
  }).flat() || []

  // Pie chart data for overall performance
  const overallPieData = analysisData ? [
    { name: 'Doğru', value: analysisData.studentPerformance.totalCorrect, color: '#10B981' },
    { name: 'Yanlış', value: analysisData.studentPerformance.totalWrong, color: '#EF4444' },
    { name: 'Boş', value: analysisData.studentPerformance.totalEmpty, color: '#6B7280' }
  ] : []

  // Pie chart data for subjects
  const subjectPieData = analysisData?.studentPerformance.subjectScores?.map(subject => ({
    name: subject.subjectName,
    data: [
      { name: 'Doğru', value: subject.correct, color: '#10B981' },
      { name: 'Yanlış', value: subject.wrong, color: '#EF4444' },
      { name: 'Boş', value: subject.empty, color: '#6B7280' }
    ]
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Öğrenci analizi yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    )
  }

  if (!activeExamId) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>Analiz için sınav seçin</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Student Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Öğrenci Bazlı Analiz
              </CardTitle>
              {analysisData && (
                <div className="text-sm text-gray-600 mt-2">
                  <p><strong>Sınav:</strong> {analysisData.examInfo.examName}</p>
                  <p><strong>Form:</strong> {analysisData.examInfo.optikFormName}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {students.length > 0 && (
                <Button 
                  onClick={exportAllStudentsToPDF}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <Download className="h-4 w-4" />
                  {loading ? 'PDF Hazırlanıyor...' : 'Tüm Öğrenciler PDF'}
                </Button>
              )}
              {analysisData && (
                <>
                  <Button 
                    onClick={() => exportToPDF(false)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF İndir
                  </Button>
                  <Button 
                    onClick={() => exportDetailedToPDF()}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Detaylı PDF
                  </Button>
                </>
              )}
              <Button 
                onClick={handleGoHome} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  İsim/Numara Ara
                </label>
                <Input
                  type="text"
                  placeholder="Öğrenci adı veya numarası..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Sınıf Filtrele
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm sınıflar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm sınıflar</SelectItem>
                    {availableClasses.map(cls => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Öğrenci Seç</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Öğrenci seçin... (${filteredStudents.length} öğrenci)`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.filter(student => student.id && student.id.trim() !== '').map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.studentNo}) - {student.class}/{student.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Student count info */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Toplam: {students.length} öğrenci</span>
              </div>
              {(searchTerm || (selectedClass !== 'all' && selectedClass !== '')) && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtreli: {filteredStudents.length} öğrenci</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Selection Prompt */}
      {!selectedStudent && !loading && (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Öğrenci Seçin</h3>
            <p>Analiz sonuçlarını görmek için yukarıdan bir öğrenci seçin.</p>
            {students.length > 0 && (
              <p className="text-sm mt-2">
                {filteredStudents.length} öğrenci mevcut
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Student Analysis Results */}
      {analysisData && selectedStudent && (
        <div id="detailed-analysis-content">
          {/* Student Info & Overall Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Öğrenci Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>Ad Soyad:</strong> {analysisData.studentInfo.ogrenciAdi}</div>
                <div><strong>Öğrenci No:</strong> {analysisData.studentInfo.ogrenciNo}</div>
                <div><strong>Sınıf:</strong> {analysisData.studentInfo.sinif}/{analysisData.studentInfo.sube}</div>
                <div><strong>Kitapçık:</strong> {analysisData.studentInfo.kt}</div>
                {analysisData.studentInfo.telefon && (
                  <div><strong>Telefon:</strong> {analysisData.studentInfo.telefon}</div>
                )}
              </CardContent>
            </Card>

            {/* Overall Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Genel Başarı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="flex justify-center">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={overallPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {overallPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} soru`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <div className="text-center mb-4">
                      <div className={`text-3xl font-bold ${getScoreColor(analysisData.studentPerformance.totalScore)}`}>
                        {analysisData.studentPerformance.totalScore.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Genel Başarı Oranı</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center text-sm">
                      <div>
                        <div className="text-lg font-semibold text-green-600">{analysisData.studentPerformance.totalCorrect}</div>
                        <div className="text-gray-500">Doğru</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-red-600">{analysisData.studentPerformance.totalWrong}</div>
                        <div className="text-gray-500">Yanlış</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-600">{analysisData.studentPerformance.totalEmpty}</div>
                        <div className="text-gray-500">Boş</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-600">{analysisData.studentPerformance.totalQuestions}</div>
                        <div className="text-gray-500">Toplam</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Sınıf İçi Durum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">#{analysisData.classComparison.studentRank}</div>
                  <div className="text-sm text-gray-500">Sınıf Sıralaması</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{analysisData.classComparison.totalStudents}</div>
                  <div className="text-sm text-gray-500">Toplam Öğrenci</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{analysisData.classComparison.studentPercentile}%</div>
                  <div className="text-sm text-gray-500">Yüzdelik Dilim</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{analysisData.classComparison.classAverage.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Sınıf Ortalaması</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance with Pie Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ders Bazlı Performans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectPieData.map((subject, index) => (
                  <div key={index} className="text-center">
                    <h4 className="font-medium mb-3">{subject.name}</h4>
                    <div className="w-32 h-32 mx-auto mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subject.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {subject.data.map((entry, cellIndex) => (
                              <Cell key={`cell-${cellIndex}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} soru`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Doğru:</span>
                        <span className="text-green-600 font-medium">{subject.data[0].value}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Yanlış:</span>
                        <span className="text-red-600 font-medium">{subject.data[1].value}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Boş:</span>
                        <span className="text-gray-600 font-medium">{subject.data[2].value}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Başarı:</span>
                        <span className={`font-bold ${getScoreColor(analysisData.studentPerformance.subjectScores[index].score)}`}>
                          {analysisData.studentPerformance.subjectScores[index].score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ders Bazlı Performans Karşılaştırması</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer>
                  <BarChart data={subjectChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="öğrenci" fill="#3b82f6" name="Öğrenci Puanı" />
                    <Bar dataKey="sınıfOrtalama" fill="#ef4444" name="Sınıf Ortalaması" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subject Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Ders Bazlı Detaylı Karşılaştırma</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ders</TableHead>
                    <TableHead>Öğrenci Puanı</TableHead>
                    <TableHead>Sınıf Ortalaması</TableHead>
                    <TableHead>Fark</TableHead>
                    <TableHead>Performans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisData.subjectComparison.map((subject) => (
                    <TableRow key={subject.subjectName}>
                      <TableCell className="font-medium">{subject.subjectName}</TableCell>
                      <TableCell className={getScoreColor(subject.studentScore)}>
                        {subject.studentScore.toFixed(1)}%
                      </TableCell>
                      <TableCell>{subject.classAverage.toFixed(1)}%</TableCell>
                      <TableCell className={subject.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {subject.difference >= 0 ? '+' : ''}{subject.difference.toFixed(1)}%
                      </TableCell>
                      <TableCell>{getPerformanceBadge(subject.performance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Subject Details Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Ders Bazlı Detay Analizleri</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={analysisData.studentPerformance.subjectScores[0]?.subjectName} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {analysisData.studentPerformance.subjectScores.map(subject => (
                    <TabsTrigger key={subject.subjectName} value={subject.subjectName} className="text-xs">
                      {subject.subjectName}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {analysisData.studentPerformance.subjectScores.map(subject => (
                  <TabsContent key={subject.subjectName} value={subject.subjectName} className="space-y-4">
                    {/* Subject Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{subject.subjectName} Özeti</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                          <div>
                            <div className={`text-xl font-bold ${getScoreColor(subject.score)}`}>
                              {subject.score.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">Başarı Oranı</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-600">{subject.correct}</div>
                            <div className="text-sm text-gray-500">Doğru</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-red-600">{subject.wrong}</div>
                            <div className="text-sm text-gray-500">Yanlış</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-gray-600">{subject.empty}</div>
                            <div className="text-sm text-gray-500">Boş</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-blue-600">{subject.answers.length}</div>
                            <div className="text-sm text-gray-500">Toplam</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Question Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Soru Bazlı Detaylar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Soru</TableHead>
                              <TableHead>Öğrenci Cevabı</TableHead>
                              <TableHead>Doğru Cevap</TableHead>
                              <TableHead>Durum</TableHead>
                              <TableHead>Konu</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subject.answers.map((answer) => (
                              <TableRow 
                                key={answer.questionNumber}
                                className={
                                  answer.isEmpty 
                                    ? "bg-blue-50 hover:bg-blue-100" 
                                    : answer.isCorrect 
                                      ? "bg-green-50 hover:bg-green-100" 
                                      : "bg-red-50 hover:bg-red-100"
                                }
                              >
                                <TableCell className="font-medium">{answer.questionNumber}</TableCell>
                                <TableCell className="font-medium">
                                  {answer.isEmpty ? '-' : answer.studentAnswer}
                                </TableCell>
                                <TableCell className="font-medium">{answer.correctAnswer}</TableCell>
                                <TableCell>
                                  {answer.isEmpty ? (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">Boş</Badge>
                                  ) : answer.isCorrect ? (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Doğru
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Yanlış
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm font-medium">{answer.topic}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Single Comprehensive Topic Chart */}
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Konu Bazlı Performans Dağılımı</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Main Pie Chart */}
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={(() => {
                                      // Konulara göre grupla
                                      const topicGroups = subject.answers.reduce((acc: any, answer: any) => {
                                        const topic = answer.topic && answer.topic.trim() ? answer.topic.trim() : 'Genel'
                                        if (!acc[topic]) {
                                          acc[topic] = { correct: 0, wrong: 0, empty: 0, total: 0 }
                                        }
                                        if (answer.isEmpty) {
                                          acc[topic].empty++
                                        } else if (answer.isCorrect) {
                                          acc[topic].correct++
                                        } else {
                                          acc[topic].wrong++
                                        }
                                        acc[topic].total++
                                        return acc
                                      }, {})

                                      // Her konu için başarı oranını hesapla ve grafik verisi oluştur
                                      const colors = [
                                        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
                                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280',
                                        '#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed'
                                      ]
                                      let colorIndex = 0
                                      
                                      return Object.entries(topicGroups).map(([topic, data]: [string, any]) => {
                                        const successRate = data.total > 0 ? (data.correct / data.total * 100) : 0
                                        return {
                                          name: topic,
                                          value: data.total,
                                          successRate: successRate.toFixed(1),
                                          correct: data.correct,
                                          wrong: data.wrong,
                                          empty: data.empty,
                                          fill: colors[colorIndex++ % colors.length]
                                        }
                                      })
                                    })()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, correct, total, successRate }) => {
                                      if (!name || name === 'undefined' || !total) return ''
                                      return `${name}: ${correct}/${total} (%${successRate})`
                                    }}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {(() => {
                                      const topicGroups = subject.answers.reduce((acc: any, answer: any) => {
                                        const topic = answer.topic && answer.topic.trim() ? answer.topic.trim() : 'Genel'
                                        if (!acc[topic]) {
                                          acc[topic] = { correct: 0, wrong: 0, empty: 0, total: 0 }
                                        }
                                        if (answer.isEmpty) {
                                          acc[topic].empty++
                                        } else if (answer.isCorrect) {
                                          acc[topic].correct++
                                        } else {
                                          acc[topic].wrong++
                                        }
                                        acc[topic].total++
                                        return acc
                                      }, {})

                                      const colors = [
                                        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
                                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280',
                                        '#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed'
                                      ]
                                      
                                      return Object.keys(topicGroups)
                                        .filter(topic => topic && topic !== 'undefined' && topic !== 'null')
                                        .map((topic, index) => (
                                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                        ))
                                    })()}
                                  </Pie>
                                  <Tooltip 
                                    content={({ active, payload, label }) => {
                                      if (active && payload && payload[0]) {
                                        const data = payload[0].payload
                                        return (
                                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                                            <h4 className="font-bold text-lg mb-2">{data.name}</h4>
                                            <div className="space-y-1 text-sm">
                                              <div className="flex justify-between">
                                                <span>Toplam Soru:</span>
                                                <span className="font-medium">{data.value}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-green-600">Doğru:</span>
                                                <span className="font-medium text-green-600">{data.correct}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-red-600">Yanlış:</span>
                                                <span className="font-medium text-red-600">{data.wrong}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-gray-600">Boş:</span>
                                                <span className="font-medium text-gray-600">{data.empty}</span>
                                              </div>
                                              <hr className="my-2" />
                                              <div className="flex justify-between font-bold">
                                                <span>Başarı Oranı:</span>
                                                <span className="text-blue-600">%{data.successRate}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      }
                                      return null
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Topic Summary Table */}
                            <div className="space-y-3">
                              <h5 className="font-medium">Konu Detayları</h5>
                              {(() => {
                                const topicGroups = subject.answers.reduce((acc: any, answer: any) => {
                                  const topic = answer.topic && answer.topic.trim() ? answer.topic.trim() : 'Genel'
                                  if (!acc[topic]) {
                                    acc[topic] = { correct: 0, wrong: 0, empty: 0, questions: [] }
                                  }
                                  if (answer.isEmpty) {
                                    acc[topic].empty++
                                  } else if (answer.isCorrect) {
                                    acc[topic].correct++
                                  } else {
                                    acc[topic].wrong++
                                  }
                                  acc[topic].questions.push(answer.questionNumber)
                                  return acc
                                }, {})

                                const colors = [
                                  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
                                  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280',
                                  '#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed'
                                ]

                                return Object.entries(topicGroups)
                                  .filter(([topic]) => topic && topic !== 'undefined' && topic !== 'null')
                                  .map(([topic, data]: [string, any], index) => {
                                  const total = data.correct + data.wrong + data.empty
                                  const successRate = total > 0 ? (data.correct / total * 100) : 0
                                  
                                  return (
                                    <div key={topic} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div 
                                          className="w-4 h-4 rounded-full"
                                          style={{ backgroundColor: colors[index % colors.length] }}
                                        ></div>
                                        <div>
                                          <div className="font-medium">{topic}</div>
                                          <div className="text-sm text-gray-500">
                                            Sorular: {data.questions.join(', ')}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium">
                                          {data.correct}/{total} (%{successRate.toFixed(1)})
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          <span className="text-green-600">{data.correct}D</span> • 
                                          <span className="text-red-600">{data.wrong}Y</span> • 
                                          <span className="text-gray-600">{data.empty}B</span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })
                              })()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default StudentAnalysis
