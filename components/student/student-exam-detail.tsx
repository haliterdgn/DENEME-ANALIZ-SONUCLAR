"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useExamStore } from "@/lib/stores/exam-store"
import { CheckCircle, XCircle, Minus, Target, TrendingUp, Brain, AlertTriangle } from "lucide-react"

interface StudentExamDetailProps {
  examId: string
  studentId: string
}

export default function StudentExamDetail({ examId, studentId }: StudentExamDetailProps) {
  const { exams, getResultsByExamId, getBookletByExamId, results } = useExamStore()
  
  const exam = exams.find(e => e.id === examId)
  const booklet = getBookletByExamId(examId)
  const allResults = getResultsByExamId(examId)
  const myResult = results.find(r => r.examId === examId && r.studentId === studentId)
  
  if (!exam || !booklet || !myResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Bu sınav için sonuç bulunamadı.</p>
        </CardContent>
      </Card>
    )
  }

  const myPercentage = Math.round((myResult.score / myResult.totalQuestions) * 100)
  const classAverage = allResults.length > 0 
    ? Math.round(allResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / allResults.length)
    : 0
  
  const myRank = allResults
    .sort((a, b) => b.score - a.score)
    .findIndex(r => r.studentId === studentId) + 1

  // Soru bazında analiz
  const questionAnalysis = booklet.questions.map((question, index) => {
    const questionNumber = index + 1
    const myAnswer = myResult.answers[questionNumber]
    const isCorrect = myAnswer === question.correctAnswer
    const isEmpty = !myAnswer
    
    // Sınıf içindeki başarı oranı
    const classCorrectCount = allResults.filter(result => 
      result.answers[questionNumber] === question.correctAnswer
    ).length
    const classSuccessRate = Math.round((classCorrectCount / allResults.length) * 100)
    
    return {
      questionNumber,
      subject: question.subject,
      topic: question.topic,
      correctAnswer: question.correctAnswer,
      myAnswer,
      isCorrect,
      isEmpty,
      classSuccessRate,
      difficulty: classSuccessRate > 80 ? 'Kolay' : classSuccessRate > 50 ? 'Orta' : 'Zor'
    }
  })

  // Ders bazında performans
  const subjectPerformance = exam.subjects.map(subject => {
    const subjectQuestions = questionAnalysis.filter(q => q.subject === subject.name)
    const correctCount = subjectQuestions.filter(q => q.isCorrect).length
    const totalCount = subjectQuestions.length
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    
    return {
      name: subject.name,
      correct: correctCount,
      total: totalCount,
      percentage,
      questions: subjectQuestions
    }
  })

  // Yanlış ve eksik sorular
  const wrongQuestions = questionAnalysis.filter(q => !q.isCorrect && !q.isEmpty)
  const emptyQuestions = questionAnalysis.filter(q => q.isEmpty)
  const missedEasyQuestions = questionAnalysis.filter(q => !q.isCorrect && q.classSuccessRate > 70)

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Puanım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{myResult.score}/{myResult.totalQuestions}</div>
            <div className="text-lg font-medium">{myPercentage}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sınıf Ortalaması
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{classAverage}%</div>
            <div className={`text-sm ${myPercentage > classAverage ? 'text-green-600' : 'text-red-600'}`}>
              {myPercentage > classAverage 
                ? `+${myPercentage - classAverage} puan üstünde` 
                : `${classAverage - myPercentage} puan altında`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Sınıftaki Sıram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{myRank}.</div>
            <div className="text-sm text-gray-600">{allResults.length} öğrenci arasında</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Kaçırdığım Kolay Sorular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{missedEasyQuestions.length}</div>
            <div className="text-sm text-gray-600">Dikkat edilmeli</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Durum</TabsTrigger>
          <TabsTrigger value="subjects">Ders Analizi</TabsTrigger>
          <TabsTrigger value="questions">Soru Detayları</TabsTrigger>
          <TabsTrigger value="mistakes">Hatalarım</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performans Dağılımı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Doğru Cevaplar
                  </span>
                  <span className="font-bold text-green-600">{myResult.score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Yanlış Cevaplar
                  </span>
                  <span className="font-bold text-red-600">{wrongQuestions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-gray-600" />
                    Boş Cevaplar
                  </span>
                  <span className="font-bold text-gray-600">{emptyQuestions.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Başarı Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Genel Başarı</span>
                      <span className="font-bold">{myPercentage}%</span>
                    </div>
                    <Progress value={myPercentage} className="h-2" />
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gray-50">
                    <div className="text-lg font-bold">
                      {myPercentage >= 85 ? "🏆 Mükemmel!" : 
                       myPercentage >= 70 ? "👍 İyi!" : 
                       myPercentage >= 50 ? "📚 Geliştirilmeli" : "🎯 Çok Çalışmalısın"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {myPercentage >= 85 ? "Harika bir performans sergiledın!" : 
                       myPercentage >= 70 ? "İyi iş! Biraz daha çaba ile mükemmel olabilir." : 
                       myPercentage >= 50 ? "Daha fazla çalışarak başarını artırabilirsin." : "Konuları tekrar etmen gerekiyor."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="grid gap-4">
            {subjectPerformance.map(subject => (
              <Card key={subject.name}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{subject.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={subject.percentage >= 70 ? "default" : subject.percentage >= 50 ? "secondary" : "destructive"}>
                        {subject.correct}/{subject.total}
                      </Badge>
                      <span className="text-lg font-bold">{subject.percentage}%</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={subject.percentage} className="h-2" />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {subject.questions.map(q => (
                        <div key={q.questionNumber} className={`p-2 border rounded text-center ${
                          q.isCorrect ? 'bg-green-50 border-green-200' :
                          q.isEmpty ? 'bg-gray-50 border-gray-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="font-bold text-sm">S{q.questionNumber}</div>
                          <div className="text-xs">
                            {q.isCorrect ? '✓' : q.isEmpty ? '⊘' : '✗'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Sorular ve Cevaplarım</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Soru</th>
                      <th className="text-left p-2">Ders</th>
                      <th className="text-left p-2">Konu</th>
                      <th className="text-center p-2">Doğru Cvp</th>
                      <th className="text-center p-2">Benim Cvp</th>
                      <th className="text-center p-2">Durum</th>
                      <th className="text-center p-2">Sınıf Başarısı</th>
                      <th className="text-center p-2">Zorluk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionAnalysis.map(q => (
                      <tr key={q.questionNumber} className={`border-b hover:bg-gray-50 ${
                        q.isCorrect ? 'bg-green-50' : q.isEmpty ? 'bg-gray-50' : 'bg-red-50'
                      }`}>
                        <td className="p-2 font-medium">{q.questionNumber}</td>
                        <td className="p-2">{q.subject}</td>
                        <td className="p-2 text-sm">{q.topic}</td>
                        <td className="p-2 font-bold text-center">{q.correctAnswer}</td>
                        <td className="p-2 font-bold text-center">
                          {q.isEmpty ? '-' : q.myAnswer}
                        </td>
                        <td className="p-2 text-center">
                          {q.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : q.isEmpty ? (
                            <Minus className="h-5 w-5 text-gray-600 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline">{q.classSuccessRate}%</Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant={q.difficulty === 'Kolay' ? "secondary" : q.difficulty === 'Orta' ? "default" : "destructive"}>
                            {q.difficulty}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mistakes" className="space-y-4">
          {missedEasyQuestions.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Kaçırdığım Kolay Sorular
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-orange-700 mb-4">
                  Bu sorular sınıfın %70'inden fazlası tarafından doğru cevaplanmış, dikkat eksikliği olabilir:
                </p>
                <div className="space-y-2">
                  {missedEasyQuestions.map(q => (
                    <div key={q.questionNumber} className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">Soru {q.questionNumber}</span>
                          <span className="text-sm text-gray-600 ml-2">({q.subject} - {q.topic})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Doğru: <span className="font-bold">{q.correctAnswer}</span></div>
                          <div className="text-sm">Benim: <span className="font-bold">{q.myAnswer || 'Boş'}</span></div>
                          <div className="text-xs text-orange-600">Sınıf başarısı: {q.classSuccessRate}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {wrongQuestions.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  Yanlış Cevapladığım Sorular
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {wrongQuestions.map(q => (
                    <div key={q.questionNumber} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">Soru {q.questionNumber}</span>
                          <span className="text-sm text-gray-600 ml-2">({q.subject} - {q.topic})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Doğru: <span className="font-bold text-green-600">{q.correctAnswer}</span></div>
                          <div className="text-sm">Benim: <span className="font-bold text-red-600">{q.myAnswer}</span></div>
                          <div className="text-xs text-gray-600">Zorluk: {q.difficulty}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {emptyQuestions.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Minus className="h-5 w-5" />
                  Boş Bıraktığım Sorular
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {emptyQuestions.map(q => (
                    <div key={q.questionNumber} className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">Soru {q.questionNumber}</span>
                          <span className="text-sm text-gray-600 ml-2">({q.subject} - {q.topic})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Doğru Cevap: <span className="font-bold">{q.correctAnswer}</span></div>
                          <div className="text-xs text-gray-600">Sınıf başarısı: {q.classSuccessRate}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
