import DashboardContainer from "@/components/dashboard-container"
import { Toaster } from "react-hot-toast"

export default function DashboardPage() {
  return (
    <>
      <DashboardContainer />
      <Toaster position="bottom-right" />
    </>
  )
}
