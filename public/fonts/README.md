# Fonts Directory

This directory is for storing local font files if needed.

## Current Setup

Currently, we use **Cairo font** from Google Fonts CDN for optimal performance and automatic updates.

The font is imported in `src/styles/fonts.css` using:
```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap');
```

## Adding Local Fonts

If you want to use local font files instead of Google Fonts CDN:

1. Download the font files (preferably in WOFF2 format for best compression)
2. Place them in this directory
3. Update `src/styles/fonts.css` to use local fonts:

```css
@font-face {
  font-family: 'Cairo';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/Cairo-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Cairo';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/Cairo-Bold.woff2') format('woff2');
}
```

## Supported Font Formats

- **WOFF2** (recommended) - Best compression, modern browsers
- **WOFF** - Good compression, older browser support
- **TTF/OTF** - Fallback for very old browsers

## Performance Tips

1. Use WOFF2 format when possible (best compression)
2. Subset fonts to include only needed characters
3. Use `font-display: swap` to prevent invisible text
4. Preload critical fonts in layout.tsx
5. Self-host fonts for better privacy and performance control

## Cairo Font Weights Available

- 200 (Extra Light)
- 300 (Light)
- 400 (Regular)
- 500 (Medium)
- 600 (Semi Bold)
- 700 (Bold)
- 800 (Extra Bold)
- 900 (Black)
