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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Alert, AlertDescription } from "components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "components/ui/alert-dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Search,
  Calendar,
  Phone,
  CreditCard,
  AlertCircle,
  Camera,
  X,
} from "lucide-react";
import { api } from "../../../trpc/react";
import type { Patient } from "@prisma/client";

interface PatientFormData {
  id: string;
  name: string;
  age: number;
  phoneNumber: string;
  cnic: string;
  comments: string;
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>({
    id: "",
    name: "",
    age: 0,
    phoneNumber: "",
    cnic: "",
    comments: "",
  });
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [scanError, setScanError] = useState<string>("");

  // tRPC queries and mutations
  const { data: patients = [], refetch } = api.patient.getAll.useQuery();
  const createPatient = api.patient.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
  });
  const updatePatient = api.patient.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditDialogOpen(false);
      setEditingPatient(null);
      resetForm();
    },
  });
  const deletePatient = api.patient.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      age: 0,
      phoneNumber: "",
      cnic: "",
      comments: "",
    });
  };

  const handleAddPatient = () => {
    createPatient.mutate({
      ...formData,
      dateLastVisited: new Date(),
    });
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      phoneNumber: patient.phoneNumber,
      cnic: patient.cnic,
      comments: patient.comments,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePatient = () => {
    if (!editingPatient) return;
    updatePatient.mutate({
      ...formData,
      id: editingPatient.id,
      dateLastVisited: new Date(),
    });
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatient.mutate({ id: patientId });
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cnic.includes(searchTerm) ||
      patient.phoneNumber.includes(searchTerm)
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const daysSinceLastVisit = (date: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Load available cameras
  const loadAvailableCameras = async () => {
    try {
      // Request permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());

      // Then enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setAvailableCameras(videoDevices);

      // Select back camera by default if available
      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear")
      );
      setSelectedCamera(
        backCamera?.deviceId || videoDevices[0]?.deviceId || ""
      );
    } catch (error) {
      console.error("Error accessing cameras:", error);
      setScanError("Unable to access camera. Please check permissions.");
    }
  };

  // Start barcode scanning
  const startBarcodeScanning = async () => {
    if (availableCameras.length === 0) {
      await loadAvailableCameras();
    }
    setIsScanningBarcode(true);
    setScanError("");
  };

  // Stop barcode scanning
  const stopBarcodeScanning = () => {
    setIsScanningBarcode(false);
    setScanError("");
  };

  // Handle barcode scan result
  const handleBarcodeScan = (result: string) => {
    setFormData({ ...formData, id: result });
    setIsScanningBarcode(false);
    setScanError("");
  };

  // Barcode Scanner Component
  const BarcodeScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
      let codeReader: any = null;
      let stream: MediaStream | null = null;

      const startScanning = async () => {
        try {
          const { BrowserMultiFormatReader } = await import("@zxing/library");
          codeReader = new BrowserMultiFormatReader();

          const constraints = {
            video: {
              deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
              facingMode: selectedCamera ? undefined : { ideal: "environment" },
            },
          };

          stream = await navigator.mediaDevices.getUserMedia(constraints);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setIsScanning(true);

            codeReader.decodeFromVideoDevice(
              selectedCamera || undefined,
              videoRef.current,
              (result: any, error: any) => {
                if (result) {
                  handleBarcodeScan(result.getText());
                  cleanup();
                }
                if (error && error.name !== "NotFoundException") {
                  console.error("Barcode scanning error:", error);
                }
              }
            );
          }
        } catch (error) {
          console.error("Error starting barcode scanner:", error);
          setScanError("Failed to start camera. Please check permissions.");
          cleanup();
        }
      };

      const cleanup = () => {
        if (codeReader) {
          codeReader.reset();
        }
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsScanning(false);
      };

      if (isScanningBarcode) {
        startScanning();
      }

      return cleanup;
    }, [isScanningBarcode, selectedCamera]);

    if (!isScanningBarcode) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scan Patient Barcode</h3>
            <Button variant="ghost" size="sm" onClick={stopBarcodeScanning}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {availableCameras.length > 1 && (
            <div className="mb-4">
              <Label htmlFor="camera-select">Select Camera:</Label>
              <select
                id="camera-select"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="mt-1 w-full rounded-md border p-2"
              >
                {availableCameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label ||
                      `Camera ${availableCameras.indexOf(camera) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative mb-4">
            <video
              ref={videoRef}
              className="h-64 w-full rounded-lg bg-black object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                <div className="text-center text-white">
                  <Camera className="mx-auto mb-2 h-8 w-8" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
          </div>

          {scanError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{scanError}</AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-gray-600">
            <p>Point the camera at a barcode to scan</p>
            <p className="mt-1">The barcode will be automatically detected</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/assets/medical-clipboard.png"
              alt="Medical"
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Patient Management
              </h1>
              <p className="text-gray-600">
                Manage all patient records and information
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's information to create a new record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="id" className="text-right">
                    Patient ID
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="id"
                      value={formData.id}
                      onChange={(e) =>
                        setFormData({ ...formData, id: e.target.value })
                      }
                      placeholder="e.g., PAT006"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startBarcodeScanning}
                      className="bg-transparent px-3"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="+92-300-1234567"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cnic" className="text-right">
                    CNIC
                  </Label>
                  <Input
                    id="cnic"
                    value={formData.cnic}
                    onChange={(e) =>
                      setFormData({ ...formData, cnic: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="42101-1234567-1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comments" className="text-right">
                    Comments
                  </Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) =>
                      setFormData({ ...formData, comments: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Medical notes and comments..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleAddPatient}
                  disabled={createPatient.isPending}
                >
                  {createPatient.isPending ? "Adding..." : "Add Patient"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search patients by name, ID, CNIC, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-80 pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {patients.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Patients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredPatients.length}
                  </div>
                  <div className="text-sm text-gray-600">Filtered Results</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Records
            </CardTitle>
            <CardDescription>
              Complete list of all registered patients with their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No patients found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "Get started by adding a new patient."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Info</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{patient.name}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <QrCode className="h-3 w-3" />
                              {patient.id}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CreditCard className="h-3 w-3" />
                              Card #{patient.cardNumber}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Age {patient.age}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {patient.phoneNumber}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CreditCard className="h-3 w-3" />
                              {patient.cnic}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3" />
                              {formatDate(patient.dateLastVisited)}
                            </div>
                            <Badge
                              variant={
                                daysSinceLastVisit(patient.dateLastVisited) > 90
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {daysSinceLastVisit(patient.dateLastVisited)} days
                              ago
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {patient.comments}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPatient(patient)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Patient
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    {patient.name}? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeletePatient(patient.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
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
            )}
          </CardContent>
        </Card>

        {/* Edit Patient Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Patient</DialogTitle>
              <DialogDescription>
                Update the patient's information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-id" className="text-right">
                  Patient ID
                </Label>
                <Input
                  id="edit-id"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-age" className="text-right">
                  Age
                </Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      age: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cnic" className="text-right">
                  CNIC
                </Label>
                <Input
                  id="edit-cnic"
                  value={formData.cnic}
                  onChange={(e) =>
                    setFormData({ ...formData, cnic: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-comments" className="text-right">
                  Comments
                </Label>
                <Textarea
                  id="edit-comments"
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleUpdatePatient}
                disabled={updatePatient.isPending}
              >
                {updatePatient.isPending ? "Updating..." : "Update Patient"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error/Success Messages */}
        {createPatient.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to create patient: {createPatient.error.message}
            </AlertDescription>
          </Alert>
        )}

        {updatePatient.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to update patient: {updatePatient.error.message}
            </AlertDescription>
          </Alert>
        )}

        {deletePatient.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to delete patient: {deletePatient.error.message}
            </AlertDescription>
          </Alert>
        )}
        {/* Barcode Scanner */}
        <BarcodeScanner />
      </div>
    </div>
  );
}
