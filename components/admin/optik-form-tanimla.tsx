"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExamStore } from "@/lib/stores/exam-store"
import { useOptikFormStore } from "@/lib/stores/optik-form-store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Save, CheckCircle, Info, Plus, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface FormField {
  start: number
  end: number
}

interface SubjectArea {
  name: string
  start: number
  end: number
  soruSayisi: number
}

interface OptikFormData {
  formAdi: string
  formKodu: string
  examTypeId?: string // Seçilen sınav tipi ID'si
  fields: {
    formAdi: FormField
    formKodu: FormField
    ogrenciAdi: FormField
    ogrenciNo: FormField
    tcKimlikNo: FormField
    cinsiyet: FormField
    kt: FormField
    bolgeKodu: FormField
    oturum: FormField
    ilKodu: FormField
    ilceKodu: FormField
    okulKodu: FormField
    sinif: FormField
    sube: FormField
    brans: FormField
    yas: FormField
    telefon: FormField
    kt1: FormField
  }
  subjects: SubjectArea[]
}

const fieldLabels = {
  formAdi: "Form Adı",
  formKodu: "Form Kodu",
  ogrenciAdi: "Öğrenci Adı",
  ogrenciNo: "Öğrenci Numarası",
  tcKimlikNo: "TC Kimlik Numarası",
  cinsiyet: "Cinsiyet",
  kt: "KT",
  bolgeKodu: "Bölge Kodu",
  oturum: "Oturum",
  ilKodu: "İl Kodu",
  ilceKodu: "İlçe Kodu",
  okulKodu: "Okul Kodu",
  sinif: "Sınıf",
  sube: "Şube",
  brans: "Branş",
  yas: "Yaş",
  telefon: "Telefon",
  kt1: "KT1",
}

export default function OptikFormTanimla() {
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [examTypes, setExamTypes] = useState<any[]>([])
  const { createOptikForm } = useExamStore()
  const { addOptikForm } = useOptikFormStore()

  // Sınav tiplerini yükle
  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        const types = await apiClient.getExamTypes()
        setExamTypes(types || [])
      } catch (error) {
        console.warn('Sınav tipleri offline modda çalışıyor')
        setExamTypes([])
      }
    }
    fetchExamTypes()
  }, [])

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OptikFormData>({
    defaultValues: {
      formAdi: "",
      formKodu: "",
      examTypeId: "",
      fields: {
        formAdi: { start: 1, end: 20 },
        formKodu: { start: 21, end: 30 },
        ogrenciAdi: { start: 31, end: 60 },
        ogrenciNo: { start: 61, end: 70 },
        tcKimlikNo: { start: 71, end: 81 },
        cinsiyet: { start: 82, end: 83 },
        kt: { start: 84, end: 85 },
        bolgeKodu: { start: 86, end: 88 },
        oturum: { start: 89, end: 90 },
        ilKodu: { start: 91, end: 93 },
        ilceKodu: { start: 94, end: 96 },
        okulKodu: { start: 97, end: 102 },
        sinif: { start: 103, end: 105 },
        sube: { start: 106, end: 108 },
        brans: { start: 109, end: 111 },
        yas: { start: 112, end: 114 },
        telefon: { start: 115, end: 125 },
        kt1: { start: 126, end: 127 },
      },
      subjects: [],
    },
  })

  const { fields: subjectFields, append: addSubject, remove: removeSubject } = useFieldArray({
    control,
    name: "subjects",
  })

  const handleAddSubject = () => {
    const lastEnd = subjectFields.length > 0 ? Math.max(...subjectFields.map(s => s.end || s.start + s.soruSayisi)) : 159
    const newStart = lastEnd + 1
    addSubject({
      name: "",
      start: newStart,
      end: newStart + 19, // 20 soru için
      soruSayisi: 20
    })
  }

  // Sınav tipi seçildiğinde dersleri otomatik yükle
  const handleExamTypeChange = (examTypeId: string) => {
    setValue('examTypeId', examTypeId)
    
    if (examTypeId) {
      const selectedExamType = examTypes.find(type => type._id === examTypeId || type.id === examTypeId)
      if (selectedExamType && selectedExamType.subjects) {
        // Mevcut dersleri temizle
        subjectFields.forEach((_, index) => {
          removeSubject(index)
        })
        
        // Sınav tipindeki dersleri ekle
        let currentStart = 160 // Öğrenci bilgileri bittiği yer
        selectedExamType.subjects.forEach((subject: any) => {
          const end = currentStart + subject.questionCount - 1
          addSubject({
            name: subject.name,
            start: currentStart,
            end: end,
            soruSayisi: subject.questionCount
          })
          currentStart = end + 1
        })
      }
    }
  }

  const onSubmit = async (data: OptikFormData) => {
    setLoading(true)
    setIsOfflineMode(false)
    
    try {
      // API ile optik form oluştur
      const result = await createOptikForm({
        formAdi: data.formAdi,
        formKodu: data.formKodu,
        examTypeId: data.examTypeId,
        fields: data.fields,
        subjects: data.subjects,
      })

      setSuccess(true)
      
      // Offline modda oluşturuldu mu kontrol et
      if (result?.message?.includes('offline')) {
        setIsOfflineMode(true)
      }
      
      setTimeout(() => {
        setSuccess(false)
        setIsOfflineMode(false)
        reset()
      }, 3000)
    } catch (error) {
      console.warn('Error creating optik form, using offline mode:', error)
      setIsOfflineMode(true)
      
      // Hata durumunda fallback olarak local'a ekle
      addOptikForm({
        formAdi: data.formAdi,
        formKodu: data.formKodu,
        fields: data.fields,
        subjects: data.subjects,
      })
      
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setIsOfflineMode(false)
        reset()
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Optik Form Tanımla</h1>
          <p className="text-gray-600">Sınav için optik okuma formu şablonu oluşturun</p>
        </div>
      </div>

      {success && (
        <Alert className={isOfflineMode ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
          <CheckCircle className={`h-4 w-4 ${isOfflineMode ? "text-orange-600" : "text-green-600"}`} />
          <AlertDescription className={isOfflineMode ? "text-orange-800" : "text-green-800"}>
            {isOfflineMode 
              ? "Optik form şablonu offline modda kaydedildi! Backend bağlantısı olduğunda senkronize edilecek."
              : "Optik form şablonu başarıyla kaydedildi!"
            }
          </AlertDescription>
        </Alert>
      )}

      {/* 1. Adım: Sınav Tipi Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">1</span>
            Sınav Tipi Seçimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Önce hangi sınav tipi için optik form oluşturacağınızı seçin. Seçtiğiniz sınav tipindeki dersler otomatik olarak eklenecek.
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Temel Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">2</span>
                Form Temel Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formAdi">Form Adı *</Label>
                  <Input
                    id="formAdi"
                    {...register("formAdi", { required: "Form adı gereklidir" })}
                    placeholder="Örn: 2024 Matematik Sınavı Form A"
                  />
                  {errors.formAdi && <p className="text-sm text-red-600">{errors.formAdi.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formKodu">Form Kodu *</Label>
                  <Input
                    id="formKodu"
                    {...register("formKodu", { required: "Form kodu gereklidir" })}
                    placeholder="Örn: MAT2024A"
                  />
                  {errors.formKodu && <p className="text-sm text-red-600">{errors.formKodu.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examType">Sınav Tipi *</Label>
                  <Select onValueChange={handleExamTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sınav tipi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((examType) => (
                        <SelectItem key={examType._id || examType.id} value={examType._id || examType.id}>
                          {examType.name || examType.typeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {examTypes.length === 0 && (
                    <p className="text-sm text-orange-600">Önce sınav tipi oluşturun</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alan Tanımları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">3</span>
                Alan Tanımları (Karakter Pozisyonları)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(fieldLabels).map(([fieldKey, label]) => (
                  <div key={fieldKey} className="space-y-3 p-4 border rounded-lg">
                    <Label className="font-semibold text-gray-900">{label}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm text-gray-600">Başlangıç</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`fields.${fieldKey as keyof typeof fieldLabels}.start`, {
                            required: "Başlangıç pozisyonu gereklidir",
                            min: { value: 1, message: "En az 1 olmalıdır" },
                          })}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-gray-600">Bitiş</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register(`fields.${fieldKey as keyof typeof fieldLabels}.end`, {
                            required: "Bitiş pozisyonu gereklidir",
                            min: { value: 1, message: "En az 1 olmalıdır" },
                          })}
                          placeholder="20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ders Alanları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">4</span>
                Ders Alanları (Cevap Bölümleri)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Optik formunuzdaki ders bölümlerini tanımlayın. Her ders için başlangıç pozisyonu ve soru sayısını belirleyin.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubject}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ders Ekle
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-gray-50 relative">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900">Ders {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubject(index)}
                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-600">Ders Adı</Label>
                          <Input
                            {...register(`subjects.${index}.name`, {
                              required: "Ders adı gereklidir",
                            })}
                            placeholder="Örn: Matematik"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-sm text-gray-600">Başlangıç</Label>
                            <Input
                              type="number"
                              min="1"
                              {...register(`subjects.${index}.start`, {
                                required: "Başlangıç pozisyonu gereklidir",
                                min: { value: 1, message: "En az 1 olmalıdır" },
                              })}
                              placeholder="160"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-sm text-gray-600">Bitiş</Label>
                            <Input
                              type="number"
                              min="1"
                              {...register(`subjects.${index}.end`, {
                                required: "Bitiş pozisyonu gereklidir",
                                min: { value: 1, message: "En az 1 olmalıdır" },
                              })}
                              placeholder="179"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-sm text-gray-600">Soru Sayısı</Label>
                          <Input
                            type="number"
                            min="1"
                            {...register(`subjects.${index}.soruSayisi`, {
                              required: "Soru sayısı gereklidir",
                              min: { value: 1, message: "En az 1 soru olmalıdır" },
                            })}
                            placeholder="20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {subjectFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Ders eklemek için yukarıdaki "Ders Ekle" butonunu kullanın</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kaydet Butonu */}
          <div className="flex justify-end">
                        <Button type="submit" size="lg" className="flex items-center gap-2 px-8" disabled={loading}>
              <Save className="h-5 w-5" />
              {loading ? "Optik Form Tanımlanıyor..." : "Optik Form Şablonunu Kaydet"}
            </Button>
          </div>
        </form>
    </div>
  )
}
