"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { CheckCircle, XCircle } from "lucide-react"
import { api } from "@/trpc/react"

export default function VerifyUsersPage() {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Get all users
  const { data: users, isLoading, refetch } = api.user.getAll.useQuery()

  // Verify user mutation
  const verifyUser = api.user.verify.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  // Reject user mutation
  const rejectUser = api.user.delete.useMutation({
    onSuccess: () => {
      refetch()
      setIsRejectDialogOpen(false)
    },
  })

  const handleVerifyUser = (userId: string) => {
    verifyUser.mutate({ userId })
  }

  const handleRejectClick = (user: any) => {
    setCurrentUser(user)
    setIsRejectDialogOpen(true)
  }

  const handleRejectUser = () => {
    if (currentUser) {
      rejectUser.mutate({ userId: currentUser.id })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Filter users into pending and verified
  const pendingUsers = users?.filter((user) => !user.verified) || []
  const verifiedUsers = users?.filter((user) => user.verified) || []

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedUsers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Users */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : pendingUsers.length > 0 ? (
                    pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center bg-transparent"
                              onClick={() => handleVerifyUser(user.id)}
                              disabled={verifyUser.isLoading}
                            >
                              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center bg-transparent"
                              onClick={() => handleRejectClick(user)}
                              disabled={rejectUser.isLoading}
                            >
                              <XCircle className="mr-1 h-4 w-4 text-red-500" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No pending users
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Verified Users */}
        <Card>
          <CardHeader>
            <CardTitle>Verified Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : verifiedUsers.length > 0 ? (
                    verifiedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.updatedAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No verified users
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{currentUser?.name}</strong> (
              {currentUser?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectUser} disabled={rejectUser.isLoading}>
              {rejectUser.isLoading ? "Rejecting..." : "Reject User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
