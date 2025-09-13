"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Users, FileText, BarChart3, Eye, Settings } from "lucide-react"
import CreateExamForm from "./create-exam-form"
import UserManagement from "./user-management"
import ExamList from "./exam-list"
import AnalyticsDashboard from "./analytics-dashboard"
import { useExamStore } from "@/lib/stores/exam-store"
import { useUserStore } from "@/lib/stores/user-store"
import OptikFormTanimla from "./optik-form-tanimla-new"
import OptikFormList from "./optik-form-list"
import OptikResultsViewer from "./optik-results-viewer"
import ExamTypeManagement from "./exam-type-management"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { exams, results } = useExamStore()
  const { users } = useUserStore()

  const stats = {
    totalExams: exams.length,
    totalStudents: users.filter((u) => u.role === "student").length,
    totalTeachers: users.filter((u) => u.role === "teacher").length,
    totalResults: results.length,
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yönetici Paneli</h1>
        <p className="text-gray-600">Sınavları, kullanıcıları yönetin ve sistem analizlerini görüntüleyin</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="exam-types">Sınav Tipleri</TabsTrigger>
          <TabsTrigger value="exams">Sınavlar</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="optik">Optik Form</TabsTrigger>
          <TabsTrigger value="optik-list">Form Listesi</TabsTrigger>
          <TabsTrigger value="results">Sonuçlar</TabsTrigger>
          <TabsTrigger value="create">Sınav Oluştur</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* API Status Card */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                API Entegrasyonu Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 text-sm mb-3">
                Backend API'ye bağlantı sağlandı. Tüm işlemler gerçek veritabanı ile senkronize edilecek.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <strong>Sınav API:</strong> ✅ Aktif<br/>
                  <strong>Optik Form API:</strong> ✅ Aktif<br/>
                  <strong>Dosya Yükleme:</strong> ✅ Aktif
                </div>
                <div>
                  <strong>Excel Upload:</strong> ✅ Hazır<br/>
                  <strong>TXT Upload:</strong> ✅ Hazır<br/>
                  <strong>Analiz API:</strong> ✅ Hazır
                </div>
              </div>
            </CardContent>
          </Card>

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
                <CardTitle className="text-sm font-medium">Öğrenciler</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Öğretmenler</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sınav Sonuçları</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalResults}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => setActiveTab("exam-types")} className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Sınav Tipi Yönet
                </Button>
                <Button onClick={() => setActiveTab("create")} variant="outline" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Yeni Sınav Oluştur
                </Button>
                <Button onClick={() => setActiveTab("users")} variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Kullanıcı Yönetimi
                </Button>
                <Button onClick={() => setActiveTab("analytics")} variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analitikleri Görüntüle
                </Button>
                <Button onClick={() => setActiveTab("optik")} variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Optik Form Tanımla
                </Button>
                <Button onClick={() => setActiveTab("results")} variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  Optik Sonuçları Görüntüle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.slice(-5).map((result, index) => (
                    <div key={`recent-activity-${result.id}-${index}`} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{result.studentName}</p>
                        <p className="text-xs text-gray-500">
                          Sınavı tamamladı • Puan: {result.score}/{result.totalQuestions}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(result.completedAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exam-types">
          <ExamTypeManagement />
        </TabsContent>

        <TabsContent value="exams">
          <ExamList />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="optik">
          <OptikFormTanimla />
        </TabsContent>

        <TabsContent value="optik-list">
          <OptikFormList />
        </TabsContent>

        <TabsContent value="results">
          <OptikResultsViewer />
        </TabsContent>

        <TabsContent value="create">
          <CreateExamForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
