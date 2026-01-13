# Modèles Piper pour TTS Offline

Ce dossier contient les modèles vocaux Piper pour la synthèse vocale en mode 100% déconnecté.

## Modèles requis

Pour que l'application fonctionne en mode offline, vous devez télécharger les modèles suivants :

### Voix françaises

1. **fr_FR-siwis-medium** (Voix féminine)
   - Fichier modèle : `fr_FR-siwis-medium.onnx`
   - Fichier config : `fr_FR-siwis-medium.onnx.json`
   - URL : https://huggingface.co/diffusionstudio/piper-voices/tree/main/fr/fr_FR/siwis/medium

2. **fr_FR-tom-medium** (Voix masculine)
   - Fichier modèle : `fr_FR-tom-medium.onnx`
   - Fichier config : `fr_FR-tom-medium.onnx.json`
   - URL : https://huggingface.co/diffusionstudio/piper-voices/tree/main/fr/fr_FR/tom/medium

3. **fr_FR-upmc-medium** (Voix féminine)
   - Fichier modèle : `fr_FR-upmc-medium.onnx`
   - Fichier config : `fr_FR-upmc-medium.onnx.json`
   - URL : https://huggingface.co/diffusionstudio/piper-voices/tree/main/fr/fr_FR/upmc/medium

4. **fr_FR-mls-medium** (Voix masculine)
   - Fichier modèle : `fr_FR-mls-medium.onnx`
   - Fichier config : `fr_FR-mls-medium.onnx.json`
   - URL : https://huggingface.co/diffusionstudio/piper-voices/tree/main/fr/fr_FR/mls/medium

## Installation manuelle

### Méthode 1 : Téléchargement direct

Pour chaque modèle, téléchargez les deux fichiers (.onnx et .onnx.json) depuis HuggingFace et placez-les dans ce dossier.

Exemple pour fr_FR-siwis-medium :
```bash
cd repet/public/models/piper/

# Télécharger le modèle
wget https://huggingface.co/diffusionstudio/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx

# Télécharger la config
wget https://huggingface.co/diffusionstudio/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json
```

### Méthode 2 : Script de téléchargement

Exécutez le script suivant pour télécharger tous les modèles :

```bash
#!/bin/bash
cd repet/public/models/piper/

VOICES=(
  "fr/fr_FR/siwis/medium"
  "fr/fr_FR/tom/medium"
  "fr/fr_FR/upmc/medium"
  "fr/fr_FR/mls/medium"
)

for voice in "${VOICES[@]}"; do
  name=$(basename "$voice")
  model="${voice%/*}"
  model_name=$(echo $voice | tr '/' '_' | sed 's/_medium$//')
  
  echo "Téléchargement de ${model_name}-medium..."
  
  wget -q "https://huggingface.co/diffusionstudio/piper-voices/resolve/main/${voice}/${model_name}-medium.onnx"
  wget -q "https://huggingface.co/diffusionstudio/piper-voices/resolve/main/${voice}/${model_name}-medium.onnx.json"
done

echo "Téléchargement terminé !"
```

## Structure attendue

Après installation, ce dossier doit contenir :

```
public/models/piper/
├── README.md (ce fichier)
├── fr_FR-siwis-medium.onnx
├── fr_FR-siwis-medium.onnx.json
├── fr_FR-tom-medium.onnx
├── fr_FR-tom-medium.onnx.json
├── fr_FR-upmc-medium.onnx
├── fr_FR-upmc-medium.onnx.json
├── fr_FR-mls-medium.onnx
└── fr_FR-mls-medium.onnx.json
```

## Taille des fichiers

- Chaque modèle .onnx : ~15-16 MB
- Chaque fichier .json : ~1 KB
- **Total : ~60-65 MB** pour les 4 voix

## Vérification

Pour vérifier que tous les modèles sont bien installés :

```bash
ls -lh public/models/piper/*.onnx
```

Vous devriez voir 4 fichiers .onnx listés.

## Mode offline

Une fois les modèles téléchargés, l'application peut fonctionner entièrement hors ligne.
L'intercepteur réseau redirige automatiquement toutes les requêtes vers ces fichiers locaux.

## Licence

Les modèles Piper sont sous licence MIT et sont disponibles grâce à :
- [Rhasspy Piper](https://github.com/rhasspy/piper) pour les modèles
- [Diffusion Studio](https://huggingface.co/diffusionstudio/piper-voices) pour l'hébergement