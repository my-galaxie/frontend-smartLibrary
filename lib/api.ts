// Hardcoded to force AWS backend usage during debug
// const API_URL = 'https://qljzkg1uzd.execute-api.ap-south-1.amazonaws.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Get token from localStorage
const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token')
    }
    return null
}

// API Client class
class APIClient {
    private baseURL: string

    constructor(baseURL: string) {
        this.baseURL = baseURL
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const token = getToken()

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        // Merge with any headers from options
        if (options.headers) {
            Object.assign(headers, options.headers)
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        console.log(`[API] Requesting: ${this.baseURL}${endpoint}`)
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
        })

        if (!response.ok) {
            const text = await response.text()
            console.error('[API] Error Response Body:', text)
            let error
            try {
                error = JSON.parse(text)
            } catch {
                error = { detail: text } // Use raw text if not JSON
            }
            throw new Error(error.detail || error.message || 'Request failed')
        }

        return response.json()
    }

    // Auth endpoints
    async signup(data: { email: string; password: string; role: string; name: string; student_id?: string }) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async login(email: string, password: string) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })
    }

    async validate() {
        return this.request('/auth/validate')
    }

    async logout() {
        return this.request('/auth/logout', { method: 'POST' })
    }

    async verifyOtp(email: string, otp: string, type: string = "signup") {
        return this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ email, otp, type })
        })
    }

    // Student endpoints
    async getStudentDashboard() {
        return this.request('/api/student/dashboard')
    }

    async getCurrentBorrowedBooks() {
        return this.request('/api/student/books/current')
    }

    async getBorrowHistory() {
        return this.request('/api/student/books/history')
    }

    async getStudentNotifications() {
        return this.request('/api/student/notifications')
    }

    async markNotificationRead(notificationId: string) {
        return this.request(`/api/student/notifications/${notificationId}/read`, {
            method: 'PUT',
        })
    }

    async getStudentFines() {
        return this.request('/api/student/fines')
    }

    async getStudentProfile() {
        return this.request('/api/student/profile')
    }

    async requestProfileUpdate(data: any) {
        return this.request('/api/student/profile/request', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async getProfileRequest() {
        return this.request('/api/student/profile/request')
    }

    // Books endpoints
    async searchBooks(params: Record<string, string>) {
        const queryString = new URLSearchParams(params).toString()
        return this.request(`/api/student/books/search?${queryString}`)
    }

    async getBookDetails(bookId: string) {
        return this.request(`/api/student/books/${bookId}`)
    }

    async subscribeToAvailability(bookId: string) {
        return this.request(`/api/books/${bookId}/notify`, { method: 'POST' })
    }

    // Admin endpoints
    async getAdminDashboard() {
        return this.request('/api/admin/dashboard')
    }

    async getBorrowLogs(params?: Record<string, string>) {
        const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
        return this.request(`/api/admin/logs${queryString}`)
    }

    async getAllBooks() {
        return this.request('/api/admin/books')
    }

    async addBook(data: any) {
        return this.request('/api/admin/books', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updateBook(bookId: string, data: any) {
        return this.request(`/api/admin/books/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    async deleteBook(bookId: string) {
        return this.request(`/api/admin/books/${bookId}`, { method: 'DELETE' })
    }

    async getAllStudents() {
        return this.request('/api/admin/students')
    }

    async getStudentDetails(studentId: string) {
        return this.request(`/api/admin/students/${studentId}`)
    }

    async getAllFines() {
        return this.request('/api/admin/fines')
    }

    async updateFineConfig(data: any) {
        return this.request('/api/admin/fines/config', {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    async broadcastNotification(data: { title: string; message: string; type?: string }) {
        return this.request('/api/admin/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async getRecentAnnouncements() {
        return this.request('/api/admin/notifications/history')
    }

    async getProfileRequests() {
        return this.request('/api/admin/profile/requests')
    }

    async processProfileRequest(requestId: string, action: 'approve' | 'reject') {
        return this.request(`/api/admin/profile/requests/${requestId}/${action}`, {
            method: 'POST',
        })
    }

    // Resources endpoints
    async getResources(params?: Record<string, string>) {
        const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
        return this.request(`/api/resources${queryString}`)
    }

    async downloadResource(resourceId: string) {
        return this.request(`/api/resources/${resourceId}/download`)
    }

    // Rules endpoints
    async getBorrowPolicy() {
        return this.request('/api/rules/borrow-policy')
    }

    // Health check
    async healthCheck() {
        return this.request('/api/health')
    }
}

export const api = new APIClient(API_URL)
