"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Users, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UserFormData {
  username: string
  password: string
  name: string
  email: string
  role: "admin" | "teacher"
}

interface User {
  _id: string
  username: string
  password: string
  role: string
  name: string
  email: string
  id: string
  createdAt: string
  updatedAt: string
}

interface Student {
  _id: string
  studentNo: string
  fullName: string
  classLevel: string
  section: string
  id: string
  createdAt: string
  updatedAt: string
}

export default function UserManagement() {
  const [showUserForm, setShowUserForm] = useState(false)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingStudents, setUploadingStudents] = useState(false)

  const {
    register: registerUser,
    handleSubmit: handleUserSubmit,
    reset: resetUser,
    setValue: setUserValue,
    formState: { errors: userErrors },
  } = useForm<UserFormData>()

  const {
    register: registerStudent,
    handleSubmit: handleStudentSubmit,
    reset: resetStudent,
    setValue: setStudentValue,
    formState: { errors: studentErrors },
  } = useForm<{
    studentNo: string
    fullName: string
    classLevel: string
    section: string
  }>()

  // Load users and students on component mount
  useEffect(() => {
    loadUsers()
    loadStudents()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await apiClient.getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('❌ Kullanıcılar yüklenemedi:', error)
      setError('Kullanıcılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const studentsData = await apiClient.getStudentsForManagement()
      setStudents(studentsData)
    } catch (error) {
      console.error('❌ Öğrenciler yüklenemedi:', error)
    }
  }

  const onUserSubmit = async (data: UserFormData) => {
    try {
      setLoading(true)
      setError("")
      
      if (editingUser) {
        await apiClient.updateUser(editingUser._id, data)
        setSuccess("Kullanıcı başarıyla güncellendi!")
        setEditingUser(null)
      } else {
        const result = await apiClient.createUser(data)
        console.log('✅ Kullanıcı oluşturuldu:', result)
        setSuccess("Kullanıcı başarıyla oluşturuldu!")
      }

      resetUser()
      setShowUserForm(false)
      await loadUsers()
    } catch (error: any) {
      console.error('❌ Kullanıcı işlemi hatası:', error)
      setError(error.message || 'Kullanıcı işlemi sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const onStudentSubmit = async (data: {
    studentNo: string
    fullName: string
    classLevel: string
    section: string
  }) => {
    try {
      setLoading(true)
      setError("")
      
      if (editingStudent) {
        await apiClient.updateStudent(editingStudent._id, data)
        setSuccess("Öğrenci başarıyla güncellendi!")
        setEditingStudent(null)
      } else {
        const result = await apiClient.createStudent(data)
        console.log('✅ Öğrenci oluşturuldu:', result)
        setSuccess("Öğrenci başarıyla oluşturuldu!")
      }

      resetStudent()
      setShowStudentForm(false)
      await loadStudents()
    } catch (error: any) {
      console.error('❌ Öğrenci işlemi hatası:', error)
      setError(error.message || 'Öğrenci işlemi sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
    setShowForm(false)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setValue("username", user.username)
    setValue("name", user.name)
    setValue("email", user.email || "")
    setValue("role", user.role as "teacher" | "student")
    setValue("classId", user.classId || "")
    setShowForm(true)
  }

  const handleDelete = (userId: string) => {
    if (confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
      deleteUser(userId)
      setSuccess("Kullanıcı başarıyla silindi!")
      setTimeout(() => setSuccess(""), 3000)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingUser(null)
    reset()
  }

  const teachers = users.filter((u) => u.role === "teacher")
  const students = users.filter((u) => u.role === "student")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Kullanıcı Ekle
        </Button>
      </div>

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* User Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Oluştur"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input
                    id="username"
                    {...register("username", { required: "Kullanıcı adı gereklidir" })}
                    placeholder="Kullanıcı adı girin"
                  />
                  {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "Ad soyad gereklidir" })}
                    placeholder="Ad soyad girin"
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" type="email" {...register("email")} placeholder="E-posta adresi girin" />
                </div>

                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select onValueChange={(value) => setValue("role", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">👩‍🏫 Öğretmen</SelectItem>
                      <SelectItem value="student">🧑‍🎓 Öğrenci</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedRole === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="classId">Sınıf ID</Label>
                  <Input id="classId" {...register("classId")} placeholder="e.g., class-1, 9A, 10B" />
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  İptal
                </Button>
                <Button type="submit">{editingUser ? "Kullanıcı Güncelle" : "Kullanıcı Oluştur"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Öğretmenler ({teachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-sm text-gray-600">@{teacher.username}</p>
                    {teacher.email && <p className="text-sm text-gray-600">{teacher.email}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Öğretmen</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(teacher)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(teacher.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && <p className="text-gray-500 text-center py-4">Öğretmen bulunamadı</p>}
            </div>
          </CardContent>
        </Card>

        {/* Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Öğrenciler ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">@{student.username}</p>
                    {student.email && <p className="text-sm text-gray-600">{student.email}</p>}
                    {student.classId && <p className="text-sm text-gray-600">Sınıf: {student.classId}</p>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Öğrenci</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(student.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {students.length === 0 && <p className="text-gray-500 text-center py-4">Öğrenci bulunamadı</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
