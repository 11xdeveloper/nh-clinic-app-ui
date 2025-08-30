"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BrowserMultiFormatReader, type Result, BarcodeFormat } from "@zxing/library"
import { Camera, X } from "lucide-react"
import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"

export default function ScanPage() {
  const [patientId, setPatientId] = useState("")
  const [patientData, setPatientData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const router = useRouter()

  const { data: patient, isLoading } = api.patient.getById.useQuery(
    { id: patientId },
    {
      enabled: patientId.length > 0,
      onSuccess: (data) => {
        setPatientData(data)
        setError(null)
      },
      onError: (err) => {
        setPatientData(null)
        setError(`Patient not found: ${err.message}`)
      },
    },
  )

  useEffect(() => {
    // Initialize the barcode reader
    codeReaderRef.current = new BrowserMultiFormatReader()

    return () => {
      // Clean up on unmount
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [])

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
      setError("Could not access camera. Please check permissions.")
    }
  }

  const startScanning = async () => {
    if (!codeReaderRef.current) return

    try {
      setIsScanning(true)
      setError(null)

      if (availableCameras.length === 0) {
        await loadAvailableCameras()
      }

      if (selectedCamera && videoRef.current) {
        const formats = [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.CODE_128,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.EAN_8,
        ]

        codeReaderRef.current.decodeFromVideoDevice(
          selectedCamera,
          videoRef.current,
          (result: Result | null, error: any) => {
            if (result) {
              const scannedCode = result.getText()
              setPatientId(scannedCode)
              stopScanning()
            }
            if (error && !(error instanceof TypeError)) {
              // Ignore TypeError as it's often just the scanner working
              console.error("Scanning error:", error)
            }
          },
        )
      } else {
        setError("No camera selected or available")
        setIsScanning(false)
      }
    } catch (err) {
      console.error("Error starting scanner:", err)
      setError("Failed to start scanner. Please try again.")
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    setIsScanning(false)
  }

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera(e.target.value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return `${date.toLocaleDateString()} (${diffDays} days ago)`
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Patient Scanner</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scan Patient Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="patientId">Patient ID</Label>
                  <div className="flex mt-1">
                    <Input
                      id="patientId"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="Enter or scan patient ID"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={isScanning ? stopScanning : startScanning}
                      className="ml-2 bg-transparent"
                    >
                      {isScanning ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {isScanning && (
                <div className="mt-4 space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
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

              {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

              <Button onClick={() => router.push("/dashboard/patients")} variant="outline" className="w-full mt-2">
                View All Patients
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded animate-pulse"></div>
              </div>
            ) : patientData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{patientData.name}</h3>
                  <Badge>{patientData.id}</Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Card Number</p>
                    <p>{patientData.cardNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p>{patientData.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{patientData.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC</p>
                    <p>{patientData.cnic}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Last Visit</p>
                  <p>{formatDate(patientData.lastVisitDate)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="whitespace-pre-wrap">{patientData.comments}</p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => router.push(`/dashboard/patients?edit=${patientData.id}`)}>
                    Edit Patient
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {patientId ? "No patient found with this ID" : "Scan or enter a patient ID to view their information"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
