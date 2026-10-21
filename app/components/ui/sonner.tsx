import { Toaster as SonnerToaster } from "sonner"

/**
 * Single toast host. Mounted once in the root layout; modules call `toast.*`
 * from mutation callbacks. Theme is light-only (the app has no dark mode yet), so
 * no next-themes dependency is needed.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{ classNames: { toast: "rounded-xl" } }}
    />
  )
}
