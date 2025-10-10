const API_BASE_URL = 'http://34.236.53.26'

class ApiClient {
  private baseUrl: string
  private defaultOptikFormIdCache: string | null = null
  private optikFormCacheTime: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 dakika cache

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private async request(endpoint: string, options: RequestInit = {}) {
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
        // Hata detaylarını görmek için response body'sini de loglayalım
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
        // Silent mode - sadece development'ta log et
        if (process.env.NODE_ENV === 'development') {
          console.info('🔌 Offline mode: API server unavailable')
        }
        return this.getOfflineFallback(url, options?.method || 'GET')
      }
      
      // Sadece beklenmeyen hataları logla
      if (!error.message?.includes('Optik form ID gerekli')) {
        console.warn('API request failed:', error)
      }
      throw error
    }
  }

  private getOfflineFallback(url: string, method: string = 'GET'): any {
    // POST istekleri için success response döndür
    if (method === 'POST') {
      if (url.includes('/api/optik-forms/')) {
        return {
          _id: 'offline-' + Date.now(),
          formAdi: 'Offline Form',
          formKodu: 'OFFLINE',
          createdAt: new Date().toISOString(),
          message: 'Form offline modda oluşturuldu'
        }
      }
      if (url.includes('/api/exam-types/')) {
        return {
          _id: 'offline-' + Date.now(),
          typeName: 'Offline Type',
          createdAt: new Date().toISOString(),
          message: 'Exam type offline modda oluşturuldu'
        }
      }
      if (url.includes('/api/exams/')) {
        return {
          _id: 'offline-' + Date.now(),
          name: 'Offline Exam',
          createdAt: new Date().toISOString(),
          message: 'Exam offline modda oluşturuldu'
        }
      }
      return { 
        _id: 'offline-' + Date.now(),
        message: 'Offline modda oluşturuldu',
        createdAt: new Date().toISOString()
      }
    }

    // DELETE istekleri için success response döndür
    if (method === 'DELETE') {
      return {
        success: true,
        message: 'Offline modda silindi'
      }
    }

    // GET istekleri için mock veri döndür
    if (url.includes('/api/exam-types/')) {
      // Tek bir sınav tipi detayı isteniyorsa
      if (url.match(/\/api\/exam-types\/[a-zA-Z0-9]+$/)) {
        return {
          success: true,
          data: {
            _id: 'mock-exam-type-1',
            typeName: 'LGS Deneme Sınavı',
            sinifSeviyeleri: [5, 6, 7, 8],
            toplamSure: 120,
            dersler: [
              { dersAdi: 'Türkçe', soruSayisi: 20 },
              { dersAdi: 'Matematik', soruSayisi: 20 },
              { dersAdi: 'Fen Bilimleri', soruSayisi: 20 },
              { dersAdi: 'İnkılap Tarihi', soruSayisi: 10 },
              { dersAdi: 'Din Kültürü', soruSayisi: 10 },
              { dersAdi: 'İngilizce', soruSayisi: 10 }
            ]
          }
        }
      }
      // Tüm sınav tipleri listesi
      return {
        success: true,
        data: [
          {
            _id: 'mock-exam-type-1',
            typeName: 'LGS Deneme Sınavı'
          },
          {
            _id: 'mock-exam-type-2', 
            typeName: 'TYT Deneme Sınavı'
          }
        ]
      }
    }
    if (url.includes('/api/optik-forms/')) {
      return []
    }
    if (url.includes('/api/exams/')) {
      return []
    }
    if (url.includes('/student-results')) {
      return []
    }
    return null
  }

  // Exam Types
  async getExamTypes() {
    return this.request('/api/exam-types/')
  }

  async createExamType(data: any) {
    return this.request('/api/exam-types/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getExamType(id: string) {
    return this.request(`/api/exam-types/${id}`)
  }

  async updateExamType(id: string, data: any) {
    return this.request(`/api/exam-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteExamType(id: string) {
    return this.request(`/api/exam-types/${id}`, {
      method: 'DELETE',
    })
  }

  // Exams
  async getExams() {
    return this.request('/api/exams/')
  }

  async createExam(data: any) {
    console.log('Creating exam with data:', data) // Debug log
    return this.request('/api/exams/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getExam(id: string) {
    return this.request(`/api/exams/${id}`)
  }

  async updateExam(id: string, data: any) {
    return this.request(`/api/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteExam(id: string) {
    return this.request(`/api/exams/${id}`, {
      method: 'DELETE',
    })
  }

  // Topic Analysis - Mevcut analyze-results endpoint'ini kullan
  async getTopicAnalysis(examId: string, optikFormId: string, includeDetails: boolean = true) {
    console.log('🎯 Topic Analysis başlatılıyor (via analyze-results):', { examId, optikFormId, includeDetails })
    
    try {
      const result = await this.request(`/api/exams/${examId}/analyze-results`, {
        method: 'POST',
        body: JSON.stringify({
          optikFormId,
          includeDetails
        }),
      })
      
      console.log('✅ Topic Analysis tamamlandı:', result)
      return result
      
    } catch (error: any) {
      console.error('❌ Topic Analysis hatası:', error)
      throw error
    }
  }

  // Excel Upload
  async uploadExcel(examId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return fetch(`${this.baseUrl}/api/exams/${examId}/upload-excel`, {
      method: 'POST',
      body: formData,
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
  }

  // TXT Upload (Optik Results)
  async uploadTxtResults(examId: string, file: File, optikFormId: string) {
    console.log('📄 TXT Upload başlatılıyor:', { examId, fileName: file.name, optikFormId })
    
    const formData = new FormData()
    formData.append('file', file)
    
    if (optikFormId && optikFormId !== 'undefined' && optikFormId !== 'null') {
      formData.append('optikFormId', optikFormId)
      console.log('✅ Optik Form ID eklendi:', optikFormId)
    } else {
      console.warn('⚠️ Optik Form ID eksik veya geçersiz:', optikFormId)
    }

    return fetch(`${this.baseUrl}/api/exams/${examId}/upload-txt`, {
      method: 'POST',
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ TXT Upload hatası:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      console.log('✅ TXT Upload başarılı:', result)
      return result
    })
  }

  // Optik Forms
  async getOptikForms() {
    return this.request('/api/optik-forms/')
  }

  async createOptikForm(data: any) {
    return this.request('/api/optik-forms/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getOptikForm(id: string) {
    return this.request(`/api/optik-forms/${id}`)
  }

  async updateOptikForm(id: string, data: any) {
    return this.request(`/api/optik-forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteOptikForm(id: string) {
    return this.request(`/api/optik-forms/${id}`, {
      method: 'DELETE',
    })
  }

  async getOptikFormsByExamType(examTypeId: string) {
    return this.request(`/api/optik-forms/by-exam-type/${examTypeId}`)
  }

  // Student Results
  async getStudentResults(examId: string, params?: {
    optikFormId?: string
    limit?: number
    skip?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.optikFormId) queryParams.set('optikFormId', params.optikFormId)
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.skip) queryParams.set('skip', params.skip.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/api/exams/${examId}/student-results${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  // Varsayılan optik form ID'sini almak için yardımcı method (cache ile)
  private async getDefaultOptikFormId(): Promise<string | null> {
    // Cache kontrolü
    const now = Date.now()
    if (this.defaultOptikFormIdCache && (now - this.optikFormCacheTime) < this.CACHE_DURATION) {
      return this.defaultOptikFormIdCache
    }

    try {
      const optikForms = await this.getOptikForms()
      if (optikForms && optikForms.length > 0) {
        const optikFormId = optikForms[0]._id || optikForms[0].id
        
        // Cache\'e kaydet
        this.defaultOptikFormIdCache = optikFormId
        this.optikFormCacheTime = now
        return optikFormId
      }
      
      // Eğer optik form yoksa, varsayılan bir tane oluşturmayı deneyelim
      const defaultOptikForm = {
        name: 'Varsayılan Optik Form - ' + new Date().toISOString().split('T')[0],
        questionCount: 40,
        layout: 'standard',
        examTypeId: null,
        createdBy: 'system',
        description: 'Otomatik oluşturulan varsayılan optik form'
      }
      
      const createdForm = await this.createOptikForm(defaultOptikForm)
      const newOptikFormId = createdForm._id || createdForm.id
      
      // Cache\'e kaydet
      this.defaultOptikFormIdCache = newOptikFormId
      this.optikFormCacheTime = now
      return newOptikFormId
    } catch (error) {
      return null
    }
  }

  // Exam Analysis - Analyze Student Results endpoint'ini kullan
  async analyzeExamResults(examId: string, data: {
    optikFormId?: string
    includeDetails?: boolean
    classFilter?: string
  }) {
    console.log('🔍 Analyze Student Results başlatılıyor:', {
      examId, 
      hasOptikFormId: !!data.optikFormId, 
      includeDetails: data.includeDetails
    })

    try {
      // Önce varsayılan optik form ID'sini al
      let optikFormId = data.optikFormId
      
      if (!optikFormId) {
        console.log('📋 Optik form ID alınıyor...')
        optikFormId = await this.getDefaultOptikFormId()
        
        if (!optikFormId) {
          throw new Error('Optik form bulunamadı')
        }
      }

      // Postman collection'a göre API request format
      const requestBody = {
        optikFormId: optikFormId,
        includeDetails: data.includeDetails !== false // default true
      }

      console.log('🚀 Analyze Student Results API çağrısı yapılıyor...')
      
      const result = await this.request(`/api/exams/${examId}/analyze-results`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      
      console.log('🎉 Analyze Student Results başarıyla tamamlandı!')
      return result
      
    } catch (error: any) {
      console.error('❌ Analyze Student Results hatası:', error)
      throw error
    }
  }

  // TXT dosyası yükleme
  async uploadTxtFile(examId: string, file: File) {
    console.log('📤 TXT dosyası yükleniyor:', { examId, fileName: file.name, fileSize: file.size })
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // FormData için özel request - Content-Type header'ını otomatik ayarla
      const url = `${this.baseUrl}/api/exams/${examId}/upload-txt`
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // FormData için Content-Type header'ını manuel olarak set etmiyoruz
        // Browser otomatik olarak multipart/form-data ve boundary'yi ekleyecek
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
      
      const result = await response.json()
      console.log('✅ TXT dosyası başarıyla yüklendi!')
      return result
      
    } catch (error: any) {
      console.error('❌ TXT dosyası yükleme hatası:', error)
      throw error
    }
  }
}

export const apiClient = new ApiClient()
export default apiClient
