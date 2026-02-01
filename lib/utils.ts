import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Since we are in a browser environment without npm install of clsx/tailwind-merge in this specific context,
// we will implement a simple version or assume these utilities might be missing if not provided via CDN.
// HOWEVER, typically these require a build step or imports. 
// For this environment, I will implement a basic string joiner to avoid dependency issues if libraries aren't available,
// OR assume the user has a setup. 
// Given the constraints, I'll write a simple helper that covers most cases.

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
