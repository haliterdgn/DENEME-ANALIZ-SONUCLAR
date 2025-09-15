"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExamStore } from "@/lib/stores/exam-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useOptikFormStore } from "@/lib/stores/optik-form-store"
import { apiClient } from "@/lib/api-client"
import { Upload, X, FileSpreadsheet, FileText, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as XLSX from "xlsx"

interface QuestionMapping {
  questionNumber: number
  correctAnswer: string
  subject?: string
  topic?: string
}

interface BookletUploadProps {
  examId: string
  onClose: () => void
}

export default function BookletUpload({ examId, onClose }: BookletUploadProps) {
  const [activeTab, setActiveTab] = useState("kitapcik")
  const [kitapcikFile, setKitapcikFile] = useState<File | null>(null)
  const [optikFile, setOptikFile] = useState<File | null>(null)
  const [selectedOptikFormId, setSelectedOptikFormId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [backendOptikForms, setBackendOptikForms] = useState<any[]>([])

  const kitapcikInputRef = useRef<HTMLInputElement>(null)
  const optikInputRef = useRef<HTMLInputElement>(null)

  const { addBooklet, getExamById, getBookletByExamId, addResult, uploadExcel, uploadTxtResults } = useExamStore()
  const { user } = useAuthStore()
  const { optikForms } = useOptikFormStore()

  // Backend'den optik formları yükle
  useEffect(() => {
    const loadOptikForms = async () => {
      try {
        const forms = await apiClient.getOptikForms()
        console.log('📋 Backend optik formları:', forms)
        setBackendOptikForms(forms || [])
      } catch (error) {
        console.warn('⚠️ Backend optik form yükleme başarısız:', error)
        setBackendOptikForms([])
      }
    }
    loadOptikForms()
  }, [])

  const exam = getExamById(examId)
  const existingBooklet = getBookletByExamId(examId)

  const handleKitapcikFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (
        selectedFile.type.includes("sheet") ||
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls")
      ) {
        setKitapcikFile(selectedFile)
        setError("")
      } else {
        setError("Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)")
      }
    }
  }

  const handleOptikFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith(".txt")) {
        setOptikFile(selectedFile)
        setError("")
      } else {
        setError("Lütfen geçerli bir TXT dosyası seçin (.txt)")
      }
    }
  }

  const parseExcelFile = (file: File): Promise<QuestionMapping[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          const questions: QuestionMapping[] = []

          // Skip header row, start from index 1
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (row.length >= 4) {
              questions.push({
                questionNumber: Number.parseInt(row[0]) || i,
                topic: row[1] || `Konu ${i}`,
                correctAnswer: row[2] || "A",
                subject: row[3] || "Genel",
              })
            }
          }

          resolve(questions)
        } catch (error) {
          reject(new Error("Excel dosyası işlenemedi"))
        }
      }
      reader.onerror = () => reject(new Error("Dosya okunamadı"))
      reader.readAsArrayBuffer(file)
    })
  }

  const parseOptikFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split("\n").filter((line) => line.trim() !== "")
          const students: any[] = []

          lines.forEach((line, index) => {
            if (line.trim()) {
              // Optik form satırını parse et
              const studentData = parseOptikLine(line, index + 1)
              if (studentData) {
                students.push(studentData)
              }
            }
          })

          resolve(students)
        } catch (error) {
          reject(new Error("Optik dosyası işlenemedi"))
        }
      }
      reader.onerror = () => reject(new Error("Dosya okunamadı"))
      reader.readAsText(file, "utf-8")
    })
  }

  const parseOptikLine = (line: string, lineNumber: number) => {
    try {
      // Optik form satırını parse et (örnek format)
      // Format: OGRENCI_ADI|OGRENCI_NO|CEVAPLAR (A,B,C,D,E formatında)

      if (line.length < 50) {
        // Basit format: sadece cevaplar
        const answers: Record<number, string> = {}
        for (let i = 0; i < line.length; i++) {
          const answer = line[i].toUpperCase()
          if (["A", "B", "C", "D", "E"].includes(answer)) {
            answers[i + 1] = answer
          }
        }

        return {
          studentName: `Öğrenci ${lineNumber}`,
          studentNumber: `${lineNumber.toString().padStart(4, "0")}`,
          answers: answers,
          rawLine: line,
        }
      } else {
        // Gelişmiş format: öğrenci bilgileri + cevaplar
        const studentName = line.substring(0, 30).trim()
        const studentNumber = line.substring(30, 40).trim()
        const answersSection = line.substring(40)

        const answers: Record<number, string> = {}
        for (let i = 0; i < answersSection.length; i++) {
          const answer = answersSection[i].toUpperCase()
          if (["A", "B", "C", "D", "E"].includes(answer)) {
            answers[i + 1] = answer
          }
        }

        return {
          studentName: studentName || `Öğrenci ${lineNumber}`,
          studentNumber: studentNumber || `${lineNumber.toString().padStart(4, "0")}`,
          answers: answers,
          rawLine: line,
        }
      }
    } catch (error) {
      console.error(`Satır ${lineNumber} parse edilemedi:`, error)
      return null
    }
  }

  const calculateResults = (students: any[], booklet: QuestionMapping[]) => {
    return students.map((student) => {
      let score = 0
      const subjectScores: Record<string, { correct: number; total: number }> = {}
      const topicScores: Record<string, { correct: number; total: number }> = {}

      // Her soru için kontrol et
      booklet.forEach((question) => {
        const studentAnswer = student.answers[question.questionNumber]
        const isCorrect = studentAnswer === question.correctAnswer

        if (isCorrect) {
          score++
        }

        // Ders bazında skorları hesapla
        if (question.subject) {
          if (!subjectScores[question.subject]) {
            subjectScores[question.subject] = { correct: 0, total: 0 }
          }
          subjectScores[question.subject].total++
          if (isCorrect) {
            subjectScores[question.subject].correct++
          }
        }

        // Konu bazında skorları hesapla
        if (question.topic) {
          if (!topicScores[question.topic]) {
            topicScores[question.topic] = { correct: 0, total: 0 }
          }
          topicScores[question.topic].total++
          if (isCorrect) {
            topicScores[question.topic].correct++
          }
        }
      })

      return {
        examId: examId,
        studentId: `student-${Date.now()}-${Math.random()}`,
        studentName: student.studentName,
        studentNumber: student.studentNumber,
        answers: student.answers,
        score: score,
        totalQuestions: booklet.length,
        subjectScores: subjectScores,
        topicScores: topicScores,
        completedAt: new Date().toISOString(),
        rawData: student.rawLine,
      }
    })
  }

  const handleKitapcikUpload = async () => {
    if (!kitapcikFile || !user) return

    setLoading(true)
    setError("")

    try {
      // API ile Excel dosyasını yükle
      await uploadExcel(examId, kitapcikFile)

      // Fallback olarak local parsing de yap
      const questions = await parseExcelFile(kitapcikFile)
      addBooklet({
        examId,
        questions,
        uploadedBy: user.id,
      })

      setSuccess("Kitapçık başarıyla yüklendi!")
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setError("Excel dosyası yüklenemedi. Lütfen formatı kontrol edin.")
    } finally {
      setLoading(false)
    }
  }

  const handleOptikUpload = async () => {
    if (!optikFile || !user || !existingBooklet) {
      setError("Önce kitapçık yüklenmelidir!")
      return
    }

    if (!selectedOptikFormId) {
      setError("Lütfen bir optik form seçin!")
      return
    }

    setLoading(true)
    setError("")

    try {
      // API ile TXT dosyasını yükle (seçilen optik form ile)
      try {
        await uploadTxtResults(examId, optikFile, selectedOptikFormId)
        console.log('✅ API yüklemesi başarılı')
      } catch (apiError) {
        console.warn('API yüklemesi başarısız, local parsing ile devam ediliyor:', apiError)
      }

      // Local parsing yap
      const students = await parseOptikFile(optikFile)
      const calculatedResults = calculateResults(students, existingBooklet.questions)

      // Sonuçları kaydet
      calculatedResults.forEach((result) => {
        addResult(result)
      })

      setResults(calculatedResults)
      setSuccess(`${calculatedResults.length} öğrencinin optik formu başarıyla işlendi!`)

      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (err) {
      setError("Optik dosyası işlenemedi. Lütfen formatı kontrol edin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sınav Dosyaları Yükle</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {exam && (
            <p className="text-sm text-gray-600">
              Sınav: <strong>{exam.name}</strong>
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="kitapcik">📚 Kitapçık Yükle (Excel)</TabsTrigger>
              <TabsTrigger value="optik">📄 Optik Yükle (TXT)</TabsTrigger>
            </TabsList>

            <TabsContent value="kitapcik" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-semibold">Excel Kitapçık Formatı</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Excel dosyanız aşağıdaki sütunlara sahip olmalıdır:</p>
                    <div className="text-sm font-mono bg-white p-3 rounded border">
                      <div className="grid grid-cols-4 gap-4 font-semibold border-b pb-2">
                        <span>Soru No</span>
                        <span>Konu</span>
                        <span>Doğru Cevap</span>
                        <span>Ders</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-2 text-gray-600">
                        <span>1</span>
                        <span>Doğrusal Denklemler</span>
                        <span>A</span>
                        <span>Matematik</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-gray-600">
                        <span>2</span>
                        <span>İkinci Dereceden Fonksiyonlar</span>
                        <span>B</span>
                        <span>Matematik</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-gray-600">
                        <span>3</span>
                        <span>Üçgenler</span>
                        <span>C</span>
                        <span>Geometri</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kitapcik-file">Excel Kitapçık Dosyası Seç</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="kitapcik-file"
                      type="file"
                      ref={kitapcikInputRef}
                      onChange={handleKitapcikFileSelect}
                      accept=".xlsx,.xls"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => kitapcikInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Excel Dosyası Seç</span>
                    </Button>
                    {kitapcikFile && <span className="text-sm text-gray-600">{kitapcikFile.name}</span>}
                  </div>
                </div>

                <Button
                  onClick={handleKitapcikUpload}
                  disabled={!kitapcikFile || loading}
                  className="w-full flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{loading ? "Yükleniyor..." : "Kitapçık Yükle"}</span>
                </Button>

                {existingBooklet && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✅ Kitapçık zaten yüklenmiş</p>
                    <p className="text-sm text-green-600 mt-1">
                      {existingBooklet.questions.length} soru • Yüklenme tarihi:{" "}
                      {new Date(existingBooklet.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="optik" className="space-y-6">
              {!existingBooklet ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">⚠️ Önce kitapçık yüklenmelidir</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Optik formları işleyebilmek için önce Excel kitapçığını yüklemeniz gerekiyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold">TXT Optik Format</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        TXT dosyanız aşağıdaki formatlardan birinde olmalıdır:
                      </p>

                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">Format 1: Sadece Cevaplar</p>
                          <div className="text-sm font-mono bg-white p-2 rounded border">
                            <div className="text-gray-600">ABCDEABCDEABCDE...</div>
                            <div className="text-gray-600">BACDEABCDEABCDE...</div>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium text-sm">Format 2: Öğrenci Bilgisi + Cevaplar</p>
                          <div className="text-sm font-mono bg-white p-2 rounded border">
                            <div className="text-gray-600">Ahmet Yılmaz 1001 ABCDEABCDEABCDE...</div>
                            <div className="text-gray-600">Ayşe Demir 1002 BACDEABCDEABCDE...</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        * Her satır bir öğrenciyi temsil eder
                        <br />* Cevaplar A, B, C, D, E harfleri olmalıdır
                        <br />* Boş bırakılan sorular için boşluk bırakın
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="optik-form-select">Optik Form Seçin</Label>
                      <Select value={selectedOptikFormId} onValueChange={setSelectedOptikFormId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Bir optik form seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {backendOptikForms.length === 0 ? (
                            <SelectItem value="none" disabled>
                              {optikForms.length === 0 
                                ? "Optik form bulunamadı - Önce optik form oluşturun"
                                : "Backend'den optik formlar yükleniyor..."
                              }
                            </SelectItem>
                          ) : (
                            backendOptikForms.map((form) => (
                              <SelectItem key={form._id || form.id} value={form._id || form.id}>
                                {form.formAdi} ({form.formKodu}) - {(form as any).kitapcikTuru ? `Kitapçık ${(form as any).kitapcikTuru}` : 'Kitapçık Türü Belirtilmedi'}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="optik-file">TXT Optik Dosyası Seç</Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="optik-file"
                          type="file"
                          ref={optikInputRef}
                          onChange={handleOptikFileSelect}
                          accept=".txt"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => optikInputRef.current?.click()}
                          className="flex items-center space-x-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>TXT Dosyası Seç</span>
                        </Button>
                        {optikFile && <span className="text-sm text-gray-600">{optikFile.name}</span>}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleOptikUpload}
                    disabled={!optikFile || !selectedOptikFormId || loading}
                    className="w-full flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{loading ? "İşleniyor..." : "Optik Formları İşle"}</span>
                  </Button>

                  {results.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">İşlenen Sonuçlar ({results.length} öğrenci)</h3>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {results.slice(0, 10).map((result, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded border text-sm">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{result.studentName}</p>
                                <p className="text-gray-600">No: {result.studentNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  {result.score}/{result.totalQuestions}
                                </p>
                                <p className="text-gray-600">
                                  {Math.round((result.score / result.totalQuestions) * 100)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {results.length > 10 && (
                          <p className="text-center text-gray-500 text-sm">... ve {results.length - 10} öğrenci daha</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
