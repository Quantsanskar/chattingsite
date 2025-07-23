"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, MessageCircle, Users, Zap } from "lucide-react"
import ClientOnly from "@/components/ClientOnly"

export default function AuthForm({ onAuthSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeTab, setActiveTab] = useState("login")

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (data.success) {
        onAuthSuccess(data.user)
      } else {
        setErrors(data.errors || { general: data.message })
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      })

      const data = await response.json()

      if (data.success) {
        onAuthSuccess(data.user)
      } else {
        setErrors(data.errors || { general: data.message })
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white leading-tight">
                Connect & Chat
                <span className="block text-purple-400">Seamlessly</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join our premium chat platform where meaningful conversations happen. Connect with like-minded
                individuals and build lasting relationships.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Real-time Messaging</h3>
                  <p className="text-gray-400">Instant communication with advanced features</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Smart Connections</h3>
                  <p className="text-gray-400">Find and connect with the right people</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Lightning Fast</h3>
                  <p className="text-gray-400">Optimized for speed and performance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-2xl font-bold text-white">Welcome</CardTitle>
                <CardDescription className="text-gray-300">Sign in to your account or create a new one</CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5">
                    <TabsTrigger value="login" className="data-[state=active]:bg-white/20">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-white/20">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-white">
                          Email
                        </Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                        {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-white">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                      </div>

                      {errors.general && (
                        <Alert className="bg-red-500/20 border-red-500/50">
                          <AlertDescription className="text-red-200">{errors.general}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4 mt-6">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username" className="text-white">
                          Username
                        </Label>
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Choose a username"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                        {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-white">
                          Email
                        </Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                        {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-white">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password" className="text-white">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="register-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
                      </div>

                      {errors.general && (
                        <Alert className="bg-red-500/20 border-red-500/50">
                          <AlertDescription className="text-red-200">{errors.general}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClientOnly>
  )
}
