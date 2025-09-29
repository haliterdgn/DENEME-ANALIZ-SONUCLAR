"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useExamStore } from "@/lib/stores/exam-store"
import { Calendar, Users, FileText, Upload, Eye, Trash2, User, School } from "lucide-react"
import { useRouter } from "next/navigation"
import BookletUpload from "./booklet-upload"
import OptikResultsViewer from "./optik-results-viewer"
import DetailedExamAnalysis from "./detailed-exam-analysis"

export default function ExamList() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [showResults, setShowResults] = useState<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { exams, getBookletByExamId, getResultsByExamId, fetchExams, createExamAPI, deleteExamAPI } = useExamStore()

  useEffect(() => {
    const loadExams = async () => {
      try {
        await fetchExams()
      } catch (error) {
        console.warn('Sınavlar offline modda çalışıyor')
      } finally {
        setLoading(false)
      }
    }
    
    loadExams()
  }, [fetchExams])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Sınav Yönetimi</h2>
          <p className="text-gray-600">Sınavlar yükleniyor...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sınav Yönetimi</h2>
        <p className="text-gray-600">Sınavlar için kitapçık ve optik form yükleyin</p>
      </div>

      {exams.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz Sınav Bulunmuyor</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              API'den sınav verisi çekilemedi. Yeni bir sınav oluşturmak için "Sınav Oluştur" sekmesini kullanın
              veya demo sınav oluşturun.
            </p>
            <Button 
              onClick={async () => {
                try {
                  await createExamAPI({
                    name: "Demo Matematik Sınavı",
                    date: new Date().toISOString().split('T')[0],
                    classLevel: "9. Sınıf",
                    subjects: [
                      { name: "Cebir", questionCount: 25 },
                      { name: "Geometri", questionCount: 20 }
                    ],
                    createdBy: "demo"
                  })
                  await fetchExams()
                } catch (error) {
                  console.error('Demo sınav oluşturulamadı:', error)
                }
              }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Demo Sınav Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {exams.map((exam) => {
          const booklet = getBookletByExamId(exam.id)
          const results = getResultsByExamId(exam.id)

          return (
            <Card key={exam.id} className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-xl">{exam.name}</span>
                      {booklet && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✅ Kitapçık Yüklendi
                        </Badge>
                      )}
                      {results.length > 0 && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          📊 {results.length} Sonuç
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(exam.date).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{exam.classLevel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{results.length} Öğrenci Sonucu</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSelectedExam(exam.id)}
                      size="lg"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-5 w-5" />
                      {booklet ? "Optik Yükle" : "Kitapçık & Optik Yükle"}
                    </Button>

                    {results.length > 0 && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="flex items-center gap-2 bg-transparent"
                          onClick={() => setShowResults(exam.id)}
                        >
                          <School className="h-5 w-5" />
                          Genel Okul Bazlı
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="flex items-center gap-2 bg-transparent border-green-500 text-green-700 hover:bg-green-50"
                          onClick={() => {
                            // Store'da examId'yi set et ve student-analysis sayfasına yönlendir
                            // Önce exam store'a selectedExam'i set edelim
                            router.push(`/student-analysis?examId=${exam.id}`)
                          }}
                        >
                          <User className="h-5 w-5" />
                          Öğrenci Bazlı
                        </Button>
                      </div>
                    )}

                    <Button 
                      variant="destructive" 
                      size="lg" 
                      className="flex items-center gap-2"
                      onClick={async () => {
                        if (window.confirm(`"${exam.name}" sınavını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                          try {
                            await deleteExamAPI(exam.id)
                            alert('Sınav başarıyla silindi!')
                          } catch (error: any) {
                            console.error('Sınav silinemedi:', error)
                            // CORS veya network hatalarında da kullanıcıya bilgi ver
                            if (error.message?.includes('CORS') || 
                                error.message?.includes('ERR_FAILED') ||
                                error.message?.includes('Access to fetch')) {
                              alert('Backend CORS hatası nedeniyle sınav sadece arayüzden silindi. Backend\'de hala mevcut olabilir.')
                            } else if (error.message?.includes('500')) {
                              alert('Backend hatası: Sınav sadece arayüzden silindi. Backend loglarını kontrol edin.')
                            } else {
                              alert('Beklenmeyen hata: Sınav silinemedi. Lütfen tekrar deneyin.')
                            }
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">📚 Dersler ve Soru Sayıları:</h4>
                    <div className="flex flex-wrap gap-2">
                      {exam.subjects?.map((subject: any, index: number) => (
                        <Badge key={`${subject.name}-${index}`} variant="outline" className="px-3 py-1">
                          {subject.name} ({subject.questionCount} soru)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {booklet && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ Kitapçık Bilgileri:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-green-700">📝 Toplam Soru:</span>
                          <span className="font-medium ml-2">{booklet.questions.length}</span>
                        </div>
                        <div>
                          <span className="text-green-700">📅 Yüklenme Tarihi:</span>
                          <span className="font-medium ml-2">
                            {new Date(booklet.uploadedAt).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-700">🎯 Durum:</span>
                          <span className="font-medium ml-2 text-green-600">Optik yüklemeye hazır</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!booklet && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">⚠️ Kitapçık Bekleniyor</h4>
                      <p className="text-sm text-yellow-700">
                        Bu sınav için henüz kitapçık yüklenmemiş. Optik formları işleyebilmek için önce Excel
                        kitapçığını yükleyin.
                      </p>
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📊 Sonuç Özeti:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">👥 Öğrenci Sayısı:</span>
                          <span className="font-medium ml-2">{results.length}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">📈 Ortalama:</span>
                          <span className="font-medium ml-2">
                            {Math.round(
                              results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length,
                            )}
                            %
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700">🏆 En Yüksek:</span>
                          <span className="font-medium ml-2">
                            {Math.max(...results.map((r) => Math.round((r.score / r.totalQuestions) * 100)))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {exams.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Henüz Sınav Yok</h3>
              <p className="text-gray-500 text-center max-w-md">
                Sınav oluşturmak için "Sınav Oluştur" sekmesini kullanın.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {selectedExam && <BookletUpload examId={selectedExam} onClose={() => setSelectedExam(null)} />}
      
      {showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Sınav Sonuçları - {exams.find(e => e.id === showResults)?.name}</h2>
              <Button variant="outline" onClick={() => setShowResults(null)}>
                Kapat
              </Button>
            </div>
            <div className="overflow-auto max-h-[80vh]">
              <DetailedExamAnalysis examId={showResults} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
