import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  id: string
  username: string
  role: "admin" | "teacher" | "student"
  name: string
  email?: string
  classId?: string
}

interface AuthState {
  user: User | null
  login: (username: string, password: string, role: string) => boolean
  setUser: (user: User) => void
  logout: () => void
}

// Mock users database
const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: {
      id: "1",
      username: "admin",
      role: "admin",
      name: "Sistem Yöneticisi",
      email: "admin@okul.edu.tr",
    },
  },
  teacher1: {
    password: "teacher123",
    user: {
      id: "2",
      username: "teacher1",
      role: "teacher",
      name: "Ahmet Yılmaz",
      email: "ahmet.yilmaz@okul.edu.tr",
    },
  },
  student1: {
    password: "student123",
    user: {
      id: "3",
      username: "student1",
      role: "student",
      name: "Ayşe Demir",
      email: "ayse.demir@okul.edu.tr",
      classId: "class-1",
    },
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (username, password, role) => {
        const userRecord = mockUsers[username]
        if (userRecord && userRecord.password === password && userRecord.user.role === role) {
          set({ user: userRecord.user })
          return true
        }
        return false
      },
      setUser: (user: User) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
)
