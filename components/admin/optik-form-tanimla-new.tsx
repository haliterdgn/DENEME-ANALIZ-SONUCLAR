"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExamStore } from "@/lib/stores/exam-store"
import { useOptikFormStore } from "@/lib/stores/optik-form-store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Save, CheckCircle, User, MapPin } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface SubjectArea {
  name: string
  start: number
  end: number
  soruSayisi: number
}

interface StudentField {
  name: string
  label: string
  start: number
  end: number
}

// Görsel'deki LGS 840 formuna göre varsayılan dersler
const defaultSubjects: SubjectArea[] = [
  { name: "TÜRKÇE", start: 162, end: 181, soruSayisi: 20 },
  { name: "SOSYAL", start: 182, end: 191, soruSayisi: 10 },
  { name: "DİN", start: 202, end: 211, soruSayisi: 10 },
  { name: "İNGİLİZCE", start: 222, end: 231, soruSayisi: 10 },
  { name: "MATEMATİK", start: 0, end: 0, soruSayisi: 0 },
  { name: "FEN", start: 0, end: 0, soruSayisi: 0 },
  { name: "HAYAT BİLGİSİ", start: 0, end: 0, soruSayisi: 0 },
]

// Görsel'deki öğrenci bilgi alanları
const defaultStudentFields: StudentField[] = [
  { name: "ogrenciAdi", label: "Öğrenci Adı", start: 16, end: 20 },
  { name: "ogrenciNo", label: "Öğrenci No", start: 10, end: 13 },
  { name: "kitapcikTuru", label: "Kitapçık Türü", start: 9, end: 9 },
  { name: "tcKimlikNo", label: "TC Kimlik No", start: 0, end: 0 },
  { name: "cinsiyet", label: "Cinsiyet", start: 0, end: 0 },
  { name: "kt", label: "KT", start: 0, end: 0 },
  { name: "bolgeKodu", label: "Bölge Kodu", start: 0, end: 0 },
  { name: "oturum", label: "Oturum", start: 0, end: 0 },
  { name: "ilKodu", label: "İl Kodu", start: 0, end: 0 },
  { name: "ilceKodu", label: "İlçe Kodu", start: 0, end: 0 },
  { name: "okulKodu", label: "Okul Kodu", start: 0, end: 0 },
  { name: "sinif", label: "Sınıf", start: 58, end: 58 },
  { name: "sube", label: "Şube", start: 59, end: 59 },
  { name: "brans", label: "Branş", start: 0, end: 0 },
  { name: "yas", label: "Yaş", start: 0, end: 0 },
  { name: "telefon", label: "Telefon", start: 0, end: 0 },
]

export default function OptikFormTanimla() {
  const [formAdi, setFormAdi] = useState("SÖZEL 840")
  const [formKodu, setFormKodu] = useState("840")
  const [examTypeId, setExamTypeId] = useState("")
  const [subjects, setSubjects] = useState<SubjectArea[]>(defaultSubjects)
  const [studentFields, setStudentFields] = useState<StudentField[]>(defaultStudentFields)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [examTypes, setExamTypes] = useState<any[]>([])

  const { createOptikForm } = useExamStore()
  const { addOptikForm, addOptikFormWithId } = useOptikFormStore()

  // Sınav tiplerini yükle
  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        const response = await apiClient.getExamTypes()
        console.log('getExamTypes response:', response)
        setExamTypes(response?.data || response || [])
      } catch (error) {
        console.warn('Offline modda çalışıyor')
        setExamTypes([])
      }
    }
    fetchExamTypes()
  }, [])

  // Sınav tipi değiştiğinde derslerini otomatik yükle
  useEffect(() => {
    const loadSubjectsFromExamType = async () => {
      console.log('examTypeId değişti:', examTypeId)
      if (examTypeId && examTypeId !== "none") {
        try {
          console.log('Sınav tipi detayları getiriliyor:', examTypeId)
          const response = await apiClient.getExamType(examTypeId)
          console.log('Sınav tipi response:', response)
          
          if (response.success && response.data?.dersler) {
            console.log('Bulunan dersler:', response.data.dersler)
            const examTypeSubjects = response.data.dersler.map((ders: any, index: number) => ({
              name: ders.dersAdi,
              start: 0, // Başlangıç pozisyonu manuel girilecek
              end: 0,
              soruSayisi: ders.soruSayisi || 0
            }))
            console.log('Oluşturulan subjects:', examTypeSubjects)
            setSubjects(examTypeSubjects)
          } else {
            console.log('Ders bulunamadı veya response başarısız')
          }
        } catch (error) {
          console.error('Sınav tipi dersleri yüklenirken hata:', error)
          // Hata durumunda varsayılan dersleri koru
        }
      } else {
        console.log('Sınav tipi seçilmemiş, varsayılan dersler yükleniyor')
        // Sınav tipi seçilmemişse varsayılan dersleri yükle
        setSubjects(defaultSubjects)
      }
    }
    loadSubjectsFromExamType()
  }, [examTypeId])

  // Ders alanını güncelle
  const updateSubject = (index: number, field: keyof SubjectArea, value: string | number) => {
    const newSubjects = [...subjects]
    newSubjects[index] = { ...newSubjects[index], [field]: value }
    
    // Eğer start veya soru sayısı değişirse, end'i otomatik hesapla
    if (field === 'start' || field === 'soruSayisi') {
      const start = field === 'start' ? Number(value) : newSubjects[index].start
      const soruSayisi = field === 'soruSayisi' ? Number(value) : newSubjects[index].soruSayisi
      if (start > 0 && soruSayisi > 0) {
        newSubjects[index].end = start + soruSayisi - 1
      }
    }
    
    setSubjects(newSubjects)
  }

  // Öğrenci alanını güncelle
  const updateStudentField = (index: number, field: keyof StudentField, value: string | number) => {
    const newFields = [...studentFields]
    newFields[index] = { ...newFields[index], [field]: value }
    setStudentFields(newFields)
  }

  // Form kaydet
  const handleSave = async () => {
    if (!formAdi.trim() || !formKodu.trim()) {
      alert('Form adı ve form kodu zorunludur!')
      return
    }

    setLoading(true)
    try {
      // Öğrenci field'larını objaye çevir
      const fieldsObject = studentFields.reduce((acc, field) => {
        acc[field.name] = { start: field.start, end: field.end }
        return acc
      }, {} as any)

      // Backend API formatına göre optik form verisi
      const optikFormData = {
        formAdi: formAdi.trim(),
        formKodu: formKodu.trim(),
        examTypeId: examTypeId && examTypeId !== "none" ? examTypeId : undefined,
        fields: fieldsObject, // Backend sadece tanımlı field'ları bekliyor
        subjects: subjects
          .filter(s => s.soruSayisi > 0) // Sadece aktif dersleri
          .map(s => ({
            name: s.name,
            start: s.start,
            soruSayisi: s.soruSayisi
            // Backend 'end' field'ını hesaplıyor, göndermeye gerek yok
          }))
      }

      console.log('📤 Optik form kaydediliyor:', optikFormData)

      // Önce API'ye kaydet
      try {
        const savedForm = await apiClient.createOptikForm(optikFormData)
        console.log('✅ API kaydetme başarılı:', savedForm)
        
        // API'den gelen ID ile local store'a ekle (local store için end field'ları da ekle)
        addOptikFormWithId({
          ...optikFormData,
          subjects: subjects.filter(s => s.soruSayisi > 0) // Local store için tüm field'lar
        }, savedForm._id || savedForm.id) // MongoDB ID'sini ayrı parametre olarak geç
      } catch (apiError) {
        console.warn('⚠️ API kaydetme başarısız, local kaydetme:', apiError)
        // API başarısız olursa sadece local'e kaydet (local store için tüm field'lar)
        addOptikForm({
          ...optikFormData,
          subjects: subjects.filter(s => s.soruSayisi > 0) // Local store için end field'ları da var
        })
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (error) {
      console.error('❌ Optik form kaydetme hatası:', error)
      alert('Kaydetme sırasında hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📝 Optik Form Tanımla</h2>
          <p className="text-gray-600 mt-1">LGS optik form yapısını tanımlayın</p>
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Optik form başarıyla kaydedildi!
          </AlertDescription>
        </Alert>
      )}

      {/* Temel Bilgiler */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Temel Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="formAdi">Form Adı</Label>
              <Input
                id="formAdi"
                value={formAdi}
                onChange={(e) => setFormAdi(e.target.value)}
                placeholder="SÖZEL 840"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="formKodu">Form Kodu</Label>
              <Input
                id="formKodu"
                value={formKodu}
                onChange={(e) => setFormKodu(e.target.value)}
                placeholder="840"
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
            <div>
              <Label htmlFor="examType">Sınav Tipi (Opsiyonel)</Label>
              <Select value={examTypeId} onValueChange={setExamTypeId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sınav tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçilmedi</SelectItem>
                  {examTypes.map((type) => (
                    <SelectItem key={type._id || type.id} value={type._id || type.id}>
                      {type.typeName || type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Öğrenci Bilgileri ve Ders Alanları - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Öğrenci Bilgi Alanları */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <User className="h-5 w-5" />
              Öğrenci Bilgi Alanları
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {studentFields.map((field, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded border text-sm">
                  <Input
                    value={field.label}
                    onChange={(e) => updateStudentField(index, 'label', e.target.value)}
                    placeholder="Alan Adı"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    value={field.start}
                    onChange={(e) => updateStudentField(index, 'start', parseInt(e.target.value) || 0)}
                    placeholder="Başlangıç"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    value={field.end}
                    onChange={(e) => updateStudentField(index, 'end', parseInt(e.target.value) || 0)}
                    placeholder="Bitiş"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ders Alanları */}
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800 flex items-center gap-2">
              📚 Ders Alanları
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {subjects.map((subject, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded border text-sm">
                  <Input
                    value={subject.name}
                    onChange={(e) => updateSubject(index, 'name', e.target.value)}
                    placeholder="Ders Adı"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    value={subject.start}
                    onChange={(e) => updateSubject(index, 'start', parseInt(e.target.value) || 0)}
                    placeholder="Başlangıç"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    value={subject.soruSayisi}
                    onChange={(e) => updateSubject(index, 'soruSayisi', parseInt(e.target.value) || 0)}
                    placeholder="Soru Sayısı"
                    className="text-xs"
                  />
                  <Input
                    value={subject.end}
                    disabled
                    placeholder="Bitiş"
                    className="text-xs bg-gray-100"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Önizleme - Kompakt */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50 py-3">
          <CardTitle className="text-purple-800 flex items-center gap-2 text-lg">
            👁️ Form Önizleme
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded border">
              <h4 className="font-semibold text-blue-800 mb-2 text-sm">📝 Öğrenci Bilgileri</h4>
              <div className="space-y-1 text-xs">
                {studentFields.filter(f => f.start > 0 || f.end > 0).map((field, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{field.label}</span>
                    <span className="text-gray-600">{field.start}-{field.end}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded border">
              <h4 className="font-semibold text-green-800 mb-2 text-sm">📚 Ders Yapısı</h4>
              <div className="space-y-1 text-xs">
                {subjects.filter(s => s.soruSayisi > 0).map((subject, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{subject.name} ({subject.soruSayisi})</span>
                    <span className="text-gray-600">{subject.start}-{subject.end}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-green-200">
                <span className="text-green-700 font-semibold text-xs">
                  Toplam: {subjects.reduce((total, s) => total + s.soruSayisi, 0)} soru
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kaydet Butonu */}
      <div className="flex justify-end space-x-3">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6"
        >
          {loading ? (
            <>🔄 Kaydediliyor...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Optik Form Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
