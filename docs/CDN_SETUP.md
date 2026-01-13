# Configuration du CDN pour les Voix - Répét

## Vue d'ensemble

Ce guide explique comment héberger les fichiers vocaux sur un CDN pour la **version online** de Répét.

Les fichiers vocaux (~268 MB au total) doivent être accessibles publiquement via HTTPS avec CORS configuré.

---

## 📋 Fichiers à Héberger

Les fichiers vocaux se trouvent dans `public/voices/` après avoir exécuté le script de téléchargement :

```bash
npm run download-models
```

### Structure des fichiers

```
public/voices/
├── fr_FR-siwis-medium.onnx        (61 MB)
├── fr_FR-siwis-medium.onnx.json   (5 KB)
├── fr_FR-tom-medium.onnx          (61 MB)
├── fr_FR-tom-medium.onnx.json     (5 KB)
├── fr_FR-upmc-medium.onnx         (74 MB)
├── fr_FR-upmc-medium.onnx.json    (5 KB)
├── fr_FR-mls-medium.onnx          (74 MB)
└── fr_FR-mls-medium.onnx.json     (5 KB)
```

**Total : ~268 MB**

---

## 🚀 Options d'Hébergement

### Option 1 : Cloudflare R2 (Recommandé)

**Avantages** :
- ✅ Gratuit jusqu'à 10 GB de stockage
- ✅ Pas de frais de bande passante sortante
- ✅ Configuration CORS simple
- ✅ CDN intégré (rapide mondialement)
- ✅ Compatible S3 (API standard)

#### Configuration

1. **Créer un compte Cloudflare**
   - Aller sur https://cloudflare.com
   - Créer un compte gratuit

2. **Créer un bucket R2**
   ```bash
   # Via le dashboard Cloudflare
   1. R2 > Create bucket
   2. Nom: repet-voices
   3. Location: Automatic
   ```

3. **Configurer CORS**
   - Dans le bucket, aller dans Settings > CORS Policy
   - Ajouter cette configuration :

   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. **Rendre le bucket public**
   - Settings > Public Access
   - Enable "Allow public read access"

5. **Obtenir l'URL publique**
   ```
   https://pub-[ID].r2.dev/
   ```

6. **Uploader les fichiers**

   Via CLI (rclone) :
   ```bash
   # Installer rclone
   brew install rclone  # macOS
   # ou apt install rclone  # Linux

   # Configurer R2
   rclone config
   # Choisir: Cloudflare R2
   # Suivre les instructions (API Key depuis dashboard)

   # Uploader
   rclone copy public/voices/ r2:repet-voices/
   ```

   Via Web Interface :
   - Upload files dans le dashboard R2

7. **Tester**
   ```bash
   curl -I https://pub-[ID].r2.dev/fr_FR-siwis-medium.onnx
   # Doit retourner 200 OK
   # Vérifier Access-Control-Allow-Origin: *
   ```

8. **Mettre à jour l'URL dans le code**
   ```typescript
   // src/core/tts/offline/NetworkInterceptor.ts
   const CDN_URL = 'https://pub-[ID].r2.dev'
   ```

---

### Option 2 : AWS S3 + CloudFront

**Avantages** :
- ✅ Très scalable
- ✅ CDN CloudFront intégré
- ✅ Fiable et rapide

**Inconvénients** :
- ⚠️ Coût selon usage (bande passante facturée)
- ⚠️ Configuration plus complexe

#### Configuration

1. **Créer un bucket S3**
   ```bash
   aws s3 mb s3://repet-voices
   ```

2. **Configurer CORS**
   Créer `cors-config.json` :
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["*"],
         "AllowedMethods": ["GET", "HEAD"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3600
       }
     ]
   }
   ```

   Appliquer :
   ```bash
   aws s3api put-bucket-cors \
     --bucket repet-voices \
     --cors-configuration file://cors-config.json
   ```

3. **Rendre public**
   Créer `bucket-policy.json` :
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::repet-voices/*"
       }
     ]
   }
   ```

   Appliquer :
   ```bash
   aws s3api put-bucket-policy \
     --bucket repet-voices \
     --policy file://bucket-policy.json
   ```

4. **Uploader les fichiers**
   ```bash
   aws s3 sync public/voices/ s3://repet-voices/ \
     --acl public-read \
     --cache-control "max-age=31536000"
   ```

5. **Créer une distribution CloudFront**
   - Console AWS > CloudFront > Create Distribution
   - Origin: S3 bucket `repet-voices`
   - Cache policy: CachingOptimized
   - Price class: Use all edge locations

6. **Obtenir l'URL CloudFront**
   ```
   https://[ID].cloudfront.net/
   ```

---

### Option 3 : Bunny CDN

**Avantages** :
- ✅ Très rapide
- ✅ Abordable (~$1/TB)
- ✅ Configuration simple

#### Configuration

1. **Créer un compte Bunny CDN**
   - https://bunny.net

2. **Créer un Storage Zone**
   - Storage > Add Storage Zone
   - Nom: repet-voices
   - Region: Choose closest to users

3. **Uploader les fichiers**
   ```bash
   # Via FTP/SFTP (credentials dans dashboard)
   # Ou via API/rclone
   ```

4. **Créer un Pull Zone (CDN)**
   - CDN > Add Pull Zone
   - Link to Storage Zone: repet-voices

5. **Configurer CORS**
   - Pull Zone > Edge Rules
   - Add Header: Access-Control-Allow-Origin: *

6. **Obtenir l'URL**
   ```
   https://repet-voices.b-cdn.net/
   ```

---

### Option 4 : GitHub Releases (Gratuit)

**Avantages** :
- ✅ Complètement gratuit
- ✅ Bande passante illimitée
- ✅ Fiable

**Inconvénients** :
- ⚠️ Pas de CORS par défaut (utiliser jsDelivr)
- ⚠️ Max 2 GB par fichier (OK pour nous)

#### Configuration

1. **Créer un repository GitHub**
   ```bash
   gh repo create repet-voices --public
   ```

2. **Uploader les fichiers**
   ```bash
   cd public/voices
   
   # Créer une release avec les assets
   gh release create v1.0.0 \
     fr_FR-siwis-medium.onnx \
     fr_FR-siwis-medium.onnx.json \
     fr_FR-tom-medium.onnx \
     fr_FR-tom-medium.onnx.json \
     fr_FR-upmc-medium.onnx \
     fr_FR-upmc-medium.onnx.json \
     fr_FR-mls-medium.onnx \
     fr_FR-mls-medium.onnx.json \
     --title "Voice Models v1.0.0" \
     --notes "Piper French voice models"
   ```

3. **Utiliser jsDelivr comme CDN (avec CORS)**
   ```
   https://cdn.jsdelivr.net/gh/OWNER/repet-voices@v1.0.0/fr_FR-siwis-medium.onnx
   ```

4. **Mettre à jour l'URL**
   ```typescript
   const CDN_URL = 'https://cdn.jsdelivr.net/gh/OWNER/repet-voices@v1.0.0'
   ```

---

## 🔒 Configuration CORS (Obligatoire)

Le CDN **DOIT** envoyer ces headers pour que les navigateurs autorisent les requêtes :

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: Range, Content-Type
Access-Control-Expose-Headers: Content-Length, Content-Range
```

### Vérifier CORS

```bash
curl -I -H "Origin: https://ios.repet.com" \
  https://cdn.repet.com/voices/fr_FR-siwis-medium.onnx

# Doit retourner :
# Access-Control-Allow-Origin: *
```

Ou dans le navigateur :
```javascript
fetch('https://cdn.repet.com/voices/fr_FR-siwis-medium.onnx')
  .then(r => console.log('OK'))
  .catch(e => console.error('CORS error:', e))
```

---

## 🔄 Mise à Jour des Voix

### Versioning

Pour permettre les mises à jour sans casser les anciennes versions :

```
https://cdn.repet.com/voices/
├── v1/
│   ├── fr_FR-siwis-medium.onnx
│   └── ...
└── v2/
    ├── fr_FR-siwis-medium.onnx
    └── ...
```

### Script de mise à jour

```bash
#!/bin/bash
# upload-voices.sh

VERSION="v1"
CDN_PATH="voices/$VERSION"

# Cloudflare R2
rclone copy public/voices/ r2:repet-voices/$CDN_PATH/

# Ou AWS S3
# aws s3 sync public/voices/ s3://repet-voices/$CDN_PATH/

echo "✅ Voix uploadées : https://cdn.repet.com/$CDN_PATH/"
```

---

## 📊 Monitoring

### Vérifier l'utilisation

```bash
# Cloudflare R2
# Dashboard > R2 > Metrics

# AWS S3
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=repet-voices \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-31T23:59:59Z \
  --period 86400 \
  --statistics Average
```

### Logs d'accès

```bash
# Cloudflare R2
# Dashboard > Analytics

# AWS S3 + CloudFront
# CloudWatch Logs
```

---

## 🧪 Tests

### Script de test complet

```bash
#!/bin/bash
# test-cdn.sh

CDN_URL="https://cdn.repet.com/voices"

FILES=(
  "fr_FR-siwis-medium.onnx"
  "fr_FR-siwis-medium.onnx.json"
  "fr_FR-tom-medium.onnx"
  "fr_FR-tom-medium.onnx.json"
  "fr_FR-upmc-medium.onnx"
  "fr_FR-upmc-medium.onnx.json"
)

for file in "${FILES[@]}"; do
  echo "Testing $file..."
  
  # Vérifier que le fichier existe (200 OK)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CDN_URL/$file")
  
  if [ "$STATUS" -eq 200 ]; then
    echo "✅ $file OK"
  else
    echo "❌ $file failed (HTTP $STATUS)"
  fi
  
  # Vérifier CORS
  CORS=$(curl -s -I -H "Origin: https://ios.repet.com" "$CDN_URL/$file" | grep -i "access-control-allow-origin")
  
  if [ -n "$CORS" ]; then
    echo "✅ CORS OK"
  else
    echo "❌ CORS missing"
  fi
done
```

---

## 💰 Estimation des Coûts

### Cloudflare R2 (Recommandé)
- Stockage : **Gratuit** (268 MB << 10 GB)
- Bande passante : **Gratuit** (pas de frais sortants)
- **Total : $0/mois** ✅

### AWS S3 + CloudFront
- Stockage S3 : ~$0.01/mois (268 MB × $0.023/GB)
- Bande passante S3→CloudFront : Gratuit
- CloudFront : ~$0.085/GB (premiers 10 TB)
- **Exemple** : 100 utilisateurs × 268 MB = ~$2.50/mois

### Bunny CDN
- Stockage : ~$0.02/mois (268 MB × $0.01/GB/mois)
- Bande passante : ~$1/TB
- **Exemple** : 100 utilisateurs × 268 MB = ~$0.03/mois

### GitHub Releases + jsDelivr
- **Gratuit** pour tout ✅

---

## 🔐 Sécurité

### Bonnes pratiques

1. **Pas de données sensibles** : Les voix sont publiques (OK)
2. **HTTPS obligatoire** : Toujours servir via HTTPS
3. **Headers de sécurité** :
   ```
   Content-Security-Policy: default-src 'none'
   X-Content-Type-Options: nosniff
   ```
4. **Rate limiting** : Configurer si possible (CloudFlare)
5. **Monitoring** : Surveiller l'utilisation anormale

---

## 📝 Checklist de Déploiement

- [ ] Fichiers vocaux téléchargés (`npm run download-models`)
- [ ] CDN choisi et configuré
- [ ] CORS configuré et testé
- [ ] Fichiers uploadés sur le CDN
- [ ] URLs testées (200 OK)
- [ ] CORS testé depuis le navigateur
- [ ] URL CDN mise à jour dans le code (`NetworkInterceptor.ts`)
- [ ] Build online testé avec le nouveau CDN
- [ ] Monitoring configuré
- [ ] Documentation mise à jour

---

## 🆘 Dépannage

### Erreur CORS

```
Access to fetch at 'https://cdn.repet.com/...' from origin 'https://ios.repet.com'
has been blocked by CORS policy
```

**Solution** : Vérifier la configuration CORS du CDN (voir section CORS ci-dessus)

### Fichier introuvable (404)

**Solutions** :
1. Vérifier que le fichier existe sur le CDN
2. Vérifier l'URL complète (casse, extension)
3. Vérifier les permissions (public read)

### Téléchargement lent

**Solutions** :
1. Utiliser un CDN avec edge locations mondiales
2. Activer la compression (Brotli/Gzip)
3. Vérifier la région du CDN vs utilisateurs

### Quota dépassé (iOS)

**Solutions** :
1. Réduire le nombre de voix en cache (LRU)
2. Permettre à l'utilisateur de choisir quelles voix télécharger
3. Comprimer les modèles (quantization)

---

## 📞 Support

Pour toute question sur la configuration du CDN :
- Issues GitHub : https://github.com/OWNER/repet/issues
- Documentation : `docs/TWO_BUILDS_ARCHITECTURE.md`

---

## 📄 Licence

Copyright (c) 2025 Répét Contributors
Licensed under the MIT License