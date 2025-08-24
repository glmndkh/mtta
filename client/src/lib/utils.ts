import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Static placeholder SVG used when an image URL is not provided
export const placeholderImageData =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDQwMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYxNDBIMTYwVjEwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTE3NSAxMTVIMjI1VjEyNUgxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

/**
 * Normalizes an object storage path into a publicly served URL.
 *
 * The backend serves files through the `/public-objects` endpoint, so paths
 * returned from uploads (e.g. `/objects/...`) need to be converted. This
 * helper centralizes that logic and also falls back to a placeholder image
 * when no URL is provided.
 */
export function getImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl) return placeholderImageData
  if (imageUrl.startsWith('http')) return imageUrl
  if (imageUrl.startsWith('data:')) return imageUrl // Handle base64 data URLs

  // If it's an object storage path, map it to the public-objects route
  // Sometimes the API prefix may already be included (e.g. "/api/public-objects/")
  // in stored URLs. Handle both cases gracefully without duplicating prefixes.
  if (imageUrl.startsWith('/api/public-objects/')) return imageUrl
  if (imageUrl.startsWith('/public-objects/')) return imageUrl
  if (imageUrl.startsWith('/objects/')) {
    const path = imageUrl.replace(/^\/objects\//, '')
    return `/public-objects/${path}`
  }

  // For other absolute or relative paths ensure they're served via public-objects
  if (imageUrl.startsWith('/')) return `/public-objects${imageUrl}`
  return `/public-objects/${imageUrl}`
}