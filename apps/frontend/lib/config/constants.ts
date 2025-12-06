/**
 * Application constants and static asset URLs
 */

export const ASSETS = {
  // Brand logos and images
  LOGOS: {
    TAILORCV: 'https://9nghnaawajmv9mqf.public.blob.vercel-storage.com/tailorcv-logo',
  },

  // Common icons or other reusable images can be added here
  ICONS: {
    // Add icon URLs here as needed
  },

  // Placeholder images
  PLACEHOLDERS: {
    // Add placeholder image URLs here as needed
  },
} as const;

// Export individual constants for easy access
export const { LOGOS, ICONS, PLACEHOLDERS } = ASSETS;

// Type exports for TypeScript support
export type AssetType = typeof ASSETS;
export type LogoType = typeof LOGOS;
