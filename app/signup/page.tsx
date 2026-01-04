"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { api } from "@/lib/api"
import { createClient } from "@supabase/supabase-js"

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["student", "admin"]),
    student_id: z.string().optional(),
    department: z.string().optional(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.role === "student" && !data.student_id) {
        return false
    }
    return true
}, {
    message: "Student ID is required for students",
    path: ["student_id"],
}).refine((data) => {
    if (data.role === "student" && !data.department) {
        return false
    }
    return true
}, {
    message: "Department is required for students",
    path: ["department"],
})

// Initialize Supabase Client for OAuth
// Note: This requires environment variables which might not be set in user environment yet.
// We'll trust the process environment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

export default function SignupPage() {
    const { signup } = useAuth()

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        role: "student",
        student_id: "",
        department: "",
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // OTP State
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [otp, setOtp] = useState("")
    const [isOtpVerifying, setIsOtpVerifying] = useState(false)

    // Success State (Post OTP)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`, // Redirect to login page to handle session
                }
            })
            if (error) throw error
        } catch (err: any) {
            setError(err.message || "Failed to initiate Google Login")
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Zod Validation
        const validationResult = signupSchema.safeParse(formData)
        if (!validationResult.success) {
            // Collect all error messages
            const errorMessages = validationResult.error.errors.map(err => err.message).join(" • ")
            setError(errorMessages)
            setIsLoading(false)
            return
        }

        try {
            await signup({
                email: formData.email,
                password: formData.password,
                role: formData.role,
                name: formData.name,
                student_id: formData.role === "student" ? formData.student_id : undefined,
                department: formData.role === "student" ? formData.department : undefined,
            })
            setIsOtpSent(true) // Switch to OTP View
        } catch (err: any) {
            setError(err.message || "Signup failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsOtpVerifying(true)
        setError("")

        try {
            await api.verifyOtp(formData.email, otp)
            setIsSuccess(true)
        } catch (err: any) {
            setError(err.message || "Invalid OTP")
        } finally {
            setIsOtpVerifying(false)
        }
    }

    if (isOtpSent && !isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-xl">Verify Email</CardTitle>
                        <CardDescription>
                            We have sent a verification code to <strong>{formData.email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Enter OTP</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isOtpVerifying}>
                                {isOtpVerifying ? "Verifying..." : "Confirm Account"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-xl text-green-600 flex items-center gap-2">
                            <AlertCircle className="h-6 w-6" />
                            Signup Successful
                        </CardTitle>
                        <CardDescription>
                            You have successfully signed up! Please login with your new credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href={`/login?role=${formData.role}`}>Go to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-2">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <span className="font-semibold text-xl">Smart Library</span>
                </Link>

                {/* Signup Card */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Create an account</CardTitle>
                        <CardDescription>Enter your information to get started</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => handleChange("role", value)}
                                    disabled={true}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.role === "student" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="student_id">Student ID</Label>
                                        <Input
                                            id="student_id"
                                            type="text"
                                            placeholder="STU2024001"
                                            value={formData.student_id}
                                            onChange={(e) => handleChange("student_id", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Input
                                            id="department"
                                            type="text"
                                            placeholder="e.g. Computer Science"
                                            value={formData.department}
                                            onChange={(e) => handleChange("department", e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Creating account..." : "Sign up"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Sign up with Google
                    </Button>
                </div>

                <div className="text-center">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
