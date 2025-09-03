"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useExamStore } from "@/lib/stores/exam-store"
import { Calendar, Users, FileText, Upload, Eye } from "lucide-react"
import BookletUpload from "./booklet-upload"

export default function ExamList() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const { exams, getBookletByExamId, getResultsByExamId } = useExamStore()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sınav Yönetimi</h2>
        <p className="text-gray-600">Sınavlar için kitapçık ve optik form yükleyin</p>
      </div>

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
                      <Button variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
                        <Eye className="h-5 w-5" />
                        Sonuçları Gör
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">📚 Dersler ve Soru Sayıları:</h4>
                    <div className="flex flex-wrap gap-2">
                      {exam.subjects.map((subject) => (
                        <Badge key={subject.id} variant="outline" className="px-3 py-1">
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

      {selectedExam && <BookletUpload examId={selectedExam} onClose={() => setSelectedExam(null)} />}
    </div>
  )
}
