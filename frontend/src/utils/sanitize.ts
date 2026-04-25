/**
 * DOMPurify sanitization helper.
 * Wraps all user-generated content rendering to prevent XSS.
 */
import DOMPurify from 'dompurify';

/**
 * Sanitizes a string, stripping any HTML/script injection.
 * Use for all user-generated text rendered to the DOM.
 */
export function sanitizeText(str: string): string {
  if (!str) return '';
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitizes HTML that is intended to be rendered via dangerouslySetInnerHTML.
 * Only use when you explicitly need to render HTML content.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br'],
    ALLOWED_ATTR: [],
  });
}
