"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import Navbar from "@/components/layout/navbar"
import StudentDashboard from "@/components/student/student-dashboard"

export default function StudentPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "student") {
      router.push("/")
    }
  }, [user, router])

  if (!user || user.role !== "student") {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <StudentDashboard />
    </div>
  )
}
