import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatName(
  firstName?: string | null,
  lastName?: string | null,
  useInitial: boolean = false
): string {
  const fn = firstName?.trim() || ""
  const ln = lastName?.trim() || ""
  if (useInitial && ln) {
    return `${ln.charAt(0)}. ${fn}`.trim()
  }
  return `${ln} ${fn}`.trim()
}

// Static placeholder SVG used when an image URL is not provided
export const placeholderImageData =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9iMjQ0IiB2aWV3Qm94PSIwIDAgNDAwIDI0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTE2MCAxMDBIMjI1VjE0MEhNMTYwVjEwMFoiIGZpbGw9IiNEOUQ5QkIiLz4KPHBhdGggZD0iTTE3NSAxN0gxNzVWMTE1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';

/**
 * Normalizes an object storage path into a publicly served URL.
 *
 * All uploaded images are stored in object storage and are historically served
 * through the legacy `/objects/` endpoint. Recently the project added a
 * `/public-objects/` endpoint, but some environments haven't configured it
 * properly which results in broken images. To keep images working across both
 * setups this helper now prefers the `/objects/` path while still attempting to
 * clean up any provided URLs.
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';

  // If it's already a data URL, return as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a path starting with /objects/, it's an object storage path
  if (imageUrl.startsWith('/objects/')) {
    return imageUrl;
  }

  // If it's a relative path, prepend with /objects/
  if (!imageUrl.startsWith('/')) {
    return `/objects/${imageUrl}`;
  }

  return imageUrl;
}