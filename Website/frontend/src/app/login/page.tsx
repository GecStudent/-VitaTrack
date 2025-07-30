import type { Metadata } from "next"
import { LoginPage } from "@/pages/auth/LoginPage"

export const metadata: Metadata = {
  title: "Sign In to VitaTrack",
  description: "Sign in to your VitaTrack account to continue tracking your health and nutrition goals.",
}

export default function Login() {
  return <LoginPage />
}
