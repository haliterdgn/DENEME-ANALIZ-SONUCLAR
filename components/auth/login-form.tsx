"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginFormData {
  username: string
  password: string
  role: "admin" | "teacher" | "student"
}

export default function LoginForm() {
  const [error, setError] = useState("")
  const { login } = useAuthStore()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>()

  const selectedRole = watch("role")

  const onSubmit = (data: LoginFormData) => {
    const success = login(data.username, data.password, data.role)
    if (!success) {
      setError("Geçersiz bilgiler. Lütfen tekrar deneyin.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giriş Yap</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select onValueChange={(value) => setValue("role", value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Rolünüzü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">👑 Yönetici (Müdür)</SelectItem>
                <SelectItem value="teacher">👩‍🏫 Öğretmen</SelectItem>
                <SelectItem value="student">🧑‍🎓 Öğrenci</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              {...register("username", { required: "Kullanıcı adı gereklidir" })}
              placeholder="Kullanıcı adınızı girin"
            />
            {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              {...register("password", { required: "Şifre gereklidir" })}
              placeholder="Şifrenizi girin"
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={!selectedRole}>
            Giriş Yap
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Demo Giriş Bilgileri:</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Yönetici:</strong> admin / admin123
            </p>
            <p>
              <strong>Öğretmen:</strong> teacher1 / teacher123
            </p>
            <p>
              <strong>Öğrenci:</strong> student1 / student123
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
