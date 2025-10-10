  const API_BASE_URL = 'http://172.28.107.97:3001'

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
      
      // Network hatası için offline fallback
      if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        console.warn('🔌 Network hatası - offline fallback kullanılıyor')
        return this.getOfflineFallback(endpoint, options.method || 'GET')
      }
      
      throw error
    }
  }

  // Offline fallback data
  private getOfflineFallback(endpoint: string, method: string): any {
    // GET istekleri için boş array döndür
    if (method === 'GET') {
      return []
    }
    
    // POST/PUT/DELETE için success response döndür
    return {
      success: true,
      message: 'Offline mode - operation simulated',
      id: 'offline-' + Date.now()
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
  
  // Not: checkStudentResults metodu kaldırıldı - gereksiz API çağrısı yapıyordu

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
      
      // 🔍 Backend'den gelen veriyi detaylıca loglayalım
      console.log('📊 BACKEND VERİ YAPISI DETAY:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      if (result) {
        // Ana yapı
        console.log('🏗️ Ana veri yapısı:', Object.keys(result))
        
        // Exam Info
        if (result.examInfo) {
          console.log('📋 examInfo içeriği:', result.examInfo)
        }
        
        // Analysis Stats
        if (result.analysisStats) {
          console.log('📈 analysisStats içeriği:', result.analysisStats)
        }
        
        // Subject Analysis - En önemlisi!
        if (result.subjectAnalysis) {
          console.log('📚 subjectAnalysis array uzunluğu:', result.subjectAnalysis.length)
          
          result.subjectAnalysis.forEach((subject: any, index: number) => {
            console.log(`📖 Ders ${index + 1}:`, {
              subjectName: subject.subjectName,
              keys: Object.keys(subject),
              topicAnalysis: subject.topicAnalysis ? 'VAR ✅' : 'YOK ❌',
              difficultyAnalysis: subject.difficultyAnalysis ? 'VAR ✅' : 'YOK ❌'
            })
            
            // Eğer konu analizi varsa detayını göster
            if (subject.topicAnalysis && subject.topicAnalysis.length > 0) {
              console.log(`🎯 ${subject.subjectName} konu listesi:`)
              subject.topicAnalysis.forEach((topic: any, tIndex: number) => {
                console.log(`   Konu ${tIndex + 1}:`, topic)
              })
            }
          })
        }
        
        // Student Results
        if (result.studentResults) {
          console.log('👥 studentResults array uzunluğu:', result.studentResults.length)
          if (result.studentResults.length > 0) {
            console.log('👤 İlk öğrenci örneği:', result.studentResults[0])
          }
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      } else {
        console.log('❌ Backend\'den veri gelmedi!')
      }
      
      return result
    } catch (error: any) {
      console.error('❌ Analiz hatası:', error)
      
      // Özel hata mesajları
      if (error.message.toLowerCase().includes('no student results')) {
        const enhancedError = new Error('Öğrenci sonuçları bulunamadı. Lütfen önce TXT dosyası yükleyin.') as any
        enhancedError.code = 'NO_STUDENT_RESULTS'
        enhancedError.originalError = error
        throw enhancedError
      }
      
      // Optik form ID hatası
      if (error.message.toLowerCase().includes('optik form') || 
          error.message.toLowerCase().includes('gerekli') ||
          (error.status === 400 && !options.optikFormId)) {
        const enhancedError = new Error('Optik form ID gerekli - alternatif yöntem kullanılacak') as any
        enhancedError.code = 'OPTIK_FORM_ID_REQUIRED'
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
  // STUDENT EXAM COMPARISON
  // =====================================
  async getStudentExamComparison(studentNo: string): Promise<any> {
    try {
      console.log('📊 Öğrenci sınav karşılaştırması yükleniyor:', studentNo)
      const result = await this.request(`/api/students/${studentNo}/exam-comparison`)
      console.log('✅ Sınav karşılaştırması yüklendi:', result)
      return result
    } catch (error) {
      console.error('❌ Sınav karşılaştırması yüklenemedi:', error)
      throw error
    }
  }

  // =====================================
  // EXAM TYPES
  // =====================================
  async getExamTypes(): Promise<any[]> {
    try {
      const result = await this.request('/api/exam-types')
      return result || []
    } catch (error) {
      console.warn('⚠️ Sınav tipleri offline modda çalışıyor')
      // Offline fallback - örnek sınav tipleri
      return [
        {
          id: 'offline-1',
          _id: 'offline-1',
          name: 'TYT Deneme',
          typeName: 'TYT Deneme',
          description: 'Temel Yeterlilik Testi',
          subjects: ['Türkçe', 'Matematik', 'Fen', 'Sosyal'],
          totalDuration: 165,
          totalQuestions: 120,
          isActive: true
        },
        {
          id: 'offline-2', 
          _id: 'offline-2',
          name: 'AYT Deneme',
          typeName: 'AYT Deneme', 
          description: 'Alan Yeterlilik Testi',
          subjects: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'],
          totalDuration: 180,
          totalQuestions: 80,
          isActive: true
        }
      ]
    }
  }

  async createExamType(data: any): Promise<any> {
    try {
      return await this.request('/api/exam-types', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.warn('⚠️ Sınav tipi oluşturma offline modda simüle edildi')
      return {
        success: true,
        id: 'offline-' + Date.now(),
        message: 'Sınav tipi offline modda oluşturuldu',
        ...data
      }
    }
  }

  async updateExamType(id: string, data: any): Promise<any> {
    try {
      return await this.request(`/api/exam-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.warn('⚠️ Sınav tipi güncelleme offline modda simüle edildi')
      return {
        success: true,
        id,
        message: 'Sınav tipi offline modda güncellendi',
        ...data
      }
    }
  }

  async deleteExamType(id: string): Promise<any> {
    try {
      return await this.request(`/api/exam-types/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.warn('⚠️ Sınav tipi silme offline modda simüle edildi')
      return {
        success: true,
        id,
        message: 'Sınav tipi offline modda silindi'
      }
    }
  }

  // =====================================
  // STUDENT RESULTS
  // =====================================
  
  async getStudentResults(examId: string, params?: {
    optikFormId?: string
    limit?: number
    skip?: number
  }): Promise<any> {
    try {
      // If no specific params, try to get all results using pagination
      if (!params || (!params.limit && !params.skip)) {
        return await this.getAllStudentResults(examId, params?.optikFormId)
      }
      
      const queryParams = new URLSearchParams()
      if (params?.optikFormId) queryParams.set('optikFormId', params.optikFormId)
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.skip) queryParams.set('skip', params.skip.toString())
      
      const queryString = queryParams.toString()
      const endpoint = `/api/exams/${examId}/student-results${queryString ? `?${queryString}` : ''}`
      
      console.log('📊 Öğrenci sonuçları çekiliyor:', { examId, params })
      const result = await this.request(endpoint)
      console.log('✅ API Response:', { 
        resultsCount: result?.results?.length || 0, 
        totalCount: result?.totalCount || 0,
        hasMore: result?.hasMore,
        resultType: typeof result,
        isArray: Array.isArray(result)
      })
      
      // Return the results array, not the wrapper object
      return result?.results || result || []
    } catch (error: any) {
      console.error('❌ Öğrenci sonuçları getirme hatası:', error)
      // Offline fallback
      return []
    }
  }

  // Helper method to get all student results using pagination
  private async getAllStudentResults(examId: string, optikFormId?: string): Promise<any[]> {
    let allResults: any[] = []
    let skip = 0
    const limit = 50 // API default batch size
    let hasMore = true

    console.log('🔄 Fetching all student results with pagination...')
    
    while (hasMore) {
      try {
        const queryParams = new URLSearchParams()
        if (optikFormId) queryParams.set('optikFormId', optikFormId)
        queryParams.set('limit', limit.toString())
        queryParams.set('skip', skip.toString())
        
        const queryString = queryParams.toString()
        const endpoint = `/api/exams/${examId}/student-results?${queryString}`
        
        console.log(`📄 Fetching batch: skip=${skip}, limit=${limit}`)
        const result = await this.request(endpoint)
        
        if (result?.results && Array.isArray(result.results)) {
          // Filter out duplicates by student ID before adding to allResults
          const newUniqueResults = result.results.filter((newResult: any) => {
            const newId = newResult.studentInfo?.tcKimlikNo || newResult.studentInfo?.ogrenciNo
            if (!newId) return true // Keep results without ID
            
            // Check if this ID already exists in allResults
            return !allResults.some((existingResult: any) => {
              const existingId = existingResult.studentInfo?.tcKimlikNo || existingResult.studentInfo?.ogrenciNo
              return existingId === newId
            })
          })
          
          allResults = [...allResults, ...newUniqueResults]
          
          const duplicatesFiltered = result.results.length - newUniqueResults.length
          if (duplicatesFiltered > 0) {
            console.log(`🔄 Filtered ${duplicatesFiltered} duplicates in this batch`)
          }
          
          console.log(`✅ Batch loaded: ${newUniqueResults.length} unique students (total so far: ${allResults.length})`)
          
          // Check if there are more results
          hasMore = result.hasMore === true || result.results.length === limit
          skip += limit
          
          // Safety check to prevent infinite loops
          if (skip > 10000) {
            console.warn('⚠️ Reached maximum pagination limit')
            break
          }
        } else {
          console.log('❌ No more results or invalid response format')
          hasMore = false
        }
      } catch (error) {
        console.error('❌ Error in pagination batch:', error)
        hasMore = false
      }
    }
    
    console.log(`🎉 All student results loaded: ${allResults.length} total students`)
    return allResults
  }

  // Exam content (cevap anahtarı) getirme
  async getExamContent(examId: string) {
    try {
      console.log('📚 Exam content çekiliyor:', { examId })
      const result = await this.request(`/api/exams/${examId}/content`)
      
      if (result?.questions) {
        // Map API format to expected component format
        result.questions = result.questions.map((q: any) => ({
          ...q,
          soruno: q.rowNumber,
          ders: q.dersAdi,
          dogru_cevap: q.dogruCevap
        }))
      }
      
      console.log('✅ Exam content alındı:', result?.questions?.length || 0, 'soru')
      return result || null
    } catch (error: any) {
      console.error('❌ Exam content getirme hatası:', error)
      return null
    }
  }

  // Student Analysis (öğrenci bazlı analiz) getirme
  async getStudentAnalysis(examId: string, studentId: string) {
    try {
      console.log('👨‍🎓 Student analysis çekiliyor:', { examId, studentId })
      
      // Önce student results'dan optik form ID'yi ve öğrenci no'yu bulalım
      const studentResults = await this.getStudentResults(examId)
      console.log('🔍 Student results yapısı:', { studentResults, type: typeof studentResults, isArray: Array.isArray(studentResults) })
      
      // studentResults direkt array olarak dönüyor
      // studentId birden fazla formatta gelebilir - UUID, TC kimlik no, öğrenci no
      const student = Array.isArray(studentResults) 
        ? studentResults.find((s: any) => {
            // Doğru eşleştirme kriterleri
            const tcMatch = s.studentInfo?.tcKimlikNo === studentId
            const ogrenciNoMatch = s.studentInfo?.ogrenciNo === studentId
            const idMatch = s.id === studentId
            
            console.log(`🔍 Checking student: ${s.studentInfo?.ogrenciAdi}, ID: ${s.id}, TC: ${s.studentInfo?.tcKimlikNo}, OgrNo: ${s.studentInfo?.ogrenciNo}`)
            console.log(`   → ID Match: ${idMatch}, TC Match: ${tcMatch}, OgrNo Match: ${ogrenciNoMatch}`)
            
            return tcMatch || ogrenciNoMatch || idMatch
          })
        : null
      
      if (!student) {
        console.error('❌ Öğrenci bulunamadı. Aranılan ID:', studentId)
        console.error('📋 Mevcut öğrenci bilgileri:', Array.isArray(studentResults) 
          ? studentResults.slice(0, 3).map((s: any) => ({ 
              id: s.id, 
              tcKimlik: s.studentInfo?.tcKimlikNo, 
              ogrenciNo: s.studentInfo?.ogrenciNo,
              name: s.studentInfo?.ogrenciAdi 
            })) 
          : 'Veri array değil')
        throw new Error(`Öğrenci bulunamadı: ${studentId}`)
      }
      
      // Veri doğrulaması
      if (!student.optikFormId) {
        throw new Error('Optik form ID bulunamadı')
      }
      
      if (!student.studentInfo?.ogrenciNo) {
        throw new Error('Öğrenci numarası bulunamadı')
      }
      
      const requestData = {
        optikFormId: student.optikFormId,
        studentNo: student.studentInfo.ogrenciNo,  // API studentNo alanını bekliyor
        oturum: student.oturum || 'tek'
      }
      
      console.log('📤 Gönderilen student analysis verisi:', requestData)
      console.log('👤 Bulunan student verisi:', student)
      console.log('🔍 Aranan Student ID:', studentId)
      console.log('🎯 Gönderilen Student No:', requestData.studentNo)
      console.log('✅ Doğru student bulundu mu?', student.studentInfo?.ogrenciNo === studentId || student.studentInfo?.tcKimlikNo === studentId)
      
      const result = await this.request(`/api/exams/${examId}/student-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })
      console.log('✅ Student analysis alındı:', result?.studentInfo?.ogrenciAdi || 'Bilinmeyen')
      console.log('🆔 Dönen Student ID/TC:', result?.studentInfo?.tcKimlikNo || result?.studentInfo?.ogrenciNo)
      return result || null
    } catch (error: any) {
      console.error('❌ Student analysis getirme hatası:', error)
      throw error
    }
  }

  // =====================================
  // USER MANAGEMENT METHODS
  // =====================================
  
  // Get all users (only for admin)
  async getUsers(): Promise<any[]> {
    try {
      const result = await this.request('/api/users')
      return result || []
    } catch (error) {
      console.error('❌ Kullanıcılar yüklenemedi:', error)
      return []
    }
  }

  // Create new user (only for admin)
  async createUser(userData: {
    username: string
    password: string
    role: 'admin' | 'teacher' | 'student'
    name: string
    email: string
  }): Promise<any> {
    return this.request('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
  }

  // Update user (only for admin)
  async updateUser(userId: string, userData: {
    username?: string
    password?: string
    role?: 'admin' | 'teacher' | 'student'
    name?: string
    email?: string
  }): Promise<any> {
    return this.request(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
  }

  // Delete user (only for admin)
  async deleteUser(userId: string): Promise<any> {
    return this.request(`/api/users/${userId}`, {
      method: 'DELETE'
    })
  }

  // User login
  async loginUser(username: string, password: string): Promise<any> {
    return this.request('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
  }

  // =====================================
  // STUDENT MANAGEMENT METHODS
  // =====================================
  
  // Get all students
  async getStudentsForManagement(): Promise<any[]> {
    try {
      const result = await this.request('/api/students')
      console.log('API Response:', result)
      return result?.students || []
    } catch (error) {
      console.error('❌ Öğrenciler yüklenemedi:', error)
      return []
    }
  }

  // Create new student
  async createStudent(studentData: {
    studentNo: string
    fullName: string
    classLevel: string
    section: string
    parentPhone: string
  }): Promise<any> {
    return this.request('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    })
  }

  // Update student
  async updateStudent(studentId: string, studentData: {
    studentNo?: string
    fullName?: string
    classLevel?: string
    section?: string
    parentPhone?: string
  }): Promise<any> {
    return this.request(`/api/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    })
  }

  // Delete student
  async deleteStudent(studentId: string): Promise<any> {
    return this.request(`/api/students/${studentId}`, {
      method: 'DELETE'
    })
  }

  // Upload students Excel file (only for admin)
  async uploadStudentsExcel(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.request('/api/students/upload-excel', {
      method: 'POST',
      body: formData
    })
  }

  // Student login
  async loginStudent(studentNo: string, fullName: string): Promise<any> {
    const loginData = { studentNo, fullName }
    console.log('🔍 API Client Login Data:', loginData)
    console.log('🔍 JSON Body:', JSON.stringify(loginData))
    console.log('🔍 URL:', '/api/students/login')
    console.log('🔍 Full URL:', `${this.baseUrl}/api/students/login`)
    
    try {
      const response = await this.request('/api/students/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })
      console.log('✅ Login API Response:', response)
      return response
    } catch (error) {
      console.error('❌ Login API Error:', error)
      throw error
    }
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

  // Get student results by student number
  async getStudentResultsByNumber(studentNumber: string): Promise<any[]> {
    try {
      // Get all exams first
      const exams = await this.getExams()
      const studentResults: any[] = []

      // For each exam, get student results and filter by student number
      for (const exam of exams) {
        try {
          const examResults = await this.getStudentResults(exam._id)
          const studentResult = examResults.find((result: any) => 
            result.studentInfo?.ogrenciNo === studentNumber ||
            result.studentInfo?.studentNumber === studentNumber ||
            result.studentNumber === studentNumber
          )
          
          if (studentResult) {
            studentResults.push({
              ...studentResult,
              examInfo: {
                examId: exam._id,
                examName: exam.name,
                examDate: exam.createdAt,
                className: exam.className,
                subject: exam.subject
              }
            })
          }
        } catch (error) {
          console.log(`Exam ${exam._id} için sonuç bulunamadı:`, error)
        }
      }

      return studentResults
    } catch (error) {
      console.error('Öğrenci sonuçları alınamadı:', error)
      throw error
    }
  }

  // Get student exam details by student number and exam id
  async getStudentExamResult(studentNumber: string, examId: string): Promise<any | null> {
    try {
      const examResults = await this.getStudentResults(examId)
      const studentResult = examResults.find((result: any) => 
        result.studentInfo?.ogrenciNo === studentNumber ||
        result.studentInfo?.studentNumber === studentNumber ||
        result.studentNumber === studentNumber
      )
      
      return studentResult || null
    } catch (error) {
      console.error('Öğrenci sınav sonucu alınamadı:', error)
      return null
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient
