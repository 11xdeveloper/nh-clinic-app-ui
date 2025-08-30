"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import {
  Users,
  QrCode,
  Calendar,
  TrendingUp,
  Activity,
  Heart,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { api } from "../../trpc/react";

export default function DashboardPage() {
  const { data: patients = [] } = api.patient.getAll.useQuery();

  const recentPatients = patients.slice(0, 5);
  const totalPatients = patients.length;
  const recentVisits = patients.filter((p) => {
    const daysSince = Math.ceil(
      (new Date().getTime() - new Date(p.dateLastVisited).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysSince <= 7;
  }).length;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Medical Image */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div
          className="absolute inset-0 bg-cover bg-right opacity-30"
          style={{ backgroundImage: "url(/assets/clinic-consultation.jpeg)" }}
        ></div>
        <div className="relative px-6 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold">Welcome to NH Clinic</h1>
                <p className="mt-2 text-xl text-blue-100">
                  Comprehensive Patient Management System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Patients
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {totalPatients}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Recent Visits
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {recentVisits}
                    </p>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Active Today
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      {
                        patients.filter((p) => {
                          const today = new Date().toDateString();
                          return (
                            new Date(p.dateLastVisited).toDateString() === today
                          );
                        }).length
                      }
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Health Score
                    </p>
                    <p className="text-3xl font-bold text-purple-600">100%</p>
                    <p className="text-xs text-gray-500">System uptime</p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img
                  src="/assets/medical-syringe.png"
                  alt="Medical Tools"
                  className="h-6 w-6"
                />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts for efficient patient management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link href="/dashboard/scan">
                  <Button className="h-20 w-full flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                    <QrCode className="h-6 w-6" />
                    Scan Patient Card
                  </Button>
                </Link>
                <Link href="/dashboard/patients">
                  <Button
                    variant="outline"
                    className="h-20 w-full flex-col gap-2 bg-transparent"
                  >
                    <Users className="h-6 w-6" />
                    View All Patients
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Patients
                  </CardTitle>
                  <CardDescription>
                    Latest patient visits and updates
                  </CardDescription>
                </div>
                <Link href="/dashboard/patients">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentPatients.length === 0 ? (
                <div className="py-8 text-center">
                  <img
                    src="/assets/medical-pills.jpeg"
                    alt="No patients"
                    className="mx-auto mb-4 h-20 w-20 rounded-lg opacity-50"
                  />
                  <p className="text-gray-500">No patients found</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Start by scanning a patient card or adding a new patient
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-600">
                            ID: {patient.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDate(patient.dateLastVisited)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          Age {patient.age}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medical Services Overview */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img
                    src="/assets/medical-clipboard.png"
                    alt="Services"
                    className="h-5 w-5"
                  />
                  Medical Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium">
                      General Checkups
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">
                      Blood Pressure Monitoring
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3">
                    <Stethoscope className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium">
                      Health Consultations
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <Badge className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Barcode Scanner</span>
                    <Badge className="bg-green-100 text-green-800">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Patient Records</span>
                    <Badge className="bg-blue-100 text-blue-800">Synced</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Health</span>
                    <Badge className="bg-green-100 text-green-800">
                      Excellent
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
