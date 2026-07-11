// ============================================================
// STOCKAGE LOCAL DU NAVIGATEUR (remplace window.storage de Claude)
// Utilise localStorage : les données restent sur CE téléphone/navigateur.
// Pas de synchronisation entre appareils avec ce système simple.
// ============================================================

export const stockageLocal = {
  // Lit une valeur. Renvoie { value: "..." } ou null si absente.
  async get(cle) {
    try {
      const valeur = localStorage.getItem(cle);
      if (valeur === null) return null;
      return { value: valeur };
    } catch (erreur) {
      console.error("Erreur lecture localStorage :", erreur);
      return null;
    }
  },

  // Enregistre une valeur (doit être une chaîne de caractères, donc JSON.stringify avant).
  async set(cle, valeur) {
    try {
      localStorage.setItem(cle, valeur);
      return true;
    } catch (erreur) {
      console.error("Erreur écriture localStorage :", erreur);
      return false;
    }
  },
};
