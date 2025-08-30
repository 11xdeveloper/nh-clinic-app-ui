"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Camera, Search, Plus, Edit, Trash2, X } from "lucide-react"
import { api } from "@/trpc/react"
import { BrowserMultiFormatReader, type Result, BarcodeFormat } from "@zxing/library"

export default function PatientsPage() {
  const searchParams = useSearchParams()
  const editPatientId = searchParams.get("edit")

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPatient, setCurrentPatient] = useState<any>(null)
  const [formData, setFormData] = useState({
    id: "",
    cardNumber: "",
    name: "",
    age: "",
    phoneNumber: "",
    cnic: "",
    comments: "",
  })

  // Barcode scanner state
  const [isScanning, setIsScanning] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null)

  // Get all patients
  const { data: patients, isLoading, refetch } = api.patient.getAll.useQuery()

  // Create patient mutation
  const createPatient = api.patient.create.useMutation({
    onSuccess: () => {
      refetch()
      setIsAddDialogOpen(false)
      resetForm()
    },
  })

  // Update patient mutation
  const updatePatient = api.patient.update.useMutation({
    onSuccess: () => {
      refetch()
      setIsEditDialogOpen(false)
      resetForm()
    },
  })

  // Delete patient mutation
  const deletePatient = api.patient.delete.useMutation({
    onSuccess: () => {
      refetch()
      setIsDeleteDialogOpen(false)
    },
  })

  // Initialize barcode reader
  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    setCodeReader(reader)

    return () => {
      reader.reset()
    }
  }, [])

  // Handle edit patient from URL param
  useEffect(() => {
    if (editPatientId && patients) {
      const patient = patients.find((p) => p.id === editPatientId)
      if (patient) {
        handleEditPatient(patient)
      }
    }
  }, [editPatientId, patients])

  const resetForm = () => {
    setFormData({
      id: "",
      cardNumber: "",
      name: "",
      age: "",
      phoneNumber: "",
      cnic: "",
      comments: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddPatient = () => {
    createPatient.mutate({
      id: formData.id,
      cardNumber: formData.cardNumber,
      name: formData.name,
      age: Number.parseInt(formData.age) || 0,
      phoneNumber: formData.phoneNumber,
      cnic: formData.cnic,
      comments: formData.comments,
    })
  }

  const handleEditPatient = (patient: any) => {
    setCurrentPatient(patient)
    setFormData({
      id: patient.id,
      cardNumber: patient.cardNumber,
      name: patient.name,
      age: patient.age.toString(),
      phoneNumber: patient.phoneNumber,
      cnic: patient.cnic,
      comments: patient.comments,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdatePatient = () => {
    updatePatient.mutate({
      id: currentPatient.id,
      cardNumber: formData.cardNumber,
      name: formData.name,
      age: Number.parseInt(formData.age) || 0,
      phoneNumber: formData.phoneNumber,
      cnic: formData.cnic,
      comments: formData.comments,
    })
  }

  const handleDeleteClick = (patient: any) => {
    setCurrentPatient(patient)
    setIsDeleteDialogOpen(true)
  }

  const handleDeletePatient = () => {
    if (currentPatient) {
      deletePatient.mutate({ id: currentPatient.id })
    }
  }

  const filteredPatients = patients?.filter((patient) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      patient.id.toLowerCase().includes(query) ||
      patient.name.toLowerCase().includes(query) ||
      patient.cardNumber.toLowerCase().includes(query) ||
      patient.phoneNumber.toLowerCase().includes(query) ||
      patient.cnic.toLowerCase().includes(query)
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return `${date.toLocaleDateString()} (${diffDays} days ago)`
  }

  // Barcode scanning functions
  const loadAvailableCameras = async () => {
    try {
      // First request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      // Stop the stream immediately, we just needed it for permissions
      stream.getTracks().forEach((track) => track.stop())

      // Now list available devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      setAvailableCameras(videoDevices)

      // Try to select the back camera by default (usually better for scanning)
      const backCamera = videoDevices.find(
        (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear"),
      )

      if (backCamera) {
        setSelectedCamera(backCamera.deviceId)
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  const startScanning = async () => {
    if (!codeReader) return

    try {
      setIsScanning(true)

      if (availableCameras.length === 0) {
        await loadAvailableCameras()
      }

      if (selectedCamera && videoRef) {
        const formats = [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.CODE_128,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.EAN_8,
        ]

        codeReader.decodeFromVideoDevice(selectedCamera, videoRef, (result: Result | null, error: any) => {
          if (result) {
            const scannedCode = result.getText()
            setFormData((prev) => ({ ...prev, id: scannedCode }))
            stopScanning()
          }
          if (error && !(error instanceof TypeError)) {
            // Ignore TypeError as it's often just the scanner working
            console.error("Scanning error:", error)
          }
        })
      }
    } catch (err) {
      console.error("Error starting scanner:", err)
      stopScanning()
    }
  }

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset()
    }
    setIsScanning(false)
  }

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(e.target.value)
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Patients</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] z-50">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="id" className="text-right">
                    Patient ID
                  </Label>
                  <div className="col-span-3 flex">
                    <Input id="id" name="id" value={formData.id} onChange={handleInputChange} className="flex-1" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={isScanning ? stopScanning : startScanning}
                      className="ml-2 bg-transparent"
                      type="button"
                    >
                      {isScanning ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {isScanning && (
                  <div className="col-span-4 space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden z-[60]">
                      <video ref={(ref) => setVideoRef(ref)} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-white/50 rounded-lg pointer-events-none"></div>
                    </div>

                    {availableCameras.length > 1 && (
                      <div>
                        <Label htmlFor="camera-select">Select Camera</Label>
                        <select
                          id="camera-select"
                          value={selectedCamera || ""}
                          onChange={handleCameraChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                        >
                          {availableCameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Camera ${camera.deviceId.slice(0, 5)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <Button onClick={stopScanning} variant="destructive" className="w-full">
                      Cancel Scanning
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cardNumber" className="text-right">
                    Card Number
                  </Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right">
                    Age
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phoneNumber" className="text-right">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cnic" className="text-right">
                    CNIC
                  </Label>
                  <Input
                    id="cnic"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comments" className="text-right">
                    Comments
                  </Label>
                  <Textarea
                    id="comments"
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPatient} disabled={createPatient.isLoading}>
                  {createPatient.isLoading ? "Adding..." : "Add Patient"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            {filteredPatients
              ? `Showing ${filteredPatients.length} of ${patients?.length} patients`
              : "Loading patients..."}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Card Number</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading patients...
                    </TableCell>
                  </TableRow>
                ) : filteredPatients && filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <Badge variant="outline">{patient.id}</Badge>
                      </TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.cardNumber}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>{patient.phoneNumber}</TableCell>
                      <TableCell>{formatDate(patient.lastVisitDate)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditPatient(patient)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(patient)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-id" className="text-right">
                Patient ID
              </Label>
              <Input id="edit-id" value={formData.id} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cardNumber" className="text-right">
                Card Number
              </Label>
              <Input
                id="edit-cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-age" className="text-right">
                Age
              </Label>
              <Input
                id="edit-age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phoneNumber" className="text-right">
                Phone Number
              </Label>
              <Input
                id="edit-phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cnic" className="text-right">
                CNIC
              </Label>
              <Input
                id="edit-cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-comments" className="text-right">
                Comments
              </Label>
              <Textarea
                id="edit-comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePatient} disabled={updatePatient.isLoading}>
              {updatePatient.isLoading ? "Updating..." : "Update Patient"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the patient record for <strong>{currentPatient?.name}</strong>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} disabled={deletePatient.isLoading}>
              {deletePatient.isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
