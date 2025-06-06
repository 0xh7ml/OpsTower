import LoginContainer from "@/components/auth/login-container"
import { Toaster } from "react-hot-toast"

export default function LoginPage() {
  return (
    <>
      <LoginContainer />
      <Toaster position="bottom-right" />
    </>
  )
}
