import SignupContainer from "@/components/auth/signup-container"
import { Toaster } from "react-hot-toast"

export default function SignupPage() {
  return (
    <>
      <SignupContainer />
      <Toaster position="bottom-right" />
    </>
  )
}
