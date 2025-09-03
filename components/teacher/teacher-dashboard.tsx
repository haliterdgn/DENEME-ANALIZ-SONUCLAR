"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useExamStore } from "@/lib/stores/exam-store"
import { useUserStore } from "@/lib/stores/user-store"
import { BarChart3, Users, FileText, TrendingUp } from "lucide-react"
import ExamAnalysis from "./exam-analysis"
import StudentProgress from "./student-progress"

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { exams, results } = useExamStore()
  const { users } = useUserStore()

  const students = users.filter((u) => u.role === "student")
  const completedExams = exams.filter((exam) => results.some((result) => result.examId === exam.id))

  const stats = {
    totalExams: exams.length,
    completedExams: completedExams.length,
    totalStudents: students.length,
    averageScore:
      results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)
        : 0,
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Öğretmen Paneli</h1>
        <p className="text-gray-600">Öğrenci performansını izleyin ve sınav sonuçlarını analiz edin</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="exams">Sınav Analizi</TabsTrigger>
          <TabsTrigger value="students">Öğrenci İlerlemesi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Sınav</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalExams}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanan Sınavlar</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedExams}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Öğrenciler</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Son Sınav Sonuçları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.slice(-5).map((result) => {
                    const exam = exams.find((e) => e.id === result.examId)
                    const percentage = Math.round((result.score / result.totalQuestions) * 100)

                    return (
                      <div key={result.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{result.studentName}</p>
                          <p className="text-xs text-gray-500">{exam?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{percentage}%</p>
                          <p className="text-xs text-gray-500">
                            {result.score}/{result.totalQuestions}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sınıf Performans Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedExams.map((exam) => {
                    const examResults = results.filter((r) => r.examId === exam.id)
                    const avgScore =
                      examResults.length > 0
                        ? Math.round(
                            examResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) /
                              examResults.length,
                          )
                        : 0

                    return (
                      <div key={exam.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{exam.name}</p>
                          <p className="text-xs text-gray-500">{examResults.length} öğrenci tamamladı</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{avgScore}%</p>
                          <p className="text-xs text-gray-500">Sınıf Ortalaması</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exams">
          <ExamAnalysis />
        </TabsContent>

        <TabsContent value="students">
          <StudentProgress />
        </TabsContent>
      </Tabs>
    </div>
  )
}
