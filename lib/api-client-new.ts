const API_BASE_URL = 'http://34.236.53.26:3001'

// API Types
interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

interface ExamInfo {
  examId: string
  examName: string
  optikFormId: string
  optikFormName: string
}

interface AnalysisStats {
  totalStudents: number
  totalQuestions: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passCount: number
  failCount: number
}

interface SubjectAnalysis {
  subjectName: string
  totalQuestions: number
  averageScore: number
  highestScore: number
  lowestScore: number
  totalCorrect: number
  totalWrong: number
  totalEmpty: number
  studentCount: number
}

interface StudentResult {
  studentInfo: {
    tcKimlikNo: string
    ogrenciAdi: string
    sinif: string
    telefon: string
  }
  totalScore: number
  totalCorrect: number
  totalWrong: number
  totalEmpty: number
  subjectScores: Array<{
    subjectName: string
    correct: number
    wrong: number
    empty: number
    score: number
  }>
  detailedAnswers: Array<{
    questionNumber: number
    studentAnswer: string
    correctAnswer: string
    isCorrect: boolean
    isEmpty: boolean
  }>
}

interface AnalysisResult {
  message: string
  examInfo: ExamInfo
  analysisStats: AnalysisStats
  subjectAnalysis: SubjectAnalysis[]
  studentResults: StudentResult[]
}

class ApiClient {
  private baseUrl: string
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 dakika cache

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  // Generic request method
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`
        try {
          const errorBody = await response.text()
          if (errorBody) {
            errorDetails += ` - ${errorBody}`
          }
        } catch (e) {
          // Response body okunamadı
        }
        throw new Error(errorDetails)
      }
      
      return await response.json()
    } catch (error) {
      // Network hatalarında offline fallback döndür
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        if (process.env.NODE_ENV === 'development') {
          console.info('🔌 Offline mode: API server unavailable')
        }
        return this.getOfflineFallback(url, options?.method || 'GET')
      }
      
      // Diğer hataları fırlat
      throw error
    }
  }

  // File upload helper
  private async uploadFile(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    // Ek data varsa ekle
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorDetails = `HTTP error! status: ${response.status}`
      try {
        const errorBody = await response.text()
        if (errorBody) {
          errorDetails += ` - ${errorBody}`
        }
      } catch (e) {
        // Response body okunamadı
      }
      throw new Error(errorDetails)
    }

    return await response.json()
  }

  // Offline fallback data
  private getOfflineFallback(url: string, method: string): any {
    console.log(`🔌 Offline fallback for ${method} ${url}`)
    
    if (url.includes('/api/exams')) {
      return []
    }
    if (url.includes('/api/exam-types')) {
      return []
    }
    if (url.includes('/api/optik-forms')) {
      return []
    }
    
    return { message: 'Offline mode', data: [] }
  }

  // =====================================
  // AUTHENTICATION
  // =====================================
  async login(credentials: { username: string; password: string }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  // =====================================
  // EXAM TYPES
  // =====================================
  async getExamTypes() {
    return this.request('/api/exam-types/')
  }

  async createExamType(examType: any) {
    return this.request('/api/exam-types/', {
      method: 'POST',
      body: JSON.stringify(examType),
    })
  }

  async updateExamType(id: string, examType: any) {
    return this.request(`/api/exam-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(examType),
    })
  }

  async deleteExamType(id: string) {
    return this.request(`/api/exam-types/${id}`, {
      method: 'DELETE',
    })
  }

  // =====================================
  // EXAMS
  // =====================================
  async getExams() {
    return this.request('/api/exams/')
  }

  async createExam(exam: any) {
    return this.request('/api/exams/', {
      method: 'POST',
      body: JSON.stringify(exam),
    })
  }

  async getExam(id: string) {
    return this.request(`/api/exams/${id}`)
  }

  async updateExam(id: string, exam: any) {
    return this.request(`/api/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exam),
    })
  }

  async deleteExam(id: string) {
    return this.request(`/api/exams/${id}`, {
      method: 'DELETE',
    })
  }

  // =====================================
  // FILE UPLOADS
  // =====================================
  async uploadExcel(examId: string, file: File) {
    console.log('📊 Excel yükleniyor:', { examId, fileName: file.name, size: file.size })
    
    try {
      const result = await this.uploadFile(`/api/exams/${examId}/upload-excel`, file)
      console.log('✅ Excel başarıyla yüklendi:', result)
      return result
    } catch (error) {
      console.error('❌ Excel yükleme hatası:', error)
      throw error
    }
  }

  async uploadTxt(examId: string, file: File, optikFormId?: string) {
    console.log('📄 TXT yükleniyor:', { examId, fileName: file.name, size: file.size, optikFormId })
    
    try {
      const additionalData = optikFormId ? { optikFormId } : undefined
      const result = await this.uploadFile(`/api/exams/${examId}/upload-txt`, file, additionalData)
      console.log('✅ TXT başarıyla yüklendi:', result)
      return result
    } catch (error) {
      console.error('❌ TXT yükleme hatası:', error)
      throw error
    }
  }

  // =====================================
  // OPTIK FORMS
  // =====================================
  async getOptikForms() {
    return this.request('/api/optik-forms/')
  }

  async getOptikFormsByExamType(examTypeId: string) {
    return this.request(`/api/optik-forms/by-exam-type/${examTypeId}`)
  }

  async createOptikForm(optikForm: any) {
    return this.request('/api/optik-forms/', {
      method: 'POST',
      body: JSON.stringify(optikForm),
    })
  }

  async updateOptikForm(id: string, optikForm: any) {
    return this.request(`/api/optik-forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(optikForm),
    })
  }

  async deleteOptikForm(id: string) {
    return this.request(`/api/optik-forms/${id}`, {
      method: 'DELETE',
    })
  }

  // =====================================
  // ANALYSIS
  // =====================================
  async analyzeResults(examId: string, options: {
    optikFormId?: string
    includeDetails?: boolean
  } = {}): Promise<AnalysisResult> {
    console.log('🎯 Analiz başlatılıyor:', { examId, ...options })
    
    try {
      const requestBody = {
        optikFormId: options.optikFormId || "default",
        includeDetails: options.includeDetails !== false // varsayılan true
      }

      const result = await this.request(`/api/exams/${examId}/analyze-results`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      
      console.log('✅ Analiz tamamlandı:', result)
      return result
      
    } catch (error) {
      console.error('❌ Analiz hatası:', error)
      throw error
    }
  }

  // =====================================
  // USERS (Bonus)
  // =====================================
  async getUsers() {
    return this.request('/api/users/')
  }

  async createUser(user: any) {
    return this.request('/api/users/', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  }

  async updateUser(id: string, user: any) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    })
  }

  // =====================================
  // LEGACY METHODS (Backward Compatibility)
  // =====================================
  
  // Eski method'lar için uyumluluk
  async getTopicAnalysis(examId: string, optikFormId?: string, includeDetails: boolean = true) {
    return this.analyzeResults(examId, { optikFormId, includeDetails })
  }

  async uploadTxtFile(examId: string, file: File) {
    return this.uploadTxt(examId, file)
  }

  async uploadTxtResults(examId: string, file: File, optikFormId: string) {
    return this.uploadTxt(examId, file, optikFormId)
  }
}

export const apiClient = new ApiClient()
export default apiClient
