import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "./auth-store"

interface UserState {
  users: User[]
  addUser: (user: Omit<User, "id">) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  getUsersByRole: (role: string) => User[]
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [
        {
          id: "1",
          username: "admin",
          role: "admin",
          name: "Sistem Yöneticisi",
          email: "admin@okul.edu.tr",
        },
        {
          id: "2",
          username: "teacher1",
          role: "teacher",
          name: "Ahmet Yılmaz",
          email: "ahmet.yilmaz@okul.edu.tr",
        },
        {
          id: "3",
          username: "student1",
          role: "student",
          name: "Ayşe Demir",
          email: "ayse.demir@okul.edu.tr",
          classId: "9A",
        },
        {
          id: "4",
          username: "student2",
          role: "student",
          name: "Mehmet Kaya",
          email: "mehmet.kaya@okul.edu.tr",
          classId: "9A",
        },
        {
          id: "student-5",
          username: "student3",
          role: "student",
          name: "Zeynep Yılmaz",
          email: "zeynep.yilmaz@okul.edu.tr",
          classId: "9B",
        },
        {
          id: "student-6",
          username: "student4",
          role: "student",
          name: "Can Özkan",
          email: "can.ozkan@okul.edu.tr",
          classId: "9B",
        },
        {
          id: "teacher-2",
          username: "teacher2",
          role: "teacher",
          name: "Fatma Şahin",
          email: "fatma.sahin@okul.edu.tr",
        },
        {
          id: "teacher-3",
          username: "teacher3",
          role: "teacher",
          name: "Mustafa Çelik",
          email: "mustafa.celik@okul.edu.tr",
        },
        {
          id: "student-7",
          username: "student5",
          role: "student",
          name: "Elif Arslan",
          email: "elif.arslan@okul.edu.tr",
          classId: "10A",
        },
        {
          id: "student-8",
          username: "student6",
          role: "student",
          name: "Burak Koç",
          email: "burak.koc@okul.edu.tr",
          classId: "10A",
        },
        {
          id: "student-9",
          username: "student7",
          role: "student",
          name: "Selin Aydın",
          email: "selin.aydin@okul.edu.tr",
          classId: "11A",
        },
        {
          id: "student-10",
          username: "student8",
          role: "student",
          name: "Emre Güneş",
          email: "emre.gunes@okul.edu.tr",
          classId: "12A",
        },
      ],
      addUser: (userData) => {
        const user: User = {
          ...userData,
          id: `user-${Date.now()}`,
        }
        set((state) => ({ users: [...state.users, user] }))
      },
      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
        }))
      },
      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }))
      },
      getUsersByRole: (role) => get().users.filter((user) => user.role === role),
    }),
    {
      name: "user-storage",
    },
  ),
)
