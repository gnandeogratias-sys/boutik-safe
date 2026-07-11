import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Configuration Vite : React + PWA (installable + fonctionne hors-ligne)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // met à jour l'app automatiquement quand tu publies une nouvelle version
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Boutik Safe",
        short_name: "Boutik Safe",
        description: "Gestion de boutique simple pour vendeurs en Afrique francophone",
        theme_color: "#16A34A", // vert - couleur de la barre du haut sur mobile
        background_color: "#FFFFFF",
        display: "standalone", // ouvre en plein écran, comme une vraie app (pas de barre d'adresse)
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Met en cache les fichiers de l'app pour qu'elle marche même sans connexion internet
        globPatterns: ["**/*.{js,css,html,png,svg}"],
      },
    }),
  ],
});
