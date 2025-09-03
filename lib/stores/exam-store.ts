import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Subject {
  id: string
  name: string
  questionCount: number
}

export interface ExamDefinition {
  id: string
  name: string
  date: string
  classLevel: string
  subjects: Subject[]
  createdBy: string
  createdAt: string
}

export interface QuestionMapping {
  questionNumber: number
  topic: string
  correctAnswer: string
  subject: string
}

export interface ExamBooklet {
  examId: string
  questions: QuestionMapping[]
  uploadedAt: string
  uploadedBy: string
}

export interface StudentResult {
  id: string
  examId: string
  studentId: string
  studentName: string
  answers: Record<number, string>
  score: number
  totalQuestions: number
  subjectScores: Record<string, { correct: number; total: number }>
  topicScores: Record<string, { correct: number; total: number }>
  completedAt: string
}

interface ExamState {
  exams: ExamDefinition[]
  booklets: ExamBooklet[]
  results: StudentResult[]
  addExam: (exam: Omit<ExamDefinition, "id" | "createdAt">) => void
  addBooklet: (booklet: Omit<ExamBooklet, "uploadedAt">) => void
  addResult: (result: Omit<StudentResult, "id">) => void
  getExamById: (id: string) => ExamDefinition | undefined
  getBookletByExamId: (examId: string) => ExamBooklet | undefined
  getResultsByStudentId: (studentId: string) => StudentResult[]
  getResultsByExamId: (examId: string) => StudentResult[]
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      exams: [
        {
          id: "exam-1",
          name: "2024 Matematik Ara Sınavı",
          date: "2024-01-15",
          classLevel: "9. Sınıf",
          subjects: [
            { id: "math-1", name: "Cebir", questionCount: 25 },
            { id: "math-2", name: "Geometri", questionCount: 20 },
            { id: "math-3", name: "Fonksiyonlar", questionCount: 15 },
          ],
          createdBy: "1",
          createdAt: "2024-01-01T10:00:00Z",
        },
        {
          id: "exam-2",
          name: "2024 Fen Bilimleri Genel Sınavı",
          date: "2024-02-10",
          classLevel: "10. Sınıf",
          subjects: [
            { id: "sci-1", name: "Fizik", questionCount: 20 },
            { id: "sci-2", name: "Kimya", questionCount: 20 },
            { id: "sci-3", name: "Biyoloji", questionCount: 20 },
          ],
          createdBy: "1",
          createdAt: "2024-01-05T10:00:00Z",
        },
        {
          id: "exam-3",
          name: "2024 Türkçe ve Edebiyat Sınavı",
          date: "2024-02-20",
          classLevel: "11. Sınıf",
          subjects: [
            { id: "tr-1", name: "Dil Bilgisi", questionCount: 15 },
            { id: "tr-2", name: "Edebiyat", questionCount: 20 },
            { id: "tr-3", name: "Kompozisyon", questionCount: 10 },
          ],
          createdBy: "1",
          createdAt: "2024-01-10T10:00:00Z",
        },
        {
          id: "exam-4",
          name: "2024 İngilizce Yeterlilik Sınavı",
          date: "2024-03-05",
          classLevel: "12. Sınıf",
          subjects: [
            { id: "eng-1", name: "Grammar", questionCount: 25 },
            { id: "eng-2", name: "Vocabulary", questionCount: 20 },
            { id: "eng-3", name: "Reading", questionCount: 15 },
          ],
          createdBy: "1",
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          id: "exam-5",
          name: "2024 Tarih ve Coğrafya Sınavı",
          date: "2024-03-15",
          classLevel: "9. Sınıf",
          subjects: [
            { id: "hist-1", name: "Tarih", questionCount: 30 },
            { id: "geo-1", name: "Coğrafya", questionCount: 25 },
          ],
          createdBy: "1",
          createdAt: "2024-01-20T10:00:00Z",
        },
      ],
      booklets: [
        {
          examId: "exam-1",
          questions: [
            { questionNumber: 1, topic: "Doğrusal Denklemler", correctAnswer: "A", subject: "Cebir" },
            { questionNumber: 2, topic: "İkinci Dereceden Denklemler", correctAnswer: "B", subject: "Cebir" },
            { questionNumber: 3, topic: "Eşitsizlikler", correctAnswer: "C", subject: "Cebir" },
            { questionNumber: 4, topic: "Fonksiyon Kavramı", correctAnswer: "D", subject: "Fonksiyonlar" },
            { questionNumber: 5, topic: "Doğrusal Fonksiyonlar", correctAnswer: "A", subject: "Fonksiyonlar" },
            { questionNumber: 6, topic: "Üçgenler", correctAnswer: "B", subject: "Geometri" },
            { questionNumber: 7, topic: "Dörtgenler", correctAnswer: "C", subject: "Geometri" },
            { questionNumber: 8, topic: "Çember", correctAnswer: "D", subject: "Geometri" },
            { questionNumber: 9, topic: "Alan Hesaplamaları", correctAnswer: "A", subject: "Geometri" },
            { questionNumber: 10, topic: "Hacim Hesaplamaları", correctAnswer: "B", subject: "Geometri" },
          ],
          uploadedAt: "2024-01-02T10:00:00Z",
          uploadedBy: "1",
        },
        {
          examId: "exam-2",
          questions: [
            { questionNumber: 1, topic: "Hareket", correctAnswer: "A", subject: "Fizik" },
            { questionNumber: 2, topic: "Kuvvet", correctAnswer: "B", subject: "Fizik" },
            { questionNumber: 3, topic: "Enerji", correctAnswer: "C", subject: "Fizik" },
            { questionNumber: 4, topic: "Atomun Yapısı", correctAnswer: "D", subject: "Kimya" },
            { questionNumber: 5, topic: "Periyodik Tablo", correctAnswer: "A", subject: "Kimya" },
            { questionNumber: 6, topic: "Hücre", correctAnswer: "B", subject: "Biyoloji" },
            { questionNumber: 7, topic: "Genetik", correctAnswer: "C", subject: "Biyoloji" },
            { questionNumber: 8, topic: "Ekoloji", correctAnswer: "D", subject: "Biyoloji" },
          ],
          uploadedAt: "2024-01-06T10:00:00Z",
          uploadedBy: "1",
        },
      ],
      results: [
        {
          id: "result-1",
          examId: "exam-1",
          studentId: "3",
          studentName: "Ayşe Demir",
          answers: { 1: "A", 2: "B", 3: "A", 4: "D", 5: "A", 6: "B", 7: "C", 8: "A", 9: "A", 10: "B" },
          score: 8,
          totalQuestions: 10,
          subjectScores: {
            Cebir: { correct: 2, total: 3 },
            Fonksiyonlar: { correct: 2, total: 2 },
            Geometri: { correct: 4, total: 5 },
          },
          topicScores: {
            "Doğrusal Denklemler": { correct: 1, total: 1 },
            "İkinci Dereceden Denklemler": { correct: 1, total: 1 },
            Eşitsizlikler: { correct: 0, total: 1 },
            "Fonksiyon Kavramı": { correct: 1, total: 1 },
            "Doğrusal Fonksiyonlar": { correct: 1, total: 1 },
            Üçgenler: { correct: 1, total: 1 },
            Dörtgenler: { correct: 1, total: 1 },
            Çember: { correct: 0, total: 1 },
            "Alan Hesaplamaları": { correct: 1, total: 1 },
            "Hacim Hesaplamaları": { correct: 1, total: 1 },
          },
          completedAt: "2024-01-15T14:30:00Z",
        },
        {
          id: "result-2",
          examId: "exam-1",
          studentId: "4",
          studentName: "Mehmet Kaya",
          answers: { 1: "A", 2: "B", 3: "C", 4: "D", 5: "B", 6: "B", 7: "C", 8: "D", 9: "A", 10: "B" },
          score: 9,
          totalQuestions: 10,
          subjectScores: {
            Cebir: { correct: 3, total: 3 },
            Fonksiyonlar: { correct: 1, total: 2 },
            Geometri: { correct: 5, total: 5 },
          },
          topicScores: {
            "Doğrusal Denklemler": { correct: 1, total: 1 },
            "İkinci Dereceden Denklemler": { correct: 1, total: 1 },
            Eşitsizlikler: { correct: 1, total: 1 },
            "Fonksiyon Kavramı": { correct: 1, total: 1 },
            "Doğrusal Fonksiyonlar": { correct: 0, total: 1 },
            Üçgenler: { correct: 1, total: 1 },
            Dörtgenler: { correct: 1, total: 1 },
            Çember: { correct: 1, total: 1 },
            "Alan Hesaplamaları": { correct: 1, total: 1 },
            "Hacim Hesaplamaları": { correct: 1, total: 1 },
          },
          completedAt: "2024-01-15T14:45:00Z",
        },
        {
          id: "result-3",
          examId: "exam-2",
          studentId: "3",
          studentName: "Ayşe Demir",
          answers: { 1: "A", 2: "B", 3: "C", 4: "D", 5: "A", 6: "B", 7: "C", 8: "D" },
          score: 8,
          totalQuestions: 8,
          subjectScores: {
            Fizik: { correct: 3, total: 3 },
            Kimya: { correct: 2, total: 2 },
            Biyoloji: { correct: 3, total: 3 },
          },
          topicScores: {
            Hareket: { correct: 1, total: 1 },
            Kuvvet: { correct: 1, total: 1 },
            Enerji: { correct: 1, total: 1 },
            "Atomun Yapısı": { correct: 1, total: 1 },
            "Periyodik Tablo": { correct: 1, total: 1 },
            Hücre: { correct: 1, total: 1 },
            Genetik: { correct: 1, total: 1 },
            Ekoloji: { correct: 1, total: 1 },
          },
          completedAt: "2024-02-10T15:00:00Z",
        },
        {
          id: "result-4",
          examId: "exam-2",
          studentId: "4",
          studentName: "Mehmet Kaya",
          answers: { 1: "A", 2: "A", 3: "C", 4: "D", 5: "A", 6: "A", 7: "C", 8: "D" },
          score: 6,
          totalQuestions: 8,
          subjectScores: {
            Fizik: { correct: 2, total: 3 },
            Kimya: { correct: 2, total: 2 },
            Biyoloji: { correct: 2, total: 3 },
          },
          topicScores: {
            Hareket: { correct: 1, total: 1 },
            Kuvvet: { correct: 0, total: 1 },
            Enerji: { correct: 1, total: 1 },
            "Atomun Yapısı": { correct: 1, total: 1 },
            "Periyodik Tablo": { correct: 1, total: 1 },
            Hücre: { correct: 0, total: 1 },
            Genetik: { correct: 1, total: 1 },
            Ekoloji: { correct: 1, total: 1 },
          },
          completedAt: "2024-02-10T15:15:00Z",
        },
        {
          id: "result-5",
          examId: "exam-1",
          studentId: "student-5",
          studentName: "Zeynep Yılmaz",
          answers: { 1: "A", 2: "B", 3: "C", 4: "D", 5: "A", 6: "B", 7: "C", 8: "D", 9: "A", 10: "B" },
          score: 10,
          totalQuestions: 10,
          subjectScores: {
            Cebir: { correct: 3, total: 3 },
            Fonksiyonlar: { correct: 2, total: 2 },
            Geometri: { correct: 5, total: 5 },
          },
          topicScores: {
            "Doğrusal Denklemler": { correct: 1, total: 1 },
            "İkinci Dereceden Denklemler": { correct: 1, total: 1 },
            Eşitsizlikler: { correct: 1, total: 1 },
            "Fonksiyon Kavramı": { correct: 1, total: 1 },
            "Doğrusal Fonksiyonlar": { correct: 1, total: 1 },
            Üçgenler: { correct: 1, total: 1 },
            Dörtgenler: { correct: 1, total: 1 },
            Çember: { correct: 1, total: 1 },
            "Alan Hesaplamaları": { correct: 1, total: 1 },
            "Hacim Hesaplamaları": { correct: 1, total: 1 },
          },
          completedAt: "2024-01-15T15:00:00Z",
        },
        {
          id: "result-6",
          examId: "exam-1",
          studentId: "student-6",
          studentName: "Can Özkan",
          answers: { 1: "B", 2: "A", 3: "C", 4: "D", 5: "A", 6: "A", 7: "C", 8: "D", 9: "B", 10: "A" },
          score: 5,
          totalQuestions: 10,
          subjectScores: {
            Cebir: { correct: 1, total: 3 },
            Fonksiyonlar: { correct: 2, total: 2 },
            Geometri: { correct: 2, total: 5 },
          },
          topicScores: {
            "Doğrusal Denklemler": { correct: 0, total: 1 },
            "İkinci Dereceden Denklemler": { correct: 0, total: 1 },
            Eşitsizlikler: { correct: 1, total: 1 },
            "Fonksiyon Kavramı": { correct: 1, total: 1 },
            "Doğrusal Fonksiyonlar": { correct: 1, total: 1 },
            Üçgenler: { correct: 0, total: 1 },
            Dörtgenler: { correct: 1, total: 1 },
            Çember: { correct: 1, total: 1 },
            "Alan Hesaplamaları": { correct: 0, total: 1 },
            "Hacim Hesaplamaları": { correct: 0, total: 1 },
          },
          completedAt: "2024-01-15T15:30:00Z",
        },
      ],
      addExam: (examData) => {
        const exam: ExamDefinition = {
          ...examData,
          id: `exam-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ exams: [...state.exams, exam] }))
      },
      addBooklet: (bookletData) => {
        const booklet: ExamBooklet = {
          ...bookletData,
          uploadedAt: new Date().toISOString(),
        }
        set((state) => ({ booklets: [...state.booklets, booklet] }))
      },
      addResult: (resultData) => {
        const result: StudentResult = {
          ...resultData,
          id: `result-${Date.now()}`,
        }
        set((state) => ({ results: [...state.results, result] }))
      },
      getExamById: (id) => get().exams.find((exam) => exam.id === id),
      getBookletByExamId: (examId) => get().booklets.find((booklet) => booklet.examId === examId),
      getResultsByStudentId: (studentId) => get().results.filter((result) => result.studentId === studentId),
      getResultsByExamId: (examId) => get().results.filter((result) => result.examId === examId),
    }),
    {
      name: "exam-storage",
    },
  ),
)
