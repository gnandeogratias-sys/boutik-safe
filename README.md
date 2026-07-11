# Boutik Safe — PWA

Application installable pour gérer une boutique (vente express, stock, crédit, rapport).

## 1. Installer et tester en local

Il te faut Node.js installé sur ton ordinateur (télécharge-le sur nodejs.org si tu ne l'as pas).

```bash
# Dans le dossier du projet
npm install
npm run dev
```

Ouvre l'adresse affichée (en général http://localhost:5173) dans ton navigateur.

## 2. Mettre en ligne (obligatoire pour l'installer sur un téléphone)

Une PWA doit être servie en HTTPS pour être installable — `localhost` sur ton PC ne suffit pas sur un vrai téléphone.
La solution la plus simple et gratuite : **Vercel** ou **Netlify**.

### Avec Vercel (le plus simple)
1. Crée un compte gratuit sur vercel.com
2. Installe l'outil : `npm install -g vercel`
3. Dans le dossier du projet, tape : `vercel`
4. Suis les instructions — Vercel détecte automatiquement Vite/React
5. Tu obtiens un lien du style `boutik-safe.vercel.app`

### Avec Netlify
1. Compile le projet : `npm run build` (crée un dossier `dist`)
2. Va sur netlify.com, crée un compte gratuit
3. Glisse le dossier `dist` dans la zone de dépôt de Netlify
4. Tu obtiens un lien en quelques secondes

## 3. Installer l'app sur le téléphone

Une fois le lien en ligne (HTTPS) :
- **Android (Chrome)** : ouvre le lien → un bandeau "Ajouter à l'écran d'accueil" apparaît (ou menu ⋮ → "Installer l'application")
- **iPhone (Safari)** : ouvre le lien → bouton Partager (carré avec flèche) → "Sur l'écran d'accueil"

L'icône Boutik Safe apparaît alors comme une vraie app, en plein écran, sans barre d'adresse.

## Fonction Scan (code-barres)

- Bouton **"Scanner un produit"** sur l'écran Vente Express : scanne un code-barres, retrouve le produit et l'ajoute au panier automatiquement.
- Bouton caméra dans le formulaire produit (écran Stock) : scanne un code-barres pour le rattacher à un produit.
- **Important** : l'accès caméra du navigateur exige une connexion **HTTPS**. Ça fonctionnera automatiquement une fois déployé sur Vercel (HTTPS par défaut), et aussi sur `localhost` en développement. Sur un simple lien `http://` non sécurisé, la caméra sera bloquée par le navigateur.
- La première ouverture demandera l'autorisation d'accès à la caméra — il faudra l'accepter.

## Important à savoir

- **Stockage** : les données (produits, ventes, crédits) sont sauvegardées avec `localStorage`, donc **sur l'appareil de chaque vendeur**. Si tu changes de téléphone ou vides le cache du navigateur, les données sont perdues. Pour une vraie synchronisation entre plusieurs appareils/vendeurs, il faudra brancher une vraie base de données (Supabase, par exemple) — je peux t'aider pour ça.
- **Hors-ligne** : grâce au service worker (généré automatiquement par `vite-plugin-pwa`), l'app continue de fonctionner sans connexion internet une fois qu'elle a été ouverte une première fois.
- **Rappels WhatsApp** : toujours en un clic manuel (le bouton ouvre WhatsApp avec le message prêt). L'envoi 100% automatique nécessite un serveur qui tourne en permanence.

## Structure du projet

```
boutik-safe-pwa/
├── index.html          → page HTML de base
├── vite.config.js       → configuration Vite + PWA (manifest, service worker)
├── tailwind.config.js   → configuration Tailwind CSS
├── public/
│   ├── icon-192.png     → icône de l'app (petite)
│   └── icon-512.png     → icône de l'app (grande)
└── src/
    ├── main.jsx         → point d'entrée, monte l'app dans la page
    ├── App.jsx          → toute la logique de Boutik Safe
    ├── stockageLocal.js → sauvegarde des données dans le navigateur
    └── index.css        → styles Tailwind
```
