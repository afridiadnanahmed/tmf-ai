"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

interface AuthModalsProps {
  isLoginOpen: boolean
  isSignupOpen: boolean
  onLoginClose: () => void
  onSignupClose: () => void
  onSwitchToSignup: () => void
  onSwitchToLogin: () => void
}

export function AuthModals({
  isLoginOpen,
  isSignupOpen,
  onLoginClose,
  onSignupClose,
  onSwitchToSignup,
  onSwitchToLogin,
}: AuthModalsProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [signupData, setSignupData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  })
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        setIsLoading(false)
        return
      }

      // Store user data in localStorage or context (you may want to use a proper auth solution)
      localStorage.setItem("user", JSON.stringify(data.user))
      
      setIsLoading(false)
      onLoginClose()
      router.push("/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        setIsLoading(false)
        return
      }

      // Auto-login after successful registration
      localStorage.setItem("user", JSON.stringify(data.user))
      
      setIsLoading(false)
      onSignupClose()
      router.push("/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={onLoginClose}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[500px]">
            {/* Left side - Form */}
            <div className="p-8 flex flex-col justify-center">
              <DialogHeader className="mb-6">
                <div className="flex justify-center mb-6">
                  <Image src="/logo.png" alt="The Meta Future" width={120} height={40} className="h-8 w-auto" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center text-gray-900">Welcome Back!</DialogTitle>
                <p className="text-center text-gray-600 mt-2">Sign in to your TMF AI account</p>
              </DialogHeader>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="w-full" 
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full pr-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Login"}
                </Button>

                <div className="text-center">
                  <span className="text-gray-600">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            </div>

            {/* Right side - Background Image */}
            <div className="hidden md:block relative bg-gradient-to-br from-gray-900 to-black">
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="relative h-full flex items-center justify-center p-8">
                {/* AI Dashboard Mockup */}
                <div className="space-y-4 w-full max-w-sm">
                  <div className="bg-gray-800/80 rounded-lg p-4 backdrop-blur-sm border border-cyan-500/30">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span className="text-cyan-400 text-sm font-mono">AI Analytics</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded w-3/4"></div>
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded w-1/2"></div>
                      <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded w-5/6"></div>
                    </div>
                  </div>

                  <div className="bg-gray-800/80 rounded-lg p-4 backdrop-blur-sm border border-blue-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-blue-400 text-sm font-mono">Performance</span>
                      <span className="text-green-400 text-xs">+24.5%</span>
                    </div>
                    <div className="flex items-end space-x-1 h-16">
                      {[40, 65, 45, 80, 55, 70, 85].map((height, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t w-3"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={isSignupOpen} onOpenChange={onSignupClose}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[500px]">
            {/* Left side - Form */}
            <div className="p-8 flex flex-col justify-center">
              <DialogHeader className="mb-6">
                <div className="flex justify-center mb-6">
                  <Image src="/logo.png" alt="The Meta Future" width={120} height={40} className="h-8 w-auto" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center text-gray-900">Join TMF AI</DialogTitle>
                <p className="text-center text-gray-600 mt-2">
                  Create your account and start transforming your marketing
                </p>
              </DialogHeader>

              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <Input 
                    type="text" 
                    placeholder="Enter your full name" 
                    className="w-full" 
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="w-full" 
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full pr-10"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="w-full pr-10"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center">
                  <span className="text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </div>

            {/* Right side - Background Image */}
            <div className="hidden md:block relative bg-gradient-to-br from-gray-900 to-black">
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="relative h-full flex items-center justify-center p-8">
                {/* AI Dashboard Mockup */}
                <div className="space-y-4 w-full max-w-sm">
                  <div className="bg-gray-800/80 rounded-lg p-4 backdrop-blur-sm border border-cyan-500/30">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span className="text-cyan-400 text-sm font-mono">AI Analytics</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded w-3/4"></div>
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded w-1/2"></div>
                      <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded w-5/6"></div>
                    </div>
                  </div>

                  <div className="bg-gray-800/80 rounded-lg p-4 backdrop-blur-sm border border-blue-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-blue-400 text-sm font-mono">Performance</span>
                      <span className="text-green-400 text-xs">+24.5%</span>
                    </div>
                    <div className="flex items-end space-x-1 h-16">
                      {[40, 65, 45, 80, 55, 70, 85].map((height, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t w-3"
                          style={{ height: `${height}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
