'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { AlertCircle, CheckCircle, XCircle, Users, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useExamStore } from '@/lib/stores/exam-store'

interface ExamContent {
  examName: string;
  optikFormName: string;
  optikFormId: string;
  questions: {
    soruno: number;
    ders: string;
    konu: string;
    dogru_cevap: string;
  }[];
}

interface StudentResult {
  studentName: string;
  studentInfo: {
    kt?: string; // kitapçık
  };
  subjectAnswers: {
    subjectName: string;
    answers: string;
    questionCount: number;
    startPosition: number;
  }[];
}

const DetailedExamAnalysis = () => {
  const { selectedExam } = useExamStore()
  const [examContent, setExamContent] = useState<ExamContent | null>(null)
  const [studentResults, setStudentResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)

  // Load exam data
  useEffect(() => {
    if (selectedExam?.id) {
      loadExamData()
    }
  }, [selectedExam])

  const loadExamData = async () => {
    if (!selectedExam?.id) return

    setLoading(true)
    setError(null)

    try {
      console.log('📥 Loading exam data for:', selectedExam.id)
      
      // Load exam content and student results
      const [contentResponse, resultsResponse] = await Promise.all([
        apiClient.getExamContent(selectedExam.id),
        apiClient.getStudentResults(selectedExam.id)
      ])

      console.log('📊 Exam content loaded:', contentResponse)
      console.log('👥 Student results loaded:', resultsResponse)

      setExamContent(contentResponse)
      setStudentResults(resultsResponse || [])
      
      // Calculate analysis
      if (contentResponse && resultsResponse?.length > 0) {
        const analysis = calculateTopicAnalysis(resultsResponse, contentResponse)
        setAnalysisData(analysis)
        console.log('🎯 Analysis completed:', analysis)
      }
    } catch (err) {
      console.error('❌ Error loading exam data:', err)
      setError('Sınav verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Advanced Topic Analysis - matches backend API format exactly
  const calculateTopicAnalysis = (results: StudentResult[], examContent: ExamContent) => {
    console.log('🎯 ADVANCED TOPIC ANALYSIS STARTED')
    
    if (!results?.length || !examContent?.questions?.length) {
      return null
    }

    // Group questions by DERS (subject)
    const subjectGroups = examContent.questions.reduce((groups: any, question: any) => {
      const subject = question.ders
      if (!groups[subject]) groups[subject] = []
      groups[subject].push(question)
      return groups
    }, {})

    const topicAnalysis: any = {}
    const subjectSummary: any = {}

    // Analyze each DERS (subject)
    Object.keys(subjectGroups).forEach(subjectName => {
      const subjectQuestions = subjectGroups[subjectName]
      
      // Group questions by topic within this subject
      const topicGroups = subjectQuestions.reduce((groups: any, question: any) => {
        const topic = question.konu
        if (!groups[topic]) groups[topic] = []
        groups[topic].push(question)
        return groups
      }, {})

      console.log(`📚 ${subjectName}: ${Object.keys(topicGroups).length} topics`)
      
      topicAnalysis[subjectName] = {}
      const topicBreakdown: any[] = []
      let subjectTotalSuccess = 0

      // Detailed analysis for each topic
      Object.keys(topicGroups).forEach(topicName => {
        const topicQuestions = topicGroups[topicName]
        const questionNumbers = topicQuestions.map((q: any) => q.soruno)
        
        // Calculate student performance for this topic
        let totalCorrect = 0
        let totalWrong = 0  
        let totalEmpty = 0
        const studentScores: number[] = []
        const questionAnalysis: any[] = []

        // Analyze each question
        topicQuestions.forEach((question: any) => {
          const questionNumber = question.soruno
          const correctAnswer = question.dogru_cevap
          let qCorrect = 0, qWrong = 0, qEmpty = 0

          // Check each student's answer to this question
          results.forEach(student => {
            if (!student.subjectAnswers) return

            const subjectAnswer = student.subjectAnswers.find((sa: any) => 
              sa.subjectName === subjectName
            )
            
            if (subjectAnswer?.answers) {
              const answers = subjectAnswer.answers
              const questionIndex = questionNumber - 1
              
              if (questionIndex >= 0 && questionIndex < answers.length) {
                const studentAnswer = answers[questionIndex]
                
                if (!studentAnswer || studentAnswer.trim() === '') {
                  qEmpty++
                } else if (studentAnswer.toLowerCase() === correctAnswer?.toLowerCase()) {
                  qCorrect++
                } else {
                  qWrong++
                }
              }
            }
          })

          const qSuccessRate = (qCorrect + qWrong + qEmpty) > 0 
            ? (qCorrect / (qCorrect + qWrong + qEmpty)) * 100 
            : 0
          
          const difficultyIndex = (qCorrect + qWrong + qEmpty) > 0
            ? qWrong / (qCorrect + qWrong + qEmpty)
            : 0

          questionAnalysis.push({
            questionNumber,
            correctAnswer,
            correctCount: qCorrect,
            wrongCount: qWrong,
            emptyCount: qEmpty,
            successRate: qSuccessRate,
            difficultyIndex,
            discriminationIndex: 0
          })

          totalCorrect += qCorrect
          totalWrong += qWrong
          totalEmpty += qEmpty
        })

        // Calculate score for each student in this topic
        results.forEach(student => {
          let studentCorrect = 0
          
          const subjectAnswer = student.subjectAnswers?.find((sa: any) => 
            sa.subjectName === subjectName
          )
          
          if (subjectAnswer?.answers) {
            topicQuestions.forEach((question: any) => {
              const questionIndex = question.soruno - 1
              if (questionIndex >= 0 && questionIndex < subjectAnswer.answers.length) {
                const studentAnswer = subjectAnswer.answers[questionIndex]
                if (studentAnswer?.toLowerCase() === question.dogru_cevap?.toLowerCase()) {
                  studentCorrect++
                }
              }
            })
          }

          const studentScore = topicQuestions.length > 0 
            ? (studentCorrect / topicQuestions.length) * 100 
            : 0
          studentScores.push(studentScore)
        })

        // Calculate statistics
        const totalQuestions = topicQuestions.length
        const totalStudents = results.length
        const totalPossibleAnswers = totalQuestions * totalStudents
        
        const successRate = totalPossibleAnswers > 0 
          ? (totalCorrect / totalPossibleAnswers) * 100 
          : 0

        const averageScore = studentScores.length > 0
          ? studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length
          : 0

        const highestScore = studentScores.length > 0 ? Math.max(...studentScores) : 0
        const lowestScore = studentScores.length > 0 ? Math.min(...studentScores) : 0
        
        const variance = studentScores.length > 0
          ? studentScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / studentScores.length
          : 0
        const standardDeviation = Math.sqrt(variance)

        // Difficulty level
        let difficultyLevel = 'medium'
        if (successRate >= 85) difficultyLevel = 'very_easy'
        else if (successRate >= 70) difficultyLevel = 'easy'
        else if (successRate >= 55) difficultyLevel = 'medium'
        else difficultyLevel = 'hard'

        const topicData = {
          topicName,
          subjectName,
          totalQuestions,
          totalStudents,
          questionNumbers,
          correctAnswers: totalCorrect,
          wrongAnswers: totalWrong,
          emptyAnswers: totalEmpty,
          successRate,
          averageScore,
          highestScore,
          lowestScore,
          standardDeviation,
          difficultyLevel,
          questionAnalysis
        }

        topicAnalysis[subjectName][topicName] = topicData
        subjectTotalSuccess += successRate

        topicBreakdown.push({
          topicName,
          questionCount: totalQuestions,
          successRate,
          difficultyLevel
        })
      })

      // Subject summary
      const topicCount = Object.keys(topicGroups).length
      const averageSuccessRate = topicCount > 0 ? subjectTotalSuccess / topicCount : 0
      const successRates = topicBreakdown.map(t => t.successRate)
      
      subjectSummary[subjectName] = {
        totalTopics: topicCount,
        totalQuestions: subjectQuestions.length,
        averageSuccessRate,
        highestTopicSuccess: Math.max(...successRates, 0),
        lowestTopicSuccess: Math.min(...successRates, 0),
        topicBreakdown
      }
    })

    // Overall statistics
    const totalTopics = Object.values(topicAnalysis).reduce((sum: number, subject: any) => 
      sum + Object.keys(subject).length, 0
    )
    const allSuccessRates = Object.values(topicAnalysis).flatMap((subject: any) =>
      Object.values(subject).map((topic: any) => topic.successRate)
    )
    const averageTopicSuccess = allSuccessRates.length > 0
      ? allSuccessRates.reduce((sum: number, rate: number) => sum + rate, 0) / allSuccessRates.length
      : 0

    return {
      message: "Konu analizi başarıyla tamamlandı",
      examInfo: {
        examId: selectedExam?.id || 'unknown',
        examName: examContent?.examName || selectedExam?.examName || 'Bilinmeyen Sınav',
        date: new Date().toISOString().split('T')[0],
        optikFormId: examContent?.optikFormId || 'unknown',
        optikFormName: examContent?.optikFormName || 'Bilinmeyen Form'
      },
      topicAnalysis,
      subjectSummary,
      overallStats: {
        totalStudents: results.length,
        totalQuestions: examContent?.questions?.length || 0,
        totalTopics,
        averageTopicSuccess
      }
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'very_easy': return 'text-green-600'
      case 'easy': return 'text-blue-600'
      case 'medium': return 'text-yellow-600'
      case 'hard': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getDifficultyBadge = (level: string) => {
    const colors = {
      'very_easy': 'bg-green-100 text-green-800',
      'easy': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    }
    const labels = {
      'very_easy': 'Çok Kolay',
      'easy': 'Kolay', 
      'medium': 'Orta',
      'hard': 'Zor'
    }
    return <Badge className={colors[level as keyof typeof colors]}>{labels[level as keyof typeof labels]}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Sınav analizi yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    )
  }

  if (!analysisData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>Analiz için sınav seçin</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Detaylı Sınav Analizi
          </CardTitle>
          <div className="text-sm text-gray-600">
            <p><strong>Sınav:</strong> {analysisData.examInfo.examName}</p>
            <p><strong>Form:</strong> {analysisData.examInfo.optikFormName}</p>
            <p><strong>Tarih:</strong> {analysisData.examInfo.date}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analysisData.overallStats.totalStudents}</div>
            <div className="text-sm text-gray-500">Toplam Öğrenci</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analysisData.overallStats.totalQuestions}</div>
            <div className="text-sm text-gray-500">Toplam Soru</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analysisData.overallStats.totalTopics}</div>
            <div className="text-sm text-gray-500">Toplam Konu</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analysisData.overallStats.averageTopicSuccess.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Ortalama Başarı</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Ders Bazlı Konu Analizleri</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(analysisData.topicAnalysis)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Object.keys(analysisData.topicAnalysis).map(subject => (
                <TabsTrigger key={subject} value={subject} className="text-xs">
                  {subject}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(analysisData.topicAnalysis).map(([subjectName, topics]: [string, any]) => (
              <TabsContent key={subjectName} value={subjectName} className="space-y-4">
                {/* Subject Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{subjectName} Ders Özeti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold">{analysisData.subjectSummary[subjectName].totalTopics}</div>
                        <div className="text-sm text-gray-500">Konu Sayısı</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{analysisData.subjectSummary[subjectName].totalQuestions}</div>
                        <div className="text-sm text-gray-500">Soru Sayısı</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{analysisData.subjectSummary[subjectName].averageSuccessRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">Ortalama Başarı</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">{analysisData.subjectSummary[subjectName].highestTopicSuccess.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">En Yüksek</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-600">{analysisData.subjectSummary[subjectName].lowestTopicSuccess.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">En Düşük</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Topics List */}
                <div className="space-y-4">
                  {Object.entries(topics).map(([topicName, topicData]: [string, any]) => (
                    <Card key={topicName}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{topicName}</CardTitle>
                            <div className="text-sm text-gray-500">
                              Sorular: {topicData.questionNumbers.join(', ')}
                            </div>
                          </div>
                          <div className="text-right">
                            {getDifficultyBadge(topicData.difficultyLevel)}
                            <div className="text-lg font-bold mt-1">{topicData.successRate.toFixed(1)}%</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-green-600">{topicData.correctAnswers}</div>
                            <div className="text-gray-500">Doğru</div>
                          </div>
                          <div>
                            <div className="font-medium text-red-600">{topicData.wrongAnswers}</div>
                            <div className="text-gray-500">Yanlış</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-600">{topicData.emptyAnswers}</div>
                            <div className="text-gray-500">Boş</div>
                          </div>
                          <div>
                            <div className="font-medium">{topicData.averageScore.toFixed(1)}%</div>
                            <div className="text-gray-500">Ortalama</div>
                          </div>
                          <div>
                            <div className="font-medium">{topicData.highestScore.toFixed(1)}%</div>
                            <div className="text-gray-500">En Yüksek</div>
                          </div>
                          <div>
                            <div className="font-medium">{topicData.standardDeviation.toFixed(1)}</div>
                            <div className="text-gray-500">Std. Sapma</div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Progress value={topicData.successRate} className="h-2" />
                        </div>

                        {/* Question Analysis Table */}
                        {topicData.questionAnalysis.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Soru Bazlı Analiz</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-16">Soru</TableHead>
                                  <TableHead className="w-16">Cevap</TableHead>
                                  <TableHead className="w-16">Doğru</TableHead>
                                  <TableHead className="w-16">Yanlış</TableHead>
                                  <TableHead className="w-16">Boş</TableHead>
                                  <TableHead>Başarı %</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {topicData.questionAnalysis.map((q: any) => (
                                  <TableRow key={q.questionNumber}>
                                    <TableCell>{q.questionNumber}</TableCell>
                                    <TableCell className="font-medium">{q.correctAnswer}</TableCell>
                                    <TableCell className="text-green-600">{q.correctCount}</TableCell>
                                    <TableCell className="text-red-600">{q.wrongCount}</TableCell>
                                    <TableCell className="text-gray-600">{q.emptyCount}</TableCell>
                                    <TableCell>{q.successRate.toFixed(1)}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default DetailedExamAnalysis
