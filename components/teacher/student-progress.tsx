"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useExamStore } from "@/lib/stores/exam-store"
import { useUserStore } from "@/lib/stores/user-store"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export default function StudentProgress() {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const { exams, getResultsByStudentId } = useExamStore()
  const { users } = useUserStore()

  const students = users.filter((u) => u.role === "student")
  const studentResults = selectedStudent ? getResultsByStudentId(selectedStudent) : []
  const selectedStudentData = students.find((s) => s.id === selectedStudent)

  // Prepare progress data
  const progressData = studentResults
    .map((result) => {
      const exam = exams.find((e) => e.id === result.examId)
      return {
        examName: exam?.name || "Unknown Exam",
        score: Math.round((result.score / result.totalQuestions) * 100),
        date: new Date(result.completedAt).toLocaleDateString(),
        timestamp: new Date(result.completedAt).getTime(),
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)

  // Calculate trend
  const getTrend = () => {
    if (progressData.length < 2) return "stable"
    const recent = progressData.slice(-3)
    const older = progressData.slice(-6, -3)

    if (recent.length === 0 || older.length === 0) return "stable"

    const recentAvg = recent.reduce((sum, r) => sum + r.score, 0) / recent.length
    const olderAvg = older.reduce((sum, r) => sum + r.score, 0) / older.length

    if (recentAvg > olderAvg + 5) return "improving"
    if (recentAvg < olderAvg - 5) return "declining"
    return "stable"
  }

  const trend = getTrend()

  // Subject performance over time
  const subjectProgress = studentResults.reduce(
    (acc, result) => {
      Object.entries(result.subjectScores).forEach(([subject, scores]) => {
        if (!acc[subject]) acc[subject] = []
        acc[subject].push({
          examName: exams.find((e) => e.id === result.examId)?.name || "Unknown",
          percentage: Math.round((scores.correct / scores.total) * 100),
          date: result.completedAt,
        })
      })
      return acc
    },
    {} as Record<string, Array<{ examName: string; percentage: number; date: string }>>,
  )

  // Weak areas analysis
  const weakAreas = studentResults.reduce(
    (acc, result) => {
      Object.entries(result.topicScores).forEach(([topic, scores]) => {
        if (!acc[topic]) {
          acc[topic] = { correct: 0, total: 0 }
        }
        acc[topic].correct += scores.correct
        acc[topic].total += scores.total
      })
      return acc
    },
    {} as Record<string, { correct: number; total: number }>,
  )

  const weakTopics = Object.entries(weakAreas)
    .map(([topic, scores]) => ({
      topic,
      percentage: Math.round((scores.correct / scores.total) * 100),
    }))
    .filter((t) => t.percentage < 70)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Öğrenci İlerleme Takibi</h2>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Bir öğrenci seçin" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudent && selectedStudentData ? (
        <div className="space-y-6">
          {/* Student Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedStudentData.name} - İlerleme Genel Bakış</span>
                <div className="flex items-center space-x-2">
                  {trend === "improving" && <TrendingUp className="h-5 w-5 text-green-600" />}
                  {trend === "declining" && <TrendingDown className="h-5 w-5 text-red-600" />}
                  {trend === "stable" && <Minus className="h-5 w-5 text-gray-600" />}
                  <Badge
                    variant={trend === "improving" ? "default" : trend === "declining" ? "destructive" : "secondary"}
                  >
                    {trend === "improving" ? "Gelişiyor" : trend === "declining" ? "Düşüyor" : "Sabit"}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{studentResults.length}</p>
                  <p className="text-sm text-gray-600">Tamamlanan Sınavlar</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {studentResults.length > 0
                      ? Math.round(
                          studentResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) /
                            studentResults.length,
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-600">Ortalama Puan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {studentResults.length > 0
                      ? Math.max(...studentResults.map((r) => Math.round((r.score / r.totalQuestions) * 100)))
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-600">En İyi Puan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{weakTopics.length}</p>
                  <p className="text-sm text-gray-600">Zayıf Alanlar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Zaman İçinde Puan İlerlemesi</CardTitle>
            </CardHeader>
            <CardContent>
              {progressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="examName" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ fill: "#8884d8", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Bu öğrenci için sınav verisi bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Performance */}
          {Object.keys(subjectProgress).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ders Performans Trendleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(subjectProgress).map(([subject, data]) => {
                    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    const latestScore = sortedData[sortedData.length - 1]?.percentage || 0

                    return (
                      <div key={subject} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">{subject}</h4>
                          <Badge
                            variant={latestScore >= 80 ? "default" : latestScore >= 60 ? "secondary" : "destructive"}
                          >
                            Son: {latestScore}%
                          </Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={sortedData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="examName" fontSize={12} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="percentage" stroke="#82ca9d" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weak Areas */}
          {weakTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Dikkat Gereken Alanlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weakTopics.map((topic, index) => (
                    <div
                      key={topic.topic}
                      className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50"
                    >
                      <div>
                        <p className="font-medium">
                          #{index + 1} {topic.topic}
                        </p>
                        <p className="text-sm text-gray-600">Odaklanmış pratik gerektirir</p>
                      </div>
                      <Badge variant="destructive">{topic.percentage}%</Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📚 Öneriler: {selectedStudentData.name}:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Çalışma seanslarında yukarıda listelenen konulara odaklanın</li>
                    <li>• Zayıf alanlar için ek pratik problemler sağlayın</li>
                    <li>• %50'nin altındaki konular için birebir özel ders düşünün</li>
                    <li>• Gelişimi izlemek için düzenli kontroller planlayın</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Exam History */}
          <Card>
            <CardHeader>
              <CardTitle>Detaylı Sınav Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentResults
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .map((result) => {
                    const exam = exams.find((e) => e.id === result.examId)
                    const percentage = Math.round((result.score / result.totalQuestions) * 100)

                    return (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{exam?.name}</h4>
                            <p className="text-sm text-gray-600">
                              Tamamlanma tarihi {new Date(result.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}
                          >
                            {percentage}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-2">Ders Performansı:</p>
                            <div className="space-y-1">
                              {Object.entries(result.subjectScores).map(([subject, scores]) => (
                                <div key={subject} className="flex justify-between">
                                  <span>{subject}:</span>
                                  <span>
                                    {scores.correct}/{scores.total} ({Math.round((scores.correct / scores.total) * 100)}
                                    %)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="font-medium mb-2">En Zayıf Konular:</p>
                            <div className="space-y-1">
                              {Object.entries(result.topicScores)
                                .filter(([_, scores]) => scores.correct / scores.total < 0.7)
                                .slice(0, 3)
                                .map(([topic, scores]) => (
                                  <div key={topic} className="flex justify-between text-red-600">
                                    <span className="truncate">{topic}:</span>
                                    <span>
                                      {scores.correct}/{scores.total}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-gray-500">İlerlemesini görüntülemek için bir öğrenci seçin</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
