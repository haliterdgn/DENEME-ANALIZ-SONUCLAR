"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, FileText, Eye, Plus, Calendar, Hash, Users } from "lucide-react"
import { useOptikFormStore } from "@/lib/stores/optik-form-store"
import { useExamStore } from "@/lib/stores/exam-store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function OptikFormList() {
  const { optikForms, deleteOptikForm } = useOptikFormStore()
  const { deleteOptikForm: deleteFromAPI, getOptikForms } = useExamStore()
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [apiOptikForms, setApiOptikForms] = useState<any[]>([])
  const [success, setSuccess] = useState(false)
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    fetchOptikForms()
  }, [])

  const fetchOptikForms = async () => {
    try {
      const forms = await getOptikForms()
      setApiOptikForms(forms || [])
    } catch (error) {
      console.warn('API optik formları getirilemedi, offline mode:', error)
      setApiOptikForms([])
    }
  }

  const handleDelete = async (id: string, isLocal: boolean = false) => {
    setDeletingId(id)
    setLoading(true)
    
    try {
      if (isLocal) {
        // Local storage'dan sil
        deleteOptikForm(id)
      } else {
        // API'dan sil
        await deleteFromAPI(id)
        await fetchOptikForms() // Listeyi yenile
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Silme hatası:', error)
    } finally {
      setLoading(false)
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const totalSubjects = (subjects: any[]) => {
    return subjects?.length || 0
  }

  const totalQuestions = (subjects: any[]) => {
    if (!subjects) return 0
    return subjects.reduce((total, subject) => {
      const questionCount = subject.questionCount || subject.soruSayisi || 0
      return total + questionCount
    }, 0)
  }

  const handleViewDetails = (form: any) => {
    setSelectedForm(form)
    setIsDetailModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optik Form Listesi</h1>
            <p className="text-gray-600">Oluşturulmuş optik formları görüntüleyin ve yönetin</p>
          </div>
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <FileText className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Optik form başarıyla silindi!
          </AlertDescription>
        </Alert>
      )}

      {/* API'dan Gelen Formlar */}
      {apiOptikForms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-500">
                API
              </Badge>
              Sunucudaki Optik Formlar ({apiOptikForms.length})
            </CardTitle>
            <CardDescription>
              Backend sunucusunda kayıtlı optik formlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Adı</TableHead>
                    <TableHead>Form Kodu</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        Dersler
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Hash className="h-4 w-4" />
                        Sorular
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Oluşturma
                      </div>
                    </TableHead>
                    <TableHead className="text-center">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiOptikForms.map((form) => (
                    <TableRow key={form._id || form.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          {form.formAdi}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{form.formKodu}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {totalSubjects(form.subjects)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {totalQuestions(form.subjects)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {formatDate(form.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(form)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loading && deletingId === (form._id || form.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Optik Formu Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{form.formAdi}</strong> adlı optik formu silmek istediğinizden emin misiniz? 
                                  Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(form._id || form.id, false)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Local Storage'daki Formlar */}
      {optikForms.length > 0 && (
        <>
          {apiOptikForms.length > 0 && <Separator />}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  LOCAL
                </Badge>
                Yerel Optik Formlar ({optikForms.length})
              </CardTitle>
              <CardDescription>
                Offline modda oluşturulan formlar (senkronizasyon bekleniyor)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Adı</TableHead>
                      <TableHead>Form Kodu</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4" />
                          Dersler
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Hash className="h-4 w-4" />
                          Sorular
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Oluşturma
                        </div>
                      </TableHead>
                      <TableHead className="text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optikForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-orange-500" />
                            {form.formAdi}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            {form.formKodu}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {totalSubjects(form.subjects)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {totalQuestions(form.subjects)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">
                          {formatDate(form.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(form)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={loading && deletingId === form.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Optik Formu Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <strong>{form.formAdi}</strong> adlı optik formu silmek istediğinizden emin misiniz? 
                                    Bu işlem geri alınamaz.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(form.id, true)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Boş Durum */}
      {optikForms.length === 0 && apiOptikForms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Henüz optik form oluşturulmamış
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Sınavlarınız için optik okuma formları oluşturmaya başlayın. 
              İlk optik formunuzu oluşturmak için aşağıdaki butona tıklayın.
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              İlk Optik Formunu Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Optik Form Detay Modalı */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Optik Form Detayları
            </DialogTitle>
            <DialogDescription>
              {selectedForm?.formAdi} - {selectedForm?.formKodu}
            </DialogDescription>
          </DialogHeader>
          
          {selectedForm && (
            <div className="space-y-6">
              {/* Form Genel Bilgileri */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Form Adı</h4>
                  <p className="font-semibold">{selectedForm.formAdi}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Form Kodu</h4>
                  <p className="font-semibold">{selectedForm.formKodu}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Toplam Ders</h4>
                  <p className="font-semibold">{totalSubjects(selectedForm.subjects)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Toplam Soru</h4>
                  <p className="font-semibold">{totalQuestions(selectedForm.subjects)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Oluşturma Tarihi</h4>
                  <p className="font-semibold">{formatDate(selectedForm.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Kaynak</h4>
                  <div className="font-semibold">
                    {selectedForm._id ? 
                      <Badge className="bg-blue-100 text-blue-800">Sunucu</Badge> : 
                      <Badge className="bg-orange-100 text-orange-800">Yerel</Badge>
                    }
                  </div>
                </div>
              </div>

              {/* Ders Detayları */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ders Bilgileri
                </h3>
                
                {selectedForm.subjects && selectedForm.subjects.length > 0 ? (
                  <div className="space-y-3">
                    {selectedForm.subjects.map((subject: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-600">Ders Adı</h4>
                            <p className="font-semibold">{subject.name || subject.subjectName || '-'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-600">Soru Sayısı</h4>
                            <p className="font-semibold">{subject.questionCount || subject.soruSayisi || '-'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-600">Başlangıç</h4>
                            <p className="font-semibold">{subject.startPosition || subject.start || '-'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-600">Bitiş</h4>
                            <p className="font-semibold">
                              {subject.endPosition || 
                               subject.end || 
                               (subject.start && subject.soruSayisi ? 
                                 (parseInt(subject.start) + parseInt(subject.soruSayisi) - 1) : 
                                 '-'
                               )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Ders bilgisi bulunmuyor</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
