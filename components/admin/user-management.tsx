"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Edit, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"

interface User {
  _id: string
  username: string
  role: string
  name: string
  email: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "teacher" as "teacher" | "admin" | "student"
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await apiClient.getUsers()
      setUsers(usersData)
      console.log('✅ Kullanıcılar yüklendi:', usersData.length)
    } catch (error) {
      console.error('❌ Kullanıcılar yüklenemedi:', error)
      setError('Kullanıcılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.password || !formData.name || !formData.email) {
      setError("Tüm alanlar zorunludur")
      return
    }

    try {
      setLoading(true)
      await apiClient.createUser(formData)
      setSuccess("Kullanıcı başarıyla oluşturuldu")
      setShowCreateModal(false)
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('❌ Kullanıcı oluşturulamadı:', error)
      setError('Kullanıcı oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "teacher" as "teacher" | "admin" | "student"
    })
    setError("")
    setSuccess("")
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Kullanıcılar ({users.length})
            </CardTitle>
            <Button onClick={openCreateModal} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Kullanıcılar yükleniyor...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Henüz kullanıcı bulunmamaktadır.</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                      {user.role === 'admin' ? 'Müdür' : 'Öğretmen'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Ad Soyad</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ad ve soyadı girin"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-username">Kullanıcı Adı</Label>
              <Input
                id="create-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Kullanıcı adını girin"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email adresini girin"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-password">Şifre</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Şifre girin"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "teacher" | "admin" | "student") => 
                  setFormData({ ...formData, role: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Öğretmen</SelectItem>
                  <SelectItem value="admin">Müdür</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
