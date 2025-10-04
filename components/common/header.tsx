"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bell, ChevronDown, LogOut } from "lucide-react"
import { getUserInitials } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Tab = "dashboard" | "integrations" | "crm" | "scheduler" | "messages" | "reports" | "settings"

interface HeaderProps {
  user: any
  setActiveTab?: (tab: Tab) => void
  setIsLogoutOpen?: (open: boolean) => void
  onLoginClick?: () => void
  onSignupClick?: () => void
}

export function Header({ user, setActiveTab, setIsLogoutOpen, onLoginClick, onSignupClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="The Meta Future" width={120} height={40} priority />
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open notifications">
                    <Bell className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-64">
                  <DropdownMenuItem className="font-medium">No new notifications</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {setActiveTab && (
                    <DropdownMenuItem onSelect={() => setActiveTab("settings")}>Settings</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {setIsLogoutOpen && (
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => setIsLogoutOpen(true)}>
                      Logout
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900" onClick={onLoginClick}>
                Login
              </Button>
              <Button style={{ background: 'linear-gradient(90deg, #459AFF 0%, #9F8BF9 100%)' }} className="hover:opacity-90 text-white" onClick={onSignupClick}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}