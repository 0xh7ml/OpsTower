import AnalyticsContainer from "@/components/analytics/analytics-container"
import { Toaster } from "react-hot-toast"

export default function AnalyticsPage() {
  return (
    <>
      <AnalyticsContainer />
      <Toaster position="bottom-right" />
    </>
  )
}
