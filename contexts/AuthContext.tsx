"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface User {
    user_id: string
    email: string
    name: string
    role: 'student' | 'admin'
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string, expectedRole?: string) => Promise<void>
    signup: (data: {
        email: string
        password: string
        role: string
        name: string
        student_id?: string
        department?: string
    }) => Promise<void>
    logout: () => void
    isAuthenticated: boolean
    isStudent: boolean
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Auto-logout state
    const [lastActivity, setLastActivity] = useState(Date.now())

    useEffect(() => {
        // 1. Check existing legacy token
        checkAuth()

        // 2. Listen for Supabase Auth changes (Google Login)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Supabase Auth Event:", event)

            if (event === 'SIGNED_IN' && session) {
                setLoading(true)
                // Set login time if not set
                if (!localStorage.getItem('login_time')) {
                    localStorage.setItem('login_time', Date.now().toString())
                }

                try {
                    // Sync Supabase Token with our API Client
                    localStorage.setItem('access_token', session.access_token)

                    // Validate with backend to get Role & DB Profile
                    const response = await api.validate()

                    setUser({
                        user_id: response.user_id,
                        email: response.email,
                        name: response.name,
                        role: response.role,
                    })

                    localStorage.setItem('user_role', response.role)
                    localStorage.setItem('user_name', response.name)

                    // Redirect based on role if on login page
                    if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
                        if (response.role === 'admin') {
                            router.push('/admin/dashboard')
                        } else {
                            router.push('/student/dashboard')
                        }
                    }
                } catch (error) {
                    console.error("Failed to sync Google login with backend:", error)
                    await supabase.auth.signOut()
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('user_role')
                    localStorage.removeItem('user_name')
                    localStorage.removeItem('login_time')
                    setUser(null)
                    setLoading(false)
                } finally {
                    setLoading(false)
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                localStorage.removeItem('access_token')
                localStorage.removeItem('user_role')
                localStorage.removeItem('user_name')
                localStorage.removeItem('login_time')
                router.push('/login')
            }
        })

        const handleUnauthorized = () => {
            console.log("Auto-logging out due to 401 Unauthorized")
            logout()
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('auth:unauthorized', handleUnauthorized)
        }

        return () => {
            subscription.unsubscribe()
            if (typeof window !== 'undefined') {
                window.removeEventListener('auth:unauthorized', handleUnauthorized)
            }
        }
    }, [])

    // Activity Tracker & Auto Logout
    useEffect(() => {
        if (!user) return;

        const handleActivity = () => {
            setLastActivity(Date.now())
        }

        // Listen for user activity
        window.addEventListener('mousemove', handleActivity)
        window.addEventListener('keypress', handleActivity)
        window.addEventListener('click', handleActivity)
        window.addEventListener('scroll', handleActivity)

        // Check timers
        const interval = setInterval(() => {
            const now = Date.now()

            // 1. Inactivity Check (10 mins)
            if (now - lastActivity > 10 * 60 * 1000) {
                console.log("Logging out due to inactivity")
                logout()
            }

            // 2. Max Session Check (30 mins)
            const loginTimeStr = localStorage.getItem('login_time')
            if (loginTimeStr) {
                const loginTime = parseInt(loginTimeStr)
                if (now - loginTime > 30 * 60 * 1000) {
                    console.log("Logging out due to max session time")
                    logout()
                }
            }
        }, 10000) // Check every 10 seconds

        return () => {
            window.removeEventListener('mousemove', handleActivity)
            window.removeEventListener('keypress', handleActivity)
            window.removeEventListener('click', handleActivity)
            window.removeEventListener('scroll', handleActivity)
            clearInterval(interval)
        }
    }, [user, lastActivity])


    const checkAuth = async () => {
        const token = localStorage.getItem('access_token')

        if (!token) {
            setLoading(false)
            return
        }

        try {
            const response = await api.validate()
            setUser({
                user_id: response.user_id,
                email: response.email,
                name: localStorage.getItem('user_name') || response.email,
                role: response.role,
            })
            // Ensure login time is set if missing (e.g. page refresh)
            if (!localStorage.getItem('login_time')) {
                localStorage.setItem('login_time', Date.now().toString())
            }
        } catch (error) {
            console.error('Auth validation failed:', error)
            localStorage.removeItem('access_token')
            localStorage.removeItem('user_role')
            localStorage.removeItem('user_name')
            localStorage.removeItem('login_time')
        } finally {
            setLoading(false)
        }
    }

    const login = async (email: string, password: string, expectedRole?: string) => {
        try {
            const response = await api.login(email, password)

            if (expectedRole && response.role !== expectedRole) {
                throw new Error(`Access denied: You are not authorized to login as a ${expectedRole}`)
            }

            localStorage.setItem('access_token', response.access_token)
            localStorage.setItem('user_role', response.role)
            localStorage.setItem('user_name', response.name)
            localStorage.setItem('login_time', Date.now().toString())

            setUser({
                user_id: response.user_id,
                email: response.email,
                name: response.name,
                role: response.role,
            })

            if (response.role === 'admin') {
                router.push('/admin/dashboard')
            } else {
                router.push('/student/dashboard')
            }
        } catch (error: any) {
            throw new Error(error.message || 'Login failed')
        }
    }

    const signup = async (data: {
        email: string
        password: string
        role: string
        name: string
        student_id?: string
        department?: string
    }) => {
        try {
            await api.signup(data)
        } catch (error: any) {
            throw new Error(error.message || 'Signup failed')
        }
    }

    const logout = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        localStorage.removeItem('login_time')
        setUser(null)
        router.push('/login')
    }

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isStudent: user?.role === 'student',
        isAdmin: user?.role === 'admin',
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
