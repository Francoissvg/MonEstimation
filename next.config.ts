import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// Adresses IPv4 du PC sur le réseau local (Wi-Fi, câble...), relues à chaque démarrage.
function localNetworkAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal)
    .map((net) => net!.address);
}

const nextConfig: NextConfig = {
  // Développement uniquement : autorise l'ouverture du serveur local depuis un téléphone
  // sur le même Wi-Fi. Sans effet sur le site en ligne.
  allowedDevOrigins: localNetworkAddresses(),
};

export default nextConfig;
