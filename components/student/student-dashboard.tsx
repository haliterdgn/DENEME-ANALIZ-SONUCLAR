"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api-client"
import SimpleExamDetail from "./simple-exam-detail"
import {
  BookOpen,
  Trophy,
  Target,
  Calendar,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Award,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Eye
} from "lucide-react"

export default function StudentDashboard() {
  const [studentResults, setStudentResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [examDetails, setExamDetails] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
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

  const loadExamDetails = async (examId: string, studentNumber: string) => {
    try {
      setDetailLoading(true)
      setError("")
      
      // API'den öğrencinin bu sınav için detaylı sonucunu al
      const detailResult = await apiClient.getStudentExamResult(examId, studentNumber)
      console.log('✅ Sınav detayı yüklendi:', detailResult)
      
      if (detailResult) {
        setExamDetails(detailResult)
        setSelectedExam(studentResults.find(r => r.examId === examId))
      } else {
        setError('Bu sınav için detaylı sonuç bulunamadı')
      }
    } catch (error) {
      console.error('❌ Sınav detayı yüklenemedi:', error)
      setError('Sınav detayları yüklenemedi')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleBackToList = () => {
    setSelectedExam(null)
    setExamDetails(null)
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

  // Eğer exam detayı seçilmişse, detay sayfasını göster
  if (selectedExam && examDetails) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <SimpleExamDetail 
          examResult={examDetails}
          onBack={handleBackToList}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Öğrenci Paneli
          </h1>
          <p className="text-gray-600 mt-2">
            Hoş geldin, {user.name}! (Öğrenci No: {user.username})
          </p>
        </div>
        <Button 
          onClick={loadStudentResults} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sınav</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedExams}</div>
            <p className="text-xs text-muted-foreground">
              Tamamlanan sınav sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Doğru</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}</div>
            <p className="text-xs text-muted-foreground">
              Sınav başına doğru sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{successRate}</div>
            <p className="text-xs text-muted-foreground">
              Genel başarı yüzdesi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Yüksek Puan</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentResults.length > 0 
                ? Math.max(...studentResults.map(r => r.correctAnswers || 0))
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              En iyi performans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exam Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sınav Sonuçlarım
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Sonuçlar yükleniyor...
            </div>
          ) : studentResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Henüz sınav sonucunuz bulunmamaktadır</h3>
              <p>Sınavlarınız tamamlandığında burada görüntülenecektir.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentResults.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {result.examInfo?.examName || `Sınav ${index + 1}`}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {result.examInfo?.examDate 
                              ? new Date(result.examInfo.examDate).toLocaleDateString('tr-TR')
                              : 'Tarih bilinmiyor'
                            }
                          </span>
                          {result.examInfo?.subject && (
                            <Badge variant="outline">
                              {result.examInfo.subject}
                            </Badge>
                          )}
                          {result.examInfo?.className && (
                            <Badge variant="outline">
                              {result.examInfo.className}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.correctAnswers || 0} / {result.totalQuestions || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          %{result.totalQuestions > 0 
                            ? Math.round(((result.correctAnswers || 0) / result.totalQuestions) * 100)
                            : 0
                          }
                        </div>
                        <Progress 
                          value={result.totalQuestions > 0 
                            ? ((result.correctAnswers || 0) / result.totalQuestions) * 100
                            : 0
                          } 
                          className="mt-2 w-20"
                        />
                      </div>
                    </div>

                    {/* Detailed Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {result.correctAnswers || 0}
                        </div>
                        <div className="text-xs text-gray-500">Doğru</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-600">
                          {result.wrongAnswers || 0}
                        </div>
                        <div className="text-xs text-gray-500">Yanlış</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-600">
                          {result.emptyAnswers || 0}
                        </div>
                        <div className="text-xs text-gray-500">Boş</div>
                      </div>
                    </div>

                    {/* Detail Button */}
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        onClick={() => loadExamDetails(result.examId, user?.username || '')}
                        disabled={detailLoading}
                        className="w-full flex items-center gap-2"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4" />
                        {detailLoading ? 'Yükleniyor...' : 'Detaylı Analiz Gör'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}