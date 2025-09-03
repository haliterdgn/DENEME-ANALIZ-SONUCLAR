"use client"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return "👑"
      case "teacher":
        return "👩‍🏫"
      case "student":
        return "🧑‍🎓"
      default:
        return "👤"
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "yönetici"
      case "teacher":
        return "öğretmen"
      case "student":
        return "öğrenci"
      default:
        return "kullanıcı"
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Sınav Yönetim Sistemi</h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getRoleIcon(user.role)}</span>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-gray-500 capitalize">{getRoleName(user.role)}</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Çıkış Yap</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
