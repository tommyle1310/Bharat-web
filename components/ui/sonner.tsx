"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
        },
        success: {
          style: {
            background: 'hsl(142, 76%, 95%)',
            color: 'hsl(142, 76%, 20%)',
            border: '1px solid hsl(142, 76%, 60%)',
          },
        },
        error: {
          style: {
            background: 'hsl(0, 84%, 95%)',
            color: 'hsl(0, 84%, 20%)',
            border: '1px solid hsl(0, 84%, 60%)',
          },
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
