"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"
import { AuthModals } from "@/components/auth-modals"
import { Header } from "@/components/common/header"
import { useAuth } from "@/lib/auth-context"
import {
  BarChart3,
  Users,
  Calendar,
  Eye,
  Bot,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  TrendingUp,
  Activity,
  Smartphone,
} from "lucide-react"

export default function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // Mock user data for dashboard mockup preview
  const mockUser = {
    name: "Adnan Ahmed",
    avatar: null // Set to a URL string if user has an avatar
  }

  // Function to generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSwitchToSignup = () => {
    setIsLoginOpen(false)
    setIsSignupOpen(true)
  }

  const handleSwitchToLogin = () => {
    setIsSignupOpen(false)
    setIsLoginOpen(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header 
        user={user} 
        onLoginClick={() => setIsLoginOpen(true)}
        onSignupClick={() => setIsSignupOpen(true)}
      />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
              ✨ AI-powered marketing platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              AI-Driven
              <br />
              Marketing & CRM
              <br />
              Dashboard
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Revolutionize your marketing strategy with advanced AI automation. Comprehensive CRM solutions that
              streamline your customer relationships and boost your business growth.
            </p>
            <Button
              style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }}
              className="hover:opacity-90 text-white px-8 py-3 text-lg"
              onClick={() => user ? router.push('/dashboard') : setIsSignupOpen(true)}
            >
              {user ? 'Go To Dashboard' : 'Get Started'}
            </Button>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="bg-white rounded-xl shadow-2xl p-6">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Revenue</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">$24.5K</div>
                    <div className="text-xs text-green-600">+12.5%</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">Users</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">1,234</div>
                    <div className="text-xs text-green-600">+8.2%</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-gray-600">Conversion</span>
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={mockUser.avatar || undefined} alt={mockUser.name} />
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {getInitials(mockUser.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="text-lg font-bold text-gray-900">3.2%</div>
                    <div className="text-xs text-green-600">+0.5%</div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="bg-gray-50 rounded-lg p-4 h-32 flex items-end justify-between">
                  <div className="flex items-end space-x-1 h-full">
                    {[40, 65, 45, 80, 55, 70, 85, 60, 75, 90, 65, 80].map((height, i) => (
                      <div key={i} className="bg-blue-500 rounded-t w-3" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="flex justify-between mt-4 text-sm text-gray-600">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600">
              Everything you need to dominate your marketing landscape with AI-powered precision
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Advanced Analytics */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Get deep insights into your marketing performance with AI-powered predictive analytics.
                </p>
              </CardContent>
            </Card>

            {/* Smart CRM */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart CRM</h3>
                <p className="text-gray-600">
                  Manage customer relationships with AI-driven insights and automated workflows.
                </p>
              </CardContent>
            </Card>

            {/* Post Scheduler */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Post Scheduler</h3>
                <p className="text-gray-600">
                  Schedule and automate your social media posts across multiple platforms.
                </p>
              </CardContent>
            </Card>

            {/* Unified View */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Unified View</h3>
                <p className="text-gray-600">
                  Get a complete overview of your marketing campaigns and customer interactions.
                </p>
              </CardContent>
            </Card>

            {/* AI Automation */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Automation</h3>
                <p className="text-gray-600">
                  Automate repetitive tasks and optimize your marketing workflows with AI.
                </p>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Assistant</h3>
                <p className="text-gray-600">
                  Get intelligent recommendations and insights from your personal AI marketing assistant.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results-Driven Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Taking Results-Driven Digital Marketing</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our AI-driven platform helps businesses of all sizes achieve remarkable growth through intelligent
                automation, data-driven insights, and personalized customer experiences. Transform your marketing
                strategy and see measurable results that drive your business forward.
              </p>
              <p className="text-gray-600">
                Whether you're looking to increase conversions, improve customer retention, or streamline your marketing
                operations, our comprehensive platform provides the tools and insights you need to succeed in today's
                competitive digital landscape.
              </p>
            </div>

            {/* Dashboard Screenshots Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Top Left - Mobile App */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="text-2xl font-bold mb-2">85%</div>
                    <div className="text-sm opacity-90">Increase in ROI</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-lg border">
                    <div className="bg-gray-900 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <Smartphone className="w-4 h-4 text-white" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-2 bg-blue-500 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Mobile Dashboard</div>
                  </div>
                </div>

                {/* Top Right */}
                <div className="space-y-4 mt-8">
                  <div className="bg-white rounded-lg p-4 shadow-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-900">Analytics</div>
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="h-2 bg-blue-200 rounded-full flex-1 mr-2">
                          <div className="h-2 bg-blue-600 rounded-full w-3/4"></div>
                        </div>
                        <span className="text-xs text-gray-600">75%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-2 bg-green-200 rounded-full flex-1 mr-2">
                          <div className="h-2 bg-green-600 rounded-full w-1/2"></div>
                        </div>
                        <span className="text-xs text-gray-600">50%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="h-2 bg-purple-200 rounded-full flex-1 mr-2">
                          <div className="h-2 bg-purple-600 rounded-full w-5/6"></div>
                        </div>
                        <span className="text-xs text-gray-600">85%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-lg p-6 text-white">
                    <div className="text-2xl font-bold mb-2">3x</div>
                    <div className="text-sm opacity-90">Faster Growth</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Transform Your Marketing?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using our AI-powered platform to drive growth and success.
          </p>
          <Button
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            onClick={() => user ? router.push('/dashboard') : setIsSignupOpen(true)}
          >
            {user ? 'Go To Dashboard' : 'Get Started Free'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="The Meta Future"
                  width={120}
                  height={40}
                  className="h-8 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-gray-400">
                Revolutionize your marketing strategy with advanced AI automation and comprehensive CRM solutions.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 The Meta Future. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <AuthModals
        isLoginOpen={isLoginOpen}
        isSignupOpen={isSignupOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignupClose={() => setIsSignupOpen(false)}
        onSwitchToSignup={handleSwitchToSignup}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  )
}
