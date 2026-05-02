"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LockKeyhole, AlertCircle, KeyRound, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        router.push("/dashboard")
      } else {
        setError("Invalid credentials. Please verify your username and password.")
      }
    } catch (err) {
      setError("A connection error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-cover bg-center bg-no-repeat bg-fixed animate-in fade-in duration-700"style={{ 
    backgroundImage: "linear-gradient(rgba(51, 50, 50, 0.53), rgba(51, 50, 50, 0.53)), url('/background.jpg')" }}>
      {/* Decorative Overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

      <Card className="w-full max-w-md shadow-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out z-10">
        <CardHeader className="space-y-2 pt-8">
          <div className="flex justify-center mb-2">
            <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              <Image 
                src="/Logo.png" 
                alt="CCSA Logo" 
                width={60} 
                height={60} 
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-center tracking-tight text-white">
            Portal Login
          </CardTitle>
          <CardDescription className="text-center text-slate-300 px-6">
            Authorized access for Christian Colleges of Southeast Asia personnel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-200 animate-in shake-in duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                Username
              </Label>
              <Input
                id="username"
                placeholder="Enter admin ID or username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:ring-indigo-500/50 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:ring-indigo-500/50 rounded-xl pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : "Sign In to Dashboard"}
            </Button>
          </form>

          <div className="flex flex-col gap-3 pt-2">
            <Link 
              href="/forgot-credentials" 
              className="text-indigo-400 hover:text-indigo-300 text-xs font-bold text-center uppercase tracking-widest transition-colors"
            >
              Account Recovery
            </Link>
            <div className="h-px bg-white/5 w-full my-1" />
            <Link 
              href="/scanner" 
              className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to Public Scanner
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col border-t border-white/5 bg-white/5 py-4 rounded-b-2xl">
          <div className="flex items-start gap-3 px-2">
            <KeyRound className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Notice</span>
              <p className="text-[11px] leading-tight text-slate-400 font-medium">
                Default: <span className="text-indigo-300">admin</span> / <span className="text-indigo-300">admin123</span>
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}