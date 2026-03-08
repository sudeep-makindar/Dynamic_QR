"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// We use any type to avoid explicit dependency warnings until typescript catches up
export function ThemeProvider({ children, ...props }: any) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
