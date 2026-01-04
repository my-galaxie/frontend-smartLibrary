"use client"

import { useState, useEffect } from "react"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    subject: "",
    total_copies: 1
  })

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await api.getAllBooks()
      if (response.books) {
        setBooks(response.books.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          total: b.total_copies,
          available: b.available_copies,
          borrowed: b.total_copies - b.available_copies
        })))
      }
    } catch (error: any) {
      console.error("Failed to fetch books:", error)
      if (error.message === "Not authenticated" || error.message.includes("401")) {
        // Token might be invalid/expired or from a different env
        window.location.href = "/auth/login?error=session_expired";
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.addBook(newBook)
      setIsDialogOpen(false)
      fetchBooks() // Refresh list
      // Reset form
      setNewBook({ title: "", author: "", isbn: "", category: "", subject: "", total_copies: 1 })
    } catch (error) {
      console.error("Failed to add book:", error)
      alert("Failed to add book")
    }
  }

  const handleDeleteBook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await api.deleteBook(id)
      fetchBooks()
    } catch (error) {
      console.error("Failed to delete book:", error)
    }
  }

  const [searchQuery, setSearchQuery] = useState("")

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Book Inventory</h1>
              <p className="text-muted-foreground mt-1">Manage library book collection</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Enter book details to add to inventory</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Book Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter book title"
                      required
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      placeholder="Enter author name"
                      required
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      placeholder="Enter ISBN"
                      required
                      value={newBook.isbn}
                      onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="e.g. Science"
                        required
                        value={newBook.category}
                        onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="e.g. Physics"
                        required
                        value={newBook.subject}
                        onChange={(e) => setNewBook({ ...newBook, subject: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Total Copies</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      required
                      value={newBook.total_copies}
                      onChange={(e) => setNewBook({ ...newBook, total_copies: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      Add Book
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1 bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Book Collection</CardTitle>
              <CardDescription>All books in the library system</CardDescription>
              <div className="mt-4">
                <Input
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-2 text-muted-foreground">Loading inventory...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Total Copies</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.length > 0 ? (
                      filteredBooks.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-medium">{book.title}</TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>{book.total}</TableCell>
                          <TableCell>
                            <Badge
                              variant={book.available > 0 ? "secondary" : "destructive"}
                              className={book.available > 0 ? "bg-primary/10 text-primary" : ""}
                            >
                              {book.available}
                            </Badge>
                          </TableCell>
                          <TableCell>{book.borrowed}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBook(book.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          {searchQuery ? "No books match your search." : "No books found. Add one to get started."}
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
