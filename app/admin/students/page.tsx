"use client"

import { useState, useEffect } from "react"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { api } from "@/lib/api"

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.getAllStudents()
        if (response.students) {
          setStudents(response.students)
        }
      } catch (error) {
        console.error("Failed to fetch students:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const [searchQuery, setSearchQuery] = useState("")

  const filteredStudents = students.filter(student =>
    (student.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
            <p className="text-muted-foreground mt-1">Monitor student library activity</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Student library activity overview</CardDescription>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-2 text-muted-foreground">Loading students...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Books Borrowed</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Total Fines</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name || "Student"}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.active_borrows || student.borrowed || 0}</TableCell>
                          <TableCell>
                            <span className={(student.overdue || 0) > 0 ? "text-destructive font-medium" : ""}>
                              {student.overdue || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={(student.fines && student.fines !== "$0" && student.fines !== 0) ? "text-destructive font-medium" : ""}>
                              {student.fines ? (String(student.fines).startsWith('$') ? student.fines : `₹${student.fines}`) : "₹0"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/students/${student.id}`}>
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          {searchQuery ? "No students match your search." : "No students found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
