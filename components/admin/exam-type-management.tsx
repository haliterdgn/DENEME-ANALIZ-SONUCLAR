"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, BookOpen, Settings, Eye, FileText } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Subject {
  name: string
  questionCount: number
}

interface ExamType {
  _id?: string
  id?: string
  name: string
  description?: string
  subjects: Subject[]
  totalDuration: number // Toplam sınav süresi (dakika)
  totalQuestions: number
  gradeLevels: string[] // Hangi sınıf seviyelerine uygun (5-8. sınıflar)
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export default function ExamTypeManagement() {
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [optikForms, setOptikForms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<ExamType | null>(null)
  const [formData, setFormData] = useState<ExamType>({
    name: "",
    description: "",
    subjects: [],
    totalDuration: 0,
    totalQuestions: 0,
    gradeLevels: [],
    isActive: true
  })

  // Önceden tanımlı sınav tipleri şablonları
  const examTemplates = {
    LGS: {
      name: "LGS (Liselere Giriş Sınavı)",
      description: "8. sınıf öğrencileri için merkezi sınav sistemi",
      subjects: [
        { name: "Türkçe", questionCount: 20, duration: 25 },
        { name: "Matematik", questionCount: 20, duration: 40 },
        { name: "Fen Bilimleri", questionCount: 20, duration: 25 },
        { name: "İnkılap Tarihi", questionCount: 10, duration: 15 },
        { name: "Din Kültürü", questionCount: 10, duration: 15 },
        { name: "İngilizce", questionCount: 10, duration: 20 }
      ],
      totalDuration: 140,
      gradeLevels: ["8. Sınıf"],
      passingScore: 40
    },
    AYT: {
      name: "AYT (Alan Yeterlilik Testi)",
      description: "12. sınıf öğrencileri için alan yeterlilik sınavı",
      subjects: [
        { name: "Matematik", questionCount: 40, duration: 60 },
        { name: "Fizik", questionCount: 14, duration: 30 },
        { name: "Kimya", questionCount: 13, duration: 30 },
        { name: "Biyoloji", questionCount: 13, duration: 30 }
      ],
      totalDuration: 150,
      gradeLevels: ["8. Sınıf"],
      passingScore: 50
    },
    TYT: {
      name: "TYT (Temel Yeterlilik Testi)",
      description: "11. ve 12. sınıf öğrencileri için temel yeterlilik sınavı",
      subjects: [
        { name: "Türkçe", questionCount: 40, duration: 50 },
        { name: "Matematik", questionCount: 40, duration: 50 },
        { name: "Sosyal Bilimler", questionCount: 20, duration: 25 },
        { name: "Fen Bilimleri", questionCount: 20, duration: 25 }
      ],
      totalDuration: 150,
      gradeLevels: ["7. Sınıf", "8. Sınıf"],
      passingScore: 45
    }
  }

  useEffect(() => {
    fetchExamTypes()
    fetchOptikForms()
  }, [])

  // Dersler değiştiğinde toplam soru sayısını otomatik hesapla
  useEffect(() => {
    const totalQuestions = formData.subjects.reduce((sum, subject) => sum + (subject.questionCount || 0), 0)
    
    // Sadece toplam soru sayısı farklıysa güncelle (sonsuz döngüyü önle)
    if (formData.totalQuestions !== totalQuestions) {
      setFormData(prev => ({
        ...prev,
        totalQuestions
      }))
    }
  }, [formData.subjects])

  const fetchOptikForms = async () => {
    try {
      const forms = await apiClient.getOptikForms()
      setOptikForms(forms)
    } catch (error) {
      // Network hatası durumunda sessizce boş array kullan
      setOptikForms([])
      console.warn('Optik formlar offline modda çalışıyor')
    }
  }

  const fetchExamTypes = async () => {
    setIsLoading(true)
    try {
      const types = await apiClient.getExamTypes()
      // API'den gelen verileri normalize et
      const normalizedTypes = types.map((type: any) => ({
        ...type,
        subjects: type.subjects || [],
        gradeLevels: type.gradeLevels || [],
        totalQuestions: type.totalQuestions || 0,
        totalDuration: type.totalDuration || 0,
        passingScore: type.passingScore || 50,
        isActive: type.isActive !== undefined ? type.isActive : true,
        optikFormId: type.optikFormId || ""
      }))
      setExamTypes(normalizedTypes)
    } catch (error) {
      // Network hatası durumunda sessizce boş array kullan
      setExamTypes([])
      console.warn('Sınav tipleri offline modda çalışıyor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Toplam soru sayısını hesapla
      const totalQuestions = formData.subjects.reduce((sum, subject) => sum + subject.questionCount, 0)
      
      // Backend için field mapping
      const dataToSave = { 
        ...formData, 
        totalQuestions,
        typeName: formData.name, // Backend typeName bekliyor, frontend name kullanıyor
        isActive: true // Her zaman aktif olarak kaydet
      }

      if (editingType) {
        await apiClient.updateExamType(editingType._id || editingType.id || '', dataToSave)
      } else {
        await apiClient.createExamType(dataToSave)
      }
      
      await fetchExamTypes()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Sınav tipi kaydedilemedi:', error)
      alert('Sınav tipi kaydedilemedi. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (examType: ExamType) => {
    if (window.confirm(`"${examType.name}" sınav tipini silmek istediğinizden emin misiniz?`)) {
      try {
        await apiClient.deleteExamType(examType._id || examType.id || '')
        await fetchExamTypes()
      } catch (error) {
        console.error('Sınav tipi silinemedi:', error)
        alert('Sınav tipi silinemedi. Lütfen tekrar deneyin.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      subjects: [],
      totalDuration: 0,
      totalQuestions: 0,
      gradeLevels: [],
      isActive: true
    })
    setEditingType(null)
  }

  const openEditDialog = (examType: ExamType) => {
    setFormData(examType)
    setEditingType(examType)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const applyTemplate = (templateKey: keyof typeof examTemplates) => {
    const template = examTemplates[templateKey]
    setFormData({
      ...formData,
      ...template,
      totalQuestions: template.subjects.reduce((sum, subject) => sum + subject.questionCount, 0),
      isActive: true // Template'den gelen sınav tipi aktif olsun
    })
  }

  const addSubject = () => {
    const newSubjects = [...formData.subjects, { name: "", questionCount: 0 }]
    
    // Toplam soru sayısını otomatik hesapla
    const totalQuestions = newSubjects.reduce((sum, subject) => sum + (subject.questionCount || 0), 0)
    
    setFormData({
      ...formData,
      subjects: newSubjects,
      totalQuestions
    })
  }

  const updateSubject = (index: number, field: keyof Subject, value: string | number) => {
    const updatedSubjects = formData.subjects.map((subject, i) => 
      i === index ? { ...subject, [field]: value } : subject
    )
    
    // Toplam soru sayısını otomatik hesapla
    const totalQuestions = updatedSubjects.reduce((sum, subject) => sum + (subject.questionCount || 0), 0)
    
    setFormData({ 
      ...formData, 
      subjects: updatedSubjects,
      totalQuestions
    })
  }

  const removeSubject = (index: number) => {
    const updatedSubjects = formData.subjects.filter((_, i) => i !== index)
    
    // Toplam soru sayısını otomatik hesapla
    const totalQuestions = updatedSubjects.reduce((sum, subject) => sum + (subject.questionCount || 0), 0)
    
    setFormData({ 
      ...formData, 
      subjects: updatedSubjects,
      totalQuestions
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">🎯 Sınav Tipi Yönetimi</h2>
          <p className="text-gray-600 mt-1">LGS, AYT, TYT gibi sınav tiplerini tanımlayın ve yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Sınav Tipi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Sınav Tipini Düzenle" : "Yeni Sınav Tipi Oluştur"}
              </DialogTitle>
              <DialogDescription>
                {editingType 
                  ? "Mevcut sınav tipinin özelliklerini güncelleyin."
                  : "Yeni bir sınav tipi oluşturun ve dersleri tanımlayın."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Şablonlar */}
              {!editingType && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📋 Hazır Şablonlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(examTemplates).map(([key, template]) => (
                        <Button
                          key={key}
                          variant="outline"
                          onClick={() => applyTemplate(key as keyof typeof examTemplates)}
                          className="h-auto p-4 text-left"
                        >
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {template.subjects.length} ders • {template.totalDuration} dk
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Temel Bilgiler</TabsTrigger>
                  <TabsTrigger value="subjects">Dersler</TabsTrigger>
                  <TabsTrigger value="settings">Ayarlar</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Sınav Tipi Adı *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Örn: LGS - Liselere Giriş Sınavı"
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalDuration">Toplam Süre (dakika) *</Label>
                      <Input
                        id="totalDuration"
                        type="number"
                        value={formData.totalDuration}
                        onChange={(e) => setFormData({ ...formData, totalDuration: parseInt(e.target.value) || 0 })}
                        placeholder="Örn: 150"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Sınav için ayrılacak toplam süre</p>
                    </div>
                  </div>

                  {/* Otomatik hesaplanan değerleri göster */}
                  {formData.subjects.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formData.totalQuestions}</div>
                        <div className="text-sm text-gray-600">Toplam Soru</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formData.totalDuration}</div>
                        <div className="text-sm text-gray-600">Toplam Süre (dk)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formData.subjects.length}</div>
                        <div className="text-sm text-gray-600">Ders Sayısı</div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Bu sınav tipi hakkında detaylı bilgi..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gradeLevels">Sınıf Seviyeleri</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"].map((grade) => (
                        <Button
                          key={grade}
                          type="button"
                          variant={formData.gradeLevels.includes(grade) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const updatedGrades = formData.gradeLevels.includes(grade)
                              ? formData.gradeLevels.filter(g => g !== grade)
                              : [...formData.gradeLevels, grade]
                            setFormData({ ...formData, gradeLevels: updatedGrades })
                          }}
                        >
                          {grade}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subjects" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Dersler ve Soru Sayıları</h3>
                    <Button onClick={addSubject} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ders Ekle
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.subjects.map((subject, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-4 gap-4 items-end">
                            <div>
                              <Label>Ders Adı</Label>
                              <Input
                                value={subject.name}
                                onChange={(e) => updateSubject(index, 'name', e.target.value)}
                                placeholder="Matematik"
                              />
                            </div>
                            <div>
                              <Label>Soru Sayısı</Label>
                              <Input
                                type="number"
                                value={subject.questionCount}
                                onChange={(e) => updateSubject(index, 'questionCount', parseInt(e.target.value) || 0)}
                                placeholder="20"
                              />
                            </div>
                            <div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeSubject(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {formData.subjects.length > 0 && (
                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Toplam Soru:</strong> {formData.subjects.reduce((sum, s) => sum + s.questionCount, 0)}
                          </div>
                          <div>
                            <strong>Ders Sayısı:</strong> {formData.subjects.length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isActive">Aktif sınav tipi</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={isLoading || !formData.name}>
                  {isLoading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sınav Tipleri Listesi */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Sınav tipleri yükleniyor...</p>
            </CardContent>
          </Card>
        ) : examTypes.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz Sınav Tipi Yok</h3>
              <p className="text-gray-500 mb-4">
                LGS, AYT, TYT gibi sınav tiplerini tanımlayarak başlayın
              </p>
            </CardContent>
          </Card>
        ) : (
          examTypes.map((examType) => (
            <Card key={examType._id || examType.id} className={`${!examType.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {examType.name}
                      {!examType.isActive && <Badge variant="secondary">Pasif</Badge>}
                    </CardTitle>
                    {examType.description && (
                      <p className="text-gray-600 text-sm mt-1">{examType.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(examType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(examType)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Toplam Soru</div>
                    <div className="font-medium">{examType.totalQuestions || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Süre</div>
                    <div className="font-medium">{examType.totalDuration || 0} dk</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ders Sayısı</div>
                    <div className="font-medium">{examType.subjects?.length || 0}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Dersler:</div>
                  <div className="flex flex-wrap gap-1">
                    {examType.subjects && examType.subjects.length > 0 ? (
                      examType.subjects.map((subject, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {subject.name} ({subject.questionCount} soru)
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Ders tanımlanmamış</span>
                    )}
                  </div>
                </div>

                {examType.gradeLevels && examType.gradeLevels.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Sınıf Seviyeleri:</div>
                    <div className="flex flex-wrap gap-1">
                      {examType.gradeLevels.map((grade, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {grade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
