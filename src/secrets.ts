const FORBIDDEN = ["private_key", "privkey", "mnemonic", "seed", "wif", "secret_key"];

function norm(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function forbiddenFields(obj: unknown, prefix = ""): string[] {
  const hits: string[] = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (FORBIDDEN.some((n) => norm(k).includes(n))) {
        hits.push(path);
      }
      hits.push(...forbiddenFields(v, path));
    }
  }
  return hits;
}
