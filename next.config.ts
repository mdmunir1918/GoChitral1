import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

function isPrivateIpv4(address: string) {
  const [first, second] = address.split(".").map(Number);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

const localNetworkHosts = Object.values(networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((address) => !address.internal && address.family === "IPv4" && isPrivateIpv4(address.address))
  .map((address) => address.address);
const localDevelopmentHosts = [...new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0", ...localNetworkHosts])];
const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  ...(isDevelopment ? { allowedDevOrigins: localDevelopmentHosts } : {}),
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    cpus: 1,
    serverActions: {
      bodySizeLimit: "27mb",
      ...(isDevelopment
        ? { allowedOrigins: localDevelopmentHosts.map((host) => `${host}:3000`) }
        : {}),
    },
  },
};

export default nextConfig;
