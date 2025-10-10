"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, GraduationCap, Shield, BookOpen, Crown, Users } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/lib/stores/auth-store"

export default function LoginForm() {
  const [userLogin, setUserLogin] = useState({ username: "", password: "", role: "teacher" as "admin" | "teacher" })
  const [studentLogin, setStudentLogin] = useState({ studentNumber: "", name: "" })
  const [userLoading, setUserLoading] = useState(false)
  const [studentLoading, setStudentLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { setUser } = useAuthStore()
  
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userLogin.username || !userLogin.password) {
      setError("Kullanıcı adı ve şifre gereklidir")
      return
    }

    try {
      setUserLoading(true)
      setError("")
      
      // API login ile rol doğrulama
      const response = await apiClient.loginUser(userLogin.username, userLogin.password)
      
      // Seçilen rol ile API'den gelen rol uyuşuyor mu kontrol et
      if (response.role !== userLogin.role) {
        setError(`Bu kullanıcı ${response.role === "admin" ? "müdür" : "öğretmen"} rolündedir. Lütfen doğru rolü seçin.`)
        setUserLoading(false)
        return
      }
      
      setSuccess(`${userLogin.role === "admin" ? "Müdür" : "Öğretmen"} girişi başarılı!`)
      console.log("✅ Personel girişi başarılı:", response)
      
      setUser({
        id: response.id || response._id,
        username: response.username,
        name: response.name,
        email: response.email,
        role: response.role
      })
    } catch (error) {
      console.error("❌ Personel girişi başarısız:", error)
      setError("Kullanıcı adı, şifre veya rol hatalı")
    } finally {
      setUserLoading(false)
    }
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentLogin.studentNumber || !studentLogin.name) {
      setError("Öğrenci numarası ve isim gereklidir")
      return
    }

    try {
      setStudentLoading(true)
      setError("")
      
      // Input verilerini temizle ve normalize et (büyük harf)
      const cleanStudentNo = studentLogin.studentNumber.trim()
      const cleanFullName = studentLogin.name.trim().toUpperCase()
      
      // Debug: Login verilerini loglayalım
      console.log("🔍 Öğrenci Login Verisi:", {
        original: { studentNo: studentLogin.studentNumber, fullName: studentLogin.name },
        cleaned: { studentNo: cleanStudentNo, fullName: cleanFullName }
      })
      
      const response = await apiClient.loginStudent(cleanStudentNo, cleanFullName)
      console.log("✅ Öğrenci girişi başarılı:", response)
      
      if (response?.success && response?.student) {
        setSuccess(`${response.message} - Hoş geldiniz ${response.student.fullName}!`)
        
        setUser({
          id: response.student.id || response.student._id,
          username: response.student.studentNo,
          name: response.student.fullName,
          email: "",
          role: "student"
        })
      } else {
        throw new Error("Giriş yanıtı beklenen formatta değil")
      }
    } catch (error: any) {
      console.error("❌ Öğrenci girişi başarısız:", error)
      
      // API'den gelen hata mesajını kullan
      const errorMessage = error?.message || "Öğrenci numarası veya isim hatalı"
      setError(`Giriş hatası: ${errorMessage}`)
    } finally {
      setStudentLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Okul Yönetim Sistemi
          </CardTitle>
          <p className="text-gray-500 mt-2">Hesabınıza giriş yapın</p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="staff" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Personel
              </TabsTrigger>
              <TabsTrigger value="student" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Öğrenci
              </TabsTrigger>
            </TabsList>

            <TabsContent value="staff" className="space-y-4">
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Kullanıcı Adı
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={userLogin.username}
                    onChange={(e) => setUserLogin({ ...userLogin, username: e.target.value })}
                    placeholder="Kullanıcı adınızı girin"
                    disabled={userLoading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Şifre
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={userLogin.password}
                    onChange={(e) => setUserLogin({ ...userLogin, password: e.target.value })}
                    placeholder="Şifrenizi girin"
                    disabled={userLoading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    {userLogin.role === "admin" ? <Crown className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    Görev
                  </Label>
                  <Select
                    value={userLogin.role}
                    onValueChange={(value: "admin" | "teacher") => 
                      setUserLogin({ ...userLogin, role: value })
                    }
                    disabled={userLoading}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Müdür
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Öğretmen
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className={`w-full h-12 ${
                    userLogin.role === "admin" 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  }`}
                  disabled={userLoading}
                >
                  {userLoading ? "Giriş yapılıyor..." : (userLogin.role === "admin" ? "Müdür Girişi" : "Öğretmen Girişi")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="student" className="space-y-4">
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentNumber" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Öğrenci Numarası
                  </Label>
                  <Input
                    id="studentNumber"
                    type="text"
                    value={studentLogin.studentNumber}
                    onChange={(e) => setStudentLogin({ ...studentLogin, studentNumber: e.target.value })}
                    placeholder="Öğrenci numaranızı girin (örn: 1050)"
                    disabled={studentLoading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ad Soyad (Tam Ad)
                  </Label>
                  <Input
                    id="studentName"
                    type="text"
                    value={studentLogin.name}
                    onChange={(e) => setStudentLogin({ ...studentLogin, name: e.target.value })}
                    placeholder="Tam adınızı girin (örn: TAHA BERK POLAT)"
                    disabled={studentLoading}
                    className="h-12"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                  disabled={studentLoading}
                >
                  {studentLoading ? "Giriş yapılıyor..." : "Öğrenci Girişi"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
