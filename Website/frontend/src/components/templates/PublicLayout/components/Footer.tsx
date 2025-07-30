import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-primary" />
              <span className="font-bold">VitaTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform your health journey with personalized nutrition and fitness tracking.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <div className="space-y-2 text-sm">
              <Link href="/features" className="block hover:text-primary">
                Features
              </Link>
              <Link href="/pricing" className="block hover:text-primary">
                Pricing
              </Link>
              <Link href="/premium" className="block hover:text-primary">
                Premium
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block hover:text-primary">
                About
              </Link>
              <Link href="/contact" className="block hover:text-primary">
                Contact
              </Link>
              <Link href="/careers" className="block hover:text-primary">
                Careers
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <div className="space-y-2 text-sm">
              <Link href="/privacy" className="block hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block hover:text-primary">
                Terms of Service
              </Link>
              <Link href="/cookies" className="block hover:text-primary">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 VitaTrack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
