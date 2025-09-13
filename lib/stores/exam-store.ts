import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/lib/api-client"

interface ExamStore {
  exams: any[]
  booklets: any[]
  results: any[]
  // Local methods
  addExam: (examData: any) => void
  addBooklet: (bookletData: any) => void
  addResult: (resultData: any) => void
  getExamById: (id: string) => any | undefined
  getBookletByExamId: (examId: string) => any | undefined
  getResultsByStudentId: (studentId: string) => any[]
  getResultsByExamId: (examId: string) => any[]
  // API methods
  fetchExams: () => Promise<any[]>
  createExamAPI: (examData: any) => Promise<any>
  deleteExamAPI: (examId: string) => Promise<void>
  uploadExcel: (examId: string, file: File) => Promise<any>
  uploadTxtResults: (examId: string, file: File, optikFormId: string) => Promise<any>
  getStudentResults: (examId: string) => Promise<any>
  analyzeExamResults: (examId: string, data: any) => Promise<any>
  getOptikForms: () => Promise<any[]>
  createOptikForm: (formData: any) => Promise<any>
  deleteOptikForm: (id: string) => Promise<any>
  refreshExamData: (examId: string) => Promise<void>
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      exams: [], // API'den çekilecek
      booklets: [], // API'den çekilecek  
      results: [], // API'den çekilecek

      // Local methods
      addExam: (examData: any) => {
        const exam = {
          ...examData,
          id: `exam-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((state: any) => ({ exams: [...state.exams, exam] }))
      },
      addBooklet: (bookletData: any) => {
        const booklet = {
          ...bookletData,
          id: `booklet-${Date.now()}`,
          uploadedAt: new Date().toISOString(),
        }
        set((state: any) => ({ booklets: [...state.booklets, booklet] }))
      },
      addResult: (resultData: any) => {
        const result = {
          ...resultData,
          id: `result-${Date.now()}`,
        }
        set((state: any) => ({ results: [...state.results, result] }))
      },
      getExamById: (id: string) => get().exams.find((exam: any) => exam.id === id),
      getBookletByExamId: (examId: string) => get().booklets.find((booklet: any) => booklet.examId === examId),
      getResultsByStudentId: (studentId: string) => get().results.filter((result: any) => result.studentId === studentId),
      getResultsByExamId: (examId: string) => get().results.filter((result: any) => result.examId === examId),

      // API methods
      fetchExams: async () => {
        try {
          const exams = await apiClient.getExams()
          // MongoDB'den gelen _id'yi id'ye çevir ve _id'yi de sakla
          const mappedExams = exams.map((exam: any) => ({
            ...exam,
            id: exam._id || exam.id,
            _id: exam._id // MongoDB _id'sini sakla
          }))
          set({ exams: mappedExams })
          return mappedExams
        } catch (error) {
          console.warn('Offline mode: Sınavlar yerel verilerde çalışıyor')
          throw error
        }
      },
      createExamAPI: async (examData: any) => {
        try {
          const exam = await apiClient.createExam(examData)
          // MongoDB'den gelen _id'yi id'ye çevir ve _id'yi de sakla
          const mappedExam = {
            ...exam,
            id: exam._id || exam.id,
            _id: exam._id // MongoDB _id'sini sakla
          }
          set((state: any) => ({ exams: [...state.exams, mappedExam] }))
          return mappedExam
        } catch (error) {
          console.warn('Offline mode: Sınav oluşturma yerel olarak kaydedildi')
          throw error
        }
      },
      deleteExamAPI: async (examId: string) => {
        try {
          // API'ye gerçek MongoDB _id'sini gönder
          const exam = get().exams.find((e: any) => e.id === examId)
          const mongoId = exam?._id || examId
          
          await apiClient.deleteExam(mongoId)
          set((state: any) => ({
            exams: state.exams.filter((exam: any) => exam.id !== examId),
            booklets: state.booklets.filter((booklet: any) => booklet.examId !== examId),
            results: state.results.filter((result: any) => result.examId !== examId)
          }))
        } catch (error: any) {
          console.warn('Offline mode: Sınav silme yerel olarak gerçekleştirildi')
          // CORS hatası veya backend hatası durumunda bile local'den sil
          if (error.message?.includes('500') || 
              error.message?.includes('CORS') || 
              error.message?.includes('ERR_FAILED') ||
              error.message?.includes('Access to fetch')) {
            console.log('API hatası (CORS/500/Network) nedeniyle sadece local storage\'dan siliniyor')
            set((state: any) => ({
              exams: state.exams.filter((exam: any) => exam.id !== examId),
              booklets: state.booklets.filter((booklet: any) => booklet.examId !== examId),
              results: state.results.filter((result: any) => result.examId !== examId)
            }))
            // CORS hatasında bile başarılı olarak işaretle
            return
          }
          throw error
        }
      },
      uploadExcel: async (examId: string, file: File) => {
        try {
          // API'ye gerçek MongoDB _id'sini gönder
          const exam = get().exams.find((e: any) => e.id === examId)
          const mongoId = exam?._id || examId
          
          const result = await apiClient.uploadExcel(mongoId, file)
          
          // Excel upload başarılı olursa booklet bilgilerini local store'a ekle
          if (result && result.booklet) {
            const booklet = {
              ...result.booklet,
              id: result.booklet._id || result.booklet.id || `booklet-${Date.now()}`,
              examId: examId, // Local examId'yi kullan
              uploadedAt: new Date().toISOString()
            }
            
            // Mevcut booklet'ı güncelle veya yeni ekle
            set((state: any) => {
              const existingIndex = state.booklets.findIndex((b: any) => b.examId === examId)
              if (existingIndex >= 0) {
                const updatedBooklets = [...state.booklets]
                updatedBooklets[existingIndex] = booklet
                return { booklets: updatedBooklets }
              } else {
                return { booklets: [...state.booklets, booklet] }
              }
            })
          }
          
          return result
        } catch (error) {
          console.error('Error uploading Excel file:', error)
          throw error
        }
      },
      uploadTxtResults: async (examId: string, file: File, optikFormId: string) => {
        try {
          // API'ye gerçek MongoDB _id'sini gönder
          const exam = get().exams.find((e: any) => e.id === examId)
          const mongoId = exam?._id || examId
          
          const result = await apiClient.uploadTxtResults(mongoId, file, optikFormId)
          
          // Başarılı upload'tan sonra exam'ı güncelle
          set((state: any) => {
            const updatedExams = state.exams.map((exam: any) => 
              exam.id === examId ? { ...exam, hasResults: true } : exam
            )
            return { exams: updatedExams }
          })
          
          // Upload'tan sonra sonuçları otomatik olarak çek
          try {
            await get().getStudentResults(examId)
          } catch (error) {
            console.warn('Sonuçlar çekilemedi, ancak upload başarılı:', error)
          }
          
          return result
        } catch (error) {
          console.error('Error uploading TXT results:', error)
          throw error
        }
      },
      getStudentResults: async (examId: string) => {
        try {
          // API'ye gerçek MongoDB _id'sini gönder
          const exam = get().exams.find((e: any) => e.id === examId)
          const mongoId = exam?._id || examId
          
          const results = await apiClient.getStudentResults(mongoId)
          
          // API'den gelen sonuçları local store'a da ekle
          if (results && results.length > 0) {
            const mappedResults = results.map((result: any) => ({
              ...result,
              id: result._id || result.id || `result-${Date.now()}-${Math.random()}`,
              examId: examId, // Local examId'yi kullan
              completedAt: result.completedAt || new Date().toISOString()
            }))
            
            // Mevcut sonuçları temizle ve yenilerini ekle
            set((state: any) => ({
              results: [
                ...state.results.filter((r: any) => r.examId !== examId),
                ...mappedResults
              ]
            }))
          }
          
          return results
        } catch (error) {
          console.warn('Offline mode: Sonuçlar yerel verilerde çalışıyor')
          throw error
        }
      },
      analyzeExamResults: async (examId: string, data: any) => {
        try {
          // API'ye gerçek MongoDB _id'sini gönder
          const exam = get().exams.find((e: any) => e.id === examId)
          const mongoId = exam?._id || examId
          
          const analysis = await apiClient.analyzeExamResults(mongoId, data)
          return analysis
        } catch (error) {
          console.error('Error analyzing exam results:', error)
          throw error
        }
      },
      getOptikForms: async () => {
        try {
          const forms = await apiClient.getOptikForms()
          return forms
        } catch (error) {
          console.warn('Offline mode: getOptikForms -', error)
          return []
        }
      },
      createOptikForm: async (formData: any) => {
        try {
          const form = await apiClient.createOptikForm(formData)
          return form
        } catch (error) {
          console.warn('Offline mode: createOptikForm -', error)
          // Offline modda da başarılı bir response döndür
          return {
            _id: 'offline-' + Date.now(),
            formAdi: formData.formAdi || 'Offline Form',
            formKodu: formData.formKodu || 'OFFLINE',
            createdAt: new Date().toISOString(),
            message: 'Form offline modda oluşturuldu'
          }
        }
      },
      deleteOptikForm: async (id: string) => {
        try {
          await apiClient.deleteOptikForm(id)
          return { success: true }
        } catch (error) {
          console.warn('Offline mode: deleteOptikForm -', error)
          return { success: true, message: 'Offline modda silindi' }
        }
      },
      refreshExamData: async (examId: string) => {
        try {
          // Sonuçları tekrar çek
          await get().getStudentResults(examId)
          console.log(`Exam ${examId} data refreshed successfully`)
        } catch (error) {
          console.error('Error refreshing exam data:', error)
          throw error
        }
      },
    }),
    {
      name: "exam-storage",
    },
  ),
)
