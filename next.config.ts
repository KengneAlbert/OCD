import type { NextConfig } from "next";

/**
 * NOTIFICATION_PROVIDER (whatsapp | brevo | both) est lu côté serveur par les
 * Route Handlers, et exposé au navigateur au moment du build : passer de la
 * phase 1 (WhatsApp) à la phase 2 (Brevo) = changer la variable + redéployer.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_NOTIFICATION_PROVIDER: process.env.NOTIFICATION_PROVIDER ?? "whatsapp",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
