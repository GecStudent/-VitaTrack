"use client"
import { Check } from "lucide-react"

import { cn } from "@/utils/helpers"
import { colors } from "@/styles/design-tokens"

interface ColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  className?: string
}

const colorOptions = [
  { name: "Emerald", value: colors.brand.primary, class: "bg-emerald-500" },
  { name: "Blue", value: "#3b82f6", class: "bg-blue-500" },
  { name: "Purple", value: "#8b5cf6", class: "bg-purple-500" },
  { name: "Pink", value: "#ec4899", class: "bg-pink-500" },
  { name: "Orange", value: "#f59e0b", class: "bg-orange-500" },
  { name: "Red", value: "#ef4444", class: "bg-red-500" },
  { name: "Indigo", value: "#6366f1", class: "bg-indigo-500" },
  { name: "Cyan", value: "#06b6d4", class: "bg-cyan-500" },
]

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {colorOptions.map((color) => (
        <button
          key={color.value}
          type="button"
          className={cn(
            "relative h-8 w-8 rounded-full border-2 border-transparent transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            color.class,
            value === color.value && "ring-2 ring-ring ring-offset-2",
          )}
          onClick={() => onChange?.(color.value)}
          title={color.name}
        >
          {value === color.value && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  )
}
