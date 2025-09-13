import { create } from "zustand"
import { persist } from "zustand/middleware"

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

export interface OptikForm {
  id: string
  formAdi: string
  formKodu: string
  examId?: string // optional for backward compatibility
  examTypeId?: string // new field for exam type
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
  createdAt: string
}

interface OptikFormState {
  optikForms: OptikForm[]
  addOptikForm: (form: Omit<OptikForm, "id" | "createdAt">) => void
  addOptikFormWithId: (form: Omit<OptikForm, "id" | "createdAt">, customId: string) => void
  updateOptikForm: (id: string, updates: Partial<OptikForm>) => void
  deleteOptikForm: (id: string) => void
  getOptikFormByExamId: (examId: string) => OptikForm | undefined
  getOptikFormById: (id: string) => OptikForm | undefined
}

export const useOptikFormStore = create<OptikFormState>()(
  persist(
    (set, get) => ({
      optikForms: [
        // Örnek veri
        {
          id: "66e5b8c1f1a2b3c4d5e6f7a8",
          formAdi: "2024 Matematik Ara Sınavı Form A",
          formKodu: "MAT2024A",
          examId: "exam-1",
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
          subjects: [
            { name: "Cebir", start: 160, end: 179, soruSayisi: 20 },
            { name: "Geometri", start: 210, end: 224, soruSayisi: 15 },
          ],
          createdAt: "2024-01-02T10:00:00Z",
        },
      ],
      addOptikForm: (formData) => {
        // MongoDB uyumlu ObjectId benzeri 24 karakterlik hex ID oluştur
        const generateObjectId = () => {
          const timestamp = Math.floor(Date.now() / 1000).toString(16)
          const random = Math.random().toString(16).substring(2, 18)
          return (timestamp + random).padEnd(24, '0').substring(0, 24)
        }
        
        const form: OptikForm = {
          ...formData,
          id: generateObjectId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ optikForms: [...state.optikForms, form] }))
      },
      addOptikFormWithId: (formData, customId) => {
        const form: OptikForm = {
          ...formData,
          id: customId,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ optikForms: [...state.optikForms, form] }))
      },
      updateOptikForm: (id, updates) => {
        set((state) => ({
          optikForms: state.optikForms.map((form) => (form.id === id ? { ...form, ...updates } : form)),
        }))
      },
      deleteOptikForm: (id) => {
        set((state) => ({
          optikForms: state.optikForms.filter((form) => form.id !== id),
        }))
      },
      getOptikFormByExamId: (examId) => get().optikForms.find((form) => form.examId === examId),
      getOptikFormById: (id) => get().optikForms.find((form) => form.id === id),
    }),
    {
      name: "optik-form-storage",
    },
  ),
)
