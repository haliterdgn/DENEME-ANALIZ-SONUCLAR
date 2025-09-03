import { create } from "zustand"
import { persist } from "zustand/middleware"

interface FormField {
  start: number
  end: number
}

interface SubjectArea {
  name: string
  start: number
  soruSayisi: number
}

export interface OptikForm {
  id: string
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
  createdAt: string
}

interface OptikFormState {
  optikForms: OptikForm[]
  addOptikForm: (form: Omit<OptikForm, "id" | "createdAt">) => void
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
          id: "optik-1",
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
            { name: "Cebir", start: 160, soruSayisi: 20 },
            { name: "Geometri", start: 210, soruSayisi: 15 },
          ],
          createdAt: "2024-01-02T10:00:00Z",
        },
      ],
      addOptikForm: (formData) => {
        const form: OptikForm = {
          ...formData,
          id: `optik-${Date.now()}`,
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
