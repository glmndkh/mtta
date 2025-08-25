import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Static placeholder SVG used when an image URL is not provided
export const placeholderImageData =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9iMjQ0IiB2aWV3Qm94PSIwIDAgNDAwIDI0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTE2MCAxMDBIMjI1VjE0MEhNMTYwVjEwMFoiIGZpbGw9IiNEOUQ1REIiLz4KPHBhdGggZD0iTTE3NSAxMTVIMjI1VjEyNUgxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

/**
 * Normalizes an object storage path into a publicly served URL.
 *
 * The backend serves files through the `/public-objects` endpoint, so paths
 * returned from uploads (e.g. `/objects/...`) need to be converted. This
 * helper centralizes that logic and also falls back to a placeholder image
 * when no URL is provided.
 */
export function getImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl || imageUrl.trim() === '') return placeholderImageData

  // Handle full URLs (http/https)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl

  // Handle base64 data URLs
  if (imageUrl.startsWith('data:')) return imageUrl

  // Clean the URL - remove any extra slashes and whitespace
  const cleanUrl = imageUrl.trim().replace(/\/+/g, '/')

  // If it's an object storage path, map it to the public-objects route
  // Handle various prefixes that might already be included
  if (cleanUrl.startsWith('/api/public-objects/')) return cleanUrl
  if (cleanUrl.startsWith('/public-objects/')) return cleanUrl

  if (cleanUrl.startsWith('/objects/')) {
    const path = cleanUrl.replace(/^\/objects\//, '')
    return `/public-objects/${path}`
  }

  // For paths starting with 'objects/' (without leading slash)
  if (cleanUrl.startsWith('objects/')) {
    const path = cleanUrl.replace(/^objects\//, '')
    return `/public-objects/${path}`
  }

  // For other absolute paths, ensure they're served via public-objects
  if (cleanUrl.startsWith('/')) {
    const path = cleanUrl.substring(1) // Remove leading slash
    return `/public-objects/${path}`
  }

  // For relative paths, add to public-objects
  return `/public-objects/${cleanUrl}`
}