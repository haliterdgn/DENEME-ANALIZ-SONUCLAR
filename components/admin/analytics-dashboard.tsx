"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExamStore } from "@/lib/stores/exam-store"
import { useUserStore } from "@/lib/stores/user-store"
import { apiClient } from "@/lib/api-client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function AnalyticsDashboard() {
  const { exams, results } = useExamStore()
  const { users } = useUserStore()
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [examAnalysis, setExamAnalysis] = useState<any>(null)
  const [studentResults, setStudentResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Seçilen sınav için analiz yap - Analyze Student Results API kullan
  const handleAnalyzeExam = async () => {
    if (!selectedExam) return
    
    setLoading(true)
    try {
      console.log('🔍 Analyze Student Results başlatılıyor, ExamID:', selectedExam)
      
      const analysisResult = await apiClient.analyzeResults(selectedExam, {
        includeDetails: true
      })
      
      console.log('✅ Analyze Student Results başarılı:', analysisResult)
      
      // Postman collection formatındaki response'u işle
      if (analysisResult) {
        // analysisStats kısmını işle
        if (analysisResult.analysisStats) {
          setExamAnalysis({
            averageScore: analysisResult.analysisStats.averageScore || 0,
            totalStudents: analysisResult.analysisStats.totalStudents || 0,
            passRate: analysisResult.analysisStats.passCount && analysisResult.analysisStats.totalStudents 
              ? (analysisResult.analysisStats.passCount / analysisResult.analysisStats.totalStudents) * 100 
              : 0,
            highestScore: analysisResult.analysisStats.highestScore || 0,
            lowestScore: analysisResult.analysisStats.lowestScore || 0,
            subjectAnalysis: analysisResult.subjectAnalysis || []
          })
        }

        // studentResults kısmını işle
        if (analysisResult.studentResults && analysisResult.studentResults.length > 0) {
          // API formatından frontend formatına dönüştür
          const formattedResults = analysisResult.studentResults.map((student: any) => ({
            studentId: student.studentInfo?.tcKimlikNo || 'unknown',
            studentName: student.studentInfo?.ogrenciAdi || 'Bilinmeyen Öğrenci',
            className: student.studentInfo?.sinif || 'Bilinmeyen Sınıf',
            phone: student.studentInfo?.telefon || '',
            totalScore: student.totalScore || 0,
            totalCorrect: student.totalCorrect || 0,
            totalWrong: student.totalWrong || 0,
            totalEmpty: student.totalEmpty || 0,
            subjectScores: student.subjectScores || [],
            detailedAnswers: student.detailedAnswers || []
          }))
          setStudentResults(formattedResults)
        }
      }
    } catch (error) {
      console.error('❌ Analyze Student Results hatası:', error)
      // Hata durumunda boş sonuçlar göster
      setExamAnalysis({ averageScore: 0, totalStudents: 0, passRate: 0 })
      setStudentResults([])
    } finally {
      setLoading(false)
    }
  }

  // Overall statistics
  const totalStudents = users.filter((u) => u.role === "student").length
  const totalTeachers = users.filter((u) => u.role === "teacher").length
  const completedExams = results.length
  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)
      : 0

  // Exam performance data - Her sınavın ortalama performansı
  const examPerformance = exams.map((exam) => {
    const examResults = results.filter((r) => r.examId === exam.id)
    const avgScore =
      examResults.length > 0
        ? Math.round(examResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / examResults.length)
        : 0

    return {
      name: exam.name.length > 20 ? exam.name.substring(0, 20) + "..." : exam.name,
      averageScore: avgScore,
      studentsCompleted: examResults.length,
      date: exam.date,
    }
  })

  // Score distribution - Puan aralıklarına göre öğrenci dağılımı
  const scoreRanges = [
    { range: "90-100%", count: 0, color: "#22c55e", label: "Mükemmel" },
    { range: "80-89%", count: 0, color: "#3b82f6", label: "Çok İyi" },
    { range: "70-79%", count: 0, color: "#f59e0b", label: "İyi" },
    { range: "60-69%", count: 0, color: "#ef4444", label: "Orta" },
    { range: "0-59%", count: 0, color: "#dc2626", label: "Zayıf" },
  ]

  results.forEach((result) => {
    const percentage = Math.round((result.score / result.totalQuestions) * 100)
    if (percentage >= 90) scoreRanges[0].count++
    else if (percentage >= 80) scoreRanges[1].count++
    else if (percentage >= 70) scoreRanges[2].count++
    else if (percentage >= 60) scoreRanges[3].count++
    else scoreRanges[4].count++
  })

  // Subject performance analysis - Ders bazında başarı analizi
  const subjectPerformance = studentResults.reduce(
    (acc, result) => {
      // subjectScores array olarak geliyor, object değil
      if (Array.isArray(result.subjectScores)) {
        result.subjectScores.forEach((subjectScore: any) => {
          const subject = subjectScore.subjectName
          if (!acc[subject]) {
            acc[subject] = { correct: 0, total: 0, attempts: 0 }
          }
          acc[subject].correct += subjectScore.correct || 0
          acc[subject].total += (subjectScore.correct || 0) + (subjectScore.wrong || 0) + (subjectScore.empty || 0)
          acc[subject].attempts++
        })
      }
      return acc
    },
    {} as Record<string, { correct: number; total: number; attempts: number }>,
  )

  const subjectData = Object.entries(subjectPerformance).map(([subject, data]) => {
    const typedData = data as { correct: number; total: number; attempts: number }
    return {
      subject: subject.length > 15 ? subject.substring(0, 15) + "..." : subject,
      percentage: Math.round((typedData.correct / typedData.total) * 100),
      attempts: typedData.attempts,
      totalQuestions: typedData.total,
    }
  })

  // Monthly performance trend - Aylık performans trendi
  const monthlyData = results.reduce(
    (acc, result) => {
      const date = new Date(result.completedAt)
      const month = date.toLocaleDateString("tr-TR", { year: "numeric", month: "short" })
      if (!acc[month]) {
        acc[month] = { scores: [], count: 0 }
      }
      acc[month].scores.push(Math.round((result.score / result.totalQuestions) * 100))
      acc[month].count++
      return acc
    },
    {} as Record<string, { scores: number[]; count: number }>,
  )

  const trendData = Object.entries(monthlyData)
    .map(([month, data]) => {
      const typedData = data as { scores: number[]; count: number }
      return {
        month,
        averageScore: Math.round(typedData.scores.reduce((sum, score) => sum + score, 0) / typedData.scores.length),
        examCount: typedData.count,
      }
    })
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name && (entry.name.includes("Score") || entry.name.includes("percentage")) ? "%" : ""}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📊 Sistem Analitikleri</h2>
          <p className="text-gray-600 mt-1">Genel performans ve istatistikleri görüntüleyin</p>
        </div>
      </div>

      {/* Sınav Analizi */}
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-800 flex items-center gap-2">
            🎯 Sınav Analizi
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue placeholder="Sınav seçin" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleAnalyzeExam} 
              disabled={!selectedExam || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? '🔄 Analiz yapılıyor...' : '🚀 Analiz Yap'}
            </Button>
          </div>

          {/* Gelişmiş Analiz Sonuçları */}
          {examAnalysis && (
            <div className="space-y-6">
              {/* Ana Metrikler */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-700">
                      {examAnalysis.averageScore || 0}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Ortalama Puan</div>
                    <div className="text-xs text-blue-500 mt-1">
                      {(examAnalysis.averageScore || 0) >= 75 ? '✅ Hedef üstü' : '⚠️ Hedef altı'}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-700">
                      {examAnalysis.totalStudents || 0}
                    </div>
                    <div className="text-sm text-green-600 font-medium">Katılan Öğrenci</div>
                    <div className="text-xs text-green-500 mt-1">
                      Katılım: %{Math.round(((examAnalysis.totalStudents || 0) / totalStudents) * 100)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-purple-700">
                      {examAnalysis.highestScore || 0}
                    </div>
                    <div className="text-sm text-purple-600 font-medium">En Yüksek Puan</div>
                    <div className="text-xs text-purple-500 mt-1">
                      Fark: {(examAnalysis.highestScore || 0) - (examAnalysis.averageScore || 0)} puan
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-orange-700">
                      {examAnalysis.lowestScore || 0}
                    </div>
                    <div className="text-sm text-orange-600 font-medium">En Düşük Puan</div>
                    <div className="text-xs text-orange-500 mt-1">
                      Fark: {(examAnalysis.averageScore || 0) - (examAnalysis.lowestScore || 0)} puan alt
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ders Bazında Detaylı Analiz */}
              {examAnalysis.subjectAnalysis && (
                <Card className="border-2 border-indigo-200">
                  <CardHeader className="bg-indigo-50">
                    <CardTitle className="text-indigo-800">📚 Ders Bazında Detaylı Performans</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {examAnalysis.subjectAnalysis.map((subjectData: any, index: number) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg border border-indigo-200">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-indigo-800">{subjectData.subjectName}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              (subjectData.averageScore || 0) >= 80 ? 'bg-green-100 text-green-800' :
                              (subjectData.averageScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(subjectData.averageScore || 0)}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Doğru: {subjectData.totalCorrect || 0}</span>
                              <span className="text-red-600">Yanlış: {subjectData.totalWrong || 0}</span>
                              <span className="text-gray-600">Boş: {subjectData.totalEmpty || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Soru: {subjectData.totalQuestions || 0}</span>
                              <span>Öğrenci: {subjectData.studentCount || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  (subjectData.averageScore || 0) >= 80 ? 'bg-green-500' :
                                  (subjectData.averageScore || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(subjectData.averageScore || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}



              {/* Gelişmiş Öğrenci Sonuçları */}
              {studentResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      👥 Öğrenci Sonuçları
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Toplam {studentResults.length} öğrenci - En iyi 10 gösteriliyor
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 p-2 text-left font-semibold">Sıra</th>
                            <th className="border border-gray-200 p-2 text-left font-semibold">Ad Soyad</th>
                            <th className="border border-gray-200 p-2 text-left font-semibold">Kitapçık Türü</th>
                            <th className="border border-gray-200 p-2 text-left font-semibold">Doğru</th>
                            <th className="border border-gray-200 p-2 text-left font-semibold">Yanlış</th>
                            <th className="border border-gray-200 p-2 text-left font-semibold">Boş</th>
                            <th className="border border-gray-200 p-2 text-left font-semibold">Puan</th>
                            <th className="border border-gray-200 p-2 text-left font-semibold">Sınıf</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentResults
                            .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                            .slice(0, 10)
                            .map((result, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-200 p-2">
                                  {index + 1}
                                  {index < 3 && (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉')}
                                </td>
                                <td className="border border-gray-200 p-2 font-medium">{result.studentName || 'N/A'}</td>
                                <td className="border border-gray-200 p-2 text-xs">{result.kitapcikTuru || 'N/A'}</td>
                                <td className="border border-gray-200 p-2 text-green-600">{result.totalCorrect || 0}</td>
                                <td className="border border-gray-200 p-2 text-red-600">{result.totalWrong || 0}</td>
                                <td className="border border-gray-200 p-2 text-gray-600">{result.totalEmpty || 0}</td>
                                <td className="border border-gray-200 p-2 font-bold">{result.totalScore || 0}</td>
                                <td className="border border-gray-200 p-2">{result.className || 'N/A'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {studentResults.length > 15 && (
                        <div className="mt-3 p-3 bg-slate-50 rounded">
                          <p className="text-sm text-slate-600 text-center">
                            📊 <strong>{studentResults.length - 15}</strong> öğrenci daha mevcut. 
                            <span className="ml-2 text-slate-500">Tam liste için detay rapor alın.</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-2 bg-blue-50">
            <CardTitle className="text-sm font-medium text-blue-800">👥 Toplam Öğrenci</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600">{totalStudents}</div>
            <p className="text-xs text-blue-600 mt-1">Aktif öğrenci sayısı</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-2 bg-green-50">
            <CardTitle className="text-sm font-medium text-green-800">👩‍🏫 Toplam Öğretmen</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-600">{totalTeachers}</div>
            <p className="text-xs text-green-600 mt-1">Sistem kullanıcısı</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-2 bg-purple-50">
            <CardTitle className="text-sm font-medium text-purple-800">📝 Tamamlanan Sınavlar</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-purple-600">{completedExams}</div>
            <p className="text-xs text-purple-600 mt-1">Toplam sınav sonucu</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-2 bg-orange-50">
            <CardTitle className="text-sm font-medium text-orange-800">📈 Sistem Ortalaması</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-orange-600">{averageScore}%</div>
            <p className="text-xs text-orange-600 mt-1">Genel başarı oranı</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Performance */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-800">📊 Sınav Performans Genel Bakış</CardTitle>
            <p className="text-sm text-blue-600">Her sınavın ortalama başarı oranı</p>
          </CardHeader>
          <CardContent className="pt-6">
            {examPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={examPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tick={{ fill: "#1e40af" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} tick={{ fill: "#1e40af" }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="averageScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ortalama Puan" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Henüz sınav verisi bulunmuyor</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-800">🎯 Puan Dağılımı</CardTitle>
            <p className="text-sm text-green-600">Öğrencilerin başarı seviyelerine göre dağılımı</p>
          </CardHeader>
          <CardContent className="pt-6">
            {scoreRanges.some((r) => r.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scoreRanges.filter((r) => r.count > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({ range, count, label }) => `${label}: ${count}`}
                    labelLine={false}
                  >
                    {scoreRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>Henüz puan verisi bulunmuyor</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      

      {/* Performance Trend */}
      {trendData.length > 0 && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-800">📈 Zaman İçinde Performans Trendi</CardTitle>
            <p className="text-sm text-orange-600">Aylık ortalama başarı oranının değişimi</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: "#ea580c" }} />
                <YAxis fontSize={12} tick={{ fill: "#ea580c" }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: "#f97316", strokeWidth: 2, r: 6 }}
                  name="Ortalama Puan"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800">🏆 En Başarılı Sınavlar</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {examPerformance
                .sort((a, b) => b.averageScore - a.averageScore)
                .slice(0, 5)
                .map((exam, index) => (
                  <div key={exam.name} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
                        <p className="font-medium text-green-800">{exam.name}</p>
                        <p className="text-sm text-green-600">{exam.studentsCompleted} öğrenci tamamladı</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-700">{exam.averageScore}%</p>
                      <p className="text-xs text-green-600">Ortalama</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800">📚 Ders Performans Özeti</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {subjectData
                .sort((a, b) => b.percentage - a.percentage)
                .map((subject, index) => (
                  <div key={`${subject.subject}-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">{subject.subject}</p>
                        <p className="text-sm text-blue-600">{subject.attempts} toplam deneme</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-700">{subject.percentage}%</p>
                      <p className="text-xs text-blue-600">Başarı oranı</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  )
}
