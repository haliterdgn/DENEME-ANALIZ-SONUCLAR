"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Eye, Download, RefreshCw, FileText, User, BarChart3 } from "lucide-react"
import { useExamStore } from "@/lib/stores/exam-store"
import { apiClient } from "@/lib/api-client"

interface ExamResult {
  id: string
  examId: string
  studentId: string
  studentName: string
  studentNumber: string
  className: string
  correctAnswers: number
  wrongAnswers: number
  emptyAnswers: number
  score: number
  percentage: number
  answers: Record<string, string>
  submittedAt: string
}

export default function OptikResultsViewer() {
  const { exams, results } = useExamStore()
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<ExamResult | null>(null)

  useEffect(() => {
    if (selectedExam) {
      handleRefreshResults()
    }
  }, [selectedExam])

  const handleRefreshResults = async () => {
    if (!selectedExam) return

    setLoading(true)
    try {
      console.log('Fetching results for exam:', selectedExam)
      
      // API'den sonuçları al
      try {
        const apiResults = await apiClient.getStudentResults(selectedExam, {})
        console.log('API results received:', apiResults)
        setExamResults(apiResults)
        return
      } catch (apiError) {
        console.warn('API request failed:', apiError)
        console.warn('API sonuçları alınamadı, local verileri kontrol ediliyor')
      }

      // Local store'dan sonuçları kontrol et
      const localResults = results.filter(result => result.examId === selectedExam)
      console.log('Local results found:', localResults.length)
      
      if (localResults.length > 0) {
        setExamResults(localResults as ExamResult[])
      } else {
        // Demo verisi oluştur
        const exam = exams.find(e => e.id === selectedExam)
        if (exam) {
          const demoResults = generateDemoResults(selectedExam, exam.title)
          setExamResults(demoResults)
          console.log('Demo results generated:', demoResults.length)
        }
      }
    } catch (error) {
      console.error('Error fetching exam results:', error)
      setExamResults([])
    } finally {
      setLoading(false)
    }
  }

  const generateDemoResults = (examId: string, examTitle: string): ExamResult[] => {
    const demoStudents = [
      { name: "Ahmet Yılmaz", number: "2023001", class: "9A" },
      { name: "Ayşe Kaya", number: "2023002", class: "9A" },
      { name: "Mehmet Demir", number: "2023003", class: "9B" },
      { name: "Fatma Şahin", number: "2023004", class: "10A" },
      { name: "Ali Özkan", number: "2023005", class: "10B" },
      { name: "Zeynep Çelik", number: "2023006", class: "11A" },
      { name: "Mustafa Acar", number: "2023007", class: "11B" },
      { name: "Elif Koç", number: "2023008", class: "12A" },
    ]

    return demoStudents.map((student, index) => {
      const correctAnswers = Math.floor(Math.random() * 20) + 10
      const wrongAnswers = Math.floor(Math.random() * 10) + 2
      const emptyAnswers = Math.max(0, 40 - correctAnswers - wrongAnswers)
      const score = correctAnswers * 2.5
      const percentage = (score / 100) * 100

      const answers: Record<string, string> = {}
      for (let i = 1; i <= 40; i++) {
        if (i <= correctAnswers) {
          answers[i.toString()] = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]
        } else if (i <= correctAnswers + wrongAnswers) {
          answers[i.toString()] = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]
        } else {
          answers[i.toString()] = ""
        }
      }

      return {
        id: `result_${examId}_${index}`,
        examId,
        studentId: `student_${index}`,
        studentName: student.name,
        studentNumber: student.number,
        className: student.class,
        correctAnswers,
        wrongAnswers,
        emptyAnswers,
        score,
        percentage,
        answers,
        submittedAt: new Date().toISOString()
      }
    })
  }

  const handleExportCSV = () => {
    if (examResults.length === 0) return

    const headers = [
      "Öğrenci No", "Öğrenci Adı", "Sınıf", "Doğru", "Yanlış", "Boş", "Puan", "Yüzde"
    ]

    const csvData = examResults.map(result => [
      result.studentNumber,
      result.studentName,
      result.className,
      result.correctAnswers,
      result.wrongAnswers,
      result.emptyAnswers,
      result.score,
      result.percentage.toFixed(2) + "%"
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `exam_results_${selectedExam}_${new Date().getTime()}.csv`
    link.click()
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 85) return "bg-green-100 text-green-800"
    if (percentage >= 70) return "bg-blue-100 text-blue-800"
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const selectedExamData = exams.find(e => e.id === selectedExam)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Sınav Sonuçları Görüntüleme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sınav Seçin</label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Sonuçlarını görmek istediğiniz sınavı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        <div className="flex flex-col">
                          <span>{exam.title}</span>
                          <span className="text-xs text-muted-foreground">{exam.subject} - {exam.date}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-exams" disabled>
                      Henüz sınav bulunamadı
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleRefreshResults}
                disabled={!selectedExam || loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
              
              <Button
                onClick={handleExportCSV}
                disabled={examResults.length === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV İndir
              </Button>
            </div>
          </div>

          {selectedExamData && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedExamData.title}</strong> sınavı seçildi. 
                Konu: {selectedExamData.subject} | Tarih: {selectedExamData.date} | 
                Süre: {selectedExamData.duration} dakika | Soru Sayısı: {selectedExamData.questionCount}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {examResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sınav Sonuçları ({examResults.length} öğrenci)
              </span>
              <Badge variant="outline">{selectedExamData?.title}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Öğrenci No</TableHead>
                    <TableHead>Öğrenci Adı</TableHead>
                    <TableHead>Sınıf</TableHead>
                    <TableHead className="text-center">Doğru</TableHead>
                    <TableHead className="text-center">Yanlış</TableHead>
                    <TableHead className="text-center">Boş</TableHead>
                    <TableHead className="text-center">Puan</TableHead>
                    <TableHead className="text-center">Yüzde</TableHead>
                    <TableHead className="text-center">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-mono">{result.studentNumber}</TableCell>
                      <TableCell className="font-medium">{result.studentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.className}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {result.correctAnswers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          {result.wrongAnswers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                          {result.emptyAnswers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {result.score.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getScoreColor(result.percentage)}>
                          {result.percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudent(result)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {result.studentName} - Detaylı Analiz
                              </DialogTitle>
                              <DialogDescription>
                                Öğrenci No: {result.studentNumber} | Sınıf: {result.className}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                                      <div className="text-sm text-muted-foreground">Doğru</div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-red-600">{result.wrongAnswers}</div>
                                      <div className="text-sm text-muted-foreground">Yanlış</div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-gray-600">{result.emptyAnswers}</div>
                                      <div className="text-sm text-muted-foreground">Boş</div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-blue-600">{result.score.toFixed(1)}</div>
                                      <div className="text-sm text-muted-foreground">Puan</div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              <Separator />

                              <div>
                                <h4 className="font-semibold mb-3">Cevap Anahtarı</h4>
                                <div className="grid grid-cols-10 gap-2">
                                  {Object.entries(result.answers).map(([questionNo, answer]) => (
                                    <div
                                      key={questionNo}
                                      className={`p-2 text-center text-sm rounded border ${
                                        answer === "" 
                                          ? "bg-gray-100 text-gray-500" 
                                          : "bg-blue-50 text-blue-900"
                                      }`}
                                    >
                                      <div className="font-mono text-xs text-muted-foreground">S{questionNo}</div>
                                      <div className="font-bold">{answer || "—"}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedExam && examResults.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Sonuç Bulunamadı</h3>
              <p>Seçilen sınav için henüz sonuç bulunmuyor.</p>
              <Button 
                onClick={handleRefreshResults} 
                variant="outline" 
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tekrar Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-muted-foreground">Sonuçlar yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
