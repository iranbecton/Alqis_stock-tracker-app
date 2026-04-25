const FORBIDDEN_PATTERNS = [
  /\b(buy|sell|hold)\b/i,
  /\b(strong buy|strong sell)\b/i,
  /\bguarantee(?:d|s)?\b/i,
  /\bwill definitely\b/i,
  /\bprice target\b/i,
];

export function findForbiddenTerms(value: string) {
  return FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(value)).map(
    (pattern) => pattern.source
  );
}

export function hasForbiddenTerms(value: string) {
  return findForbiddenTerms(value).length > 0;
}
