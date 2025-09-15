"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, User, BookOpen, Save, X } from "lucide-react"
import { useOptikFormStore } from "@/lib/stores/optik-form-store"
import { useExamStore } from "@/lib/stores/exam-store"
import { apiClient } from "@/lib/api-client"

interface Props {
  form: any
  onClose: () => void
}

export default function OptikFormEditModal({ form, onClose }: Props) {
  // Form temel bilgileri
  const [formAdi, setFormAdi] = useState(form.formAdi || "")
  const [formKodu, setFormKodu] = useState(form.formKodu || "")
  const [examTypeId, setExamTypeId] = useState(form.examTypeId || "")
  
  // Öğrenci bilgi alanları
  const [studentFields, setStudentFields] = useState([
    { name: 'ogrenciAdi', label: 'Öğrenci Adı', start: 19, end: 39 },
    { name: 'ogrenciNo', label: 'Öğrenci No', start: 1, end: 7 },
    { name: 'tcKimlikNo', label: 'TC Kimlik No', start: 8, end: 18 },
    { name: 'cinsiyet', label: 'Cinsiyet', start: 40, end: 40 },
    { name: 'kt', label: 'KT', start: 0, end: 1 },
    { name: 'kitapcikTuru', label: 'Kitapçık Türü', start: 49, end: 49 },
    { name: 'bolgeKodu', label: 'Bölge Kodu', start: 41, end: 43 },
    { name: 'oturum', label: 'Oturum', start: 44, end: 45 },
    { name: 'ilKodu', label: 'İl Kodu', start: 46, end: 48 },

  ])

  // Ders alanları
  const [subjects, setSubjects] = useState([
    { name: "TÜRKÇE", start: 50, soruSayisi: 20 },
    { name: "MATEMATİK", start: 70, soruSayisi: 20 },
    { name: "FEN BİLİMLERİ", start: 90, soruSayisi: 20 },
    { name: "SOSYAL BİLGİLER", start: 110, soruSayisi: 10 },
    { name: "DİN KÜLTÜRÜ", start: 120, soruSayisi: 10 },
    { name: "İNGİLİZCE", start: 130, soruSayisi: 10 }
  ])

  // State
  const [examTypes, setExamTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Store methods
  const { updateOptikForm } = useOptikFormStore()

  // Sınav tiplerini yükle
  useEffect(() => {
    const loadExamTypes = async () => {
      try {
        const response = await apiClient.getExamTypes()
        if (response.success) {
          setExamTypes(response.data || [])
        }
      } catch (error) {
        console.error('Sınav tipleri yüklenirken hata:', error)
      }
    }
    loadExamTypes()
  }, [])

  // Sınav tipi değiştiğinde derslerini otomatik yükle
  useEffect(() => {
    const loadSubjectsFromExamType = async () => {
      console.log('Edit modal - examTypeId değişti:', examTypeId)
      if (examTypeId && examTypeId !== "none") {
        try {
          console.log('Edit modal - Sınav tipi detayları getiriliyor:', examTypeId)
          const response = await apiClient.getExamType(examTypeId)
          console.log('Edit modal - Sınav tipi response:', response)
          
          if (response.success && response.data?.dersler) {
            console.log('Edit modal - Bulunan dersler:', response.data.dersler)
            const examTypeSubjects = response.data.dersler.map((ders: any) => ({
              name: ders.dersAdi,
              start: 0, // Varsayılan başlangıç pozisyonu
              soruSayisi: ders.soruSayisi || 0
            }))
            console.log('Edit modal - Oluşturulan subjects:', examTypeSubjects)
            setSubjects(examTypeSubjects)
          } else {
            console.log('Edit modal - Ders bulunamadı veya response başarısız')
          }
        } catch (error) {
          console.error('Sınav tipi dersleri yüklenirken hata:', error)
        }
      } else {
        console.log('Edit modal - Sınav tipi seçilmemiş, dersler temizleniyor')
        // Sınav tipi seçilmemişse dersleri temizle
        setSubjects([])
      }
    }
    loadSubjectsFromExamType()
  }, [examTypeId])

  useEffect(() => {
    // Form verilerini yükle
    if (form.fields) {
      const fieldsArray = Object.entries(form.fields).map(([name, field]: [string, any]) => {
        const labels: Record<string, string> = {
          ogrenciAdi: 'Öğrenci Adı',
          ogrenciNo: 'Öğrenci No', 
          tcKimlikNo: 'TC Kimlik No',
          cinsiyet: 'Cinsiyet',
          kt: 'KT',
          kitapcikTuru: 'Kitapçık Türü',
          bolgeKodu: 'Bölge Kodu',
          oturum: 'Oturum',
          ilKodu: 'İl Kodu',

        }
        return {
          name,
          label: labels[name] || name,
          start: field.start,
          end: field.end
        }
      })
      setStudentFields(fieldsArray)
    }

    if (form.subjects) {
      setSubjects(form.subjects.map((subject: any) => ({
        name: subject.name,
        start: subject.start,
        soruSayisi: subject.soruSayisi || subject.questionCount || 0
      })))
    }
  }, [form])

  const updateStudentField = (index: number, field: string, value: any) => {
    const updated = [...studentFields]
    updated[index] = { ...updated[index], [field]: value }
    setStudentFields(updated)
  }

  const updateSubject = (index: number, field: string, value: any) => {
    const updated = [...subjects]
    updated[index] = { ...updated[index], [field]: field === 'soruSayisi' ? parseInt(value) || 0 : value }
    setSubjects(updated)
  }

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
        fields: fieldsObject,
        subjects: subjects
          .filter(s => s.soruSayisi > 0)
          .map(s => ({
            name: s.name,
            start: s.start,
            soruSayisi: s.soruSayisi
          }))
      }

      console.log('📤 Optik form güncelleniyor:', optikFormData)

      // API'ye güncelle
      if (form._id) {
        // Backend'den gelen form
        try {
          await apiClient.updateOptikForm(form._id, optikFormData)
          console.log('✅ API güncelleme başarılı')
        } catch (apiError) {
          console.warn('⚠️ API güncelleme başarısız:', apiError)
          throw apiError
        }
      } else {
        // Local form
        updateOptikForm(form.id, {
          ...optikFormData,
          subjects: subjects.filter(s => s.soruSayisi > 0).map(s => ({
            ...s,
            end: s.start + s.soruSayisi - 1
          }))
        })
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)

    } catch (error) {
      console.error('❌ Optik form güncelleme hatası:', error)
      alert('Güncelleme sırasında hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Optik form başarıyla güncellendi!
          </AlertDescription>
        </Alert>
      )}

      {/* Temel Bilgiler */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
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
        </CardContent>
      </Card>

      {/* Öğrenci Bilgi Alanları ve Ders Alanları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Öğrenci Bilgi Alanları */}
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800 flex items-center gap-2">
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
                    onChange={(e) => updateStudentField(index, 'start', parseInt(e.target.value))}
                    placeholder="Başlangıç"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    value={field.end}
                    onChange={(e) => updateStudentField(index, 'end', parseInt(e.target.value))}
                    placeholder="Bitiş"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ders Alanları */}
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Ders Alanları
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {subjects.map((subject, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded border text-sm">
                  <Input
                    value={subject.name}
                    onChange={(e) => updateSubject(index, 'name', e.target.value)}
                    placeholder="Ders Adı"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    value={subject.start}
                    onChange={(e) => updateSubject(index, 'start', parseInt(e.target.value))}
                    placeholder="Başlangıç"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    value={subject.soruSayisi}
                    onChange={(e) => updateSubject(index, 'soruSayisi', e.target.value)}
                    placeholder="Soru Sayısı"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kaydet/İptal Butonları */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          İptal
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}
