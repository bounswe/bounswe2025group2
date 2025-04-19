import * as React from "react"

import { cn } from "@/lib/utils"
import { useTheme } from "@/theme/ThemeContext"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    const { theme } = useTheme();
    const colors = theme === 'dark' ? {
      placeholder: '#555555',
      text: '#ffffff'
    } : {
      placeholder: '#9a0000',
      text: '#800000'
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&::placeholder]:text-[var(--placeholder-color)]",
          className
        )}
        style={{
          ...style,
          '--placeholder-color': colors.placeholder,
          color: colors.text,
        } as React.CSSProperties}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
