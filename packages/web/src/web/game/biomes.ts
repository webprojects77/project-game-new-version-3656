export interface Biome {
  name: string;
  hint: string;
  sky: [string, string, string, string, string];
  fog: string;
  hemiSky: string;
  hemiGround: string;
  sun: string;
  rim: string;
  walk: string;
  neon: string;
  side: string[];
  sideH: [number, number];
  obstacle: { low: string; high: string; block: string; accent: string };
}

export const BIOMES: Biome[] = [
  {
    name: "BAIRRO DA LUIZA",
    hint: "Casas, cercas e carros — manhã",
    sky: ["#123A6B", "#2E6FA8", "#7FB6D8", "#FFC48A", "#FFE9B0"],
    fog: "#8FC0DE",
    hemiSky: "#DDF1FF",
    hemiGround: "#4A3A2A",
    sun: "#FFF0CE",
    rim: "#6FD0FF",
    walk: "#8C7A63",
    neon: "#FFD23F",
    side: ["#F2A6C0", "#F9D77E", "#9BE0C0", "#FFB68A", "#C7B4F0"],
    sideH: [4, 8],
    obstacle: { low: "#B3651F", high: "#2FA8A0", block: "#8E5AB8", accent: "#FFF3D6" },
  },
  {
    name: "ESCOLA",
    hint: "Muros, quadras e placas — meio-dia",
    sky: ["#1E5FA8", "#4C93D6", "#9FD3F0", "#F5F0C8", "#FFFDF0"],
    fog: "#BEDCEC",
    hemiSky: "#FFFFFF",
    hemiGround: "#3C4A3A",
    sun: "#FFFFFF",
    rim: "#9BFF3D",
    walk: "#A3A08F",
    neon: "#22E1FF",
    side: ["#E8E2CE", "#CFE3F2", "#F0C9A8", "#BFD8B0"],
    sideH: [5, 10],
    obstacle: { low: "#2F6FB3", high: "#E04E7A", block: "#D8C36A", accent: "#FFFFFF" },
  },
  {
    name: "CENTRO",
    hint: "Prédios, semáforos e ônibus — fim de tarde",
    sky: ["#170B2B", "#4B1B63", "#B3277A", "#FF6B3D", "#FFD23F"],
    fog: "#7A3A6E",
    hemiSky: "#FFD9F2",
    hemiGround: "#2A1040",
    sun: "#FFE6C9",
    rim: "#22E1FF",
    walk: "#3B2260",
    neon: "#FF2E88",
    side: ["#5A3A8C", "#3E5AA8", "#8C3A6B", "#2F4A7A"],
    sideH: [12, 28],
    obstacle: { low: "#FF7A1F", high: "#22E1FF", block: "#6C4BD8", accent: "#FFD23F" },
  },
  {
    name: "PRAÇA",
    hint: "Árvores, bancos e lago — noite",
    sky: ["#07071C", "#141446", "#2A2A6B", "#4A3A7A", "#7A5AA8"],
    fog: "#2A2A5C",
    hemiSky: "#9FB8FF",
    hemiGround: "#101828",
    sun: "#CFE0FF",
    rim: "#9BFF3D",
    walk: "#2A3A34",
    neon: "#9BFF3D",
    side: ["#1E5A3A", "#2A7A4A", "#174A32", "#2F6B44"],
    sideH: [6, 12],
    obstacle: { low: "#7A4A28", high: "#3AC98A", block: "#2A6B8C", accent: "#E8FFD6" },
  },
  {
    name: "PRAIA",
    hint: "Areia, guarda-sóis e coqueiros — sol forte",
    sky: ["#1B7FC4", "#3FA9E0", "#8FD8F2", "#D8F2F7", "#FFF6DC"],
    fog: "#BFE9F2",
    hemiSky: "#FFFFFF",
    hemiGround: "#C9A96B",
    sun: "#FFFBEA",
    rim: "#2BD9C9",
    walk: "#E8D2A0",
    neon: "#2BD9C9",
    side: ["#2BD9C9", "#E8D2A0", "#FF6B6B", "#FFD98A", "#7ED9B8"],
    sideH: [3, 7],
    obstacle: { low: "#FF6B6B", high: "#2BD9C9", block: "#B98A4A", accent: "#FFF6DC" },
  },
  {
    name: "SHOPPING",
    hint: "Vitrines, mármore e escadas rolantes — luz fria",
    sky: ["#DDE4EC", "#E8EDF3", "#F2F5F8", "#F7F9FB", "#FFFFFF"],
    fog: "#E4E9F0",
    hemiSky: "#FFFFFF",
    hemiGround: "#B9BEC8",
    sun: "#F4F7FF",
    rim: "#CFA94A",
    walk: "#E9E9EE",
    neon: "#CFA94A",
    side: ["#FFFFFF", "#E4E4EA", "#CFA94A", "#F2D8E4", "#D8E6F2"],
    sideH: [7, 14],
    obstacle: { low: "#C0392B", high: "#CFA94A", block: "#9AA3AE", accent: "#FFFFFF" },
  },
];
