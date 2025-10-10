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

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  // Generic request method with enhanced error handling
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(options.body && !(options.body instanceof FormData) 
            ? { 'Content-Type': 'application/json' } 
            : {}),
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} ${response.statusText}`
        let errorPayload: any = null
        
        try {
          const errorText = await response.text()
          if (errorText) {
            try {
              // JSON parse dene
              errorPayload = JSON.parse(errorText)
              // Error message'ı çıkar
              const apiError = errorPayload.error || errorPayload.message || errorText
              errorMessage = `${apiError}`
            } catch {
              // JSON değilse text olarak kullan
              errorMessage = `${errorText}`
            }
          }
        } catch (e) {
          // Response body okunamadı
        }
        
        // Özel error objesi oluştur
        const error = new Error(errorMessage) as any
        error.status = response.status
        error.payload = errorPayload
        throw error
      }
      
      return await response.json()
    } catch (error) {
      console.error(`❌ API Error [${options.method || 'GET'} ${url}]:`, error)
      throw error
    }
  }

  // =====================================
  // FILE UPLOAD HELPER
  // =====================================
  async uploadFile(endpoint: string, file: File, additionalData?: any): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    // Ek veriyi ekle
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key])
      })
    }
    
    return this.request(endpoint, {
      method: 'POST',
      body: formData
    })
  }

  // =====================================
  // RESULTS PRE-CHECK
  // =====================================
  
  // Sınav için öğrenci sonuçlarının yüklenip yüklenmediğini kontrol et
  async checkStudentResults(examId: string): Promise<{ hasResults: boolean, message?: string }> {
    try {
      // Önce results status kontrol et (eğer böyle bir endpoint varsa)
      const result = await this.request(`/api/exams/${examId}/results/status`, {
        method: 'GET'
      })
      return { hasResults: true, message: 'Öğrenci sonuçları mevcut' }
    } catch (error: any) {
      // 404 veya "No student results" mesajı varsa
      if (error.message.includes('404') || error.message.toLowerCase().includes('no student results')) {
        return { hasResults: false, message: 'Öğrenci sonuçları henüz yüklenmemiş' }
      }
      
      // Başka bir hata varsa tekrar fırlat
      throw error
    }
  }

  // =====================================
  // ANALYSIS WITH PRE-CHECK
  // =====================================
  async analyzeResults(examId: string, options: {
    optikFormId?: string
    includeDetails?: boolean
  } = {}): Promise<AnalysisResult> {
    console.log('🎯 Analiz başlatılıyor:', { examId, ...options })
    
    try {
      const requestBody: any = {
        includeDetails: options.includeDetails !== false // varsayılan true
      }

      // OptikFormId sadece geçerli bir ID varsa ekle
      if (options.optikFormId && 
          options.optikFormId !== "default" && 
          options.optikFormId.length > 10) { // Basit ID validation
        requestBody.optikFormId = options.optikFormId
        console.log('✅ OptikFormId eklendi:', options.optikFormId)
      } else {
        console.log('ℹ️ OptikFormId gönderilmiyor - backend otomatik bulacak')
      }

      const result = await this.request(`/api/exams/${examId}/analyze-results`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
      
      console.log('✅ Analiz başarıyla tamamlandı')
      return result
    } catch (error: any) {
      console.error('❌ Analiz hatası:', error)
      
      // Eğer "No student results" hatası varsa özel mesaj
      if (error.message.toLowerCase().includes('no student results')) {
        const enhancedError = new Error('Öğrenci sonuçları bulunamadı. Lütfen önce TXT dosyası yükleyin.') as any
        enhancedError.code = 'NO_STUDENT_RESULTS'
        enhancedError.originalError = error
        throw enhancedError
      }
      
      throw error
    }
  }

  // =====================================
  // FILE UPLOADS
  // =====================================
  
  // Excel upload
  async uploadExcel(examId: string, file: File): Promise<any> {
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

  // TXT upload with optik form
  async uploadTxt(examId: string, file: File, optikFormId?: string): Promise<any> {
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
  async getOptikForms(): Promise<any[]> {
    try {
      const result = await this.request('/api/optik-forms')
      return result || []
    } catch (error) {
      console.error('❌ Optik formlar yüklenemedi:', error)
      return []
    }
  }

  async createOptikForm(data: any): Promise<any> {
    return this.request('/api/optik-forms', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateOptikForm(id: string, data: any): Promise<any> {
    return this.request(`/api/optik-forms/${id}`, {
      method: 'PUT', 
      body: JSON.stringify(data)
    })
  }

  async deleteOptikForm(id: string): Promise<any> {
    return this.request(`/api/optik-forms/${id}`, {
      method: 'DELETE'
    })
  }

  // =====================================
  // EXAMS
  // =====================================
  async getExams(): Promise<any[]> {
    try {
      const result = await this.request('/api/exams')
      return result || []
    } catch (error) {
      console.error('❌ Sınavlar yüklenemedi:', error)
      return []
    }
  }

  async createExam(data: any): Promise<any> {
    return this.request('/api/exams', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateExam(id: string, data: any): Promise<any> {
    return this.request(`/api/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteExam(id: string): Promise<any> {
    return this.request(`/api/exams/${id}`, {
      method: 'DELETE'
    })
  }

  // =====================================
  // BACKWARD COMPATIBILITY METHODS
  // =====================================
  
  // Eski API isimleri için wrapper metodlar
  async getDetailedAnalysis(examId: string, optikFormId?: string, includeDetails = true) {
    return this.analyzeResults(examId, { optikFormId, includeDetails })
  }

  async uploadTxtFile(examId: string, file: File) {
    return this.uploadTxt(examId, file)
  }

  async uploadTxtResults(examId: string, file: File, optikFormId: string) {
    return this.uploadTxt(examId, file, optikFormId)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
