# Icons Directory

## Placeholder Icons

This directory contains placeholder icons for the PWA (Progressive Web App).

For production, replace these placeholder files with actual branded icons:

- `icon-192.png` - 192x192px icon (required for PWA)
- `icon-512.png` - 512x512px icon (required for PWA)

## Creating Production Icons

1. Create a base icon design (SVG recommended)
2. Export as PNG in the following sizes:
   - 192x192px (for `icon-192.png`)
   - 512x512px (for `icon-512.png`)
3. Ensure the icon works well as both `any` and `maskable` (with safe zone)

## Maskable Icons

For optimal display on all devices, ensure icons follow the maskable icon guidelines:
- Keep important content within the safe zone (80% of the icon)
- The outer 20% may be cropped on some devices

## Tools

You can use these tools to generate PWA icons:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Maskable.app](https://maskable.app/) - Test maskable icons

## Temporary Solution

For development, you can use the `vite.svg` in the public folder or create simple colored squares with the app initial "R".

Example command to create placeholder icons (requires ImageMagick):

```bash
# Create 192x192 icon
convert -size 192x192 xc:#2563eb -fill white -font Arial -pointsize 120 -gravity center -annotate +0+0 "R" icon-192.png

# Create 512x512 icon
convert -size 512x512 xc:#2563eb -fill white -font Arial -pointsize 320 -gravity center -annotate +0+0 "R" icon-512.png
```
