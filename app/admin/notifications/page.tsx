"use client"

import { useState, useEffect } from "react"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Send, Settings, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

export default function NotificationControlPage() {
  const [reminderTiming, setReminderTiming] = useState("2")
  const [overdueFrequency, setOverdueFrequency] = useState("daily")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [recipients, setRecipients] = useState("all")
  const [loading, setLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])

  const [historyLoading, setHistoryLoading] = useState(true)

  const fetchAnnouncements = async () => {
    try {
      const res = await api.getRecentAnnouncements()
      if (res.notifications) {
        setAnnouncements(res.notifications)
      }
    } catch (err: any) {
      console.error("Failed to fetch announcements", err)
      if (err.message === "Not authenticated" || err.message.includes("401")) {
        // Handled by global event now, but good to keep
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleBroadcast = async () => {
    if (!title || !message) {
      alert("Please enter title and message")
      return
    }
    setLoading(true)
    try {
      await api.broadcastNotification({
        title,
        message,
        type: "announcement" // or based on logic
      })
      alert("Announcement sent successfully!")
      setTitle("")
      setMessage("")
      fetchAnnouncements() // Refresh list
    } catch (error) {
      console.error("Broadcast failed", error)
      alert("Failed to send announcement")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setConfigLoading(true)
    try {
      await api.updateFineConfig({
        reminder_days: parseInt(reminderTiming),
        overdue_frequency: overdueFrequency
      })
      alert("Settings saved successfully")
    } catch (error) {
      console.error("Failed to save settings", error)
      alert("Failed to save settings")
    } finally {
      setConfigLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Control</h1>
            <p className="text-muted-foreground mt-1">Configure reminders and send announcements</p>
          </div>

          {/* Reminder Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Reminder Configuration</CardTitle>
                  <CardDescription>Set up automated due date reminder timing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminder-days">Send reminder before due date (days)</Label>
                <Select value={reminderTiming} onValueChange={setReminderTiming}>
                  <SelectTrigger id="reminder-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="overdue-frequency">Overdue reminder frequency</Label>
                <Select value={overdueFrequency} onValueChange={setOverdueFrequency}>
                  <SelectTrigger id="overdue-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="every-2-days">Every 2 days</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveConfig} disabled={configLoading}>
                {configLoading ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>

          {/* Broadcast Announcement */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                <div>
                  <CardTitle>Broadcast Announcement</CardTitle>
                  <CardDescription>Send notifications to all students</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement-title">Announcement Title</Label>
                  <Input
                    id="announcement-title"
                    placeholder="e.g., Library Maintenance Notice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcement-message">Message</Label>
                  <Textarea
                    id="announcement-message"
                    placeholder="Enter your announcement message..."
                    rows={4}
                    className="resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipients</Label>
                  <Select value={recipients} onValueChange={setRecipients}>
                    <SelectTrigger id="recipient">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="overdue">Students with Overdue Books</SelectItem>
                      <SelectItem value="active">Students with Active Borrows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={handleBroadcast} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Sending..." : "Send Announcement"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Announcements</CardTitle>
              <CardDescription>Previously sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : announcements.length > 0 ? (
                  announcements.map((ann: any) => (
                    <div key={ann.id} className="border-b pb-4 last:border-0 last:pb-0 group">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <h3 className="font-semibold">{ann.title || ann.message?.split(':')[0] || "No Title"}</h3>
                          <span className="text-xs text-muted-foreground">{new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this broadcast?")) return;
                            try {
                              setHistoryLoading(true)
                              await api.deleteBroadcast({
                                title: ann.title,
                                message: ann.message,
                                type: ann.type
                              })
                              alert("Broadcast deleted")
                              fetchAnnouncements()
                            } catch (e) {
                              console.error(e)
                              alert("Failed to delete")
                              setHistoryLoading(false)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{ann.message?.split(':')[1] || ann.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">Sent to: All Students</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No recent announcements</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
