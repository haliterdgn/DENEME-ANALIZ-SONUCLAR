"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, UserPlus, Upload, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"

interface Student {
  _id: string
  studentNo: string
  fullName: string
  classLevel: string
  section: string
  parentPhone?: string
  // Legacy fields for backward compatibility
  name?: string
  studentNumber?: string
  className?: string
  grade?: number
  schoolCode?: string
  schoolName?: string
  tcNo?: string
  email?: string
  gender?: string
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    studentNo: "",
    fullName: "",
    classLevel: "",
    section: "",
    parentPhone: ""
  })
  
  // Excel upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const studentsData = await apiClient.getStudentsForManagement()
      console.log('API Response:', studentsData)
      
      // Ensure studentsData is an array
      if (Array.isArray(studentsData)) {
        setStudents(studentsData)
        console.log('✅ Öğrenciler yüklendi:', studentsData.length)
      } else {
        console.error('❌ API yanıtı array değil:', studentsData)
        setStudents([])
        setError('Öğrenci verileri beklenen formatta değil')
      }
    } catch (error) {
      console.error('❌ Öğrenciler yüklenemedi:', error)
      setError('Öğrenciler yüklenemedi')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.studentNo || !formData.fullName || !formData.classLevel) {
      setError("Öğrenci numarası, isim ve sınıf zorunludur")
      return
    }

    try {
      setLoading(true)
      // API'nin beklediği yeni format
      const studentData = {
        studentNo: formData.studentNo,
        fullName: formData.fullName.toUpperCase(), // API için büyük harf
        classLevel: formData.classLevel,
        section: formData.section,
        parentPhone: formData.parentPhone
      }
      const response = await apiClient.createStudent(studentData)
      console.log('Create Student Response:', response)
      
      if (response?.success) {
        setSuccess(`Öğrenci başarıyla oluşturuldu: ${response.student?.fullName || response.student?.name}`)
      } else {
        setSuccess("Öğrenci başarıyla oluşturuldu")
      }
      
      setShowCreateModal(false)
      resetForm()
      loadStudents()
    } catch (error) {
      console.error('❌ Öğrenci oluşturulamadı:', error)
      setError('Öğrenci oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      studentNo: "",
      fullName: "",
      classLevel: "",
      section: "",
      parentPhone: ""
    })
    setError("")
    setSuccess("")
  }

  const handleExcelUpload = async () => {
    if (!selectedFile) {
      setError("Lütfen bir Excel dosyası seçin")
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.uploadStudentsExcel(selectedFile)
      console.log('Excel Upload Response:', response)
      
      if (response?.results) {
        const { total, success, skipped, errors } = response.results
        let message = `Excel yükleme tamamlandı: ${success}/${total} öğrenci başarıyla eklendi`
        
        if (skipped > 0) {
          message += `, ${skipped} öğrenci atlandı`
        }
        
        if (errors && errors.length > 0) {
          message += `, ${errors.length} hata oluştu`
          console.warn('Excel Upload Errors:', errors)
        }
        
        setSuccess(message)
      } else {
        setSuccess("Excel dosyası başarıyla yüklendi")
      }
      
      setShowUploadModal(false)
      setSelectedFile(null)
      loadStudents()
    } catch (error) {
      console.error('❌ Excel yüklenemedi:', error)
      setError('Excel dosyası yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file)
        setError("")
      } else {
        setError("Lütfen geçerli bir Excel dosyası seçin (.xlsx veya .xls)")
        setSelectedFile(null)
      }
    }
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      studentNo: student.studentNo || student.studentNumber || '',
      fullName: student.fullName || student.name || '',
      classLevel: student.classLevel || student.className || '',
      section: student.section || '',
      parentPhone: student.parentPhone || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent || !formData.studentNo || !formData.fullName || !formData.classLevel) {
      setError("Öğrenci numarası, isim ve sınıf zorunludur")
      return
    }

    try {
      setLoading(true)
      const studentData = {
        studentNo: formData.studentNo,
        fullName: formData.fullName.toUpperCase(), // API için büyük harf
        classLevel: formData.classLevel,
        section: formData.section,
        parentPhone: formData.parentPhone
      }
      const response = await apiClient.updateStudent(editingStudent._id, studentData)
      console.log('Update Student Response:', response)
      
      if (response?.success || response?.student) {
        setSuccess(`Öğrenci başarıyla güncellendi: ${formData.fullName}`)
      } else {
        setSuccess("Öğrenci başarıyla güncellendi")
      }
      
      setShowEditModal(false)
      setEditingStudent(null)
      resetForm()
      loadStudents()
    } catch (error) {
      console.error('❌ Öğrenci güncellenemedi:', error)
      setError('Öğrenci güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`"${student.name}" isimli öğrenciyi silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.deleteStudent(student._id)
      console.log('Delete Student Response:', response)
      
      if (response?.success || response?.message) {
        setSuccess(`Öğrenci başarıyla silindi: ${student.name}`)
      } else {
        setSuccess("Öğrenci başarıyla silindi")
      }
      
      loadStudents()
    } catch (error) {
      console.error('❌ Öğrenci silinemedi:', error)
      setError('Öğrenci silinemedi')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Öğrenciler ({students.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowUploadModal(true)} variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Excel Yükle
              </Button>
              <Button onClick={openCreateModal} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Yeni Öğrenci
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Öğrenciler yükleniyor...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Henüz öğrenci bulunmamaktadır.</div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(students) && students.map((student) => (
                <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">{student.fullName || student.name}</h3>
                      <p className="text-sm text-gray-500">No: {student.studentNo || student.studentNumber}</p>
                      <p className="text-sm text-gray-500">{student.classLevel || student.className} / {student.section}</p>
                      {student.schoolName && (
                        <p className="text-sm text-gray-500">Okul: {student.schoolName}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">
                        {student.classLevel || student.className || student.grade}. Sınıf
                      </Badge>
                      {student.gender && (
                        <Badge variant="secondary" className="text-xs">
                          {student.gender === 'E' ? 'Erkek' : 'Kız'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditStudent(student)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteStudent(student)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Student Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Öğrenci Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-student-name">Ad Soyad *</Label>
              <Input
                id="create-student-name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="halit erdoğan"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-student-number">Öğrenci Numarası *</Label>
              <Input
                id="create-student-number"
                value={formData.studentNo}
                onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                placeholder="1245"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-class-level">Sınıf Seviyesi *</Label>
              <Input
                id="create-class-level"
                value={formData.classLevel}
                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                placeholder="7"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-section">Şube *</Label>
              <Input
                id="create-section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="B"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-parent-phone">Veli Telefonu</Label>
              <Input
                id="create-parent-phone"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="05511581212"
                disabled={loading}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Öğrenci Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-student-name">Ad Soyad *</Label>
              <Input
                id="edit-student-name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="halit erdoğan"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-student-number">Öğrenci Numarası *</Label>
              <Input
                id="edit-student-number"
                value={formData.studentNo}
                onChange={(e) => setFormData({ ...formData, studentNo: e.target.value })}
                placeholder="1245"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-class-level">Sınıf Seviyesi *</Label>
              <Input
                id="edit-class-level"
                value={formData.classLevel}
                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                placeholder="7"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-section">Şube *</Label>
              <Input
                id="edit-section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="B"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-parent-phone">Veli Telefonu</Label>
              <Input
                id="edit-parent-phone"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="05511581212"
                disabled={loading}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingStudent(null)
                  resetForm()
                }}
                disabled={loading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excel Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excel ile Öğrenci Yükle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Excel Dosyası</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={loading}
              />
              {selectedFile && (
                <p className="text-sm text-green-600">
                  ✓ Seçilen dosya: {selectedFile.name}
                </p>
              )}
            </div>
            
            <div className="text-sm text-gray-600 max-h-64 overflow-y-auto">
              <p>Excel dosyasında şu sütunlar olmalıdır:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>studentNo</strong> - Öğrenci numarası (örn: 1245)</li>
                <li><strong>fullName</strong> - Ad Soyad (örn: halit erdoğan)</li>
                <li><strong>classLevel</strong> - Sınıf seviyesi (örn: 7)</li>
                <li><strong>section</strong> - Şube (örn: B)</li>
                <li><strong>parentPhone</strong> - Veli telefonu (örn: 05511581212) <em>(opsiyonel)</em></li>
              </ul>
              <p className="mt-2 text-xs text-blue-600">
                💡 İpucu: İlk satır başlık satırı olmalıdır. Zorunlu alanlar: studentNo, fullName, classLevel, section
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowUploadModal(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button 
                onClick={handleExcelUpload}
                disabled={loading || !selectedFile}
              >
                {loading ? "Yükleniyor..." : "Yükle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}