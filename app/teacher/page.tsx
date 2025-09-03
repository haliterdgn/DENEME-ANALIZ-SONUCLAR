"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import Navbar from "@/components/layout/navbar"
import TeacherDashboard from "@/components/teacher/teacher-dashboard"

export default function TeacherPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "teacher") {
      router.push("/")
    }
  }, [user, router])

  if (!user || user.role !== "teacher") {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TeacherDashboard />
    </div>
  )
}
