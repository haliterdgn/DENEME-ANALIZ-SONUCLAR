"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useExamStore } from "@/lib/stores/exam-store"
import { apiClient } from "@/lib/api-client"
import { CheckCircle, XCircle, Minus, Download, BarChart3, Users, TrendingUp, Target, BookOpen, Award, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { formatOgrenciNo } from "@/lib/utils"

interface DetailedExamAnalysisProps {
  examId: string
  hideClassFilter?: boolean // Sınıf filtresini gizle (exam-list için)
}

export default function DetailedExamAnalysis({ examId, hideClassFilter = false }: DetailedExamAnalysisProps) {
  const { exams, getResultsByExamId, getBookletByExamId, getOptikForms } = useExamStore()
  const { toast } = useToast()
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [examAnalysis, setExamAnalysis] = useState<any>(null)
  const [studentResults, setStudentResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [optikForms, setOptikForms] = useState<any[]>([])
  const [selectedOptikFormId, setSelectedOptikFormId] = useState<string>("")
  const [classes] = useState([
    { id: "all", name: "Tüm Sınıflar" },
    { id: "9A", name: "9-A Sınıfı" },
    { id: "9B", name: "9-B Sınıfı" },
    { id: "10A", name: "10-A Sınıfı" },
    { id: "10B", name: "10-B Sınıfı" },
    { id: "11A", name: "11-A Sınıfı" },
    { id: "11B", name: "11-B Sınıfı" },
    { id: "12A", name: "12-A Sınıfı" },
    { id: "12B", name: "12-B Sınıfı" }
  ])
  
  const exam = exams.find(e => e.id === examId)
  const results = getResultsByExamId(examId)
  const booklet = getBookletByExamId(examId)

  // Optik formları yükle
  useEffect(() => {
    const loadOptikForms = async () => {
      try {
        const forms = await getOptikForms()
        setOptikForms(forms || [])
        // İlk optik formu seç
        if (forms && forms.length > 0) {
          setSelectedOptikFormId(forms[0]._id || forms[0].id)
        }
      } catch (error) {
        console.error('Optik formlar yüklenirken hata:', error)
      }
    }
    loadOptikForms()
  }, [])

  // Sayfa yüklendiğinde otomatik analiz yap
  useEffect(() => {
    // Eğer sınıf filtresi gizliyse, her zaman tüm sınıfları analiz et
    if (hideClassFilter) {
      setSelectedClass("all")
    }
    performDetailedAnalysis()
  }, [examId, selectedClass, hideClassFilter])

  // Topic Analysis API ile detaylı analiz yap
  const performDetailedAnalysis = async () => {
    setLoading(true)
    try {
      console.log('🔍 Topic Analysis başlatılıyor, ExamID:', examId)
      
      // Seçili optik form ID'sini kullan
      if (!selectedOptikFormId) {
        toast({
          title: "Hata",
          description: "Lütfen bir optik form seçin.",
          variant: "destructive",
        })
        return
      }
      
      const analysisResult = await apiClient.getTopicAnalysis(examId, selectedOptikFormId, true)
      
      console.log('✅ Detaylı analiz başarılı:', analysisResult)
      
      // API'den dönen gerçek formatı işle - Yeni Topic Analysis formatı
      if (analysisResult) {
        // examInfo, topicAnalysis formatında geliyor
        setExamAnalysis({
          // Exam Info
          examInfo: analysisResult.examInfo || {},
          
          // Topic Analysis - Ders bazında konu analizi
          topicAnalysis: analysisResult.topicAnalysis || {},
          
          // Message
          message: analysisResult.message || "Analiz tamamlandı"
        })

        // Student Results - Gerçek API formatındaki öğrenci sonuçları
        if (analysisResult.studentResults && analysisResult.studentResults.length > 0) {
          const formattedStudents = analysisResult.studentResults.map((student: any) => ({
            // Student Info
            tcKimlikNo: student.studentInfo?.tcKimlikNo || '',
            ogrenciAdi: student.studentInfo?.ogrenciAdi || 'Bilinmeyen',
            ogrenciNo: student.studentInfo?.ogrenciNo || '',
            sinif: student.studentInfo?.sinif || '',
            sube: student.studentInfo?.sube || '',
            telefon: student.studentInfo?.telefon || '',
            
            // Scores
            totalScore: student.totalScore || 0,
            totalCorrect: student.totalCorrect || 0,
            totalWrong: student.totalWrong || 0,
            totalEmpty: student.totalEmpty || 0,
            
            // Subject Scores & Detailed Answers
            subjectScores: student.subjectScores || [],
            detailedAnswers: student.detailedAnswers || []
          }))
          setStudentResults(formattedStudents)
        } else {
          setStudentResults([])
        }
      }
    } catch (error) {
      console.error('❌ Detaylı analiz hatası:', error)
      toast({
        title: "Hata",
        description: "Analiz yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
      // Hata durumunda boş sonuçlar
      setExamAnalysis({
        examInfo: {},
        topicAnalysis: {},
        message: "Analiz yapılamadı"
      })
      setStudentResults([])
    } finally {
      setLoading(false)
    }
  }

  if (!exam) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Sınav bulunamadı.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🎯 {exam.name} - Detaylı Analiz</h2>
          <p className="text-gray-600">Yeni API ile kapsamlı sınav analizi</p>
        </div>
      </div>

      {/* API Analiz Kontrolleri */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800">📊 Analiz Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className={`grid ${hideClassFilter ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 mb-4`}>
            {!hideClassFilter && (
              <div>
                <label className="block text-sm font-medium mb-2">Sınıf Filtresi</label>
                <Select onValueChange={setSelectedClass} defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Sınıf seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Optik Form Seçimi */}
            <div>
              <Label htmlFor="optik-form">Optik Form</Label>
              <Select value={selectedOptikFormId || ''} onValueChange={setSelectedOptikFormId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optik form seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {optikForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name} ({form.questionCount} soru)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={performDetailedAnalysis} 
                disabled={loading || !selectedOptikFormId}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Analiz Yapılıyor...' : 'Detaylı Analiz Yap'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Analiz Sonuçları */}
      {examAnalysis && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">🏠 Genel Bakış</TabsTrigger>
            <TabsTrigger value="subjects">📚 Ders Analizi</TabsTrigger>
            <TabsTrigger value="questions">❓ Soru Analizi</TabsTrigger>
            <TabsTrigger value="students">👥 Öğrenci Detayları</TabsTrigger>
          </TabsList>

          {/* Genel Bakış - Gerçek API Formatı */}
          <TabsContent value="overview" className="space-y-6">
            {/* Exam Info Card */}
            {examAnalysis.examInfo && (
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 mb-6">
                <CardHeader>
                  <CardTitle className="text-indigo-800">📋 Sınav Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-indigo-600">Sınav Adı</div>
                      <div className="font-bold">{examAnalysis.examInfo.examName || 'Bilinmeyen'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-indigo-600">Sınav ID</div>
                      <div className="font-mono text-xs">{examAnalysis.examInfo.examId || 'Bilinmeyen'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-indigo-600">Optik Form</div>
                      <div className="font-bold">{examAnalysis.examInfo.optikFormName || 'Bilinmeyen'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-indigo-600">Durum</div>
                      <Badge variant="default" className="bg-green-500">{examAnalysis.message}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-3xl font-bold text-blue-600">
                    {examAnalysis.analysisStats?.totalStudents || 0}
                  </div>
                  <div className="text-sm text-blue-600">Katılan Öğrenci</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(examAnalysis.analysisStats?.averageScore || 0)}
                  </div>
                  <div className="text-sm text-green-600">Ortalama Puan</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                <CardContent className="p-6 text-center">
                  <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <div className="text-3xl font-bold text-yellow-600">
                    {examAnalysis.analysisStats?.highestScore || 0}
                  </div>
                  <div className="text-sm text-yellow-600">En Yüksek Puan</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-3xl font-bold text-purple-600">
                    {examAnalysis.analysisStats?.totalQuestions || 0}
                  </div>
                  <div className="text-sm text-purple-600">Toplam Soru</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Başarı/Başarısızlık */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                  <div className="text-3xl font-bold text-emerald-600">
                    {examAnalysis.analysisStats?.passCount || 0}
                  </div>
                  <div className="text-sm text-emerald-600">Başarılı Öğrenci</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-3xl font-bold text-red-600">
                    {examAnalysis.analysisStats?.failCount || 0}
                  </div>
                  <div className="text-sm text-red-600">Başarısız Öğrenci</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Konu Analizi - Yeni Topic Analysis Formatı */}
          <TabsContent value="subjects" className="space-y-6">
            {examAnalysis.topicAnalysis && Object.keys(examAnalysis.topicAnalysis).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(examAnalysis.topicAnalysis).map(([subjectName, topics]: [string, any]) => (
                  <Card key={subjectName} className="border-2 border-indigo-200">
                    <CardHeader className="bg-indigo-50">
                      <CardTitle className="text-indigo-800 text-xl">{subjectName}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Object.entries(topics).map(([topicName, topicData]: [string, any]) => (
                          <Card key={topicName} className="border border-gray-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg text-gray-800">{topicName}</CardTitle>
                            </CardHeader>
                              <div className="space-y-3">
                                {/* Temel İstatistikler */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Başarı Oranı:</span>
                                    <span className={`font-semibold ${
                                      topicData.successRate >= 80 ? 'text-green-600' :
                                      topicData.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      %{topicData.successRate || 0}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Soru Sayısı:</span>
                                    <span className="font-semibold">{topicData.totalQuestions || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Doğru:</span>
                                    <span className="text-green-600 font-semibold">{topicData.correctAnswers || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Yanlış:</span>
                                    <span className="text-red-600 font-semibold">{topicData.wrongAnswers || 0}</span>
                                  </div>
                                </div>
                                
                                {/* Zorluk Seviyesi Badge */}
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">Zorluk:</span>
                                  <Badge className={
                                    topicData.difficultyLevel === 'very_easy' ? 'bg-green-100 text-green-800 border-green-200' :
                                    topicData.difficultyLevel === 'easy' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    topicData.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    topicData.difficultyLevel === 'hard' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-red-100 text-red-800 border-red-200'
                                  }>
                                    {topicData.difficultyLevel === 'very_easy' ? 'Çok Kolay' :
                                     topicData.difficultyLevel === 'easy' ? 'Kolay' :
                                     topicData.difficultyLevel === 'medium' ? 'Orta' :
                                     topicData.difficultyLevel === 'hard' ? 'Zor' : 'Çok Zor'}
                                  </Badge>
                                </div>

                                {/* Başarı Çubuğu */}
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      topicData.successRate >= 80 ? 'bg-green-500' :
                                      topicData.successRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(topicData.successRate || 0, 100)}%` }}
                                  />
                                </div>
                                
                                {/* Soru Numaraları */}
                                <div className="text-xs text-gray-600">
                                  <span>Sorular: {topicData.questionNumbers?.join(', ') || 'N/A'}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Ders analizi verisi bulunamadı.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Soru Analizi */}
          <TabsContent value="questions" className="space-y-6">
            {examAnalysis.questionAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="bg-green-100">
                    <CardTitle className="text-green-800">🎯 En Başarılı Sorular</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {examAnalysis.questionAnalysis.easiest?.slice(0, 10).map((question: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                          <span className="font-medium">Soru {question.questionNumber}</span>
                          <span className="text-green-600 font-bold">{question.successRate}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="bg-red-100">
                    <CardTitle className="text-red-800">⚠️ En Zor Sorular</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {examAnalysis.questionAnalysis.hardest?.slice(0, 10).map((question: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                          <span className="font-medium">Soru {question.questionNumber}</span>
                          <span className="text-red-600 font-bold">{question.successRate}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Öğrenci Detayları - Gerçek API Formatı */}
          <TabsContent value="students" className="space-y-6">
            {studentResults.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>👥 Öğrenci Performans Listesi</CardTitle>
                  <p className="text-sm text-gray-600">
                    {selectedClass !== "all" ? `${classes.find(c => c.id === selectedClass)?.name} - ` : ""}
                    Toplam {studentResults.length} öğrenci
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 p-2 text-left text-xs">Sıra</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Kitapçık Türü</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Öğrenci Adı</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Öğr. No</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Sınıf</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Şube</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Doğru</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Yanlış</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Boş</th>
                          <th className="border border-gray-200 p-2 text-left text-xs">Puan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentResults
                          .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                          .map((student, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-200 p-2 font-bold text-sm">{index + 1}</td>
                              <td className="border border-gray-200 p-2 text-xs font-mono">{student.kitapcikTuru || 'N/A'}</td>
                              <td className="border border-gray-200 p-2 text-sm font-semibold">{student.ogrenciAdi || 'Bilinmeyen'}</td>
                              <td className="border border-gray-200 p-2 text-sm">{formatOgrenciNo(student.ogrenciNo)}</td>
                              <td className="border border-gray-200 p-2 text-sm">{student.sinif || 'N/A'}</td>
                              <td className="border border-gray-200 p-2 text-sm">{student.sube || 'N/A'}</td>
                              <td className="border border-gray-200 p-2 text-green-600 font-semibold text-sm">{student.totalCorrect || 0}</td>
                              <td className="border border-gray-200 p-2 text-red-600 font-semibold text-sm">{student.totalWrong || 0}</td>
                              <td className="border border-gray-200 p-2 text-gray-600 font-semibold text-sm">{student.totalEmpty || 0}</td>
                              <td className="border border-gray-200 p-2">
                                <span className={`font-bold text-sm ${
                                  (student.totalScore || 0) >= 80 ? 'text-green-600' :
                                  (student.totalScore || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {student.totalScore || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Öğrenci verisi bulunamadı.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Fallback: Eski veriler */}
      {!examAnalysis && results.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">⚠️ Eski Veri Görünümü</CardTitle>
            <p className="text-sm text-yellow-600">
              Yeni API analizi yapmak için yukarıdan optik form seçin. 
              Aşağıda mevcut eski veriler gösteriliyor.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{results.length}</div>
                <div className="text-sm text-gray-600">Kayıtlı Sonuç</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)}%
                </div>
                <div className="text-sm text-gray-600">Ortalama Başarı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {booklet?.questions?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Toplam Soru</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Veri yok durumu */}
      {!examAnalysis && results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500 mb-4">Bu sınav için henüz analiz edecek veri yok.</p>
            <p className="text-sm text-gray-400">
              Önce optik formları yükleyin ve sonra analiz yapın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
