import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Phone, Mail, MapPin } from "lucide-react"
import Image from "next/image"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="The Meta Future" width={150} height={50} className="h-10 w-auto" />
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              Login
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign Up</Button>
          </div>
        </div>
      </header>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Contact us</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions about our AI-powered marketing platform? We'd love to hear from you. Send us a message and
              we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="space-y-6">
              <Card className="p-8 shadow-lg border-0">
                <CardContent className="p-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Get a Proposal</h2>
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <Input placeholder="John" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <Input placeholder="Doe" className="w-full" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <Input type="email" placeholder="john@example.com" className="w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <Input type="tel" placeholder="+1 (555) 123-4567" className="w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                      <Textarea
                        placeholder="Tell us about your project and how we can help..."
                        className="w-full h-32"
                      />
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">Send Message</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4 text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone Number</h3>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  </CardContent>
                </Card>

                <Card className="p-4 text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email Address</h3>
                    <p className="text-sm text-gray-600">hello@future.com</p>
                  </CardContent>
                </Card>

                <Card className="p-4 text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                    <p className="text-sm text-gray-600">Available 24/7</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* World Map */}
            <div className="space-y-6">
              <Card className="p-8 shadow-lg border-0 h-full">
                <CardContent className="p-0 h-full flex flex-col">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Global Presence</h2>
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 flex items-center justify-center">
                    {/* Simplified World Map SVG */}
                    <div className="relative w-full h-64">
                      <svg viewBox="0 0 400 200" className="w-full h-full">
                        {/* Simplified world map paths */}
                        <path
                          d="M50 80 L120 70 L180 85 L220 75 L280 80 L350 85 L350 120 L280 125 L220 115 L180 125 L120 120 L50 115 Z"
                          fill="#e5e7eb"
                          stroke="#d1d5db"
                          strokeWidth="1"
                        />
                        <path
                          d="M80 100 L140 95 L200 105 L250 100 L300 105 L300 140 L250 135 L200 140 L140 135 L80 130 Z"
                          fill="#e5e7eb"
                          stroke="#d1d5db"
                          strokeWidth="1"
                        />

                        {/* Location markers */}
                        <circle cx="120" cy="90" r="4" fill="#3b82f6" />
                        <circle cx="200" cy="95" r="4" fill="#3b82f6" />
                        <circle cx="280" cy="100" r="4" fill="#3b82f6" />

                        {/* Connecting lines */}
                        <line x1="120" y1="90" x2="200" y2="95" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
                        <line x1="200" y1="95" x2="280" y2="100" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-gray-600">
                      Serving customers worldwide with offices in North America, Europe, and Asia-Pacific regions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
              <h3 className="font-semibold mb-4">Product Company</h3>
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
              <h3 className="font-semibold mb-4">About Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Team and Conditions
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
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">About Us</h3>
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
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Status
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
    </div>
  )
}
