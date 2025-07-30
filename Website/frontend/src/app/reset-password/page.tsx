import type { Metadata } from "next"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

export const metadata: Metadata = {
  title: "Reset Your Password - VitaTrack",
  description: "Reset your VitaTrack account password to regain access to your health tracking dashboard.",
}

export default function ResetPassword() {
  return <ResetPasswordPage />
}
