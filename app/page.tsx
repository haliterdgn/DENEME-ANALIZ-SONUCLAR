"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import LoginForm from "@/components/auth/login-form"

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          router.push("/admin")
          break
        case "teacher":
          router.push("/teacher")
          break
        case "student":
          router.push("/student")
          break
      }
    }
  }, [user, router])

  if (user) {
    return <div className="flex items-center justify-center min-h-screen">Yönlendiriliyor...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sınav Yönetim Sistemi</h1>
          <p className="text-gray-600">Panele erişmek için giriş yapın</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
