"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExamStore } from "@/lib/stores/exam-store"
import { useOptikFormStore } from "@/lib/stores/optik-form-store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Save, CheckCircle } from "lucide-react"

interface FormField {
  start: number
  end: number
}

interface SubjectArea {
  name: string
  start: number
  soruSayisi: number
}

interface OptikFormData {
  formAdi: string
  formKodu: string
  examId: string
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
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const { exams } = useExamStore()
  const { addOptikForm } = useOptikFormStore()

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
      examId: "",
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

  const { fields: subjectFields, replace: replaceSubjects } = useFieldArray({
    control,
    name: "subjects",
  })

  const selectedExam = exams.find((exam) => exam.id === selectedExamId)

  const handleExamSelect = (examId: string) => {
    setSelectedExamId(examId)
    setValue("examId", examId)

    const exam = exams.find((e) => e.id === examId)
    if (exam) {
      // Dinamik olarak seçilen sınavın derslerine göre subject alanlarını oluştur
      const subjects = exam.subjects.map((subject, index) => ({
        name: subject.name,
        start: 160 + index * 50, // Her ders için 50 karakter aralık
        soruSayisi: subject.questionCount,
      }))
      replaceSubjects(subjects)
    }
  }

  const onSubmit = (data: OptikFormData) => {
    if (!selectedExamId) {
      alert("Lütfen önce bir sınav seçiniz!")
      return
    }

    addOptikForm({
      formAdi: data.formAdi,
      formKodu: data.formKodu,
      examId: selectedExamId,
      fields: data.fields,
      subjects: data.subjects,
    })

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      reset()
      setSelectedExamId("")
    }, 3000)
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
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Optik form şablonu başarıyla kaydedildi!</AlertDescription>
        </Alert>
      )}

      {/* 1. Adım: Sınav Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">1</span>
            Sınav Seçimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exam-select">Sınav Seçiniz *</Label>
              <Select value={selectedExamId} onValueChange={handleExamSelect}>
                <SelectTrigger id="exam-select">
                  <SelectValue placeholder="Bir sınav seçiniz..." />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name} - {exam.date} ({exam.classLevel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExam && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Seçilen Sınav Bilgileri:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Sınav Adı:</strong> {selectedExam.name}
                    </p>
                    <p>
                      <strong>Tarih:</strong> {new Date(selectedExam.date).toLocaleDateString("tr-TR")}
                    </p>
                    <p>
                      <strong>Sınıf:</strong> {selectedExam.classLevel}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Dersler:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-2">
                      {selectedExam.subjects.map((subject) => (
                        <li key={subject.id}>
                          {subject.name} ({subject.questionCount} soru)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedExamId && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-sm text-gray-600 mb-4">
                  Seçilen sınavın derslerine göre otomatik olarak oluşturulmuştur. Başlangıç pozisyonlarını ve soru
                  sayılarını düzenleyebilirsiniz.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-3">{field.name}</h4>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-sm text-gray-600">Başlangıç Pozisyonu</Label>
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
                    <p>Önce bir sınav seçiniz</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kaydet Butonu */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" className="flex items-center gap-2 px-8" disabled={!selectedExamId}>
              <Save className="h-5 w-5" />
              Optik Form Şablonunu Tanımla
            </Button>
          </div>
        </form>
      )}

      {!selectedExamId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Optik Form Tanımlamaya Başlayın</h3>
            <p className="text-gray-500 text-center max-w-md">
              Optik form şablonu oluşturmak için önce yukarıdan bir sınav seçiniz. Seçtiğiniz sınavın derslerine göre
              form alanları otomatik olarak hazırlanacaktır.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
