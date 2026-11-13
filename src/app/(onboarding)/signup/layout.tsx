import { SignupShell } from "@/components/onboarding/signup-frame"

/** The sign-up pages share one frame, so the logo bar and the illustration stay still while the card changes. */
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <SignupShell>{children}</SignupShell>
}
