import { z } from 'zod';

/**
 * Validate SKU input based on SKU definition
 */
export function validateSkuInput(skuId: string, input: any, schema: z.ZodType<any>): any {
  const result = schema.safeParse(input);
  
  if (!result.success) {
    throw new ValidationError(
      `Invalid input for SKU ${skuId}`,
      result.error.errors
    );
  }
  
  return result.data;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: any[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate image URL constraints
 */
export function validateImageUrl(url: string, maxSizeBytes: number = 5 * 1024 * 1024): void {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid image URL', []);
  }
}

/**
 * Validate PDF URL constraints
 */
export function validatePdfUrl(url: string, maxSizeBytes: number = 10 * 1024 * 1024): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid PDF URL', []);
  }
}

/**
 * Safe prompt filter - block disallowed content
 */
export function validatePrompt(prompt: string): void {
  const blocked = [
    /sex/i,
    /porn/i,
    /nude/i,
    /nsfw/i,
    
  ];
  
  for (const pattern of blocked) {
    if (pattern.test(prompt)) {
      throw new ValidationError(
        'Prompt contains disallowed content (people, violence, etc.)',
        []
      );
    }
  }
}

/**
 * Validate content type
 */
export function validateContentType(contentType: string, allowed: string[]): void {
  if (!allowed.includes(contentType)) {
    throw new ValidationError(
      `Content type ${contentType} not allowed. Must be one of: ${allowed.join(', ')}`,
      []
    );
  }
}

