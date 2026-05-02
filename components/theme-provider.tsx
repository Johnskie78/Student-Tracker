"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: Readonly<ThemeProviderProps>) {
  const [mounted, setMounted] = React.useState(false)

  // Wait for the component to be "mounted" in the browser
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // If not mounted, just show the children without the theme script
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}