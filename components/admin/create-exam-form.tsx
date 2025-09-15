"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExamStore } from "@/lib/stores/exam-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api-client"
import { Trash2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ID generator function
const generateId = () => {
  return 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

interface ExamFormData {
  name: string
  date: string
  classLevels: string
  examTypeId: string
  code: string
  duration: number
  subjects: any[]
}

interface ExamType {
  _id?: string
  id?: string
  name: string
  subjects: Array<{
    name: string
    questionCount: number
    duration?: number
  }>
  totalDuration: number
  gradeLevels: string[]
  isActive: boolean
}

export default function CreateExamForm() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addExam, createExamAPI } = useExamStore()
  const { user } = useAuthStore()

  // Exam types'ları yükle
  useEffect(() => {
    const loadExamTypes = async () => {
      try {
        const types = await apiClient.getExamTypes()
        console.log('Exam types loaded:', types)
        console.log('Raw types count:', types?.length || 0)
        
        // Tüm sınav tiplerini göster (isActive kontrolü kaldırıldı)
        const allTypes = types || []
        console.log('All exam types:', allTypes)
        setExamTypes(allTypes)
      } catch (error) {
        console.error('Error loading exam types:', error)
        console.warn('Sınav tipleri offline modda çalışıyor')
        setExamTypes([])
      }
    }
    loadExamTypes()
  }, [])

  // Sınav tipi seçildiğinde dersleri otomatik olarak ayarla
  const handleExamTypeChange = (examTypeId: string) => {
    const examType = examTypes.find(type => (type._id || type.id) === examTypeId)
    if (examType) {
      setSelectedExamType(examType)
      setSelectedSubjects(examType.subjects.map(s => s.name))
      
      // Form verilerini güncelle
      setValue('examTypeId', examTypeId)
      setValue('duration', examType.totalDuration)
      setValue('subjects', examType.subjects.map(subject => ({
        name: subject.name,
        questionCount: subject.questionCount
      })))
    }
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExamFormData>({
    defaultValues: {
      subjects: [],
      duration: 150,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subjects",
  })

  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects((prev) => prev.filter((s) => s !== subject))
      const index = fields.findIndex((field) => field.name === subject)
      if (index !== -1) {
        remove(index)
      }
    } else {
      setSelectedSubjects((prev) => [...prev, subject])
      append({
        id: `subject-${Date.now()}`,
        name: subject,
        questionCount: 10,
      })
    }
  }

  const onSubmit = async (data: ExamFormData) => {
    if (!user) return
    
    // Exam type ID validation
    if (!data.examTypeId) {
      alert('Lütfen sınav türünü seçin')
      return
    }

    setLoading(true)
    try {
      console.log('Form data being sent:', data) // Debug log
      
      // API ile sınav oluştur
      await createExamAPI({
        name: data.name,
        date: data.date,
        classLevels: data.classLevels, // Backend'de classLevels bekleniyor
        examTypeId: data.examTypeId,
        code: data.code,
        duration: data.duration,
        subjects: data.subjects,
        createdBy: user.id,
      })

      setSuccess(true)
      reset()
      setSelectedSubjects([])

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error creating exam:', error)
            // Hata durumunda fallback olarak local'a ekle
      addExam({
        id: generateId(),
        name: data.name,
        date: data.date,
        classLevels: data.classLevels,
        examTypeId: data.examTypeId,
        code: data.code,
        duration: data.duration,
        subjects: data.subjects,
        createdBy: user.id,
        status: 'offline'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Yeni Sınav Oluştur</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {success && (
            <Alert>
              <AlertDescription>
                Sınav başarıyla oluşturuldu! Artık sınav kitapçığını yükleyebilirsiniz.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sınav Adı</Label>
              <Input
                id="name"
                {...register("name", { required: "Sınav adı gereklidir" })}
                placeholder="örn: Matematik Ara Sınavı"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Sınav Tarihi</Label>
              <Input id="date" type="date" {...register("date", { required: "Sınav tarihi gereklidir" })} />
              {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classLevels">Sınıf Seviyesi</Label>
              <Select onValueChange={(value) => setValue("classLevels", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınıf seviyesi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5. Sınıf</SelectItem>
                  <SelectItem value="6">6. Sınıf</SelectItem>
                  <SelectItem value="7">7. Sınıf</SelectItem>
                  <SelectItem value="8">8. Sınıf</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register("classLevels", { required: "Sınıf seviyesi gereklidir" })} />
              {errors.classLevels && <p className="text-sm text-red-600">{errors.classLevels.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Sınav Kodu</Label>
              <Input
                id="code"
                {...register("code", { required: "Sınav kodu gereklidir" })}
                placeholder="örn: 9765"
              />
              {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Süre (dakika)</Label>
              <Input
                id="duration"
                type="number"
                {...register("duration", { required: "Süre gereklidir", min: 1 })}
                placeholder="örn: 150"
              />
              {errors.duration && <p className="text-sm text-red-600">{errors.duration.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examTypeId">Sınav Tipi *</Label>
              <Select onValueChange={handleExamTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınav tipini seçin (LGS, AYT, TYT vb.)" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((type) => (
                    <SelectItem key={type._id || type.id || Math.random()} value={type._id || type.id || "unknown"}>
                      <div className="flex flex-col">
                        <span>{type.name}</span>
                        <span className="text-xs text-gray-500">
                          {type.subjects.length} ders • {type.totalDuration} dk
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {examTypes.length === 0 && (
                <p className="text-sm text-orange-600">
                  Sınav tipi bulunamadı. Önce sınav tipi oluşturun.
                </p>
              )}
              <p className="text-xs text-gray-500">
                Toplam {examTypes.length} sınav tipi
              </p>
              <input type="hidden" {...register("examTypeId", { required: "Sınav türü seçimi gereklidir" })} />
              {errors.examTypeId && <p className="text-sm text-red-600">{errors.examTypeId.message}</p>}
            </div>


          </div>

          <div className="space-y-4">
            <Label>Dersler ve Soru Sayıları</Label>
            
            {selectedExamType ? (
              <div className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{selectedExamType.name}</strong> sınav tipi seçildi. 
                    Aşağıdaki dersler otomatik olarak tanımlanmıştır.
                  </AlertDescription>
                </Alert>
                
                {selectedExamType.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{subject.name}</span>
                      <span className="text-sm text-gray-600">
                        {subject.questionCount} soru
                        {subject.duration && ` • ${subject.duration} dk`}
                      </span>
                    </div>
                    <div className="text-sm text-green-600">✓ Dahil</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">
                Önce bir sınav tipi seçin
              </div>
            )}
          </div>

          {fields.length > 0 && (
            <div className="space-y-4">
              <Label>Ders Başına Soru Sayısı</Label>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label className="font-medium">{field.name}</Label>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        min="1"
                        {...register(`subjects.${index}.questionCount`, {
                          required: "Soru sayısı gereklidir",
                          min: { value: 1, message: "En az 1 olmalıdır" },
                        })}
                        placeholder="Sorular"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        remove(index)
                        setSelectedSubjects((prev) => prev.filter((s) => s !== field.name))
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={fields.length === 0 || loading}>
            {loading ? "Sınav Oluşturuluyor..." : "Sınav Oluştur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
