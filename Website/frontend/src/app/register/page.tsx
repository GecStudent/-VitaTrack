import type { Metadata } from "next"
import { RegisterPage } from "@/pages/auth/RegisterPage"

export const metadata: Metadata = {
  title: "Create Your VitaTrack Account",
  description: "Join VitaTrack today and start your journey to better health and nutrition tracking.",
}

export default function Register() {
  return <RegisterPage />
}
