"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BookOpen,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Star,
  Brain
} from "lucide-react"

interface SimpleExamDetailProps {
  examResult: any
  onBack: () => void
}

export default function SimpleExamDetail({ examResult, onBack }: SimpleExamDetailProps) {
  // Öğrenci performans hesaplamaları
  const totalQuestions = examResult.totalQuestions || 0
  const correctAnswers = examResult.correctAnswers || 0
  const wrongAnswers = examResult.wrongAnswers || 0
  const emptyAnswers = examResult.emptyAnswers || 0
  const score = examResult.score || 0
  const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : "0"

  // Konu bazlı performans (varsa)
  const subjectAnalysis = examResult.subjectAnalysis || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">{examResult.examName || 'Sınav Detayı'}</h1>
          <p className="text-gray-500">{examResult.examDate || examResult.date}</p>
        </div>
      </div>

      {/* Genel Performans Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Puan</p>
                <p className="text-2xl font-bold text-blue-600">{score}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Başarı Oranı</p>
                <p className="text-2xl font-bold text-green-600">{percentage}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doğru</p>
                <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Yanlış</p>
                <p className="text-2xl font-bold text-red-600">{wrongAnswers}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Soru Analizi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Soru Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Doğru Cevaplar</span>
              <div className="flex items-center gap-2">
                <Progress value={(correctAnswers / totalQuestions) * 100} className="w-32" />
                <span className="text-sm font-bold text-green-600">{correctAnswers}/{totalQuestions}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Yanlış Cevaplar</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(wrongAnswers / totalQuestions) * 100} 
                  className="w-32 [&>div]:bg-red-500" 
                />
                <span className="text-sm font-bold text-red-600">{wrongAnswers}/{totalQuestions}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Boş Cevaplar</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(emptyAnswers / totalQuestions) * 100} 
                  className="w-32 [&>div]:bg-gray-400" 
                />
                <span className="text-sm font-bold text-gray-600">{emptyAnswers}/{totalQuestions}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Konu Bazlı Performans */}
      {subjectAnalysis && subjectAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Konu Bazlı Performans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectAnalysis.map((subject: any, index: number) => {
                const subjectPercentage = subject.totalQuestions > 0 
                  ? ((subject.correctAnswers / subject.totalQuestions) * 100).toFixed(1)
                  : "0"
                
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{subject.subjectName || `Konu ${index + 1}`}</h4>
                      <Badge variant={parseFloat(subjectPercentage) >= 70 ? "default" : parseFloat(subjectPercentage) >= 50 ? "secondary" : "destructive"}>
                        {subjectPercentage}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-green-600 font-semibold">{subject.correctAnswers}</p>
                        <p className="text-gray-500">Doğru</p>
                      </div>
                      <div className="text-center">
                        <p className="text-red-600 font-semibold">{subject.wrongAnswers}</p>
                        <p className="text-gray-500">Yanlış</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 font-semibold">{subject.emptyAnswers}</p>
                        <p className="text-gray-500">Boş</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={parseFloat(subjectPercentage)} 
                      className="mt-2" 
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gelişim Önerileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gelişim Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Genel performans değerlendirmesi */}
            {parseFloat(percentage) >= 80 ? (
              <Alert className="border-green-200 bg-green-50">
                <Star className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Mükemmel performans!</strong> %{percentage} başarı oranı ile çok başarılı bir sonuç elde ettiniz. 
                  Bu başarınızı sürdürmeye devam edin! 🎉
                </AlertDescription>
              </Alert>
            ) : parseFloat(percentage) >= 60 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>İyi performans!</strong> %{percentage} başarı oranı ile başarılı bir sonuç elde ettiniz. 
                  Birkaç konuda daha çalışarak performansınızı artırabilirsiniz.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Gelişime açık performans.</strong> %{percentage} başarı oranı ile daha iyi sonuçlar alabilirsiniz. 
                  Eksik kaldığınız konularda çalışma yapmanızı öneririz.
                </AlertDescription>
              </Alert>
            )}

            {/* Konu bazlı öneriler */}
            {subjectAnalysis && subjectAnalysis.length > 0 && subjectAnalysis
              .filter((subject: any) => {
                const perf = subject.totalQuestions > 0 
                  ? (subject.correctAnswers / subject.totalQuestions) * 100
                  : 0
                return perf < 70
              })
              .map((subject: any, index: number) => (
                <Alert key={index}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{subject.subjectName || `Konu ${index + 1}`}</strong> konusunda 
                    daha fazla çalışma yapmanız önerilir. 
                    Başarı oranınız: {subject.totalQuestions > 0 
                      ? ((subject.correctAnswers / subject.totalQuestions) * 100).toFixed(1)
                      : 0}%
                  </AlertDescription>
                </Alert>
              ))}

            {/* Genel çalışma önerileri */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">💡 Çalışma Önerileri:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Yanlış cevapladığınız soruları tekrar çözün</li>
                <li>• Boş bıraktığınız sorulardaki konuları çalışın</li>
                <li>• Düzenli pratik yaparak performansınızı artırın</li>
                <li>• Zayıf olduğunuz konulara odaklanın</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}