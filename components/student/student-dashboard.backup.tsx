"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api-client"
import {
  BarChart3,
  TrendingUp,
  Target,
  BookOpen,
  Trophy,
  Star,
  Calendar,
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Users,
  Eye,
  GraduationCap,
  Award,
  RefreshCw
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import StudentExamDetail from "./student-exam-detail"

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedExamDetail, setSelectedExamDetail] = useState<string | null>(null)
  const [studentResults, setStudentResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuthStore()

  useEffect(() => {
    if (user && user.username) {
      loadStudentResults()
    }
  }, [user])

  const loadStudentResults = async () => {
    if (!user?.username) return

    try {
      setLoading(true)
      setError("")
      const results = await apiClient.getStudentResultsByNumber(user.username)
      setStudentResults(results)
      console.log('✅ Öğrenci sonuçları yüklendi:', results)
    } catch (error) {
      console.error('❌ Öğrenci sonuçları yüklenemedi:', error)
      setError('Sınav sonuçlarınız yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const completedExams = studentResults.length
    const averageScore = studentResults.length > 0 
    ? Math.round(studentResults.reduce((sum, result) => sum + (result.correctAnswers || 0), 0) / studentResults.length)
    : 0

  const totalQuestions = studentResults.length > 0
    ? Math.round(studentResults.reduce((sum, result) => sum + (result.totalQuestions || 0), 0) / studentResults.length)
    : 0

  const successRate = totalQuestions > 0 ? Math.round((averageScore / totalQuestions) * 100) : 0

  // Sınıf içindeki sıralama hesaplama
  const allStudents = users.filter((u) => u.role === "student")
  const studentAverages = allStudents
    .map((student) => {
      const studentResults = getResultsByStudentId(student.id)
      const avg =
        studentResults.length > 0
          ? Math.round(
              studentResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / studentResults.length,
            )
          : 0
      return { student, average: avg, examCount: studentResults.length }
    })
    .filter((s) => s.examCount > 0)
    .sort((a, b) => b.average - a.average)

  const myRank = studentAverages.findIndex((s) => s.student.id === user.id) + 1
  const totalActiveStudents = studentAverages.length

  // Progress data
  const progressData = myResults
    .map((result, index) => {
      const exam = exams.find((e) => e.id === result.examId)
      return {
        exam: exam?.name || `Exam ${index + 1}`,
        score: Math.round((result.score / result.totalQuestions) * 100),
        date: new Date(result.completedAt).toLocaleDateString(),
        timestamp: new Date(result.completedAt).getTime(),
        correctAnswers: result.score,
        totalQuestions: result.totalQuestions,
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)

  // Subject performance analysis
  const subjectPerformance = myResults.reduce(
    (acc, result) => {
      Object.entries(result.subjectScores).forEach(([subject, scores]) => {
        if (!acc[subject]) {
          acc[subject] = { correct: 0, total: 0, attempts: 0 }
        }
        const scoreData = scores as { correct: number; total: number }
        acc[subject].correct += scoreData.correct
        acc[subject].total += scoreData.total
        acc[subject].attempts++
      })
      return acc
    },
    {} as Record<string, { correct: number; total: number; attempts: number }>,
  )

  const subjectData = Object.entries(subjectPerformance).map(([subject, data]) => {
    const subjectInfo = data as { correct: number; total: number; attempts: number }
    return {
      subject,
      percentage: Math.round((subjectInfo.correct / subjectInfo.total) * 100),
      correct: subjectInfo.correct,
      total: subjectInfo.total,
      attempts: subjectInfo.attempts,
    }
  })

  // Radar chart data for skills
  const skillsData = subjectData.map((subject) => ({
    subject: subject.subject,
    score: subject.percentage,
    fullMark: 100,
  }))

  // Topic performance analysis
  const topicPerformance = myResults.reduce(
    (acc, result) => {
      Object.entries(result.topicScores).forEach(([topic, scores]) => {
        if (!acc[topic]) {
          acc[topic] = { correct: 0, total: 0 }
        }
        const topicScoreData = scores as { correct: number; total: number }
        acc[topic].correct += topicScoreData.correct
        acc[topic].total += topicScoreData.total
      })
      return acc
    },
    {} as Record<string, { correct: number; total: number }>,
  )

  const weakTopics = Object.entries(topicPerformance)
    .map(([topic, scores]) => {
      const topicData = scores as { correct: number; total: number }
      return {
        topic,
        percentage: Math.round((topicData.correct / topicData.total) * 100),
        correct: topicData.correct,
        total: topicData.total,
      }
    })
    .filter((t) => t.total >= 2) // En az 2 soru çözülmüş konular
    .sort((a, b) => a.percentage - b.percentage)

  const strongTopics = Object.entries(topicPerformance)
    .map(([topic, scores]) => {
      const topicData = scores as { correct: number; total: number }
      return {
        topic,
        percentage: Math.round((topicData.correct / topicData.total) * 100),
        correct: topicData.correct,
        total: topicData.total,
      }
    })
    .filter((t) => t.percentage >= 80 && t.total >= 2)
    .sort((a, b) => b.percentage - a.percentage)

  // Performance trend analysis
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

  // Achievement badges
  const achievements = [
    {
      id: "first_exam",
      name: "İlk Adım",
      description: "İlk sınavını tamamladın!",
      icon: "🎯",
      earned: completedExams >= 1,
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "high_scorer",
      name: "Yüksek Performans",
      description: "90% üzeri puan aldın!",
      icon: "🏆",
      earned: myResults.some((r) => (r.score / r.totalQuestions) * 100 >= 90),
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "consistent",
      name: "Tutarlı Başarı",
      description: "5 sınav tamamladın!",
      icon: "⭐",
      earned: completedExams >= 5,
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "improver",
      name: "Gelişim Ustası",
      description: "Performansın sürekli artıyor!",
      icon: "📈",
      earned: trend === "improving",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "top_student",
      name: "Sınıf Lideri",
      description: "Sınıfta ilk 3'tesin!",
      icon: "👑",
      earned: myRank <= 3 && myRank > 0,
      color: "bg-orange-100 text-orange-800",
    },
  ]

  const earnedAchievements = achievements.filter((a) => a.earned)

  // Study recommendations
  const getStudyRecommendations = () => {
    const recommendations = []

    if (averageScore < 60) {
      recommendations.push({
        type: "urgent",
        title: "Temel Konulara Odaklan",
        description: "Önce temel konuları pekiştir, sonra ileri konulara geç.",
        icon: "🚨",
        color: "bg-red-50 border-red-200 text-red-800",
      })
    }

    if (weakTopics.length > 0) {
      recommendations.push({
        type: "improvement",
        title: `${weakTopics[0].topic} Konusunu Çalış`,
        description: `Bu konuda %${weakTopics[0].percentage} başarın var. Daha fazla pratik yap.`,
        icon: "📚",
        color: "bg-orange-50 border-orange-200 text-orange-800",
      })
    }

    if (trend === "declining") {
      recommendations.push({
        type: "warning",
        title: "Performans Düşüşü",
        description: "Son sınavlarda performansın düştü. Çalışma planını gözden geçir.",
        icon: "⚠️",
        color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      })
    }

    if (averageScore >= 80) {
      recommendations.push({
        type: "advanced",
        title: "İleri Seviye Sorular",
        description: "Harika gidiyorsun! Artık daha zor sorularla kendini test et.",
        icon: "🎯",
        color: "bg-blue-50 border-blue-200 text-blue-800",
      })
    }

    return recommendations
  }

  const studyRecommendations = getStudyRecommendations()

  // Goal setting
  const currentGoal = 85 // Hedef puan
  const goalProgress = Math.min((averageScore / currentGoal) * 100, 100)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎓 Öğrenci Panelim</h1>
            <p className="text-gray-600">
              Merhaba {user.name}! Performansını detaylı olarak incele ve gelişim alanlarını keşfet.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Sınıf Sıralaması</div>
            <div className="text-2xl font-bold text-blue-600">
              {myRank > 0 ? `${myRank}/${totalActiveStudents}` : "Henüz sıralama yok"}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">📊 Genel Bakış</TabsTrigger>
          <TabsTrigger value="exams">📝 Sınavlarım</TabsTrigger>
          <TabsTrigger value="detailed">🔍 Detaylı Analiz</TabsTrigger>
          <TabsTrigger value="progress">📈 İlerleme</TabsTrigger>
          <TabsTrigger value="subjects">📚 Dersler</TabsTrigger>
          <TabsTrigger value="achievements">🏆 Başarılar</TabsTrigger>
          <TabsTrigger value="study">📖 Çalışma Planı</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50">
                <CardTitle className="text-sm font-medium text-blue-800">Tamamlanan Sınavlar</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-blue-600">{completedExams}</div>
                <p className="text-xs text-blue-600 mt-1">
                  {completedExams > 0 ? "Harika! Devam et" : "İlk sınavını tamamla"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50">
                <CardTitle className="text-sm font-medium text-green-800">Ortalama Puanım</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-green-600">{averageScore}%</div>
                <div className="flex items-center mt-1">
                  {trend === "improving" && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                  {trend === "declining" && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                  <p className="text-xs text-green-600">
                    {trend === "improving" ? "Yükselişte!" : trend === "declining" ? "Düşüşte" : "Sabit"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50">
                <CardTitle className="text-sm font-medium text-purple-800">Sınıf Sıralaması</CardTitle>
                <Trophy className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-purple-600">{myRank > 0 ? `#${myRank}` : "N/A"}</div>
                <p className="text-xs text-purple-600 mt-1">{totalActiveStudents} öğrenci arasında</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50">
                <CardTitle className="text-sm font-medium text-orange-800">Güçlü Alanlar</CardTitle>
                <Star className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-orange-600">{strongTopics.length}</div>
                <p className="text-xs text-orange-600 mt-1">Konuda uzmanlaştın</p>
              </CardContent>
            </Card>
          </div>

          {/* Goal Progress */}
          <Card className="border-2 border-indigo-200">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Target className="h-5 w-5" />
                Hedef Takibi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Hedef Ortalama: {currentGoal}%</span>
                  <span className="text-sm text-gray-600">Mevcut: {averageScore}%</span>
                </div>
                <Progress value={goalProgress} className="h-3" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Başlangıç</span>
                  <span>{Math.round(goalProgress)}% tamamlandı</span>
                  <span>Hedef</span>
                </div>
                {averageScore >= currentGoal ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">🎉 Tebrikler! Hedefine ulaştın!</p>
                    <p className="text-green-600 text-sm">Yeni hedef belirleyebilirsin: 90%</p>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 font-medium">💪 Hedefe {currentGoal - averageScore} puan kaldı!</p>
                    <p className="text-blue-600 text-sm">Düzenli çalışarak hedefe ulaşabilirsin.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">📈 Son Performansım</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={progressData.slice(-5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" fontSize={12} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{ fill: "#22c55e", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>İlk sınavını tamamla</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-800">🎯 Beceri Haritam</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {skillsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={skillsData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" fontSize={12} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
                      <Radar
                        name="Performans"
                        dataKey="score"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Beceri haritası oluşturuluyor...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exams" className="space-y-6">
          <div className="grid gap-4">
            {myResults.length > 0 ? (
              myResults.map((result) => {
                const exam = exams.find(e => e.id === result.examId)
                const percentage = Math.round((result.score / result.totalQuestions) * 100)
                
                return (
                  <Card key={result.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <span className="text-xl">{exam?.name || 'Bilinmeyen Sınav'}</span>
                            <Badge variant={percentage >= 85 ? "default" : percentage >= 70 ? "secondary" : percentage >= 50 ? "outline" : "destructive"}>
                              {percentage}%
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-6 text-sm text-gray-600 mt-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(result.completedAt).toLocaleDateString("tr-TR")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              <span>{result.score}/{result.totalQuestions} Doğru</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4" />
                              <span>
                                {percentage >= 85 ? "Mükemmel" : 
                                 percentage >= 70 ? "İyi" : 
                                 percentage >= 50 ? "Orta" : "Geliştirilmeli"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => setSelectedExamDetail(result.examId)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detayları Gör
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">Başarı Oranı</span>
                            <span className="text-sm font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                percentage >= 85 ? 'bg-green-500' :
                                percentage >= 70 ? 'bg-blue-500' :
                                percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {result.subjectScores && (
                          <div>
                            <h4 className="font-medium mb-2">Ders Bazında Performans:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {Object.entries(result.subjectScores).map(([subject, scores]) => {
                                const scoreData = scores as { correct: number; total: number }
                                const subjectPercentage = scoreData.total > 0 ? Math.round((scoreData.correct / scoreData.total) * 100) : 0
                                return (
                                  <div key={subject} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium">{subject}</span>
                                    <div className="text-right">
                                      <div className="text-sm font-bold">{scoreData.correct}/{scoreData.total}</div>
                                      <div className="text-xs text-gray-600">{subjectPercentage}%</div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Henüz Sınav Sonucun Yok</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    İlk sınavını tamamladığında burada detaylı analizini görebileceksin.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Güçlü Alanlarım
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {strongTopics.length > 0 ? (
                    strongTopics.slice(0, 5).map((topic, index) => (
                      <div key={topic.topic} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-green-800">{topic.topic}</p>
                            <p className="text-sm text-green-600">
                              {topic.correct}/{topic.total} doğru
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{topic.percentage}%</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Daha fazla sınav çözerek güçlü alanlarını keşfet!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  Gelişim Alanlarım
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {weakTopics.length > 0 ? (
                    weakTopics.slice(0, 5).map((topic, index) => (
                      <div key={topic.topic} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-red-800">{topic.topic}</p>
                            <p className="text-sm text-red-600">
                              {topic.correct}/{topic.total} doğru
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive">{topic.percentage}%</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Harika! Zayıf alan tespit edilmedi.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Comparison */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Users className="h-5 w-5" />
                Sınıf Karşılaştırması
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{myRank > 0 ? myRank : "N/A"}</div>
                  <div className="text-sm text-blue-600">Sıralamam</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {studentAverages.length > 0
                      ? Math.round(studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-green-600">Sınıf Ortalaması</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {averageScore > 0 && studentAverages.length > 0
                      ? (averageScore -
                          Math.round(studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length) >
                        0
                          ? "+"
                          : "") +
                        (averageScore -
                          Math.round(studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length))
                      : "N/A"}
                  </div>
                  <div className="text-sm text-purple-600">Ortalamadan Fark</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card className="border-2 border-indigo-200">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <TrendingUp className="h-5 w-5" />
                Detaylı İlerleme Analizi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {progressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="exam" fontSize={12} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: "#6366f1", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>İlerleme grafiğin oluşturuluyor...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Exam History */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle>📋 Detaylı Sınav Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myResults
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .map((result) => {
                    const exam = exams.find((e) => e.id === result.examId)
                    const percentage = Math.round((result.score / result.totalQuestions) * 100)

                    return (
                      <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{exam?.name}</h4>
                            <p className="text-sm text-gray-600">
                              📅 {new Date(result.completedAt).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{percentage}%</div>
                            <Badge
                              variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}
                            >
                              {percentage >= 80 ? "Mükemmel" : percentage >= 60 ? "İyi" : "Geliştirilmeli"}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-2">📊 Genel Performans:</p>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Doğru Cevap:</span>
                                <span className="font-medium text-green-600">{result.score}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Yanlış Cevap:</span>
                                <span className="font-medium text-red-600">{result.totalQuestions - result.score}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Toplam Soru:</span>
                                <span className="font-medium">{result.totalQuestions}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="font-medium mb-2">📚 Ders Performansı:</p>
                            <div className="space-y-1">
                              {Object.entries(result.subjectScores).map(([subject, scores]) => {
                                const scoreData = scores as { correct: number; total: number }
                                return (
                                  <div key={subject} className="flex justify-between">
                                    <span>{subject}:</span>
                                    <span className="font-medium">
                                      {scoreData.correct}/{scoreData.total} ({Math.round((scoreData.correct / scoreData.total) * 100)}
                                      %)
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-purple-800">📚 Ders Performansı</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">Ders verisi bulunmuyor</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectData.map((subject) => (
              <Card key={subject.subject} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{subject.subject}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Başarı Oranı</span>
                      <Badge
                        variant={
                          subject.percentage >= 80 ? "default" : subject.percentage >= 60 ? "secondary" : "destructive"
                        }
                      >
                        {subject.percentage}%
                      </Badge>
                    </div>
                    <Progress value={subject.percentage} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Doğru</div>
                        <div className="font-bold text-green-600">{subject.correct}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Toplam</div>
                        <div className="font-bold">{subject.total}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card className="border-2 border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Trophy className="h-5 w-5" />
                Başarı Rozetlerim
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.earned
                        ? `${achievement.color} border-current`
                        : "bg-gray-50 text-gray-400 border-gray-200"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <p className="text-sm mt-1">{achievement.description}</p>
                      {achievement.earned && <Badge className="mt-2 bg-green-100 text-green-800">Kazanıldı!</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-800">📈 İlerleme Özeti</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{earnedAchievements.length}</div>
                  <div className="text-sm text-blue-600">Kazanılan Rozet</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {achievements.length - earnedAchievements.length}
                  </div>
                  <div className="text-sm text-green-600">Hedeflenen Rozet</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round((earnedAchievements.length / achievements.length) * 100)}%
                  </div>
                  <div className="text-sm text-purple-600">Tamamlanma Oranı</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="study" className="space-y-6">
          <Card className="border-2 border-indigo-200">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Brain className="h-5 w-5" />
                Kişiselleştirilmiş Çalışma Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {studyRecommendations.map((rec, index) => (
                  <div key={index} className={`p-4 border-2 rounded-lg ${rec.color}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{rec.icon}</div>
                      <div>
                        <h3 className="font-semibold">{rec.title}</h3>
                        <p className="text-sm mt-1">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">📅 Haftalık Çalışma Planı</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {weakTopics.slice(0, 3).map((topic, index) => (
                    <div key={topic.topic} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{topic.topic}</span>
                        <Badge variant="outline">Günde 30dk</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Mevcut: %{topic.percentage} → Hedef: %80</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-800">🎯 Bu Hafta Hedeflerin</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Günlük 2 saat çalışma</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">1 deneme sınavı çöz</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Zayıf konulara odaklan</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {selectedExamDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">
                {exams.find(e => e.id === selectedExamDetail)?.name} - Detaylı Analiz
              </h2>
              <Button variant="outline" onClick={() => setSelectedExamDetail(null)}>
                Kapat
              </Button>
            </div>
            <div className="overflow-auto max-h-[80vh]">
              <StudentExamDetail examId={selectedExamDetail} studentId={user.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
