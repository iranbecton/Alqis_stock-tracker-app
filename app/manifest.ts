import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ALQIS",
    short_name: "ALQIS",
    description: "Reasoning-first market intelligence",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#13224A",
    background_color: "#13224A",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
