import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

// ============================================================
// SCANNER DE CODE-BARRES
// Ouvre la caméra du téléphone et détecte automatiquement un code-barres.
// Dès qu'un code est détecté, on appelle onDetection(code) et on ferme la caméra.
// ============================================================
export default function Scanner({ onDetection, onFermer }) {
  const idZoneCamera = "zone-scan-camera";
  const scannerRef = useRef(null);
  const dejaDetecteRef = useRef(false); // évite de déclencher plusieurs fois pour le même scan

  useEffect(() => {
    const scanner = new Html5Qrcode(idZoneCamera);
    scannerRef.current = scanner;
    dejaDetecteRef.current = false;

    async function arreterProprement() {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch (erreur) {
        // Rien à faire : la caméra était peut-être déjà arrêtée
      }
    }

    scanner
      .start(
        { facingMode: "environment" }, // caméra arrière du téléphone
        { fps: 10, qrbox: { width: 260, height: 150 } },
        (texteDetecte) => {
          if (dejaDetecteRef.current) return; // ignore les détections en double
          dejaDetecteRef.current = true;
          arreterProprement().then(() => onDetection(texteDetecte));
        },
        () => {
          // Appelé à chaque image sans code détecté : normal, on ignore silencieusement
        }
      )
      .catch((erreur) => {
        console.error("Impossible d'accéder à la caméra :", erreur);
        onFermer();
      });

    // Nettoyage : on coupe la caméra si le composant se ferme
    return () => {
      arreterProprement();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-40 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-white text-lg font-bold">📷 Scanner un code-barres</h2>
        <button onClick={onFermer} className="text-white p-1">
          <X size={28} />
        </button>
      </div>
      {/* html5-qrcode insère automatiquement le flux vidéo dans cette div */}
      <div id={idZoneCamera} className="flex-1" />
      <p className="text-white text-center p-4 text-sm">
        Vise le code-barres du produit avec la caméra
      </p>
    </div>
  );
}
