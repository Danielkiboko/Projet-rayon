# Création de Collaborateurs (Sous-Admin) pour les Fournisseurs

## Description
Permettre aux fournisseurs (Rayon et Immo) d'ajouter des collaborateurs (sous-fournisseurs) pour les aider à gérer leur boutique. Ces collaborateurs auront accès au tableau de bord fournisseur mais leurs actions seront liées au compte du fournisseur principal.

> [!IMPORTANT]
> **User Review Required** : Cette fonctionnalité nécessite de modifier la sécurité de la base de données (Firestore Rules) et la façon dont l'application identifie "à qui appartient un produit". 

## Open Questions
- Souhaitez-vous que les collaborateurs aient accès à TOUT le tableau de bord (finances, paiements) ou voulez-vous restreindre certaines pages (ex: cacher la facturation et les finances aux collaborateurs) ? *Pour l'instant, le plan prévoit de leur donner le même accès.*

## Proposed Changes

### Configuration et Sécurité

#### [MODIFY] `firestore.rules`
- Ajout du rôle `SUB_SUPPLIER`.
- Autoriser la lecture et l'écriture sur les produits, commandes, factures, etc., si le `parentSupplierId` du collaborateur correspond au `supplierId` de la ressource.

### Backend (Server Actions)

#### [NEW] `src/app/supplier/team/actions.ts`
- Création d'une fonction `createCollaboratorAction` qui utilise le SDK Admin pour créer le compte du collaborateur, l'ajouter à la collection `users`, et lui assigner un "Custom Claim" (un badge de sécurité Firebase) contenant son rôle (`SUB_SUPPLIER`) et l'identifiant de son patron (`parentSupplierId`).

### Frontend (Tableau de bord Fournisseur)

#### [NEW] `src/app/supplier/team/page.tsx`
- Interface permettant au fournisseur principal de voir la liste de ses collaborateurs, d'en ajouter de nouveaux (avec nom, email, mot de passe) ou de les supprimer.

#### [MODIFY] `src/app/supplier/layout.tsx`
- Ajout du lien "Mon Équipe" ou "Collaborateurs" dans le menu de navigation latéral pour les fournisseurs.

#### [MODIFY] `src/context/AuthContext.tsx`
- Autoriser le rôle `SUB_SUPPLIER` (ou `sub_supplier`) à se connecter et à accéder aux pages `/supplier`.

#### [MODIFY] Fichiers du dashboard fournisseur (`src/app/supplier/**/*.tsx`)
- Partout où nous cherchions les données avec `where("supplierId", "==", user.uid)`, nous utiliserons maintenant `const activeSupplierId = userData?.parentSupplierId || user.uid;` pour que les collaborateurs voient les produits de leur patron.

## Verification Plan
### Automated Tests
- Déploiement des nouvelles règles Firestore via la commande `firebase deploy --only firestore:rules`.

### Manual Verification
- Créer un collaborateur depuis le compte d'un fournisseur.
- Se déconnecter, puis se connecter avec le compte du collaborateur.
- Vérifier qu'il voit bien les produits de son patron et qu'il peut en ajouter un nouveau.
