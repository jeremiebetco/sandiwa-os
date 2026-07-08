const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;'
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => HTML_ESCAPE_MAP[char] ?? char)
}

export function sanitizeText(value: string, maxLength = 5000): string {
  return escapeHtml(value.trim().slice(0, maxLength))
}
