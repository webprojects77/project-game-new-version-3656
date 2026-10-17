export type SkinKey =
  | "classica"
  | "esportiva"
  | "praiana"
  | "escolar"
  | "shopping"
  | "neon"
  | "polaroid"
  | "policial"
  | "cachorro";

export type SkinTier = "padrao" | "comum" | "rara" | "epica" | "especial" | "admin";

export interface BodyPalette {
  skin: string;
  hair: string;
  shirt: string;
  shirtAlt: string;
  pants: string;
  shoes: string;
  detail: string;
}

export interface SkinInfo {
  key: SkinKey;
  name: string;
  desc: string;
  tier: SkinTier;
  tierColor: string;
  cost: number;
  record: number;
  specials: number;
  body: BodyPalette;
}

export const SKINS: SkinInfo[] = [
  {
    key: "classica",
    name: "Luiza Clássica",
    desc: "A de sempre: jaqueta rosa e tênis branco.",
    tier: "padrao",
    tierColor: "#B8AFC9",
    cost: 0,
    record: 0,
    specials: 0,
    body: {
      skin: "#F3C29A",
      hair: "#3A2118",
      shirt: "#FF2E7E",
      shirtAlt: "#C21E5E",
      pants: "#29467A",
      shoes: "#FFFFFF",
      detail: "#29D9FF",
    },
  },
  {
    key: "esportiva",
    name: "Luiza Esportiva",
    desc: "Uniforme de treino, pronta pra correr de verdade.",
    tier: "comum",
    tierColor: "#B8AFC9",
    cost: 50_000,
    record: 0,
    specials: 0,
    body: {
      skin: "#F3C29A",
      hair: "#3A2118",
      shirt: "#3CE87A",
      shirtAlt: "#1F8C4C",
      pants: "#1A1030",
      shoes: "#FFC93C",
      detail: "#FFFFFF",
    },
  },
  {
    key: "praiana",
    name: "Luiza de Praia",
    desc: "Regata, short e chinelo — direto da área da Praia.",
    tier: "comum",
    tierColor: "#B8AFC9",
    cost: 90_000,
    record: 0,
    specials: 0,
    body: {
      skin: "#F0BE93",
      hair: "#2E1A12",
      shirt: "#FFD166",
      shirtAlt: "#E08A2E",
      pants: "#00C2C7",
      shoes: "#FF6FA5",
      detail: "#FFFFFF",
    },
  },
  {
    key: "escolar",
    name: "Luiza Escolar",
    desc: "Uniforme azul e branco, direto da fase da Escola.",
    tier: "rara",
    tierColor: "#29D9FF",
    cost: 150_000,
    record: 20_000,
    specials: 0,
    body: {
      skin: "#E8B183",
      hair: "#241009",
      shirt: "#FFFFFF",
      shirtAlt: "#29D9FF",
      pants: "#1F3D8C",
      shoes: "#1A1030",
      detail: "#FFC93C",
    },
  },
  {
    key: "shopping",
    name: "Luiza do Shopping",
    desc: "Look de passeio com jaqueta dourada da área do Shopping.",
    tier: "rara",
    tierColor: "#29D9FF",
    cost: 250_000,
    record: 60_000,
    specials: 0,
    body: {
      skin: "#F3C29A",
      hair: "#4A2A6B",
      shirt: "#FFC93C",
      shirtAlt: "#C79419",
      pants: "#2A2A38",
      shoes: "#FFFFFF",
      detail: "#FF2E7E",
    },
  },
  {
    key: "neon",
    name: "Luiza Neon",
    desc: "Roupa que brilha no escuro da fase da Praça.",
    tier: "epica",
    tierColor: "#FF2E7E",
    cost: 400_000,
    record: 150_000,
    specials: 0,
    body: {
      skin: "#F6CDA8",
      hair: "#FF2E7E",
      shirt: "#29D9FF",
      shirtAlt: "#0E5C7A",
      pants: "#6C2BD8",
      shoes: "#3CE87A",
      detail: "#FFFFFF",
    },
  },
  {
    key: "polaroid",
    name: "Luiza Polaroid",
    desc: "Exclusiva: só com o item especial da pista, não se compra.",
    tier: "especial",
    tierColor: "#FFC93C",
    cost: 0,
    record: 0,
    specials: 3,
    body: {
      skin: "#F3C29A",
      hair: "#5B2A8C",
      shirt: "#FFC93C",
      shirtAlt: "#B3821F",
      pants: "#FFFFFF",
      shoes: "#FF2E7E",
      detail: "#29D9FF",
    },
  },
  {
    key: "policial",
    name: "Luiza Policial",
    desc: "Exclusiva da conta admin: farda do policial que persegue na pista.",
    tier: "admin",
    tierColor: "#3CE87A",
    cost: 0,
    record: 0,
    specials: 0,
    body: {
      skin: "#F3C29A",
      hair: "#1A1030",
      shirt: "#1F3D8C",
      shirtAlt: "#14275A",
      pants: "#1A1030",
      shoes: "#0E0A1C",
      detail: "#FFC93C",
    },
  },
  {
    key: "cachorro",
    name: "Luiza Cachorro",
    desc: "Exclusiva da conta admin: as cores do cachorro farejador.",
    tier: "admin",
    tierColor: "#3CE87A",
    cost: 0,
    record: 0,
    specials: 0,
    body: {
      skin: "#E8B183",
      hair: "#7A4A22",
      shirt: "#C88A4A",
      shirtAlt: "#8A5A28",
      pants: "#3A2118",
      shoes: "#1A1030",
      detail: "#FFFFFF",
    },
  },
];

export const DEFAULT_SKIN: SkinKey = "classica";

export function findSkin(key: SkinKey): SkinInfo {
  return SKINS.find((s) => s.key === key) ?? SKINS[0];
}

export interface Progress {
  coins: number;
  best: number;
  specials: number;
  admin?: boolean;
}

export function isUnlocked(skin: SkinInfo, p: Progress) {
  if (p.admin) return true;
  if (skin.tier === "admin") return false;
  if (skin.tier === "padrao") return true;
  if (skin.tier === "especial") return p.specials >= skin.specials;
  return p.coins >= skin.cost && p.best >= skin.record;
}

export function requirementLabel(skin: SkinInfo, p: Progress): string[] {
  if (p.admin || skin.tier === "padrao") return [];
  if (skin.tier === "admin") return ["só na conta admin"];
  if (skin.tier === "especial") {
    return [`${p.specials}/${skin.specials} itens especiais`];
  }
  const out: string[] = [];
  out.push(`${skin.cost.toLocaleString("pt-BR")} moedas${p.coins >= skin.cost ? " ✓" : ""}`);
  if (skin.record > 0) {
    out.push(`recorde de ${skin.record.toLocaleString("pt-BR")}${p.best >= skin.record ? " ✓" : ""}`);
  }
  return out;
}
