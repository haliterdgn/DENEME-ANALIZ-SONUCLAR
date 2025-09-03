"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useExamStore } from "@/lib/stores/exam-store"
import { useUserStore } from "@/lib/stores/user-store"
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
  const subjectPerformance = results.reduce(
    (acc, result) => {
      Object.entries(result.subjectScores).forEach(([subject, scores]) => {
        if (!acc[subject]) {
          acc[subject] = { correct: 0, total: 0, attempts: 0 }
        }
        acc[subject].correct += scores.correct
        acc[subject].total += scores.total
        acc[subject].attempts++
      })
      return acc
    },
    {} as Record<string, { correct: number; total: number; attempts: number }>,
  )

  const subjectData = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject: subject.length > 15 ? subject.substring(0, 15) + "..." : subject,
    percentage: Math.round((data.correct / data.total) * 100),
    attempts: data.attempts,
    totalQuestions: data.total,
  }))

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
    .map(([month, data]) => ({
      month,
      averageScore: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length),
      examCount: data.count,
    }))
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
              {entry.name.includes("Score") || entry.name.includes("percentage") ? "%" : ""}
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

      {/* Subject Performance */}
      {subjectData.length > 0 && (
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">📚 Ders Performans Analizi</CardTitle>
            <p className="text-sm text-purple-600">Her dersin genel başarı oranı</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={subjectData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis
                  dataKey="subject"
                  fontSize={12}
                  tick={{ fill: "#7c3aed" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis fontSize={12} tick={{ fill: "#7c3aed" }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Başarı Oranı" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
                  <div key={subject.subject} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800 text-center">⚠️ Dikkat Gereken Alanlar</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {subjectData
                .filter((s) => s.percentage < 60)
                .sort((a, b) => a.percentage - b.percentage)
                .slice(0, 3)
                .map((subject) => (
                  <div key={subject.subject} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-800">{subject.subject}</p>
                    <p className="text-sm text-red-600">%{subject.percentage} başarı - İyileştirme gerekli</p>
                  </div>
                ))}
              {subjectData.filter((s) => s.percentage < 60).length === 0 && (
                <p className="text-center text-gray-500 py-4">🎉 Tüm dersler iyi durumda!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-800 text-center">📊 Genel İstatistikler</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700">Toplam Soru:</span>
                <span className="font-bold">{results.reduce((sum, r) => sum + r.totalQuestions, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Doğru Cevap:</span>
                <span className="font-bold text-green-600">{results.reduce((sum, r) => sum + r.score, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Yanlış Cevap:</span>
                <span className="font-bold text-red-600">
                  {results.reduce((sum, r) => sum + (r.totalQuestions - r.score), 0)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-yellow-700">Genel Başarı:</span>
                <span className="font-bold text-lg">{averageScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200">
          <CardHeader className="bg-indigo-50">
            <CardTitle className="text-indigo-800 text-center">🎯 Hedef ve Öneriler</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="p-2 bg-indigo-50 rounded">
                <p className="font-medium text-indigo-800">Hedef Ortalama: 75%</p>
                <p className="text-indigo-600">
                  Mevcut: {averageScore}%{averageScore >= 75 ? " ✅" : ` (${75 - averageScore}% eksik)`}
                </p>
              </div>
              <div className="p-2 bg-indigo-50 rounded">
                <p className="font-medium text-indigo-800">Öneri:</p>
                <p className="text-indigo-600">
                  {averageScore >= 80
                    ? "Mükemmel performans! Devam edin."
                    : averageScore >= 70
                      ? "İyi gidiyor, biraz daha çalışma gerekli."
                      : averageScore >= 60
                        ? "Orta seviye, daha fazla pratik yapın."
                        : "Ciddi çalışma gerekli, öğretmenlerle görüşün."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
