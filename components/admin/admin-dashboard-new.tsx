"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  PlusCircle, 
  Users, 
  FileText, 
  BarChart3, 
  Eye, 
  Settings, 
  BookOpen,
  TrendingUp,
  Calendar,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Download,
  Upload,
  Zap,
  Award,
  UserCheck
} from "lucide-react"
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
  const [activeView, setActiveView] = useState<string | null>(null)
  const { exams, results } = useExamStore()
  const { users } = useUserStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const stats = {
    totalExams: exams.length,
    totalStudents: users.filter((u) => u.role === "student").length,
    totalTeachers: users.filter((u) => u.role === "teacher").length,
    totalResults: results.length,
    activeExams: exams.filter((e) => e.status === "active").length,
    completedExams: exams.filter((e) => e.status === "completed").length,
  }

  const quickActions = [
    {
      title: "Yeni Sınav",
      description: "Hızlıca sınav oluştur",
      icon: PlusCircle,
      color: "bg-blue-500",
      action: () => setActiveView("create"),
      badge: "Hızlı"
    },
    {
      title: "Optik Form",
      description: "Form tanımla ve yönet",
      icon: FileText,
      color: "bg-green-500",
      action: () => setActiveView("optik"),
      badge: null
    },
    {
      title: "Sonuçlar",
      description: "Sınav sonuçlarını görüntüle",
      icon: Eye,
      color: "bg-purple-500",
      action: () => setActiveView("results"),
      badge: results.length > 0 ? "Yeni" : null
    },
    {
      title: "Analizler",
      description: "Detaylı raporlar ve grafikler",
      icon: BarChart3,
      color: "bg-orange-500",
      action: () => setActiveView("analytics"),
      badge: null
    }
  ]

  const managementActions = [
    {
      title: "Sınav Yönetimi",
      description: "Tüm sınavları listele ve düzenle",
      icon: BookOpen,
      action: () => setActiveView("exams")
    },
    {
      title: "Kullanıcı Yönetimi", 
      description: "Öğrenci ve öğretmenleri yönet",
      icon: Users,
      action: () => setActiveView("users")
    },
    {
      title: "Sınav Tipleri",
      description: "Sınav kategorilerini düzenle",
      icon: Settings,
      action: () => setActiveView("exam-types")
    },
    {
      title: "Form Listesi",
      description: "Optik formları görüntüle",
      icon: Target,
      action: () => setActiveView("optik-list")
    }
  ]

  if (activeView) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setActiveView(null)}
            className="flex items-center gap-2"
          >
            ← Ana Panele Dön
          </Button>
        </div>
        
        {activeView === "create" && <CreateExamForm />}
        {activeView === "users" && <UserManagement />}
        {activeView === "exams" && <ExamList />}
        {activeView === "analytics" && <AnalyticsDashboard />}
        {activeView === "optik" && <OptikFormTanimla />}
        {activeView === "optik-list" && <OptikFormList />}
        {activeView === "results" && <OptikResultsViewer />}
        {activeView === "exam-types" && <ExamTypeManagement />}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Yönetici Paneli</h1>
          <p className="text-gray-600 text-lg">Sınav sistemini yönetin ve analiz edin</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col items-end">
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {currentTime.toLocaleTimeString('tr-TR')}
          </div>
        </div>
      </div>

      {/* System Status */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-green-800">Sistem Durumu: Aktif</h3>
            <Badge className="bg-green-100 text-green-800">Çevrimiçi</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>API Bağlantısı</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Veritabanı</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Dosya Sistemi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Analiz Motoru</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Toplam Sınav</p>
                <p className="text-3xl font-bold">{stats.totalExams}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Öğrenciler</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Öğretmenler</p>
                <p className="text-3xl font-bold">{stats.totalTeachers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Sonuçlar</p>
                <p className="text-3xl font-bold">{stats.totalResults}</p>
              </div>
              <Award className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Aktif Sınavlar</p>
                <p className="text-3xl font-bold">{stats.activeExams}</p>
              </div>
              <Activity className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-sm">Tamamlanan</p>
                <p className="text-3xl font-bold">{stats.completedExams}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-200"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  {action.badge && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Management Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-500" />
          Yönetim İşlemleri
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {managementActions.map((action, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-gray-50"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <action.icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
