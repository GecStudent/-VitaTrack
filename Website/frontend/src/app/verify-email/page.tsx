import type { Metadata } from "next"
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage"

export const metadata: Metadata = {
  title: "Verify Your Email - VitaTrack",
  description: "Verify your email address to complete your VitaTrack account setup.",
}

export default function VerifyEmail() {
  return <VerifyEmailPage />
}
