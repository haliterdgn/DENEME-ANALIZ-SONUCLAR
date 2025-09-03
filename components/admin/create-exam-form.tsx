"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useExamStore, type Subject } from "@/lib/stores/exam-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExamFormData {
  name: string
  date: string
  classLevel: string
  subjects: Subject[]
}

const availableSubjects = ["Matematik", "Fizik", "Kimya", "Biyoloji", "İngilizce", "Tarih", "Coğrafya", "Edebiyat"]

export default function CreateExamForm() {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const { addExam } = useExamStore()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExamFormData>({
    defaultValues: {
      subjects: [],
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

  const onSubmit = (data: ExamFormData) => {
    if (!user) return

    addExam({
      name: data.name,
      date: data.date,
      classLevel: data.classLevel,
      subjects: data.subjects,
      createdBy: user.id,
    })

    setSuccess(true)
    reset()
    setSelectedSubjects([])

    setTimeout(() => setSuccess(false), 3000)
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

          <div className="space-y-2">
            <Label htmlFor="classLevel">Sınıf Seviyesi</Label>
            <Input
              id="classLevel"
              {...register("classLevel", { required: "Sınıf seviyesi gereklidir" })}
              placeholder="örn: 9. Sınıf, 10. Sınıf"
            />
            {errors.classLevel && <p className="text-sm text-red-600">{errors.classLevel.message}</p>}
          </div>

          <div className="space-y-4">
            <Label>Ders Seçimi</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableSubjects.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject}
                    checked={selectedSubjects.includes(subject)}
                    onCheckedChange={() => handleSubjectToggle(subject)}
                  />
                  <Label htmlFor={subject} className="text-sm">
                    {subject}
                  </Label>
                </div>
              ))}
            </div>
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

          <Button type="submit" className="w-full" disabled={fields.length === 0}>
            Sınav Oluştur
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
