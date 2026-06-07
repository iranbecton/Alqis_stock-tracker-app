import withSerwist from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

const withSerwistConfig = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
  register: false,
  exclude: [/\.map$/, /^manifest.*\.js$/, /app\/api\//],
  additionalPrecacheEntries: [{ url: "/offline", revision: null }],
});

export default withSerwistConfig(nextConfig);
