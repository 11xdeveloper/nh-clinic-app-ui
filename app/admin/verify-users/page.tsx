"use client";

import { useState } from "react";
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
import { Users, Shield, UserCheck, UserX, Mail, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from "@/trpc/react";
import type { User } from "@prisma/client";

export default function VerifyUsersPage() {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // tRPC queries and mutations
  const { data: unverifiedUsers = [], refetch } = api.user.getUnverified.useQuery();
  const { data: allUsers = [] } = api.user.getAll.useQuery();
  
  const verifyUser = api.user.verify.useMutation({
    onSuccess: () => {
      refetch();
      setMessage({
        type: "success",
        text: "User verified successfully!",
      });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message,
      });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  const rejectUser = api.user.delete.useMutation({
    onSuccess: () => {
      refetch();
      setMessage({
        type: "success",
        text: "User account rejected and removed.",
      });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message,
      });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  const handleVerifyUser = (userId: number) => {
    verifyUser.mutate({ id: userId });
  };

  const handleRejectUser = (userId: number) => {
    rejectUser.mutate({ id: userId });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "ADMIN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800";
  };

  const verifiedUsers = allUsers.filter(user => user.verified);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">
              Verify new user accounts and manage existing users
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Verification
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {unverifiedUsers.length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Verified Users
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {verifiedUsers.length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {allUsers.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
          >
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Pending Verification Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Verification
            </CardTitle>
            <CardDescription>
              Users waiting for account verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unverifiedUsers.length === 0 ? (
              <div className="py-8 text-center">
                <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No pending verifications
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All users have been verified.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Info</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unverifiedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getRoleBadgeColor(user.role)}
                          >
                            {user.role === "ADMIN" ? (
                              <Shield className="mr-1 h-3 w-3" />
                            ) : (
                              <Users className="mr-1 h-3 w-3" />
                            )}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(new Date())}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyUser(user.id)}
                              disabled={verifyUser.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="mr-1 h-3 w-3" />
                              Verify
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={rejectUser.isPending}
                                >
                                  <UserX className="mr-1 h-3 w-3" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject {user.name}'s
                                    account? This will permanently delete their
                                    account and they will need to sign up again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRejectUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Reject User
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

        {/* Verified Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Verified Users
            </CardTitle>
            <CardDescription>
              All verified and active users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verifiedUsers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No verified users
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No users have been verified yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Info</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifiedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getRoleBadgeColor(user.role)}
                          >
                            {user.role === "ADMIN" ? (
                              <Shield className="mr-1 h-3 w-3" />
                            ) : (
                              <Users className="mr-1 h-3 w-3" />
                            )}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
