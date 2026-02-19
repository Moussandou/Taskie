# TASKIE — AI Life Planner

## Cahier des Charges Fonctionnel & Technique (V1 Fonctionnelle)

---

# 1. Vision Produit

TASKIE est un planner intelligent qui transforme un brain-dump chaotique en planning quotidien optimisé selon :

- contraintes horaires
- contexte (transport, maison, téléphone, PC)
- niveau d’énergie
- priorités

Objectif V1 :
Créer une application réellement utilisable au quotidien, fiable, intuitive et prédictible.

L’IA n’est utilisée que pour comprendre le texte libre. Le planning repose sur un moteur déterministe.

---

# 2. Problème Utilisateur

Utilisateur cible : étudiant / jeune actif débordé.

Problèmes :

- Tâches dispersées (notes, carnet, mémoire)
- Mauvaise utilisation des micro-temps (transport, pauses)
- Déséquilibre travail / loisirs
- Charge mentale élevée

TASKIE doit :

- Réduire la friction d’organisation
- Proposer un planning cohérent automatiquement
- Permettre des ajustements simples

---

# 3. Périmètre V1

## Inclus

- Brain dump texte libre
- Parsing IA → tâches structurées
- Gestion des contraintes journalières
- Moteur de scheduling déterministe
- Timeline quotidienne
- Drag & drop
- Snooze / Done / Lock
- Explication du placement
- Sauvegarde utilisateur

## Exclu (V1)

- Synchronisation Google Calendar
- Application mobile native
- Collaboration
- Gamification
- Social

---

# 4. Fonctionnalités

## 4.1 Brain Dump

Input unique texte libre.
Bouton : "Organiser ma journée"

Traitement :

- Extraction tâches
- Estimation durée
- Détection contexte
- Détection énergie requise
- Détection deadline

Si ambigu → retour de questions.

---

## 4.2 Modèle de Tâche

Structure :

- id
- titre
- durée_estimee (minutes)
- importance (1–5)
- deadline (nullable)
- contexte (phone, pc, home, outside, any)
- energie (low, medium, high)
- flexibilité (fixed, flexible)
- status (pending, done)

---

## 4.3 Contraintes Journalières

Utilisateur définit :

- plages indisponibles (cours, travail)
- plages transport
- plages libres
- profil énergie par tranche horaire

---

## 4.4 Moteur de Scheduling

Ordre :

1. Bloquer contraintes fixes
2. Placer tâches verrouillées
3. Calcul score tâches restantes
4. Remplir créneaux compatibles
5. Ajouter buffer (5–10 min)

Score tâche =

importance

- urgence (deadline proche)
- compatibilité contexte
- compatibilité énergie

* pénalité fragmentation

Règles :

- Maximum 80% de remplissage journalier
- Grouper tâches similaires si possible
- Respecter contexte (ex phone-only en transport)

---

## 4.5 Interface

### Écran 1 — Dump

- Zone texte
- Bouton organiser

### Écran 2 — Aujourd’hui

- Timeline verticale
- Carte tâche : durée, contexte, énergie
- Actions : Done / Snooze / Lock / Delete
- Drag & drop
- Indication "Pourquoi ici"

### Écran 3 — Paramètres journée

- Ajouter contraintes
- Définir profil énergie

---

# 5. API

## POST /api/parse

Input : texte libre + contexte
Output : liste tâches structurées + questions éventuelles

## POST /api/schedule

Input : tâches + contraintes
Output : planning journalier + explications + warnings

## POST /api/reschedule

Input : planning + modification
Output : planning recalculé

---

# 6. Architecture Technique

Frontend :

- Next.js
- Tailwind
- Framer Motion

Backend :

- API routes Next.js

IA :

- (1 appel max par génération)

Stockage :

- firebase ou PostgreSQL

---

# 7. Contraintes Non Fonctionnelles

- Temps génération planning < 2 secondes
- Interface minimaliste
- Mobile responsive
- Pas de dépendance IA pour replanification
- Validation stricte JSON IA

---

# 8. Roadmap V1

Semaine 1

- UI Dump
- Endpoint parse

Semaine 2

- Modèle données
- Algo scheduling

Semaine 3

- Timeline + drag & drop

Semaine 4

- Optimisation UX
- Déploiement

---

# 9. Critères de Réussite

- Brain dump → planning cohérent en < 5 secondes
- Placement logique compréhensible
- Ajustement simple sans bug
- Utilisable 7 jours d’affilée sans frustration

---

FIN DU DOCUMENT
