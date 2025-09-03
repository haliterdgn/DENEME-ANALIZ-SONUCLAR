"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExamStore } from "@/lib/stores/exam-store"
import { Eye, Download, FileText, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function OptikResultsViewer() {
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")

  const { exams, getResultsByExamId, getBookletByExamId, results } = useExamStore()

  const examResults = selectedExam ? getResultsByExamId(selectedExam) : []
  const selectedExamData = exams.find((e) => e.id === selectedExam)
  const booklet = selectedExam ? getBookletByExamId(selectedExam) : null
  const selectedStudentResult = examResults.find((r) => r.id === selectedStudent)

  const exportResults = () => {
    if (!examResults.length) return

    const csvContent = [
      ["Öğrenci Adı", "Öğrenci No", "Toplam Puan", "Doğru Sayısı", "Yanlış Sayısı", "Yüzde"].join(","),
      ...examResults.map((result) =>
        [
          result.studentName,
          (result as any).studentNumber || "Bilinmiyor",
          `${result.score}/${result.totalQuestions}`,
          result.score,
          result.totalQuestions - result.score,
          Math.round((result.score / result.totalQuestions) * 100) + "%",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedExamData?.name || "sinav"}_sonuclari.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📊 Optik Sonuçları Görüntüle</h2>
          <p className="text-gray-600 mt-1">Yüklenen optik formların sonuçlarını detaylı olarak inceleyin</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="📋 Sonuçlarını görmek istediğiniz sınavı seçin" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => {
                const examResultCount = getResultsByExamId(exam.id).length
                return (
                  <SelectItem key={exam.id} value={exam.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{exam.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {examResultCount} sonuç
                      </Badge>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {examResults.length > 0 && (
            <Button onClick={exportResults} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              CSV İndir
            </Button>
          )}
        </div>
      </div>

      {selectedExam && selectedExamData ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Detaylı Görünüm
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cevap Karşılaştırma
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    {selectedExamData.name} - Sonuç Özeti
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">{examResults.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Toplam Öğrenci</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        {examResults.length > 0
                          ? Math.round(
                              examResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) /
                                examResults.length,
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Sınıf Ortalaması</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">
                        {examResults.length > 0
                          ? Math.max(...examResults.map((r) => Math.round((r.score / r.totalQuestions) * 100)))
                          : 0}
                        %
                      </p>
                      <p className="text-sm text-gray-600 mt-1">En Yüksek Puan</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">
                        {examResults.length > 0
                          ? Math.min(...examResults.map((r) => Math.round((r.score / r.totalQuestions) * 100)))
                          : 0}
                        %
                      </p>
                      <p className="text-sm text-gray-600 mt-1">En Düşük Puan</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">🏆 Öğrenci Sıralaması</h3>
                    {examResults
                      .sort((a, b) => b.score / b.totalQuestions - a.score / a.totalQuestions)
                      .map((result, index) => {
                        const percentage = Math.round((result.score / result.totalQuestions) * 100)
                        return (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : index === 1
                                      ? "bg-gray-100 text-gray-800"
                                      : index === 2
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{result.studentName}</p>
                                <p className="text-sm text-gray-600">
                                  No: {(result as any).studentNumber || "Bilinmiyor"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="font-bold text-xl">
                                  {result.score}/{result.totalQuestions}
                                </p>
                                <p className="text-sm text-gray-600">{percentage}% başarı</p>
                              </div>
                              <Badge
                                variant={
                                  percentage >= 85
                                    ? "default"
                                    : percentage >= 70
                                      ? "secondary"
                                      : percentage >= 50
                                        ? "outline"
                                        : "destructive"
                                }
                                className="text-sm px-3 py-1"
                              >
                                {percentage >= 85
                                  ? "🏆 Mükemmel"
                                  : percentage >= 70
                                    ? "👍 İyi"
                                    : percentage >= 50
                                      ? "📈 Orta"
                                      : "📉 Geliştirilmeli"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedStudent(result.id)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Detay
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            {selectedStudentResult ? (
              <Card className="border-2 border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    {selectedStudentResult.studentName} - Detaylı Analiz
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold mb-4 text-lg flex items-center gap-2">📚 Ders Bazında Performans</h4>
                      <div className="space-y-3">
                        {Object.entries(selectedStudentResult.subjectScores).map(([subject, scores]) => {
                          const percentage = Math.round((scores.correct / scores.total) * 100)
                          return (
                            <div key={subject} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{subject}</span>
                                <Badge
                                  variant={
                                    percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"
                                  }
                                >
                                  {percentage}%
                                </Badge>
                              </div>
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Doğru: {scores.correct}</span>
                                <span>Toplam: {scores.total}</span>
                                <span>Yanlış: {scores.total - scores.correct}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className={`h-2 rounded-full ${percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4 text-lg flex items-center gap-2">🎯 Konu Bazında Performans</h4>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {Object.entries(selectedStudentResult.topicScores).map(([topic, scores]) => {
                          const isCorrect = scores.correct === scores.total
                          return (
                            <div
                              key={topic}
                              className={`p-3 rounded-lg border ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{topic}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">
                                    {scores.correct}/{scores.total}
                                  </span>
                                  <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStudent("")}
                        className="flex items-center gap-2"
                      >
                        ← Geri Dön
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                        Bu Öğrencinin Raporunu İndir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Öğrenci Seçin</h3>
                    <p className="text-gray-500">Detaylı analiz için yukarıdaki listeden bir öğrenci seçin</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comparison">
            {booklet && (
              <Card className="border-2 border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Soru Bazında Cevap Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                          <th className="text-left p-4 font-semibold">Soru No</th>
                          <th className="text-left p-4 font-semibold">Doğru Cevap</th>
                          <th className="text-left p-4 font-semibold">Konu</th>
                          <th className="text-left p-4 font-semibold">Ders</th>
                          <th className="text-center p-4 font-semibold">✅ Doğru</th>
                          <th className="text-center p-4 font-semibold">❌ Yanlış</th>
                          <th className="text-center p-4 font-semibold">Başarı Oranı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booklet.questions.map((question) => {
                          const correctCount = examResults.filter(
                            (result) => result.answers[question.questionNumber] === question.correctAnswer,
                          ).length
                          const wrongCount = examResults.length - correctCount
                          const successRate =
                            examResults.length > 0 ? Math.round((correctCount / examResults.length) * 100) : 0

                          return (
                            <tr key={question.questionNumber} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="p-4">
                                <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold">
                                  {question.questionNumber}
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="font-bold text-lg px-3 py-1">
                                  {question.correctAnswer}
                                </Badge>
                              </td>
                              <td className="p-4 text-gray-700 font-medium">{question.topic}</td>
                              <td className="p-4">
                                <Badge variant="secondary">{question.subject}</Badge>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-green-600 font-bold text-lg">{correctCount}</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="text-red-600 font-bold text-lg">{wrongCount}</span>
                              </td>
                              <td className="p-4 text-center">
                                <Badge
                                  variant={
                                    successRate >= 80
                                      ? "default"
                                      : successRate >= 60
                                        ? "secondary"
                                        : successRate >= 40
                                          ? "outline"
                                          : "destructive"
                                  }
                                  className="font-bold"
                                >
                                  {successRate}%
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">📊 Analiz Özeti</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">En Kolay Soru:</span>
                        <span className="font-medium ml-2">
                          {
                            booklet.questions.reduce((max, q) => {
                              const rate = Math.round(
                                (examResults.filter((r) => r.answers[q.questionNumber] === q.correctAnswer).length /
                                  examResults.length) *
                                  100,
                              )
                              const maxRate = Math.round(
                                (examResults.filter((r) => r.answers[max.questionNumber] === max.correctAnswer).length /
                                  examResults.length) *
                                  100,
                              )
                              return rate > maxRate ? q : max
                            }).questionNumber
                          }
                          . Soru
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">En Zor Soru:</span>
                        <span className="font-medium ml-2">
                          {
                            booklet.questions.reduce((min, q) => {
                              const rate = Math.round(
                                (examResults.filter((r) => r.answers[q.questionNumber] === q.correctAnswer).length /
                                  examResults.length) *
                                  100,
                              )
                              const minRate = Math.round(
                                (examResults.filter((r) => r.answers[min.questionNumber] === min.correctAnswer).length /
                                  examResults.length) *
                                  100,
                              )
                              return rate < minRate ? q : min
                            }).questionNumber
                          }
                          . Soru
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Genel Başarı:</span>
                        <span className="font-medium ml-2">
                          {Math.round(
                            booklet.questions.reduce((sum, q) => {
                              return (
                                sum +
                                (examResults.filter((r) => r.answers[q.questionNumber] === q.correctAnswer).length /
                                  examResults.length) *
                                  100
                              )
                            }, 0) / booklet.questions.length,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-2 border-gray-200">
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <FileText className="h-20 w-20 mx-auto mb-6 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-3">Sınav Seçin</h3>
              <p className="text-gray-500 max-w-md">
                Optik sonuçlarını görüntülemek için yukarıdan bir sınav seçin. Seçtiğiniz sınavın detaylı analizi burada
                görünecek.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
