"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useExamStore } from "@/lib/stores/exam-store"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export default function ExamAnalysis() {
  const [selectedExam, setSelectedExam] = useState<string>("")
  const { exams, getResultsByExamId, getBookletByExamId } = useExamStore()

  const examResults = selectedExam ? getResultsByExamId(selectedExam) : []
  const selectedExamData = exams.find((e) => e.id === selectedExam)
  const booklet = selectedExam ? getBookletByExamId(selectedExam) : null

  // Calculate statistics
  const stats = {
    totalStudents: examResults.length,
    averageScore:
      examResults.length > 0
        ? Math.round(examResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / examResults.length)
        : 0,
    highestScore:
      examResults.length > 0 ? Math.max(...examResults.map((r) => Math.round((r.score / r.totalQuestions) * 100))) : 0,
    lowestScore:
      examResults.length > 0 ? Math.min(...examResults.map((r) => Math.round((r.score / r.totalQuestions) * 100))) : 0,
  }

  // Score distribution
  const scoreRanges = [
    { range: "90-100%", count: 0, color: "#22c55e" },
    { range: "80-89%", count: 0, color: "#3b82f6" },
    { range: "70-79%", count: 0, color: "#f59e0b" },
    { range: "60-69%", count: 0, color: "#ef4444" },
    { range: "Below 60%", count: 0, color: "#dc2626" },
  ]

  examResults.forEach((result) => {
    const percentage = Math.round((result.score / result.totalQuestions) * 100)
    if (percentage >= 90) scoreRanges[0].count++
    else if (percentage >= 80) scoreRanges[1].count++
    else if (percentage >= 70) scoreRanges[2].count++
    else if (percentage >= 60) scoreRanges[3].count++
    else scoreRanges[4].count++
  })

  // Subject performance analysis
  const subjectPerformance = examResults.reduce(
    (acc, result) => {
      Object.entries(result.subjectScores).forEach(([subject, scores]) => {
        if (!acc[subject]) {
          acc[subject] = { correct: 0, total: 0, students: 0 }
        }
        acc[subject].correct += scores.correct
        acc[subject].total += scores.total
        acc[subject].students++
      })
      return acc
    },
    {} as Record<string, { correct: number; total: number; students: number }>,
  )

  const subjectData = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject,
    percentage: Math.round((data.correct / data.total) * 100),
    avgCorrect: Math.round(data.correct / data.students),
    totalQuestions: Math.round(data.total / data.students),
  }))

  // Topic analysis
  const topicPerformance = examResults.reduce(
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

  const difficultTopics = Object.entries(topicPerformance)
    .map(([topic, scores]) => ({
      topic,
      percentage: Math.round((scores.correct / scores.total) * 100),
      totalAttempts: scores.total,
    }))
    .filter((t) => t.totalAttempts >= 3) // Only show topics attempted by multiple students
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sınav Analizi</h2>
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Analiz edilecek sınavı seçin" />
          </SelectTrigger>
          <SelectContent>
            {exams.map((exam) => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedExam && selectedExamData ? (
        <div className="space-y-6">
          {/* Exam Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedExamData.name} - Genel Bakış</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-600">Öğrenci</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  <p className="text-sm text-gray-600">Ortalama Puan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.highestScore}%</p>
                  <p className="text-sm text-gray-600">En Yüksek Puan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.lowestScore}%</p>
                  <p className="text-sm text-gray-600">En Düşük Puan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Puan Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scoreRanges}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Not Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scoreRanges.filter((r) => r.count > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ range, count }) => `${range}: ${count}`}
                    >
                      {scoreRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Subject Performance */}
          {subjectData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ders Performans Analizi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectData.map((subject) => (
                    <div key={subject.subject} className="p-4 border rounded-lg">
                      <h4 className="font-semibold">{subject.subject}</h4>
                      <div className="mt-2 space-y-1 text-sm">
                        <p>
                          Sınıf Ortalaması: <span className="font-medium">{subject.percentage}%</span>
                        </p>
                        <p>
                          Ort. Doğru:{" "}
                          <span className="font-medium">
                            {subject.avgCorrect}/{subject.totalQuestions}
                          </span>
                        </p>
                        <Badge
                          variant={
                            subject.percentage >= 80
                              ? "default"
                              : subject.percentage >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {subject.percentage >= 80
                            ? "Güçlü"
                            : subject.percentage >= 60
                              ? "Ortalama"
                              : "Odaklanma Gerekli"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Difficult Topics */}
          {difficultTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>En Zorlu Konular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {difficultTopics.map((topic, index) => (
                    <div key={topic.topic} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          #{index + 1} {topic.topic}
                        </p>
                        <p className="text-sm text-gray-600">{topic.totalAttempts} toplam deneme</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{topic.percentage}%</p>
                        <Badge variant="destructive">Zor</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Student Results */}
          <Card>
            <CardHeader>
              <CardTitle>Bireysel Öğrenci Performansı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {examResults
                  .sort((a, b) => b.score / b.totalQuestions - a.score / a.totalQuestions)
                  .map((result, index) => {
                    const percentage = Math.round((result.score / result.totalQuestions) * 100)
                    return (
                      <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{result.studentName}</p>
                            <p className="text-sm text-gray-600">
                              {result.score}/{result.totalQuestions} doğru
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{percentage}%</p>
                          <Badge
                            variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}
                          >
                            {percentage >= 80 ? "Mükemmel" : percentage >= 60 ? "İyi" : "Yardım Gerekli"}
                          </Badge>
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
            <p className="text-gray-500">Detaylı analiz için bir sınav seçin</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
