"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/AuthForm"
import Dashboard from "@/components/Dashboard"

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isActive = true

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok && isActive) {
          const data = await response.json()
          if (data.success) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isActive = false
    }
  }, [mounted])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {user ? <Dashboard user={user} onLogout={handleLogout} /> : <AuthForm onAuthSuccess={handleAuthSuccess} />}
    </div>
  )
}
