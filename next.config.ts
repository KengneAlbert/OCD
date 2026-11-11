import type { NextConfig } from "next";

/**
 * NOTIFICATION_PROVIDER (whatsapp | brevo | both) est lu côté serveur par les
 * Route Handlers, et exposé au navigateur au moment du build : passer de la
 * phase 1 (WhatsApp) à la phase 2 (Brevo) = changer la variable + redéployer.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_NOTIFICATION_PROVIDER: process.env.NOTIFICATION_PROVIDER ?? "whatsapp",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Photos de la marketplace (Supabase Storage, bucket public « produits »).
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
  // Envoi des photos de produits par Server Action (compressées dans le navigateur, 3 Mo max).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Ancienne page de confirmation (avant « réserver = payer ») : la suite se passe sur /paiement/[token].
  async redirects() {
    return [
      { source: "/confirmation", destination: "/reserver", permanent: true },
      { source: "/lives", destination: "/live", permanent: true },
      { source: "/espace", destination: "/moi", permanent: true },
      { source: "/espace/connexion", destination: "/connexion", permanent: true },
    ];
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
