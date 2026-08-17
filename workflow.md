# Workflow du processus

Le processus est composé de **8 étapes principales** et de plusieurs étapes conditionnelles de **demande d'information complémentaire**.

Les étapes conditionnelles apparaissent dans la timeline uniquement lorsque le workflow passe effectivement par celles-ci.

---

## 1. Saisie de la demande

Première étape du processus.

- Lors de la création du processus, cette étape est **automatiquement validée**.
- Le processus passe automatiquement à l'étape **Vérification métier**.

---

## 2. Vérification métier

Cette étape permet de vérifier les informations et les éléments nécessaires au traitement de la demande.

Une fois la vérification terminée, le processus passe à l'étape **Validation métier N+1**.

---

## 3. Validation métier N+1

À cette étape, deux choix sont possibles :

- **Traitement service approvisionnement**
- **Demande d'information complémentaire**

### Demande d'information complémentaire

Si des informations complémentaires sont nécessaires :

1. Le processus passe à l'étape **Demande d'information complémentaire**.
2. Une fois cette étape résolue, le processus revient automatiquement à **Validation métier N+1**.
3. L'utilisateur peut alors choisir de :
   - poursuivre vers **Traitement service approvisionnement** ;
   - demander à nouveau des informations complémentaires.

> **Important :** cette étape de demande d'information complémentaire est spécifique à la **Validation métier N+1**.

---

## 4. Traitement service approvisionnement

À cette étape, deux choix sont possibles :

- **Signature LAD 1**
- **Demande d'information complémentaire**

### Demande d'information complémentaire

Si des informations complémentaires sont nécessaires :

1. Le processus passe à l'étape **Demande d'information complémentaire**.
2. Une fois cette étape résolue, le processus revient automatiquement à **Traitement service approvisionnement**.
3. L'utilisateur peut alors choisir de :
   - poursuivre vers **Signature LAD 1** ;
   - demander à nouveau des informations complémentaires.

> **Important :** cette étape de demande d'information complémentaire est spécifique au **Traitement service approvisionnement**.

---

## 5. Signature LAD 1

À cette étape, **trois choix principaux** sont possibles :

- **Règlement en cours**
- **Signature LAD 2**
- **Signature LAD 3**
- **Demande d'information complémentaire**

### Demande d'information complémentaire

Si des informations complémentaires sont nécessaires :

1. Le processus passe à l'étape **Demande d'information complémentaire**.
2. Une fois cette étape résolue, le processus revient automatiquement à **Signature LAD 1**.
3. L'utilisateur peut alors choisir à nouveau entre :
   - **Règlement en cours**
   - **Signature LAD 2**
   - **Signature LAD 3**
   - **Demande d'information complémentaire**

> **Important :** cette étape de demande d'information complémentaire est spécifique à la **Signature LAD 1**.

### Signature LAD 2

Si **Signature LAD 2** est sélectionnée :

1. Le processus passe à **Signature LAD 2**.
2. Une fois la signature validée, le processus passe automatiquement à **Règlement en cours**.

### Signature LAD 3

Si **Signature LAD 3** est sélectionnée :

1. Le processus passe à **Signature LAD 3**.
2. Une fois la signature validée, le processus passe automatiquement à **Règlement en cours**.

---

## 6. Règlement en cours

Le processus entre dans la phase de règlement.

Une fois le règlement effectué, le processus passe à **Paiement effectué**.

---

## 7. Paiement effectué

Cette étape confirme que le paiement a été effectué.

> **Règle automatique :** dès que l'étape **Paiement effectué** est validée, le processus est automatiquement clôturé.

Le processus passe donc automatiquement à l'étape **Clôturée**.

---

## 8. Clôturée

Le processus arrive à son état final : **Clôturée**.

Aucune action supplémentaire n'est nécessaire.

---

# Gestion des étapes de demande d'information complémentaire

Les étapes de **Demande d'information complémentaire** sont contextuelles.

Il ne s'agit pas d'une seule étape réutilisée dans tous les cas. Chaque demande d'information complémentaire est rattachée à l'étape depuis laquelle elle a été déclenchée.

| Étape d'origine | Étape de demande d'information | Retour après résolution |
|---|---|---|
| Validation métier N+1 | Demande d'information complémentaire | Validation métier N+1 |
| Traitement service approvisionnement | Demande d'information complémentaire | Traitement service approvisionnement |
| Signature LAD 1 | Demande d'information complémentaire | Signature LAD 1 |

Ainsi, lorsque l'utilisateur demande des informations complémentaires, le workflow conserve l'étape d'origine afin de pouvoir y revenir après résolution.

---

# Gestion de la Timeline

## Affichage initial

Au démarrage du processus, la timeline affiche uniquement les **étapes principales** :

1. Saisie de la demande
2. Vérification métier
3. Validation métier N+1
4. Traitement service approvisionnement
5. Signature LAD 1
6. Règlement en cours
7. Paiement effectué
8. Clôturée

Les étapes conditionnelles ne sont pas affichées initialement.

---

## Affichage dynamique

Une étape conditionnelle apparaît dans la timeline **uniquement lorsque le workflow passe effectivement par cette étape**.

Par exemple, si une demande d'information complémentaire est effectuée depuis **Validation métier N+1** :

```text
Saisie de la demande
        ↓
Vérification métier
        ↓
Validation métier N+1
        ↓
Demande d'information complémentaire
        ↓
Validation métier N+1
        ↓
Traitement service approvisionnement