import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  CreditCard,
  BarChart3,
  Plus,
  Minus,
  Trash2,
  Send,
  AlertTriangle,
  X,
  Camera,
} from "lucide-react";
import { stockageLocal } from "./stockageLocal.js";
import Scanner from "./Scanner.jsx";

// ============================================================
// BOUTIK SAFE
// Application de gestion de boutique pour l'Afrique francophone
// Ecrans : Vente Express / Stock / Crédit / Rapport
// Stockage : persistant (remplace Supabase dans cette démo)
// ============================================================

// --- Liste d'émojis simples pour représenter la "photo" produit ---
const EMOJIS_PRODUITS = ["🥛", "🍞", "🧼", "🧴", "🍚", "🧂", "🥫", "🍬", "🧃", "🥚", "🧈", "📦"];

// --- Produits de départ (juste pour que l'app ne soit pas vide au premier lancement) ---
const PRODUITS_INITIAUX = [
  { id: "p1", nom: "Lait en poudre", emoji: "🥛", prix: 1500, stock: 12, peremption: "2026-07-20", codeBarre: "" },
  { id: "p2", nom: "Pain", emoji: "🍞", prix: 250, stock: 3, peremption: "2026-07-06", codeBarre: "" },
  { id: "p3", nom: "Savon", emoji: "🧼", prix: 500, stock: 20, peremption: "", codeBarre: "" },
  { id: "p4", nom: "Riz (kg)", emoji: "🍚", prix: 700, stock: 8, peremption: "", codeBarre: "" },
];

function genererId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formaterFCFA(montant) {
  return new Intl.NumberFormat("fr-FR").format(montant) + " F";
}

// Nombre de jours restants avant péremption (négatif = déjà périmé)
function joursAvantPeremption(dateStr) {
  if (!dateStr) return null;
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  const datePeremption = new Date(dateStr);
  const diffMs = datePeremption - aujourdHui;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function dateAujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function BoutikSafe() {
  const [ongletActif, setOngletActif] = useState("vente");
  const [produits, setProduits] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [credits, setCredits] = useState([]);
  const [numeroPatron, setNumeroPatron] = useState("");
  const [chargement, setChargement] = useState(true);
  const [messageInfo, setMessageInfo] = useState(null);

  // --- Fonction utilitaire : lit une clé du stockage sans jamais planter ---
  async function chargerCle(cle) {
    try {
      const resultat = await stockageLocal.get(cle);
      if (resultat && resultat.value) {
        return JSON.parse(resultat.value);
      }
      return null;
    } catch (erreur) {
      // Clé absente ou stockage indisponible : on continue simplement sans planter
      return null;
    }
  }

  // --- Chargement initial depuis le stockage persistant ---
  useEffect(() => {
    async function charger() {
      try {
        const produitsSauvegardes = await chargerCle("produits");
        if (produitsSauvegardes && produitsSauvegardes.length > 0) {
          setProduits(produitsSauvegardes);
        } else {
          setProduits(PRODUITS_INITIAUX);
          try {
            await stockageLocal.set("produits", JSON.stringify(PRODUITS_INITIAUX));
          } catch (erreur) {
            console.error("Erreur sauvegarde initiale :", erreur);
          }
        }

        const ventesSauvegardees = await chargerCle("ventes");
        setVentes(ventesSauvegardees || []);

        const creditsSauvegardes = await chargerCle("credits");
        setCredits(creditsSauvegardes || []);

        const patronSauvegarde = await chargerCle("numeroPatron");
        setNumeroPatron(patronSauvegarde || "");
      } catch (erreur) {
        console.error("Erreur de chargement :", erreur);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  // --- Fonctions de sauvegarde (à appeler après chaque modification) ---
  async function sauvegarderProduits(nouveauxProduits) {
    setProduits(nouveauxProduits);
    try {
      await stockageLocal.set("produits", JSON.stringify(nouveauxProduits));
    } catch (e) {
      console.error("Erreur sauvegarde produits :", e);
    }
  }

  async function sauvegarderVentes(nouvellesVentes) {
    setVentes(nouvellesVentes);
    try {
      await stockageLocal.set("ventes", JSON.stringify(nouvellesVentes));
    } catch (e) {
      console.error("Erreur sauvegarde ventes :", e);
    }
  }

  async function sauvegarderCredits(nouveauxCredits) {
    setCredits(nouveauxCredits);
    try {
      await stockageLocal.set("credits", JSON.stringify(nouveauxCredits));
    } catch (e) {
      console.error("Erreur sauvegarde credits :", e);
    }
  }

  async function sauvegarderNumeroPatron(numero) {
    setNumeroPatron(numero);
    try {
      await stockageLocal.set("numeroPatron", JSON.stringify(numero));
    } catch (e) {
      console.error("Erreur sauvegarde numero patron :", e);
    }
  }

  function afficherMessage(texte) {
    setMessageInfo(texte);
    setTimeout(() => setMessageInfo(null), 2500);
  }

  // --- Alertes globales (stock bas + péremption proche) ---
  const alertesStock = produits.filter((p) => p.stock < 5);
  const alertesPeremption = produits.filter((p) => {
    const j = joursAvantPeremption(p.peremption);
    return j !== null && j < 7;
  });
  const nombreAlertes = alertesStock.length + alertesPeremption.length;

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-600">
        <p className="text-white text-2xl font-bold">Chargement de Boutik Safe...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* ---------- EN-TETE ---------- */}
      <header className="bg-green-600 text-white px-4 py-4 flex items-center justify-between shadow-md sticky top-0 z-20">
        <h1 className="text-2xl font-extrabold tracking-tight">🏪 Boutik Safe</h1>
        {nombreAlertes > 0 && ongletActif !== "stock" && (
          <button
            onClick={() => setOngletActif("stock")}
            className="bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 animate-pulse"
          >
            <AlertTriangle size={16} /> {nombreAlertes}
          </button>
        )}
      </header>

      {/* ---------- MESSAGE FLASH ---------- */}
      {messageInfo && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-700 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-lg font-semibold">
          {messageInfo}
        </div>
      )}

      {/* ---------- CONTENU DE L'ONGLET ACTIF ---------- */}
      <main className="flex-1 overflow-y-auto pb-24">
        {ongletActif === "vente" && (
          <EcranVenteExpress
            produits={produits}
            sauvegarderProduits={sauvegarderProduits}
            ventes={ventes}
            sauvegarderVentes={sauvegarderVentes}
            afficherMessage={afficherMessage}
          />
        )}
        {ongletActif === "stock" && (
          <EcranStock
            produits={produits}
            sauvegarderProduits={sauvegarderProduits}
            alertesStock={alertesStock}
            alertesPeremption={alertesPeremption}
            afficherMessage={afficherMessage}
          />
        )}
        {ongletActif === "credit" && (
          <EcranCredit
            credits={credits}
            sauvegarderCredits={sauvegarderCredits}
            afficherMessage={afficherMessage}
          />
        )}
        {ongletActif === "rapport" && (
          <EcranRapport
            ventes={ventes}
            numeroPatron={numeroPatron}
            sauvegarderNumeroPatron={sauvegarderNumeroPatron}
          />
        )}
      </main>

      {/* ---------- BARRE DE NAVIGATION EN BAS ---------- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-green-600 flex justify-around items-stretch z-20">
        <BoutonNav
          actif={ongletActif === "vente"}
          onClick={() => setOngletActif("vente")}
          icone={<ShoppingCart size={26} />}
          label="Vente"
        />
        <BoutonNav
          actif={ongletActif === "stock"}
          onClick={() => setOngletActif("stock")}
          icone={<Package size={26} />}
          label="Stock"
          alerte={nombreAlertes > 0}
        />
        <BoutonNav
          actif={ongletActif === "credit"}
          onClick={() => setOngletActif("credit")}
          icone={<CreditCard size={26} />}
          label="Crédit"
        />
        <BoutonNav
          actif={ongletActif === "rapport"}
          onClick={() => setOngletActif("rapport")}
          icone={<BarChart3 size={26} />}
          label="Rapport"
        />
      </nav>
    </div>
  );
}

// ============================================================
// BOUTON DE NAVIGATION
// ============================================================
function BoutonNav({ actif, onClick, icone, label, alerte }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative ${
        actif ? "text-green-700" : "text-gray-400"
      }`}
    >
      {icone}
      {alerte && <span className="absolute top-1 right-1/4 w-2.5 h-2.5 bg-red-600 rounded-full" />}
      <span className={`text-xs font-bold ${actif ? "text-green-700" : "text-gray-400"}`}>{label}</span>
    </button>
  );
}

// ============================================================
// ECRAN 1 : VENTE EXPRESS
// ============================================================
function EcranVenteExpress({ produits, sauvegarderProduits, ventes, sauvegarderVentes, afficherMessage }) {
  // Panier : { [idProduit]: quantite }
  const [panier, setPanier] = useState({});
  const [scannerOuvert, setScannerOuvert] = useState(false);

  function changerQuantite(idProduit, delta) {
    setPanier((ancien) => {
      const produit = produits.find((p) => p.id === idProduit);
      const quantiteActuelle = ancien[idProduit] || 0;
      let nouvelleQuantite = quantiteActuelle + delta;
      if (nouvelleQuantite < 0) nouvelleQuantite = 0;
      if (produit && nouvelleQuantite > produit.stock) nouvelleQuantite = produit.stock;
      return { ...ancien, [idProduit]: nouvelleQuantite };
    });
  }

  // Appelé quand la caméra détecte un code-barres
  function traiterCodeScanne(codeDetecte) {
    setScannerOuvert(false);
    const produitTrouve = produits.find((p) => p.codeBarre && p.codeBarre === codeDetecte);
    if (produitTrouve) {
      changerQuantite(produitTrouve.id, 1);
      afficherMessage(`✅ ${produitTrouve.nom} ajouté au panier`);
    } else {
      afficherMessage("⚠️ Aucun produit avec ce code-barres");
    }
  }

  const articlesPanier = Object.entries(panier).filter(([, qte]) => qte > 0);
  const totalPanier = articlesPanier.reduce((somme, [id, qte]) => {
    const produit = produits.find((p) => p.id === id);
    return somme + (produit ? produit.prix * qte : 0);
  }, 0);

  function validerVente() {
    if (articlesPanier.length === 0) return;

    // 1. Déduire le stock de chaque produit vendu
    const nouveauxProduits = produits.map((p) => {
      const qteVendue = panier[p.id] || 0;
      return qteVendue > 0 ? { ...p, stock: p.stock - qteVendue } : p;
    });

    // 2. Enregistrer la vente dans l'historique
    const nouvelleVente = {
      id: genererId(),
      date: new Date().toISOString(),
      articles: articlesPanier.map(([id, qte]) => {
        const produit = produits.find((p) => p.id === id);
        return { produitId: id, nom: produit.nom, quantite: qte, prix: produit.prix };
      }),
      total: totalPanier,
    };

    sauvegarderProduits(nouveauxProduits);
    sauvegarderVentes([...ventes, nouvelleVente]);
    setPanier({});
    afficherMessage("✅ Vente enregistrée : " + formaterFCFA(totalPanier));
  }

  return (
    <div className="p-3">
      {/* ---------- BOUTON SCANNER (scan optionnel, pas obligatoire) ---------- */}
      <button
        onClick={() => setScannerOuvert(true)}
        className="w-full bg-gray-800 text-white text-lg font-extrabold py-3.5 rounded-2xl shadow-md mb-3 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Camera size={22} /> Scanner un produit
      </button>

      <div className="grid grid-cols-2 gap-3">
        {produits.map((produit) => {
          const quantite = panier[produit.id] || 0;
          const enRupture = produit.stock === 0;
          return (
            <div
              key={produit.id}
              className={`rounded-2xl border-4 ${
                quantite > 0 ? "border-green-600 bg-green-50" : "border-gray-200 bg-white"
              } p-3 flex flex-col items-center shadow-sm ${enRupture ? "opacity-40" : ""}`}
            >
              <div className="text-5xl mb-1">{produit.emoji}</div>
              <div className="text-base font-bold text-center leading-tight">{produit.nom}</div>
              <div className="text-lg font-extrabold text-green-700 mb-2">{formaterFCFA(produit.prix)}</div>
              <div className="text-xs text-gray-500 mb-2">Stock : {produit.stock}</div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => changerQuantite(produit.id, -1)}
                  disabled={quantite === 0}
                  className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center disabled:opacity-30 active:scale-95"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-extrabold w-6 text-center">{quantite}</span>
                <button
                  onClick={() => changerQuantite(produit.id, 1)}
                  disabled={enRupture}
                  className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center disabled:opacity-30 active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- RESUME DU PANIER + BOUTON VALIDER (fixe en bas) ---------- */}
      {articlesPanier.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t-4 border-green-600 p-3 shadow-2xl z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-gray-700">
              {articlesPanier.length} article{articlesPanier.length > 1 ? "s" : ""}
            </span>
            <span className="text-2xl font-extrabold text-green-700">{formaterFCFA(totalPanier)}</span>
          </div>
          <button
            onClick={validerVente}
            className="w-full bg-green-600 text-white text-xl font-extrabold py-4 rounded-2xl shadow-md active:scale-[0.98]"
          >
            ✅ Valider Vente
          </button>
        </div>
      )}

      {/* ---------- CAMERA DE SCAN (affichée par-dessus tout le reste) ---------- */}
      {scannerOuvert && (
        <Scanner onDetection={traiterCodeScanne} onFermer={() => setScannerOuvert(false)} />
      )}
    </div>
  );
}

// ============================================================
// ECRAN 2 : GESTION DU STOCK
// ============================================================
function EcranStock({ produits, sauvegarderProduits, alertesStock, alertesPeremption, afficherMessage }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [produitEnEdition, setProduitEnEdition] = useState(null);

  function ouvrirAjout() {
    setProduitEnEdition(null);
    setFormulaireOuvert(true);
  }

  function ouvrirEdition(produit) {
    setProduitEnEdition(produit);
    setFormulaireOuvert(true);
  }

  function enregistrerProduit(donnees) {
    if (produitEnEdition) {
      // Modification d'un produit existant
      const nouveauxProduits = produits.map((p) =>
        p.id === produitEnEdition.id ? { ...p, ...donnees } : p
      );
      sauvegarderProduits(nouveauxProduits);
      afficherMessage("✏️ Produit modifié");
    } else {
      // Ajout d'un nouveau produit
      const nouveauProduit = { id: genererId(), ...donnees };
      sauvegarderProduits([...produits, nouveauProduit]);
      afficherMessage("➕ Produit ajouté");
    }
    setFormulaireOuvert(false);
  }

  function supprimerProduit(id) {
    sauvegarderProduits(produits.filter((p) => p.id !== id));
    setFormulaireOuvert(false);
    afficherMessage("🗑️ Produit supprimé");
  }

  return (
    <div className="p-3">
      {/* ---------- ALERTES ---------- */}
      {alertesStock.map((p) => (
        <div key={"rupture-" + p.id} className="bg-red-100 border-l-4 border-red-600 text-red-800 p-3 rounded-lg mb-2 font-bold flex items-center gap-2">
          <AlertTriangle size={20} /> Attention rupture sur {p.nom} ({p.stock} restant{p.stock > 1 ? "s" : ""})
        </div>
      ))}
      {alertesPeremption.map((p) => {
        const j = joursAvantPeremption(p.peremption);
        return (
          <div key={"peremption-" + p.id} className="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-3 rounded-lg mb-2 font-bold flex items-center gap-2">
            <AlertTriangle size={20} />
            {j < 0 ? `${p.nom} est périmé !` : `${p.nom} expire dans ${j} jour${j > 1 ? "s" : ""}`}
          </div>
        );
      })}

      {/* ---------- BOUTON AJOUTER ---------- */}
      <button
        onClick={ouvrirAjout}
        className="w-full bg-green-600 text-white text-lg font-extrabold py-4 rounded-2xl shadow-md mb-3 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Plus size={22} /> Ajouter Produit
      </button>

      {/* ---------- LISTE DES PRODUITS ---------- */}
      <div className="space-y-2">
        {produits.map((produit) => {
          const j = joursAvantPeremption(produit.peremption);
          return (
            <button
              key={produit.id}
              onClick={() => ouvrirEdition(produit)}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-3 flex items-center gap-3 text-left active:bg-gray-50"
            >
              <div className="text-4xl">{produit.emoji}</div>
              <div className="flex-1">
                <div className="text-lg font-bold">{produit.nom}</div>
                <div className="text-sm text-gray-500">{formaterFCFA(produit.prix)}</div>
                {produit.peremption && (
                  <div className={`text-xs font-semibold ${j < 7 ? "text-orange-600" : "text-gray-400"}`}>
                    Péremption : {produit.peremption}
                  </div>
                )}
              </div>
              <div
                className={`text-lg font-extrabold px-3 py-1 rounded-xl ${
                  produit.stock < 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {produit.stock}
              </div>
            </button>
          );
        })}
      </div>

      {/* ---------- FORMULAIRE AJOUT / EDITION (fenêtre modale) ---------- */}
      {formulaireOuvert && (
        <FormulaireProduit
          produit={produitEnEdition}
          onEnregistrer={enregistrerProduit}
          onSupprimer={produitEnEdition ? () => supprimerProduit(produitEnEdition.id) : null}
          onFermer={() => setFormulaireOuvert(false)}
        />
      )}
    </div>
  );
}

function FormulaireProduit({ produit, onEnregistrer, onSupprimer, onFermer }) {
  const [nom, setNom] = useState(produit?.nom || "");
  const [emoji, setEmoji] = useState(produit?.emoji || EMOJIS_PRODUITS[0]);
  const [prix, setPrix] = useState(produit?.prix || "");
  const [stock, setStock] = useState(produit?.stock ?? "");
  const [peremption, setPeremption] = useState(produit?.peremption || "");
  const [codeBarre, setCodeBarre] = useState(produit?.codeBarre || "");
  const [scannerOuvert, setScannerOuvert] = useState(false);

  function valider() {
    if (!nom.trim() || prix === "" || stock === "") return; // champs obligatoires
    onEnregistrer({
      nom: nom.trim(),
      emoji,
      prix: Number(prix),
      stock: Number(stock),
      peremption,
      codeBarre: codeBarre.trim(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-extrabold">{produit ? "Modifier le produit" : "Nouveau produit"}</h2>
          <button onClick={onFermer} className="p-1">
            <X size={24} />
          </button>
        </div>

        {/* Choix de la photo (émoji) */}
        <label className="text-sm font-bold text-gray-600">Photo</label>
        <div className="flex flex-wrap gap-2 my-2">
          {EMOJIS_PRODUITS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center ${
                emoji === e ? "bg-green-600" : "bg-gray-100"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="text-sm font-bold text-gray-600">Nom du produit</label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Lait en poudre"
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg mb-3 mt-1"
        />

        <label className="text-sm font-bold text-gray-600">Prix (FCFA)</label>
        <input
          type="number"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          placeholder="Ex : 500"
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg mb-3 mt-1"
        />

        <label className="text-sm font-bold text-gray-600">Quantité en stock</label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Ex : 10"
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg mb-3 mt-1"
        />

        <label className="text-sm font-bold text-gray-600">Date de péremption (optionnel)</label>
        <input
          type="date"
          value={peremption}
          onChange={(e) => setPeremption(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg mb-4 mt-1"
        />

        <label className="text-sm font-bold text-gray-600">Code-barres (optionnel)</label>
        <div className="flex gap-2 mt-1 mb-4">
          <input
            value={codeBarre}
            onChange={(e) => setCodeBarre(e.target.value)}
            placeholder="Scanne ou tape le code"
            className="flex-1 border-2 border-gray-200 rounded-xl p-3 text-lg"
          />
          <button
            onClick={() => setScannerOuvert(true)}
            className="bg-gray-800 text-white px-4 rounded-xl flex items-center justify-center"
          >
            <Camera size={22} />
          </button>
        </div>

        <button
          onClick={valider}
          className="w-full bg-green-600 text-white text-lg font-extrabold py-4 rounded-2xl mb-2 active:scale-[0.98]"
        >
          💾 Enregistrer
        </button>
        {onSupprimer && (
          <button
            onClick={onSupprimer}
            className="w-full bg-red-50 text-red-600 text-base font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Trash2 size={18} /> Supprimer ce produit
          </button>
        )}
      </div>

      {/* ---------- CAMERA DE SCAN POUR LE CODE-BARRES ---------- */}
      {scannerOuvert && (
        <Scanner
          onDetection={(code) => {
            setCodeBarre(code);
            setScannerOuvert(false);
          }}
          onFermer={() => setScannerOuvert(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// ECRAN 3 : GESTION DU CREDIT
// ============================================================
function EcranCredit({ credits, sauvegarderCredits, afficherMessage }) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [nomClient, setNomClient] = useState("");
  const [numeroWhatsapp, setNumeroWhatsapp] = useState("");
  const [montant, setMontant] = useState("");

  function ajouterCredit() {
    if (!nomClient.trim() || !numeroWhatsapp.trim() || !montant) return;
    const nouveauCredit = {
      id: genererId(),
      client: nomClient.trim(),
      numero: numeroWhatsapp.trim(),
      montant: Number(montant),
      date: dateAujourdhui(),
      paye: false,
    };
    sauvegarderCredits([...credits, nouveauCredit]);
    setNomClient("");
    setNumeroWhatsapp("");
    setMontant("");
    setFormulaireOuvert(false);
    afficherMessage("💳 Crédit enregistré pour " + nouveauCredit.client);
  }

  function marquerPaye(id) {
    sauvegarderCredits(credits.map((c) => (c.id === id ? { ...c, paye: true } : c)));
  }

  // Construit le lien WhatsApp pré-rempli (envoi manuel en un clic)
  function lienRappelWhatsapp(credit) {
    const numeroPropre = credit.numero.replace(/[^0-9+]/g, "");
    const message = `Bonjour ${credit.client}, rappel: ${formaterFCFA(credit.montant)} à payer à Boutik Safe. Merci`;
    return `https://wa.me/${numeroPropre}?text=${encodeURIComponent(message)}`;
  }

  const creditsEnCours = credits.filter((c) => !c.paye);
  const creditsSoldes = credits.filter((c) => c.paye);

  return (
    <div className="p-3">
      <button
        onClick={() => setFormulaireOuvert(true)}
        className="w-full bg-green-600 text-white text-lg font-extrabold py-4 rounded-2xl shadow-md mb-3 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Plus size={22} /> Vente à Crédit
      </button>

      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm p-3 rounded-lg mb-3">
        ℹ️ L'envoi du rappel J+2 se fait ici en un clic (WhatsApp doit être installé sur le téléphone). Un envoi
        totalement automatique nécessite un serveur en ligne.
      </div>

      {creditsEnCours.length > 0 && (
        <>
          <h3 className="text-base font-extrabold text-gray-700 mb-2">Crédits en cours</h3>
          <div className="space-y-2 mb-4">
            {creditsEnCours.map((credit) => (
              <div key={credit.id} className="bg-white border-2 border-gray-200 rounded-2xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-lg font-bold">{credit.client}</div>
                    <div className="text-sm text-gray-500">{credit.numero}</div>
                    <div className="text-xs text-gray-400">Depuis le {credit.date}</div>
                  </div>
                  <div className="text-xl font-extrabold text-red-600">{formaterFCFA(credit.montant)}</div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={lienRappelWhatsapp(credit)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-1"
                  >
                    <Send size={16} /> Rappel WhatsApp
                  </a>
                  <button
                    onClick={() => marquerPaye(credit.id)}
                    className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-2.5 rounded-xl"
                  >
                    ✅ Marqué payé
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {creditsSoldes.length > 0 && (
        <>
          <h3 className="text-base font-extrabold text-gray-400 mb-2">Soldés</h3>
          <div className="space-y-2 opacity-60">
            {creditsSoldes.map((credit) => (
              <div key={credit.id} className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-3 flex justify-between">
                <span className="font-bold">{credit.client}</span>
                <span className="font-bold">{formaterFCFA(credit.montant)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {credits.length === 0 && (
        <p className="text-center text-gray-400 mt-8">Aucun crédit enregistré pour le moment.</p>
      )}

      {/* ---------- FORMULAIRE NOUVEAU CREDIT ---------- */}
      {formulaireOuvert && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-extrabold">Nouvelle vente à crédit</h2>
              <button onClick={() => setFormulaireOuvert(false)} className="p-1">
                <X size={24} />
              </button>
            </div>

            <label className="text-sm font-bold text-gray-600">Nom du client</label>
            <input
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Ex : Mariam"
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg mb-3 mt-1"
            />

            <label className="text-sm font-bold text-gray-600">Numéro WhatsApp</label>
            <input
              value={numeroWhatsapp}
              onChange={(e) => setNumeroWhatsapp(e.target.value)}
              placeholder="Ex : +229 90000000"
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg mb-3 mt-1"
            />

            <label className="text-sm font-bold text-gray-600">Montant (FCFA)</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Ex : 2000"
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg mb-4 mt-1"
            />

            <button
              onClick={ajouterCredit}
              className="w-full bg-green-600 text-white text-lg font-extrabold py-4 rounded-2xl active:scale-[0.98]"
            >
              💾 Enregistrer le crédit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ECRAN 4 : RAPPORT PATRON
// ============================================================
function EcranRapport({ ventes, numeroPatron, sauvegarderNumeroPatron }) {
  const [numeroSaisi, setNumeroSaisi] = useState(numeroPatron);

  const aujourdHui = dateAujourdhui();
  const ventesDuJour = ventes.filter((v) => v.date.slice(0, 10) === aujourdHui);

  const chiffreAffairesJour = ventesDuJour.reduce((somme, v) => somme + v.total, 0);
  const nombreVentesJour = ventesDuJour.length;

  // Calcul du produit le plus vendu aujourd'hui
  const compteurProduits = {};
  ventesDuJour.forEach((v) => {
    v.articles.forEach((a) => {
      compteurProduits[a.nom] = (compteurProduits[a.nom] || 0) + a.quantite;
    });
  });
  let produitPlusVendu = "—";
  let maxVendu = 0;
  Object.entries(compteurProduits).forEach(([nom, qte]) => {
    if (qte > maxVendu) {
      maxVendu = qte;
      produitPlusVendu = nom;
    }
  });

  function lienRapportWhatsapp() {
    const numeroPropre = numeroPatron.replace(/[^0-9+]/g, "");
    const message =
      `📊 Chiffres du jour - Boutik Safe (${aujourdHui})\n` +
      `CA Total : ${formaterFCFA(chiffreAffairesJour)}\n` +
      `Nombre de ventes : ${nombreVentesJour}\n` +
      `Produit le plus vendu : ${produitPlusVendu}${maxVendu ? " (" + maxVendu + ")" : ""}`;
    return `https://wa.me/${numeroPropre}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div className="p-3">
      <h2 className="text-xl font-extrabold mb-3">📊 Chiffres du jour</h2>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-green-600 text-white rounded-2xl p-4 col-span-2">
          <div className="text-sm opacity-90">Chiffre d'affaires total</div>
          <div className="text-3xl font-extrabold">{formaterFCFA(chiffreAffairesJour)}</div>
        </div>
        <div className="bg-gray-100 rounded-2xl p-4">
          <div className="text-sm text-gray-500">Nb de ventes</div>
          <div className="text-2xl font-extrabold">{nombreVentesJour}</div>
        </div>
        <div className="bg-gray-100 rounded-2xl p-4">
          <div className="text-sm text-gray-500">Plus vendu</div>
          <div className="text-lg font-extrabold truncate">{produitPlusVendu}</div>
        </div>
      </div>

      {/* ---------- NUMERO DU PATRON ---------- */}
      <label className="text-sm font-bold text-gray-600">Numéro WhatsApp du patron</label>
      <div className="flex gap-2 mt-1 mb-3">
        <input
          value={numeroSaisi}
          onChange={(e) => setNumeroSaisi(e.target.value)}
          placeholder="Ex : +229 90000000"
          className="flex-1 border-2 border-gray-200 rounded-xl p-3 text-lg"
        />
        <button
          onClick={() => sauvegarderNumeroPatron(numeroSaisi)}
          className="bg-gray-200 text-gray-700 font-bold px-4 rounded-xl"
        >
          OK
        </button>
      </div>

      {numeroPatron ? (
        <a
          href={lienRapportWhatsapp()}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-green-600 text-white text-lg font-extrabold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Send size={20} /> Envoyer Rapport WhatsApp au Patron
        </a>
      ) : (
        <p className="text-center text-gray-400">Enregistre le numéro du patron pour activer l'envoi.</p>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm p-3 rounded-lg mt-3">
        ℹ️ Ce bouton ouvre WhatsApp avec le rapport déjà écrit. Pour un envoi 100% automatique tous les jours à 20h,
        il faudra un serveur en ligne (ex : Supabase Edge Functions + API WhatsApp Business).
      </div>
    </div>
  );
}
