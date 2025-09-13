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
  uploadExcel: (examId: string, file: File) => Promise<any>
  uploadTxtResults: (examId: string, file: File, optikFormId: string) => Promise<any>
  getStudentResults: (examId: string) => Promise<any>
  analyzeExamResults: (examId: string, data: any) => Promise<any>
  getOptikForms: () => Promise<any[]>
  createOptikForm: (formData: any) => Promise<any>
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
          set({ exams })
          return exams
        } catch (error) {
          console.error('Error fetching exams:', error)
          throw error
        }
      },
      createExamAPI: async (examData: any) => {
        try {
          const exam = await apiClient.createExam(examData)
          set((state: any) => ({ exams: [...state.exams, exam] }))
          return exam
        } catch (error) {
          console.error('Error creating exam:', error)
          throw error
        }
      },
      uploadExcel: async (examId: string, file: File) => {
        try {
          const result = await apiClient.uploadExcel(examId, file)
          return result
        } catch (error) {
          console.error('Error uploading Excel file:', error)
          throw error
        }
      },
      uploadTxtResults: async (examId: string, file: File, optikFormId: string) => {
        try {
          const result = await apiClient.uploadTxtResults(examId, file, optikFormId)
          set((state: any) => {
            const updatedExams = state.exams.map((exam: any) => 
              exam.id === examId ? { ...exam, hasResults: true } : exam
            )
            return { exams: updatedExams }
          })
          return result
        } catch (error) {
          console.error('Error uploading TXT results:', error)
          throw error
        }
      },
      getStudentResults: async (examId: string) => {
        try {
          const results = await apiClient.getStudentResults(examId)
          return results
        } catch (error) {
          console.error('Error fetching student results:', error)
          throw error
        }
      },
      analyzeExamResults: async (examId: string, data: any) => {
        try {
          const analysis = await apiClient.analyzeExamResults(examId, data)
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
          console.error('Error fetching optik forms:', error)
          throw error
        }
      },
      createOptikForm: async (formData: any) => {
        try {
          const form = await apiClient.createOptikForm(formData)
          return form
        } catch (error) {
          console.error('Error creating optik form:', error)
          throw error
        }
      },
    }),
    {
      name: "exam-storage",
    },
  ),
)
