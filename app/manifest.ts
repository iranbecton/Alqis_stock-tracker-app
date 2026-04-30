import type { MetadataRoute } from "next";
import {
  ALQIS_ICON_192,
  ALQIS_ICON_512,
  ALQIS_MASKABLE_ICON_512,
} from "@/lib/brand/assets";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ALQIS",
    short_name: "ALQIS",
    description: "AI-powered market intelligence that explains why stocks move.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#081019",
    theme_color: "#081019",
    orientation: "portrait",
    categories: ["finance", "productivity", "business"],
    icons: [
      {
        src: ALQIS_ICON_192,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: ALQIS_ICON_512,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: ALQIS_MASKABLE_ICON_512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
