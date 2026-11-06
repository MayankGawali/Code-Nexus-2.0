/**
 * Prometheus Pre-Inference PII & Secret Redaction Engine
 * Deterministic sanitization pass that masks sensitive enterprise data, API keys,
 * contact details, and confidential internal project codenames before any external or model processing.
 */

export type RedactionType =
  | "api_key"
  | "bearer_token"
  | "email"
  | "phone"
  | "credit_card"
  | "ip_address"
  | "confidential_codename";

export type RedactionMatch = {
  type: RedactionType;
  raw: string;
  masked: string;
  start: number;
  stop: number;
};

const SECRET_PATTERNS: { type: RedactionType; regex: RegExp; placeholder: string }[] = [
  // API Keys (OpenAI, GitHub, AWS, Generic)
  {
    type: "api_key",
    regex: /\b(sk-[a-zA-Z0-9]{20,48}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16})\b/g,
    placeholder: "[REDACTED_API_KEY]",
  },
  {
    type: "bearer_token",
    regex: /\bBearer\s+([a-zA-Z0-9_.-]{24,})\b/g,
    placeholder: "Bearer [REDACTED_TOKEN]",
  },
  // Email addresses
  {
    type: "email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    placeholder: "[REDACTED_EMAIL]",
  },
  // Phone numbers (US, international formats)
  {
    type: "phone",
    regex: /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g,
    placeholder: "[REDACTED_PHONE]",
  },
  // Credit cards (16 digits or hyphenated)
  {
    type: "credit_card",
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    placeholder: "[REDACTED_CARD]",
  },
  // IPv4 addresses
  {
    type: "ip_address",
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    placeholder: "[REDACTED_IP]",
  },
  // Confidential internal codenames
  {
    type: "confidential_codename",
    regex: /\b(PROJECT_NEBULA|PROJECT_ASTER_V3|PROJECT_TITAN_SECRET)\b/g,
    placeholder: "[CONFIDENTIAL_CODENAME]",
  },
];

export function redactSecretsAndPii(text: string): {
  sanitized: string;
  redactions: RedactionMatch[];
  hasRedactions: boolean;
} {
  let sanitized = text;
  const redactions: RedactionMatch[] = [];

  for (const { type, regex, placeholder } of SECRET_PATTERNS) {
    let match;
    const currentRegex = new RegExp(regex.source, regex.flags);

    while ((match = currentRegex.exec(text)) !== null) {
      redactions.push({
        type,
        raw: match[0],
        masked: placeholder,
        start: match.index,
        stop: match.index + match[0].length,
      });
    }
  }

  // Sort descending by start so replacement doesn't shift offsets
  redactions.sort((a, b) => b.start - a.start);

  for (const r of redactions) {
    sanitized =
      sanitized.slice(0, r.start) + r.masked + sanitized.slice(r.stop);
  }

  // Reverse back for display order
  redactions.reverse();

  return {
    sanitized,
    redactions,
    hasRedactions: redactions.length > 0,
  };
}
