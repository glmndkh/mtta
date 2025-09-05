import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
export function getImageUrl(imageUrl: string): string {
  if (!imageUrl?.trim()) {
    console.log("getImageUrl: Empty or null URL, returning placeholder");
    return placeholderImageData;
  }

  console.log("getImageUrl: Processing URL:", imageUrl);


  // Handle data URLs (base64 encoded images)
  if (imageUrl.startsWith('data:')) {
    console.log("getImageUrl: Data URL detected, returning as-is");
    return imageUrl;
  }

  // Convert Google Cloud Storage URLs to our objects endpoint
  if (imageUrl.startsWith('https://storage.googleapis.com/')) {
    console.log("getImageUrl: GCS URL detected, converting to object path");
    try {
      const url = new URL(imageUrl);
      // Remove the bucket name from the path
      const parts = url.pathname.split('/').filter(Boolean);
      parts.shift(); // bucket
      imageUrl = parts.join('/');
    } catch (e) {
      console.error("getImageUrl: Failed to parse GCS URL", e);
      return placeholderImageData;
    }
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Handle other external URLs
    console.log("getImageUrl: External URL detected, returning as-is");
    return imageUrl;
  }

  // Fix duplicate path segments that may appear in stored URLs
  imageUrl = imageUrl
    .replace(/\/public-objects\/public-objects\//g, '/public-objects/')
    .replace(/\/objects\/objects\//g, '/objects/');

  // Clean up the path - remove leading slashes and normalize
  let cleanUrl = imageUrl.replace(/^\/+/, '');
  console.log("getImageUrl: Cleaned URL:", cleanUrl);

  // Prefer serving through the legacy /objects/ endpoint which works in all environments
  if (cleanUrl.startsWith('objects/')) {
    const objectPath = `/objects/${cleanUrl.replace(/^objects\//, '')}`;
    console.log('getImageUrl: Object storage path:', objectPath);
    return objectPath;
  }

  // Convert already-public paths back to the objects endpoint
  if (cleanUrl.startsWith('public-objects/')) {
    const objectPath = `/objects/${cleanUrl.replace(/^public-objects\//, '')}`;
    console.log('getImageUrl: Converting public object path to objects path:', objectPath);
    return objectPath;
  }

  // Paths beginning with uploads/ should also point to objects
  if (cleanUrl.startsWith('uploads/')) {
    const objectPath = `/objects/${cleanUrl}`;
    console.log('getImageUrl: Converting uploads path to objects path:', objectPath);
    return objectPath;
  }

  // For other relative paths, default to /objects/
  if (!cleanUrl.startsWith('/')) {
    const objectPath = `/objects/${cleanUrl}`;
    console.log('getImageUrl: Defaulting to objects path:', objectPath);
    return objectPath;
  }

  console.log('getImageUrl: Final URL:', cleanUrl);
  return cleanUrl;
}