const CODE_TO_SLUG: Record<string, string> = {
  MBB: "maybank",
  PBE: "public-bank",
  HLB: "hong-leong-bank",
};

const CODE_TO_LABEL: Record<string, string> = {
  MBB: "Maybank",
  PBE: "Public Bank",
  HLB: "Hong Leong Bank",
};

export function bank_code_to_slug(code: string): string {
  return CODE_TO_SLUG[code] ?? code.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function slug_to_bank_code(slug: string): string | null {
  const hit = Object.entries(CODE_TO_SLUG).find(([, s]) => s === slug);
  if (hit) return hit[0];
  if (/^[a-z0-9-]+$/.test(slug)) {
    return slug.toUpperCase().replace(/-/g, "_");
  }
  return null;
}

export function bank_code_to_label(code: string, institution?: string | null): string {
  if (CODE_TO_LABEL[code]) return CODE_TO_LABEL[code];
  const name = institution?.trim();
  if (name) return name;
  return code;
}

export function ordered_bank_codes(codes: string[]): string[] {
  const priority = ["MBB", "PBE", "HLB"];
  const unique = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
  const ordered = [
    ...priority.filter((c) => unique.includes(c)),
    ...unique.filter((c) => !priority.includes(c)).sort(),
  ];
  return ordered;
}