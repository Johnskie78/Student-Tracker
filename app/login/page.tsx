"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, KeyRound, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
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
  <div
    className="
      min-h-screen
      flex
      items-center
      justify-center
      relative
      overflow-hidden
      bg-cover
      bg-center
      bg-no-repeat
      bg-fixed
      font-sans
    "
    style={{
      backgroundImage:
        "url('/background.jpg')",
    }}
  >
    {/* Premium Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-cyan-950/40 to-slate-950/80 backdrop-blur-[4px]" />

    {/* Floating Glow Effects */}
    <div className="absolute top-0 left-0 h-[400px] w-[400px] bg-indigo-500/20 blur-[140px] rounded-full" />
    <div className="absolute bottom-0 right-0 h-[350px] w-[350px] bg-cyan-500/10 blur-[120px] rounded-full" />

    <Card
      className="
        relative
        w-full
        max-w-md
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-[#0b1120]/85
        backdrop-blur-2xl
        shadow-[0_25px_70px_rgba(0,0,0,0.55)]
        animate-in
        fade-in
        zoom-in-95
        slide-in-from-bottom-8
        duration-700
        z-10
      "
    >
      {/* Card Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 h-60 w-60 rounded-full bg-indigo-500/20 blur-[90px]" />
        <div className="absolute -bottom-24 -right-24 h-60 w-60 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <CardHeader className="relative z-10 pt-10 space-y-5">
        {/* Logo */}
        <div className="flex justify-center">
          <div
            className="
              relative
              h-24
              w-24
              flex
              items-center
              justify-center
              rounded-[28px]
              border
              border-white/10
              bg-gradient-to-br
              from-slate-800
              to-slate-900
              shadow-[0_8px_30px_rgba(99,102,241,0.30)]
            "
          >
            <Image
              src="/Logo.png"
              alt="CCSA Logo"
              width={72}
              height={72}
              className="object-contain"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <CardTitle
            className="
              text-center
              text-4xl
              font-black
              tracking-tight
              text-white
            "
          >
            Portal Login
          </CardTitle>

          <CardDescription
            className="
              text-center
              text-slate-300
              text-base
              leading-relaxed
              px-8
            "
          >
            Authorized access for Christian Colleges of Southeast Asia personnel.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 px-8 pb-6 space-y-5">
        {/* Error */}
        {error && (
          <Alert className="border border-red-500/20 bg-red-500/10 text-red-200 rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="
                text-xs
                uppercase
                tracking-[0.15em]
                font-black
                text-slate-400
              "
            >
              Username
            </Label>

            <Input
              id="username"
              placeholder="Enter admin ID or username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="
                h-14
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                text-white
                placeholder:text-slate-500
                focus:border-indigo-500
                focus:ring-2
                focus:ring-indigo-500/30
                transition-all
              "
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="
                text-xs
                uppercase
                tracking-[0.15em]
                font-black
                text-slate-400
              "
            >
              Password
            </Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  h-14
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  text-white
                  placeholder:text-slate-500
                  focus:border-indigo-500
                  focus:ring-2
                  focus:ring-indigo-500/30
                  transition-all
                  pr-14
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  hover:text-white
                  transition-colors
                "
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="
              w-full
              h-14
              rounded-2xl
              bg-gradient-to-r
              from-indigo-600
              via-violet-600
              to-blue-600
              text-white
              font-extrabold
              hover:scale-[1.02]
              hover:shadow-[0_12px_40px_rgba(79,70,229,0.45)]
              transition-all
              duration-300
              active:scale-[0.98]
            "
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              "Sign In to Dashboard"
            )}
          </Button>
        </form>

        {/* Links */}
        <div className="pt-4 space-y-4">
          <Link
            href="/forgot-credentials"
            className="
              block
              text-center
              text-xs
              font-black
              uppercase
              tracking-[0.15em]
              text-indigo-400
              hover:text-indigo-300
              transition
            "
          >
            Account Recovery
          </Link>

          <div className="h-px bg-white/10" />

          <Link
            href="/scanner"
            className="
              flex
              items-center
              justify-center
              gap-2
              text-slate-400
              hover:text-white
              transition
              group
              text-sm
              font-medium
            "
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Return to Public Scanner
          </Link>
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="relative z-10 border-t border-white/10 bg-white/[0.03] py-5">
        <div className="flex items-start gap-3 w-full justify-center">
          <KeyRound className="h-5 w-5 text-indigo-400 mt-0.5" />

          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
              System Notice
            </span>

            <p className="text-xs text-slate-400 mt-1">
              Default:
              <span className="text-indigo-300 font-semibold">
                {" "}admin
              </span>
              {" / "}
              <span className="text-indigo-300 font-semibold">
                admin123
              </span>
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  </div>
)
}