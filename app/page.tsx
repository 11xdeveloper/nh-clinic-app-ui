"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Alert, AlertDescription } from "components/ui/alert";
import { Badge } from "components/ui/badge";
import { Separator } from "components/ui/separator";
import {
  Camera,
  Square,
  CheckCircle,
  User,
  Phone,
  Calendar,
  FileText,
  CreditCard,
  Hash,
  AlertCircle,
} from "lucide-react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import type { Patient } from "@prisma/client";
import { findPatient } from "lib/actions";

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const daysSinceLastVisit = (date: Date) => {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function PatientCardSystem() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    [],
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [showCameraSelection, setShowCameraSelection] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    loadAvailableCameras();
  }, []);

  const loadAvailableCameras = async () => {
    try {
      if (!codeReader.current) return;

      // First request camera permission
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permissionError) {
        console.error("Camera permission denied:", permissionError);
        setError(
          "Camera access denied. Please allow camera access and refresh the page.",
        );
        return;
      }

      // Now we can list the devices after permission is granted
      const videoInputDevices =
        await codeReader.current.listVideoInputDevices();

      // Stop the permission stream since we just needed it for permission
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setAvailableCameras(videoInputDevices);

      if (videoInputDevices.length > 1) {
        setShowCameraSelection(true);
        // Default to back camera if available, otherwise first camera
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear"),
        );
        setSelectedCameraId(
          backCamera?.deviceId || videoInputDevices[0]!.deviceId,
        );
      } else if (videoInputDevices.length === 1) {
        setSelectedCameraId(videoInputDevices[0]!.deviceId);
        setShowCameraSelection(false);
      } else {
        setError("No camera devices found");
      }
    } catch (err) {
      console.error("Error loading cameras:", err);
      setError(
        "Failed to load camera devices. Please check your camera permissions.",
      );
    }
  };

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setError("");
      setScannedCode("");
      setPatient(null);
      setIsScanning(true);

      // Load cameras if not already loaded or if permission was previously denied
      if (availableCameras.length === 0) {
        await loadAvailableCameras();
        // If still no cameras after loading, return early
        if (availableCameras.length === 0) {
          setIsScanning(false);
          return;
        }
      }

      const cameraId = selectedCameraId || availableCameras[0]?.deviceId;

      if (!cameraId) {
        throw new Error("No camera selected");
      }

      const result = await codeReader.current.decodeOnceFromVideoDevice(
        cameraId,
        videoRef.current,
      );

      const code = result.getText();
      setScannedCode(code);

      const foundPatient = await findPatient(code);
      if (foundPatient) {
        setPatient(foundPatient);
      } else {
        setError(`No patient found with ID: ${code}`);
      }

      setIsScanning(false);
    } catch (err) {
      console.error("Scanning error:", err);
      if (err instanceof NotFoundException) {
        setError("No barcode found. Please try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to access camera. Please check permissions.");
      }
      setIsScanning(false);
    }
  };

  const handleCameraChange = (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (codeReader.current) {
      codeReader.current.reset();
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  const resetScanner = () => {
    setScannedCode("");
    setPatient(null);
    setError("");
    if (codeReader.current) {
      codeReader.current.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">NH Clinic</h1>
          <p className="text-gray-600">Patient Card System</p>
        </div>

        {/* Scanner Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Camera className="h-6 w-6" />
              Scan Patient Card
            </CardTitle>
            <CardDescription>
              Position the patient's barcode within the camera view
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera Video Element */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                style={{ display: isScanning ? "block" : "none" }}
              />
              {!isScanning && !patient && (
                <div className="flex h-full items-center justify-center">
                  <Square className="h-16 w-16 text-gray-400" />
                </div>
              )}
              {patient && (
                <div className="flex h-full items-center justify-center bg-green-50">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              )}
            </div>

            {/* Camera Selection */}
            {showCameraSelection &&
              availableCameras.length > 1 &&
              !isScanning && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Camera:
                  </label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {availableCameras.map((camera, index) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isScanning && !patient && (
                <Button onClick={startScanning} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />
                  Scan Patient Card
                </Button>
              )}

              {isScanning && (
                <Button
                  onClick={stopScanning}
                  variant="destructive"
                  className="flex-1"
                >
                  Stop Scanning
                </Button>
              )}

              {patient && (
                <Button
                  onClick={resetScanner}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  Scan Another Patient
                </Button>
              )}
            </div>

            {/* Error Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Patient Information Card */}
        {patient && (
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Active Patient
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Patient Name and Basic Info */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {patient.name}
                  </h3>
                  <p className="text-gray-600">Age: {patient.age} years</p>
                </div>
                <div className="text-right md:text-left">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Hash className="h-4 w-4" />
                    ID: {patient.id}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    Card: {patient.cardNumber}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                  <p className="text-gray-900">{patient.phoneNumber}</p>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CreditCard className="h-4 w-4" />
                    CNIC
                  </div>
                  <p className="text-gray-900">{patient.cnic}</p>
                </div>
              </div>

              <Separator />

              {/* Visit Information */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4" />
                  Last Visit Information
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="font-medium text-blue-900">
                    {formatDate(patient.dateLastVisited)}
                  </p>
                  <p className="text-sm text-blue-700">
                    ({daysSinceLastVisit(patient.dateLastVisited)} days ago)
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4" />
                  Medical Comments
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm leading-relaxed text-gray-800">
                    {patient.comments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!patient && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-blue-800">
                <p className="mb-2 font-medium">How to use:</p>
                <ul className="mx-auto max-w-md space-y-1 text-left">
                  <li>• Click "Scan Patient Card" to activate camera</li>
                  <li>• Position patient's barcode in camera view</li>
                  <li>• Patient information will display automatically</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
