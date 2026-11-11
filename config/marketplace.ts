/** Marketplace des abonnés. */
export const marketplaceConfig = {
  /** Nombre maximum de produits / services par abonné. */
  maxProducts: 12,
  /** Taille maximale d'une photo envoyée (Mo), après compression dans le navigateur. */
  maxImageMb: 3,
  /** Côté le plus long d'une photo après compression (px). */
  imageMaxSide: 1200,
  /** Bucket Supabase Storage des photos. */
  bucket: "produits",
} as const;
