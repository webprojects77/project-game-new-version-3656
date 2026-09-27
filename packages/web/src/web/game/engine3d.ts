/**
 * Luiza Run Surfs — motor 3D (three.js).
 *
 * Mundo em 3 faixas, câmera atrás e acima da Luiza (estilo Subway Surfers).
 * A pista, o cenário e os obstáculos são geometria 3D de verdade; a Luiza, o
 * policial e os itens são billboards (planos que sempre encaram a câmera) com
 * as fotos/placeholders dos "slots" de arte.
 */
import * as THREE from "three";
import { GameAudio } from "./audio";
import { type CharPose, Dog, Humanoid, makeCop } from "./characters";
import { animateItem, disposeItem, type ItemKind, makeItemMesh } from "./items";
import { carregarModelos, makeModelo, type ModeloKey } from "./models";
import { PALETTE } from "./palette";
import { animatePower, makePowerMesh, POWERS, type PowerKind, sortearPower } from "./powerups";
import { DEFAULT_SKIN, findSkin, type SkinKey } from "./skins";
import { makeBuildingTexture, makeRoadTexture, makeSkyTexture } from "./textures";

export type Phase = "menu" | "running" | "paused" | "caught" | "over";
export type InputAction = "left" | "right" | "jump" | "slide";
export type NotifyKind = "recorde" | "combo" | "especial" | "fase" | "power";

/** Chaves usadas pelo painel admin para forçar o spawn de uma peça. */
export type SpawnKey = ObstacleType;

/** Interruptores da conta admin (nenhum liga sozinho numa conta normal). */
export interface AdminFlags {
  /** god mode: invencível + multiplicador alto */
  god: boolean;
  /** invencibilidade avulsa */
  invuln: boolean;
  /** atravessa obstáculos e faixas travadas */
  noclip: boolean;
  /** sai do trilho das 3 faixas e flutua */
  fly: boolean;
  /** câmera solta do personagem */
  freeCam: boolean;
  /** desenha as caixas de colisão */
  hitbox: boolean;
  /** velocidade do jogo (0.2 = câmera lenta, 3 = acelerado) */
  timeScale: number;
  /** multiplicador de moedas e pontuação */
  multiplier: number;
}

/** Números do overlay de debug da conta admin. */
export interface DebugInfo {
  fps: number;
  x: number;
  y: number;
  lane: number;
  speed: number;
  distance: number;
  obstacles: number;
  items: number;
  area: string;
}

/** Power-up ativo mostrado na HUD (ícone + barra de tempo restante). */
export interface ActivePower {
  key: PowerKind;
  icone: string;
  cor: string;
  nome: string;
  ms: number;
  max: number;
}

export interface HudState {
  score: number;
  distance: number;
  lives: number;
  coins: number;
  specials: number;
  speedKmh: number;
  boostMs: number;
  boostMax: number;
  copHeat: number;
  combo: number;
  comboTimer: number;
  /** power-ups com duração, em ordem de coleta */
  powers: ActivePower[];
  /** escudo guardado (aguenta uma batida) */
  shield: boolean;
  /** segunda chance guardada no slot separado */
  chance: boolean;
  /** área/fase atual (0 a 5) */
  area: number;
  areaName: string;
}

export interface GameOverPayload {
  score: number;
  distance: number;
  coins: number;
  specials: number;
  combo: number;
}

export interface FloatingText {
  id: number;
  text: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Constantes do mundo (1 unidade ≈ 1 metro)
// ---------------------------------------------------------------------------
const LANE_W = 2.3;
const LANES = [-LANE_W, 0, LANE_W];
const ROAD_W = 9;
const ROAD_LEN = 420;

const GRAVITY = -34;
const JUMP_V = 12.6;
const SLIDE_TIME = 0.5;
const COYOTE = 0.1;
const BUFFER = 0.16;

const SPEED_START = 14;
/** teto de velocidade: subiu bastante para o jogo não "empacar" fácil */
const SPEED_MAX = 48;
const SPEED_RAMP = 0.0055;

/** impulso que a rampa/escada rolante dá (sobe ~2 blocos de altura) */
const RAMP_LAUNCH = 16.2;
/** altura do teto do ônibus: dá para passar por cima com o duplo pulo */
const ONIBUS_TOP = 2.9;
/** comprimento do "trem" (carro/ônibus) que tranca a faixa */
const TREM_LEN = 9;

const SPAWN_Z = -135;
const DESPAWN_Z = 16;

const PLAYER_H = 1.85;
const SLIDE_H = 0.85;

/** Distância (em metros) de cada fase antes de trocar de bioma. */
const BIOME_LEN = 2200;

/** Combo: tempo (s) sem coletar nada antes de o multiplicador cair. */
const COMBO_WINDOW = 3.2;
const COMBO_MAX = 8;
/** Duração do power-up de velocidade, em ms. */
const BOOST_MS = 5000;

interface Biome {
  name: string;
  hint: string;
  /** gradiente do céu, do topo até o horizonte */
  sky: [string, string, string, string, string];
  fog: string;
  hemiSky: string;
  hemiGround: string;
  sun: string;
  rim: string;
  walk: string;
  neon: string;
  /** cor dos volumes laterais (casas, muros, prédios, árvores) */
  side: string[];
  /** faixa de altura dos volumes laterais */
  sideH: [number, number];
  obstacle: { low: string; high: string; block: string; accent: string };
}

/** As 4 fases do GDD: bairro → escola → centro → praça, com hora do dia diferente. */
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
    // Área 5: sol forte, areia bege, mar turquesa e guarda-sóis listrados.
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
    // Área 6: luz artificial fria e uniforme, mármore polido e vitrines.
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

/**
 * low = pular · high = deslizar · block = desviar de faixa
 * ride = escada rolante do shopping (sobe em cima pulando)
 */
export type ObstacleType = "low" | "high" | "block" | "ride";

interface Obstacle {
  type: ObstacleType;
  lane: number;
  z: number;
  group: THREE.Object3D;
  hit: boolean;
  /** altura a partir da qual a Luiza passa por cima (Infinity = não passa) */
  topo: number;
  /** rampa/escada rolante: em vez de bater, lança a Luiza para cima */
  rampa: boolean;
  /** carro/ônibus: vem numa faixa fixa e tranca a troca de faixa */
  trem: boolean;
}

interface Item {
  kind: ItemKind | "power";
  /** qual power-up está dentro da cápsula (só para kind === "power") */
  power?: PowerKind;
  lane: number;
  z: number;
  y: number;
  obj: THREE.Object3D;
  taken: boolean;
  /** quando coletado, o item "salta" em direção à HUD antes de sumir */
  fly: number;
  /** posição x atual (o ímã puxa as moedas para a Luiza) */
  x: number;
}

interface Building {
  mesh: THREE.Mesh;
  side: -1 | 1;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export class Game3D {
  private canvas: HTMLCanvasElement;
  private audio: GameAudio;
  private onHud: (hud: HudState) => void;
  private onGameOver: (payload: GameOverPayload) => void;
  private onPhaseChange: (phase: Phase) => void;
  private onFloat: (text: FloatingText) => void;
  private onNotify: (kind: NotifyKind, text: string) => void;

  // three.js
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private road!: THREE.Mesh;
  private roadTex: THREE.Texture;
  private buildings: Building[] = [];
  private player!: Humanoid;
  private cop!: Humanoid;
  private sirenL!: THREE.PointLight;
  private particles!: THREE.Points;
  private particleData: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[] = [];

  // bioma / fases
  private skyTextures: THREE.Texture[] = [];
  private hemi!: THREE.HemisphereLight;
  private sun!: THREE.DirectionalLight;
  private rim!: THREE.DirectionalLight;
  private walks: THREE.Mesh[] = [];
  private neons: THREE.Mesh[] = [];
  private biomeIdx = 0;
  private gates: { group: THREE.Object3D; z: number }[] = [];
  /** props de cenário exclusivos da área (coqueiro, trampolim, vitrine...) */
  private props: { group: THREE.Object3D; z: number }[] = [];
  /** distância até o próximo prop de cenário */
  private nextProp = 24;

  // cachorro 3D low poly
  private dog!: Dog;
  private dogZ = 8;
  private dogX = 1.6;
  private barkTimer = 2;

  /** skin escolhida na tela de personagens */
  private skin: SkinKey = DEFAULT_SKIN;

  // configurações do jogador
  private reduceFx = false;
  private vibrate = true;
  /** recorde pessoal, usado para avisar "novo recorde" no meio da corrida */
  private best = 0;
  private beatRecord = false;

  phase: Phase = "menu";
  private raf = 0;
  private lastTs = 0;
  private t = 0;
  private hudTimer = 0;
  private floatId = 0;

  // estado da partida
  private lane = 1;
  private x = 0;
  private y = 0;
  private vy = 0;
  private sliding = 0;
  private groundedFor = 0;
  private jumpBuffer = 0;
  private lives = 3;
  private score = 0;
  private distance = 0;
  private coins = 0;
  private specials = 0;
  private speed = SPEED_START;
  // combo
  private combo = 1;
  private comboBest = 1;
  private comboHits = 0;
  private comboTimer = 0;
  private boost = 0;
  // power-ups
  /** tempo restante (ms) de cada power-up com duração */
  private powerTimers = new Map<PowerKind, number>();
  /** escudo guardado: aguenta uma batida e estala */
  private shield = false;
  /** segunda chance guardada (slot separado da HUD) */
  private chance = false;
  /** o duplo pulo já foi usado neste pulo? */
  private usedDoubleJump = false;
  /** bolha do escudo em volta da Luiza */
  private shieldMesh!: THREE.Mesh;
  /** distância até o próximo power-up (1 a cada 95-140 s: item raro) */
  private nextPower = 0;
  /** metros que ainda faltam para um coração poder aparecer de novo */
  private heartCooldown = 1200;
  /** o item especial só pode aparecer 1 vez por partida */
  private specialSpawned = false;
  /** contagem regressiva "3, 2, 1, Vai!" no início da partida */
  private countdown = 0;
  private countdownStep = 0;
  private invuln = 0;
  private shake = 0;
  private hitFlash = 0;
  private caughtTimer = 0;

  // policial
  private copZ = 6.2;
  private copX = -1.6;
  private copTargetZ = 6.2;
  private copSurge = 0;

  // ---- conta admin / debug ----
  private admin: AdminFlags = {
    god: false,
    invuln: false,
    noclip: false,
    fly: false,
    freeCam: false,
    hitbox: false,
    timeScale: 1,
    multiplier: 1,
  };
  /** x livre do modo fly (fora das 3 faixas) */
  private flyX = 0;
  /** quadros por segundo suavizados, para o overlay de debug */
  private fps = 60;
  /** caixas de colisão desenhadas quando o admin liga o hitbox */
  private hitboxGroup = new THREE.Group();
  private hitboxTimer = 0;
  private freeCamPos = new THREE.Vector3(0, 6, 12);

  // spawner
  private nextSpawn = 40;
  private lastRow: { type: ObstacleType; lanes: number[] } | null = null;
  private obstacles: Obstacle[] = [];
  private items: Item[] = [];
  private pool: THREE.Object3D[] = [];

  constructor(opts: {
    canvas: HTMLCanvasElement;
    audio: GameAudio;
    onHud: (hud: HudState) => void;
    onPhaseChange: (phase: Phase) => void;
    onGameOver: (payload: GameOverPayload) => void;
    onFloat?: (text: FloatingText) => void;
    onNotify?: (kind: NotifyKind, text: string) => void;
  }) {
    this.canvas = opts.canvas;
    this.audio = opts.audio;
    this.onHud = opts.onHud;
    this.onPhaseChange = opts.onPhaseChange;
    this.onGameOver = opts.onGameOver;
    this.onFloat = opts.onFloat ?? (() => {});
    this.onNotify = opts.onNotify ?? (() => {});

    // Se o aparelho/navegador não tiver WebGL, avisamos em vez de deixar tela branca.
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    } catch {
      throw new Error("WEBGL_UNAVAILABLE");
    }
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(new THREE.Color("#170B2B"));

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500);
    this.camera.position.set(0, 5.1, 8.6);
    this.camera.lookAt(0, 1.7, -10);

    this.scene.add(this.hitboxGroup);
    this.roadTex = makeRoadTexture();
    // a cerquinha em .glb vai chegando em paralelo; até lá o jogo usa a de código
    carregarModelos();
    this.buildWorld();
    this.resize();
    this.pushHud();
    const w = window as unknown as Record<string, unknown>;
    if (!w.__gs) w.__gs = [];
    (w.__gs as unknown[]).push(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // -------------------------------------------------------------------------
  // construção do mundo
  // -------------------------------------------------------------------------
  private buildWorld() {
    this.skyTextures = BIOMES.map((b) => makeSkyTexture(b.sky));
    this.scene.background = this.skyTextures[0];
    this.scene.fog = new THREE.Fog(new THREE.Color(BIOMES[0].fog), 45, 150);

    this.hemi = new THREE.HemisphereLight(0xffd9f2, 0x2a1040, 1.15);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffe6c9, 1.5);
    this.sun.position.set(7, 16, 6);
    this.scene.add(this.sun);
    this.rim = new THREE.DirectionalLight(0x22e1ff, 0.6);
    this.rim.position.set(-8, 6, 10);
    this.scene.add(this.rim);

    // pista
    this.roadTex.repeat.set(1, ROAD_LEN / 9);
    const roadMat = new THREE.MeshStandardMaterial({ map: this.roadTex, roughness: 0.85, metalness: 0.05 });
    this.road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, ROAD_LEN), roadMat);
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.z = -ROAD_LEN / 2 + 20;
    this.scene.add(this.road);

    // calçadas + neon nas laterais
    for (const side of [-1, 1] as const) {
      const walk = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.5, ROAD_LEN),
        new THREE.MeshStandardMaterial({ color: new THREE.Color("#3B2260"), roughness: 0.9 }),
      );
      walk.position.set(side * (ROAD_W / 2 + 1.7), 0.25, -ROAD_LEN / 2 + 20);
      this.scene.add(walk);
      this.walks.push(walk);

      const neon = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.1, ROAD_LEN),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(PALETTE.cyan),
          emissive: new THREE.Color(PALETTE.cyan),
          emissiveIntensity: 1.6,
        }),
      );
      neon.position.set(side * (ROAD_W / 2 - 0.1), 0.52, -ROAD_LEN / 2 + 20);
      this.scene.add(neon);
      this.neons.push(neon);
    }

    // prédios laterais (pool reciclado)
    const buildingTextures = [makeBuildingTexture(320), makeBuildingTexture(190), makeBuildingTexture(45)];
    for (let i = 0; i < 26; i++) {
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      const tex = pick(buildingTextures).clone();
      tex.needsUpdate = true;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }),
      );
      this.scene.add(mesh);
      const building: Building = { mesh, side };
      this.buildings.push(building);
      this.placeBuilding(building, -((i / 2) * 16 + rand(0, 8)));
    }

    // Luiza + policial: bonecos 3D low poly (sem foto, sem billboard)
    this.player = new Humanoid(findSkin(this.skin).body, { ponytail: true });
    this.scene.add(this.player.group);
    this.cop = makeCop();
    this.scene.add(this.cop.group);

    // bolha do escudo (fica invisível até o power-up ser coletado)
    this.shieldMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 1),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8CC9FF"),
        emissive: new THREE.Color("#8CC9FF"),
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.28,
        roughness: 0.1,
      }),
    );
    this.shieldMesh.visible = false;
    this.scene.add(this.shieldMesh);

    this.sirenL = new THREE.PointLight(0xff2e88, 0, 18);
    this.scene.add(this.sirenL);

    this.dog = new Dog();
    this.dog.group.visible = false;
    this.scene.add(this.dog.group);

    // partículas simples (poeira / brilho)
    const geo = new THREE.BufferGeometry();
    const count = 220;
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.scene.add(this.particles);
    for (let i = 0; i < count; i++) this.particleData.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });

    this.applyBiome(0);
  }

  /** Troca a fase: céu, luz, cor das calçadas, neon e volumes laterais. */
  private applyBiome(idx: number) {
    this.biomeIdx = idx;
    const b = BIOMES[idx];
    this.scene.background = this.skyTextures[idx];
    if (this.scene.fog) (this.scene.fog as THREE.Fog).color.set(b.fog);
    this.hemi.color.set(b.hemiSky);
    this.hemi.groundColor.set(b.hemiGround);
    this.sun.color.set(b.sun);
    this.rim.color.set(b.rim);
    for (const w of this.walks) (w.material as THREE.MeshStandardMaterial).color.set(b.walk);
    for (const n of this.neons) {
      const mat = n.material as THREE.MeshStandardMaterial;
      mat.color.set(b.neon);
      mat.emissive.set(b.neon);
    }
    for (const bd of this.buildings) {
      (bd.mesh.material as THREE.MeshStandardMaterial).color.set(pick(b.side));
    }
    this.renderer.setClearColor(new THREE.Color(b.fog));
  }

  /** Portal que marca a entrada de uma fase nova. */
  private spawnGate() {
    const b = BIOMES[this.biomeIdx];
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(b.neon),
      emissive: new THREE.Color(b.neon),
      emissiveIntensity: 0.9,
      roughness: 0.4,
    });
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.6, 0.5), mat);
      post.position.set(sx * (ROAD_W / 2 + 0.3), 3.8, 0);
      group.add(post);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 1.6, 0.9, 0.6), mat);
    top.position.set(0, 7.4, 0);
    group.add(top);
    // faixa de pedestre gigante no chão
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_W - 0.4, 0.06, 0.6),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(b.obstacle.accent), roughness: 0.6 }),
      );
      stripe.position.set(0, 0.04, i * 1.3);
      group.add(stripe);
    }
    group.position.set(0, 0, SPAWN_Z - 6);
    this.scene.add(group);
    this.gates.push({ group, z: SPAWN_Z - 6 });
  }

  private placeBuilding(b: Building, z: number) {
    const range = BIOMES[this.biomeIdx].sideH;
    const h = rand(range[0], range[1]);
    const w = rand(5, 9);
    const d = rand(6, 11);
    b.mesh.scale.set(w, h, d);
    b.mesh.position.set(b.side * (ROAD_W / 2 + 3.4 + w / 2 + rand(0, 4)), h / 2, z);
  }

  // -------------------------------------------------------------------------
  // ciclo de vida
  // -------------------------------------------------------------------------
  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // em telas estreitas (celular) abre um pouco o campo de visão
    this.camera.fov = w / h < 0.75 ? 74 : 62;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.lane = 1;
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.sliding = 0;
    this.groundedFor = 1;
    this.jumpBuffer = 0;
    this.lives = 3;
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.specials = 0;
    this.combo = 1;
    this.comboBest = 1;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.beatRecord = false;
    this.speed = SPEED_START;
    this.boost = 0;
    this.invuln = 1;
    this.shake = 0;
    this.hitFlash = 0;
    this.caughtTimer = 0;
    this.copZ = 26;
    this.copTargetZ = 26;
    this.copSurge = 0; // começa longe: policial e cachorro só aparecem quando há dano
    this.nextSpawn = 46;
    this.lastRow = null;
    this.dogZ = 28;
    this.barkTimer = 2.5;
    // power-ups zerados
    this.powerTimers.clear();
    this.shield = false;
    this.chance = false;
    this.usedDoubleJump = false;
    this.shieldMesh.visible = false;
    this.nextPower = rand(95, 140);
    this.heartCooldown = 1200;
    this.specialSpawned = false;
    // contagem regressiva antes de começar a valer
    this.countdown = 3.2;
    this.countdownStep = 4;
    this.clearEntities();
    this.applyBiome(0);
    this.setPhase("running");
    this.audio.playTrack(0);
    this.pushHud();
  }

  pause() {
    if (this.phase !== "running") return;
    this.setPhase("paused");
    this.audio.pauseMusic();
  }

  resume() {
    if (this.phase !== "paused") return;
    this.setPhase("running");
    this.audio.playMusic();
  }

  toMenu() {
    this.clearEntities();
    this.setPhase("menu");
    this.audio.pauseMusic();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.clearEntities();
    this.player.dispose();
    this.cop.dispose();
    this.dog.dispose();
    this.renderer.dispose();
  }

  /** Troca a skin da Luiza (tela de seleção de personagem). */
  setSkin(skin: SkinKey) {
    this.skin = skin;
    this.player.setPalette(findSkin(skin).body);
  }

  /** Recorde pessoal atual, para avisar quando for batido no meio da corrida. */
  setBest(best: number) {
    this.best = best;
  }

  /** Menos partículas e sem tremida de câmera (aparelho fraco / enjoo). */
  setReduceFx(on: boolean) {
    this.reduceFx = on;
  }

  /** Liga/desliga a vibração do celular. */
  setVibration(on: boolean) {
    this.vibrate = on;
  }

  /** Vibração curta no celular (ignorada em quem não tem o recurso). */
  private buzz(ms: number) {
    if (!this.vibrate) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* aparelho sem vibração */
    }
  }

  private setPhase(phase: Phase) {
    this.phase = phase;
    this.onPhaseChange(phase);
  }

  private clearEntities() {
    for (const o of this.obstacles) this.recycle(o.group);
    for (const i of this.items) {
      this.scene.remove(i.obj);
      disposeItem(i.obj);
    }
    for (const g of this.gates) this.recycle(g.group);
    for (const p of this.props) this.recycle(p.group);
    this.gates = [];
    this.props = [];
    this.obstacles = [];
    this.items = [];
  }

  // -------------------------------------------------------------------------
  // input — respostas rápidas, sem travar em animação
  // -------------------------------------------------------------------------
  input(action: InputAction) {
    if (this.phase !== "running") return;
    switch (action) {
      case "left":
        this.tentarFaixa(this.lane - 1);
        break;
      case "right":
        this.tentarFaixa(this.lane + 1);
        break;
      case "jump":
        this.tryJump();
        break;
      case "slide":
        // deslizar cancela o pulo (queda rápida) e recomeça o agachamento
        if (this.y > 0.1) this.vy = Math.min(this.vy, -16);
        if (this.sliding <= 0.1) this.audio.play("slide");
        this.sliding = SLIDE_TIME;
        break;
    }
  }

  /**
   * Troca de faixa. Se um carro/ônibus estiver passando naquela faixa a troca
   * é recusada (igual aos trens do Subway Surfers): a Luiza continua na faixa
   * e leva só um tranco na câmera.
   */
  private tentarFaixa(alvo: number) {
    if (alvo < 0 || alvo > 2) return;
    if (this.faixaTravada(alvo)) {
      this.audio.play("erro");
      this.shake = Math.max(this.shake, 0.3);
      this.buzz(14);
      return;
    }
    this.lane = alvo;
  }

  /** true quando tem um trem (carro/ônibus) ocupando aquela faixa agora. */
  private faixaTravada(lane: number) {
    if (this.admin.noclip || this.admin.fly) return false;
    return this.obstacles.some((o) => o.trem && o.lane === lane && o.z > -TREM_LEN && o.z < 5.5);
  }

  private tryJump() {
    const canJump = this.groundedFor <= COYOTE;
    if (canJump) {
      this.vy = JUMP_V;
      this.sliding = 0; // pular interrompe o agachamento na hora
      this.groundedFor = COYOTE + 1;
      this.jumpBuffer = 0;
      this.usedDoubleJump = false;
      this.audio.play("jump");
      this.burst(this.x, 0.15, 0, PALETTE.cyan, 8);
      return;
    }
    // duplo pulo: só com o power-up ativo e uma vez por pulo
    if (this.powerTimers.has("pulo") && !this.usedDoubleJump) {
      this.usedDoubleJump = true;
      this.vy = JUMP_V * 0.92;
      this.sliding = 0;
      this.audio.play("jump");
      this.burst(this.x, this.y + 0.4, 0, PALETTE.lime, 14);
      return;
    }
    this.jumpBuffer = BUFFER; // guarda o comando para o instante do pouso
  }

  // -------------------------------------------------------------------------
  // loop
  // -------------------------------------------------------------------------
  private loop = (ts: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const real = Math.min(0.05, (ts - this.lastTs) / 1000 || 0);
    this.lastTs = ts;
    if (real > 0) this.fps += (1 / real - this.fps) * 0.1;
    // o admin pode rodar o jogo em câmera lenta ou acelerado
    const dt = real * this.admin.timeScale;
    this.t += dt;

    if (this.phase === "running" || this.phase === "caught") this.update(dt);
    else if (this.phase === "menu") this.updateIdle(dt);

    this.updateVisuals(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateIdle(dt: number) {
    const d = 9 * dt;
    this.scroll(d);
    this.x += (0 - this.x) * Math.min(1, dt * 4);
  }

  private update(dt: number) {
    if (this.phase === "caught") {
      this.caughtTimer -= dt;
      this.speed = Math.max(0, this.speed - 26 * dt);
      this.copZ += (1.1 - this.copZ) * Math.min(1, dt * 3);
      this.scroll(this.speed * dt);
      if (this.caughtTimer <= 0) {
        this.setPhase("over");
        this.audio.pauseMusic();
        this.audio.play("gameover");
        this.onGameOver({
          score: Math.floor(this.score),
          distance: Math.floor(this.distance),
          coins: this.coins,
          specials: this.specials,
          combo: this.comboBest,
        });
      }
      return;
    }

    // contagem regressiva "3, 2, 1, Vai!" — a Luiza corre parada no lugar
    if (this.countdown > 0) {
      this.countdown -= dt;
      const passo = Math.ceil(this.countdown - 0.2);
      if (passo < this.countdownStep) {
        this.countdownStep = passo;
        this.audio.play("contagem");
        if (passo <= 0) {
          this.float("VAI!", PALETTE.lime);
          this.burst(this.x, 1.2, 0, PALETTE.lime, 20);
        } else {
          this.float(String(passo), PALETTE.gold);
        }
      }
      this.x += (LANES[this.lane] - this.x) * Math.min(1, dt * 13);
      this.scroll(6 * dt);
      return;
    }

    // velocidade
    const target = Math.min(SPEED_MAX, SPEED_START + this.distance * SPEED_RAMP);
    this.speed += (target - this.speed) * Math.min(1, dt * 1.2);
    const boosting = this.boost > 0;
    const effSpeed = this.speed * (boosting ? 1.5 : 1);
    if (boosting) this.boost = Math.max(0, this.boost - dt * 1000);
    this.audio.setMusicRate(0.95 + (effSpeed / SPEED_MAX) * 0.28);

    // power-ups com duração vão descontando; avisa quando acaba
    for (const [key, ms] of [...this.powerTimers]) {
      const restante = ms - dt * 1000;
      if (restante <= 0) {
        this.powerTimers.delete(key);
        this.audio.play("powerfim");
        this.float(`${POWERS[key].nome} acabou`, PALETTE.muted);
      } else {
        this.powerTimers.set(key, restante);
      }
    }

    const travelled = effSpeed * dt;
    this.distance += travelled;
    if (this.heartCooldown > 0) this.heartCooldown -= travelled;
    this.score +=
      travelled * (boosting ? 2 : 1) * (this.powerTimers.has("x2") ? 2 : 1) * this.multiplicador();

    // faixa
    this.x += (LANES[this.lane] - this.x) * Math.min(1, dt * 13);

    // modo fly da conta admin: sem gravidade e sem trilho de faixas
    if (this.admin.fly) {
      this.x += (this.flyX - this.x) * Math.min(1, dt * 7);
      this.vy *= 0.9;
      this.y = Math.max(0, this.y + this.vy * dt);
      this.groundedFor = 0;
    } else if (this.y > 0 || this.vy > 0) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      this.groundedFor += dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.groundedFor = 0;
        this.burst(this.x, 0.1, 0, "#ffffff", 5);
      }
    } else {
      this.groundedFor = 0;
    }

    // comando de pulo guardado (permite pular no instante do pouso)
    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= dt;
      if (this.groundedFor <= COYOTE) this.tryJump();
    }

    if (this.sliding > 0) this.sliding -= dt;
    // conta admin: invencibilidade fica sempre renovada
    if (this.admin.god || this.admin.invuln) this.invuln = Math.max(this.invuln, 0.5);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.2);

    // policial — com "Fuga Rápida" ele fica muito atrás e some da tela
    if (this.copSurge > 0) this.copSurge -= dt;
    const fugindo = this.powerTimers.has("fuga");
    // Sem dano, o policial fica longe (atrás da câmera) e não aparece na tela.
    // Ele só entra em cena quando a Luiza leva uma batida (copSurge > 0).
    this.copTargetZ = fugindo ? 30 : this.copSurge > 0 ? 3.1 : 26;
    // durante a perseguição ele fecha a distância rápido; depois volta devagar
    this.copZ += (this.copTargetZ - this.copZ) * Math.min(1, dt * (this.copSurge > 0 ? 3.4 : 1.6));
    const copSide = this.x >= 0 ? -1 : 1;
    this.copX += (this.x + copSide * 1.5 - this.copX) * Math.min(1, dt * 2.2);

    // troca de fase (bioma) por distância
    const wantBiome = Math.floor(this.distance / BIOME_LEN) % BIOMES.length;
    if (wantBiome !== this.biomeIdx) {
      this.applyBiome(wantBiome);
      this.spawnGate();
      // sem aviso de troca de cenário: nada de nome do bioma nem lista de objetos na tela,
      // a mudança é percebida só pelo cenário e pela música
      this.burst(this.x, 1.4, -4, PALETTE.gold, 24);
      // música da área nova entra com crossfade de ~1,5 s
      this.audio.playTrack(wantBiome);
      this.audio.play("transicao");
      this.buzz(24);
    }

    // cachorro correndo com o policial
    const dogSide = this.x >= 0 ? -1 : 1;
    this.dogZ += (this.copZ - 1.5 - this.dogZ) * Math.min(1, dt * 1.8);
    this.dogX += (this.x + dogSide * 2.2 - this.dogX) * Math.min(1, dt * 2.6);
    this.barkTimer -= dt;
    if (this.barkTimer <= 0) {
      this.barkTimer = this.copSurge > 0 ? rand(1.1, 2) : rand(3.5, 6.5);
      // o latido só toca quando o cachorro está em cena (perseguição ativa)
      if (this.copSurge > 0) this.audio.play("bark");
    }

    // ímã: puxa as moedas das outras faixas para a Luiza
    if (this.powerTimers.has("iman")) {
      for (const it of this.items) {
        if (it.taken || it.kind !== "coin") continue;
        if (it.z < -26 || it.z > 6) continue;
        it.x += (this.x - it.x) * Math.min(1, dt * 4.5);
        it.obj.position.x = it.x;
      }
    }

    // novo recorde no meio da corrida
    if (!this.beatRecord && this.best > 0 && this.score > this.best) {
      this.beatRecord = true;
      this.onNotify("recorde", "Novo recorde pessoal!");
      this.audio.play("recorde");
      this.burst(this.x, 1.6, 0, PALETTE.gold, 26);
      this.buzz(40);
    }

    // power-up universal: 1 a cada 30-45 segundos de corrida
    this.nextPower -= dt;
    if (this.nextPower <= 0) {
      this.nextPower = rand(95, 140);
      this.spawnPower();
    }

    this.scroll(travelled);
    this.spawn(travelled, effSpeed);
    this.collisions();

    this.hudTimer += dt;
    if (this.hudTimer > 0.1) {
      this.hudTimer = 0;
      this.pushHud();
    }
  }

  /** move o mundo para trás (em direção à câmera) */
  private scroll(d: number) {
    this.roadTex.offset.y -= d / 9;

    for (const o of this.obstacles) {
      // carro e ônibus têm movimento próprio: vêm um pouco mais rápido
      o.z += o.trem ? d * 1.24 : d;
      o.group.position.z = o.z;
    }
    for (const it of this.items) {
      it.z += d;
      it.obj.position.z = it.z;
    }
    for (const g of this.gates) {
      g.z += d;
      g.group.position.z = g.z;
    }
    const goneGates = this.gates.filter((g) => g.z > DESPAWN_Z + 8);
    for (const g of goneGates) this.recycle(g.group);
    this.gates = this.gates.filter((g) => g.z <= DESPAWN_Z + 8);

    for (const p of this.props) {
      p.z += d;
      p.group.position.z = p.z;
    }
    for (const p of this.props.filter((x) => x.z > DESPAWN_Z + 14)) this.recycle(p.group);
    this.props = this.props.filter((x) => x.z <= DESPAWN_Z + 14);

    // novos props de cenário nas calçadas
    this.nextProp -= d;
    if (this.nextProp <= 0) {
      this.nextProp = rand(16, 30);
      this.spawnProp();
    }

    for (const b of this.buildings) {
      b.mesh.position.z += d;
      if (b.mesh.position.z > 40) this.placeBuilding(b, b.mesh.position.z - 26 * 16);
    }

    // recicla o que passou
    const gone = this.obstacles.filter((o) => o.z > DESPAWN_Z);
    for (const o of gone) this.recycle(o.group);
    this.obstacles = this.obstacles.filter((o) => o.z <= DESPAWN_Z);

    // itens coletados ainda ficam alguns quadros "saltando" para a HUD
    for (const it of this.items.filter((i) => i.z > DESPAWN_Z || (i.taken && i.fly <= 0))) {
      this.scene.remove(it.obj);
      disposeItem(it.obj);
    }
    this.items = this.items.filter((i) => i.z <= DESPAWN_Z && (!i.taken || i.fly > 0));
  }

  // -------------------------------------------------------------------------
  // spawner — garante que sempre dá para desviar
  // -------------------------------------------------------------------------
  private spawn(travelled: number, effSpeed: number) {
    this.nextSpawn -= travelled;
    if (this.nextSpawn > 0) return;

    const difficulty = Math.min(1, this.distance / 2600);

    // tipo da linha; evita pedir pulo logo depois de agachar sem espaço
    const types: ObstacleType[] =
      this.biomeIdx === 5
        ? ["low", "high", "block", "ride", "ride", "low"] // shopping tem escada rolante
        : ["low", "high", "block", "low", "block", "ride"];
    let type = pick(types);
    if (this.lastRow && this.lastRow.type === "high" && type === "low" && difficulty < 0.5) type = "block";

    // quantas faixas ficam bloqueadas (nunca as 3)
    const blocked = Math.random() < 0.2 + difficulty * 0.4 ? 2 : 1;
    const order = shuffle([0, 1, 2]);
    const lanes = order.slice(0, blocked);

    for (const lane of lanes) this.addObstacle(type, lane, SPAWN_Z);

    // itens nas faixas livres
    const free = [0, 1, 2].filter((l) => !lanes.includes(l));
    if (free.length) {
      const lane = pick(free);
      const roll = Math.random();
      if (roll < 0.74) {
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) this.addItem("coin", lane, SPAWN_Z - i * 3.2, 1.15);
      } else if (roll < 0.765 && this.lives < 3 && this.heartCooldown <= 0) {
        // coração é item raro: no máximo um a cada ~1,2 km e só com vida faltando
        this.heartCooldown = 1200;
        this.addItem("heart", lane, SPAWN_Z, 1.35);
      } else if (roll < 0.785) {
        this.addItem("boost", lane, SPAWN_Z, 1.35);
      } else if (!this.specialSpawned && this.distance > 700) {
        // item especial: no máximo 1 por partida
        this.specialSpawned = true;
        this.addItem("special", lane, SPAWN_Z, 1.4);
      } else {
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) this.addItem("coin", lane, SPAWN_Z - i * 3.2, 1.15);
      }
    }

    // ESPAÇO: sempre em tempo de reação, não em distância fixa.
    // quanto mais rápido, maior o vão — nunca fica impossível.
    const reaction = type === "block" ? 0.62 : 0.78;
    const recovery = this.lastRow && this.lastRow.type !== type ? 0.34 : 0.16;
    const jitter = rand(0, 0.22);
    this.nextSpawn = Math.max(13, effSpeed * (reaction + recovery + jitter));

    this.lastRow = { type, lanes };
  }

  /**
   * Qual peça modelada em 3D entra em cada área. Devolve `undefined` quando a
   * área usa um obstáculo desenhado em código (praia e shopping têm os seus).
   */
  private modeloDoObstaculo(type: ObstacleType): ModeloKey | undefined {
    if (type === "low" || type === "ride") {
      // pular: cerca de madeira no bairro/praça, barricada na escola, cone no centro
      return ([
        "cercaMadeira",
        "cerquinha",
        "cone",
        "cercaMadeira",
        undefined,
        undefined,
      ] as (ModeloKey | undefined)[])[this.biomeIdx];
    }
    if (type === "block") {
      // desviar: carro na rua, caixas no pátio da escola, ônibus da linha azul no centro
      return ([
        "carro",
        "caixas",
        "onibus",
        undefined,
        undefined,
        undefined,
      ] as (ModeloKey | undefined)[])[this.biomeIdx];
    }
    return undefined;
  }

  /**
   * Regras de cada obstáculo: até onde ele "bate", se lança a Luiza para cima
   * (rampa/escada) e se ele é um trem (vem na faixa e tranca a troca).
   */
  private metaDoObstaculo(type: ObstacleType): { topo: number; rampa: boolean; trem: boolean } {
    if (type === "ride") return { topo: 1.15, rampa: true, trem: false };
    if (type === "block") {
      const modelo = this.modeloDoObstaculo(type);
      // ônibus: dá para passar por cima com o duplo pulo ou saindo de uma rampa
      if (modelo === "onibus") return { topo: ONIBUS_TOP, rampa: false, trem: true };
      // carro: não dá para pular, e enquanto ele está do lado a faixa fica travada
      if (modelo === "carro") return { topo: Infinity, rampa: false, trem: true };
      return { topo: Infinity, rampa: false, trem: false };
    }
    return { topo: type === "low" ? 0.95 : Infinity, rampa: false, trem: false };
  }

  private addObstacle(type: ObstacleType, lane: number, z: number) {
    const group = this.buildObstacle(type);
    group.position.set(LANES[lane], 0, z);
    this.scene.add(group);
    const meta = this.metaDoObstaculo(type);
    this.obstacles.push({ type, lane, z, group, hit: false, ...meta });
  }

  /**
   * Obstáculos são geometria low poly de verdade (sem foto), com forma e cor
   * variando por bioma: cerca/muro/placa no bairro, ônibus e semáforo no
   * centro, banco e arbusto na praça...
   */
  private buildObstacle(type: ObstacleType): THREE.Object3D {
    const b = BIOMES[this.biomeIdx];
    const group = new THREE.Group();
    const mat = (color: string, emissive = 0) =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.75,
        metalness: 0.05,
        emissive: new THREE.Color(color),
        emissiveIntensity: emissive,
      });

    // --- obstáculos exclusivos da PRAIA (área 5) -------------------------
    if (this.biomeIdx === 4 && type === "high") {
      // guarda-sol aberto: passa deslizando por baixo
      const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.9, 8), mat("#B98A4A"));
      poste.position.y = 1.45;
      group.add(poste);
      for (let i = 0; i < 8; i++) {
        const gomo = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 0.7, 3),
          mat(i % 2 === 0 ? "#FF6B6B" : b.obstacle.accent, 0.2),
        );
        gomo.position.y = 2.75;
        gomo.rotation.y = (i / 8) * Math.PI * 2;
        gomo.scale.set(0.42, 1, 0.42);
        group.add(gomo);
      }
      const cupula = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.75, 8), mat("#2BD9C9", 0.25));
      cupula.position.y = 2.72;
      group.add(cupula);
      return group;
    }
    if (this.biomeIdx === 4 && type === "low") {
      // cadeira de praia: pular por cima
      const assento = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.9), mat("#FF6B6B"));
      assento.position.y = 0.6;
      group.add(assento);
      const costas = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.14), mat(b.obstacle.accent, 0.15));
      costas.position.set(0, 1.0, -0.42);
      costas.rotation.x = -0.35;
      group.add(costas);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const pe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), mat("#B98A4A"));
          pe.position.set(sx * 0.72, 0.3, sz * 0.36);
          group.add(pe);
        }
      }
      return group;
    }

    // --- obstáculos exclusivos do SHOPPING (área 6) ----------------------
    if (this.biomeIdx === 5 && type === "ride") {
      // escada rolante: dá para subir em cima pulando
      const rampa = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 3.2), mat("#9AA3AE"));
      rampa.position.set(0, 0.95, 0);
      rampa.rotation.x = 0.22;
      group.add(rampa);
      for (let i = 0; i < 6; i++) {
        const degrau = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.4), mat("#CFA94A", 0.3));
        degrau.position.set(0, 0.55 + i * 0.14, 1.4 - i * 0.55);
        group.add(degrau);
      }
      for (const sx of [-1, 1]) {
        const corrimao = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.3), mat("#FFFFFF", 0.2));
        corrimao.position.set(sx * 0.95, 1.45, 0);
        corrimao.rotation.x = 0.22;
        group.add(corrimao);
      }
      return group;
    }
    if (this.biomeIdx === 5 && type === "low") {
      // carrinho de compras largado no meio do corredor
      const cesta = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.9), mat("#C0392B"));
      cesta.position.y = 0.75;
      group.add(cesta);
      for (let i = 0; i < 4; i++) {
        const grade = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.95), mat("#FFFFFF", 0.2));
        grade.position.y = 0.5 + i * 0.2;
        group.add(grade);
      }
      const cabo = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.1), mat("#9AA3AE"));
      cabo.position.set(0, 1.2, 0.45);
      group.add(cabo);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 8), mat(PALETTE.ink));
          roda.rotation.z = Math.PI / 2;
          roda.position.set(sx * 0.6, 0.13, sz * 0.34);
          group.add(roda);
        }
      }
      return group;
    }

    if (type === "ride") {
      // rampa turbo: dá para pular em cima dela (modelo .glb)
      const rampa = makeModelo("rampa");
      if (rampa) {
        group.add(rampa);
        return group;
      }
    }

    if (type === "ride" || type === "low") {
      // baixo: pular. Cada área tem a sua peça modelada em 3D.
      const modelo = this.modeloDoObstaculo(type);
      const peca = modelo ? makeModelo(modelo) : null;
      if (peca) {
        group.add(peca);
        // uma leve variação de ângulo para não parecer tudo igual
        peca.rotation.y += rand(-0.06, 0.06);
        return group;
      }

      // reserva: se o modelo ainda não carregou, usamos a cerca desenhada em código
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 0.5), mat(b.obstacle.low));
      body.position.y = 0.72;
      group.add(body);
      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.35), mat(b.obstacle.low));
        leg.position.set(sx * 0.72, 0.36, 0);
        group.add(leg);
      }
      if (this.biomeIdx === 2) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 6), mat(b.obstacle.accent, 0.25));
        cone.position.set(0, 0.4, 0.5);
        group.add(cone);
      } else {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.56), mat(b.obstacle.accent, 0.3));
        stripe.position.y = 0.95;
        group.add(stripe);
      }
    } else if (type === "high") {
      // alto: deslizar. Varal (bairro), placa (escola), semáforo (centro), galho (praça)
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.4), mat(b.obstacle.high, 0.35));
      bar.position.y = 2.55;
      group.add(bar);
      const face = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.06), mat(b.obstacle.accent, 0.5));
      face.position.set(0, 2.55, 0.24);
      group.add(face);
      for (const sx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.1, 0.18), mat(PALETTE.ink));
        post.position.set(sx * 1.05, 1.55, 0);
        group.add(post);
      }
      if (this.biomeIdx === 3) {
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), mat("#2A7A4A"));
        leaf.position.set(0, 3.2, 0);
        group.add(leaf);
      }
    } else {
      // bloqueia a faixa: carro (bairro), caixas (escola), ônibus (centro)...
      const modelo = this.modeloDoObstaculo(type);
      const peca = modelo ? makeModelo(modelo) : null;
      if (peca) {
        group.add(peca);
        peca.rotation.y += rand(-0.04, 0.04);
        return group;
      }
      if (this.biomeIdx === 2) {
        const bus = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 1.5), mat(b.obstacle.block));
        bus.position.y = 1.25;
        group.add(bus);
        for (let i = 0; i < 3; i++) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), mat(b.obstacle.accent, 0.4));
          win.position.set(-0.6 + i * 0.6, 1.85, 0.78);
          group.add(win);
        }
      } else if (this.biomeIdx === 3) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 0), mat(b.obstacle.block));
        rock.position.y = 1.05;
        rock.rotation.set(0.3, 0.6, 0.2);
        group.add(rock);
      } else if (this.biomeIdx === 4) {
        // jangada encostada na areia com castelo de areia na frente
        const casco = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1.4), mat("#B98A4A"));
        casco.position.y = 0.3;
        group.add(casco);
        const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), mat("#8A6534"));
        mastro.position.y = 1.4;
        group.add(mastro);
        const vela = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 1.1), mat(b.obstacle.accent, 0.2));
        vela.position.set(0.05, 1.5, 0.2);
        group.add(vela);
        for (let i = 0; i < 3; i++) {
          const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.5 + i * 0.15, 6), mat("#E8D2A0"));
          torre.position.set(-0.6 + i * 0.6, 0.3 + i * 0.07, 0.9);
          group.add(torre);
        }
      } else if (this.biomeIdx === 5) {
        // vitrine de loja fechada bloqueando o corredor
        const vidro = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2.7, 0.16),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color("#D8E6F2"),
            emissive: new THREE.Color("#FFFFFF"),
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.72,
            roughness: 0.05,
            metalness: 0.4,
          }),
        );
        vidro.position.y = 1.35;
        group.add(vidro);
        const moldura = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 0.3), mat("#CFA94A", 0.3));
        moldura.position.y = 2.78;
        group.add(moldura);
        for (const sx of [-1, 1]) {
          const lateral = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 0.3), mat("#CFA94A", 0.25));
          lateral.position.set(sx, 1.4, 0);
          group.add(lateral);
        }
        const roupa = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 8), mat("#F2D8E4", 0.15));
        roupa.position.set(0, 0.7, -0.2);
        group.add(roupa);
      } else {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 2.7, 0.7), mat(b.obstacle.block));
        wall.position.y = 1.35;
        group.add(wall);
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 0.85), mat(b.obstacle.accent, 0.25));
        top.position.y = 2.78;
        group.add(top);
      }
    }
    return group;
  }

  /**
   * Props de cenário exclusivos de cada área (ficam nas calçadas, sem
   * atrapalhar a corrida). São eles que dão a "cara" de cada fase.
   */
  private buildProp(): THREE.Object3D {
    const group = new THREE.Group();
    const mat = (color: string, emissive = 0) =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: emissive,
        roughness: 0.7,
      });

    // peças modeladas em 3D que ficam na calçada de algumas áreas
    const modelado: (ModeloKey | undefined)[] = ["casinha", "cone", "placa", undefined, undefined, undefined];
    const alvo = modelado[this.biomeIdx];
    if (alvo && Math.random() < 0.6) {
      const peca = makeModelo(alvo);
      if (peca) {
        group.add(peca);
        // casa/placa/cone modelados ficam retos e rente à calçada
        group.userData.alinhado = true;
        return group;
      }
    }

    switch (this.biomeIdx) {
      case 0: {
        if (Math.random() < 0.5) {
          // trampolim do quintal
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              const pe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), mat("#9AA3AE"));
              pe.position.set(sx * 1.1, 0.4, sz * 1.1);
              group.add(pe);
            }
          }
          const lona = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.16, 12), mat("#2F6FB3"));
          lona.position.y = 0.88;
          group.add(lona);
          const borda = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.12, 6, 14), mat(PALETTE.gold, 0.2));
          borda.position.y = 0.96;
          borda.rotation.x = Math.PI / 2;
          group.add(borda);
        } else {
          // carrinho de rolimã
          const tabua = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.6), mat("#B3651F"));
          tabua.position.y = 0.34;
          group.add(tabua);
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10), mat(PALETTE.ink));
              roda.rotation.z = Math.PI / 2;
              roda.position.set(sx * 0.44, 0.2, sz * 0.6);
              group.add(roda);
            }
          }
        }
        break;
      }
      case 1: {
        if (Math.random() < 0.5) {
          // fila de mochilas encostadas no muro
          for (let i = 0; i < 4; i++) {
            const cor = ["#E04E7A", "#2F6FB3", "#D8C36A", "#3AC98A"][i];
            const mochila = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.34), mat(cor));
            mochila.position.set(0, 0.31, i * 0.7);
            group.add(mochila);
            const bolso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.1), mat("#FFFFFF", 0.1));
            bolso.position.set(0, 0.18, i * 0.7 + 0.2);
            group.add(bolso);
          }
        } else {
          // cones de educação física
          for (let i = 0; i < 3; i++) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 8), mat("#FF7A1F", 0.15));
            cone.position.set(rand(-0.4, 0.4), 0.35, i * 1.1);
            group.add(cone);
            const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), mat("#FFFFFF", 0.1));
            base.position.set(cone.position.x, 0.03, i * 1.1);
            group.add(base);
          }
        }
        break;
      }
      case 2: {
        if (Math.random() < 0.5) {
          // banca de jornal virada
          const corpo = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.2), mat("#5A3A8C"));
          corpo.position.set(0, 0.7, 0);
          corpo.rotation.z = 0.42;
          group.add(corpo);
          const toldo = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.4), mat(PALETTE.pink, 0.4));
          toldo.position.set(0.3, 1.5, 0);
          toldo.rotation.z = 0.42;
          group.add(toldo);
          for (let i = 0; i < 4; i++) {
            const jornal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), mat("#FFF3D6", 0.1));
            jornal.position.set(rand(-1, 1), 0.03, rand(-0.8, 0.8));
            jornal.rotation.y = rand(0, 3);
            group.add(jornal);
          }
        } else {
          // poste caído com a luz ainda piscando
          const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6, 8), mat("#9AA3AE"));
          poste.position.set(0, 0.6, 0);
          poste.rotation.x = Math.PI / 2 - 0.12;
          group.add(poste);
          const luz = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.9), mat(PALETTE.gold, 0.9));
          luz.position.set(0, 0.7, 2.9);
          group.add(luz);
        }
        break;
      }
      case 3: {
        if (Math.random() < 0.5) {
          // playground: escorregador + balanço
          const escada = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 0.2), mat("#2A6B8C"));
          escada.position.set(0, 1.1, -0.9);
          group.add(escada);
          const rampa = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 2.8), mat(PALETTE.gold, 0.2));
          rampa.position.set(0, 1.2, 0.7);
          rampa.rotation.x = 0.5;
          group.add(rampa);
          const barra = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 2.6), mat("#3AC98A"));
          barra.position.set(1.6, 2.1, 0);
          group.add(barra);
          const assento = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), mat("#E8FFD6", 0.15));
          assento.position.set(1.6, 0.6, 0);
          group.add(assento);
        } else {
          // lago com reflexo
          const agua = new THREE.Mesh(
            new THREE.CircleGeometry(2.6, 18),
            new THREE.MeshStandardMaterial({
              color: new THREE.Color("#2A6B8C"),
              emissive: new THREE.Color("#22E1FF"),
              emissiveIntensity: 0.35,
              transparent: true,
              opacity: 0.85,
              roughness: 0.05,
              metalness: 0.6,
            }),
          );
          agua.rotation.x = -Math.PI / 2;
          agua.position.y = 0.06;
          group.add(agua);
          for (let i = 0; i < 3; i++) {
            const pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.25, 0.5), 0), mat("#4A5A54"));
            pedra.position.set(rand(-2.4, 2.4), 0.2, rand(-2.4, 2.4));
            group.add(pedra);
          }
        }
        break;
      }
      case 4: {
        const r = Math.random();
        if (r < 0.4) {
          // coqueiro de tronco curvo
          for (let i = 0; i < 6; i++) {
            const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.16 - i * 0.012, 0.2 - i * 0.012, 0.9, 7), mat("#8A6534"));
            seg.position.set(Math.sin(i * 0.28) * 0.55, 0.45 + i * 0.85, 0);
            seg.rotation.z = -Math.cos(i * 0.28) * 0.16;
            group.add(seg);
          }
          for (let i = 0; i < 6; i++) {
            const folha = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.1, 4), mat("#2BAF7A"));
            folha.position.set(Math.sin(1.4) * 0.55, 5.5, 0);
            folha.rotation.set(0.9, (i / 6) * Math.PI * 2, 0);
            group.add(folha);
          }
          for (const sx of [-1, 1]) {
            const coco = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat("#6B4A28"));
            coco.position.set(Math.sin(1.4) * 0.55 + sx * 0.22, 5.2, 0);
            group.add(coco);
          }
        } else if (r < 0.75) {
          // guarda-sol listrado + cadeira na areia
          const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), mat("#B98A4A"));
          poste.position.y = 1.3;
          group.add(poste);
          for (let i = 0; i < 8; i++) {
            const gomo = new THREE.Mesh(
              new THREE.ConeGeometry(1.5, 0.7, 3),
              mat(i % 2 === 0 ? "#FF6B6B" : "#FFF6DC", 0.15),
            );
            gomo.position.y = 2.5;
            gomo.rotation.y = (i / 8) * Math.PI * 2;
            gomo.scale.set(0.42, 1, 0.42);
            group.add(gomo);
          }
          const espreguicadeira = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.7), mat("#2BD9C9"));
          espreguicadeira.position.set(1.5, 0.4, 0);
          group.add(espreguicadeira);
        } else {
          // quiosque de coco
          const balcao = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.4), mat("#E8D2A0"));
          balcao.position.y = 0.6;
          group.add(balcao);
          const telhado = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.1, 4), mat("#8A6534"));
          telhado.position.y = 1.9;
          telhado.rotation.y = Math.PI / 4;
          group.add(telhado);
          const placa = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.08), mat("#FF6B6B", 0.35));
          placa.position.set(0, 1.45, 0.75);
          group.add(placa);
          for (let i = 0; i < 4; i++) {
            const coco = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat("#2BAF7A"));
            coco.position.set(-0.9 + i * 0.6, 1.32, 0.4);
            group.add(coco);
          }
        }
        break;
      }
      default: {
        const r = Math.random();
        if (r < 0.4) {
          // vitrine iluminada com manequim
          const caixa = new THREE.Mesh(new THREE.BoxGeometry(3, 3.2, 1.2), mat("#FFFFFF"));
          caixa.position.y = 1.6;
          group.add(caixa);
          const luz = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 1.3), mat("#FFF6DC", 0.9));
          luz.position.y = 3.2;
          group.add(luz);
          const manequim = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1, 4, 8), mat("#F2D8E4", 0.1));
          manequim.position.set(0, 1.1, 0.8);
          group.add(manequim);
          const vestido = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 8), mat(PALETTE.pink, 0.25));
          vestido.position.set(0, 0.75, 0.8);
          group.add(vestido);
        } else if (r < 0.7) {
          // planta em vaso + banco de mármore
          const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.7, 8), mat("#CFA94A", 0.2));
          vaso.position.y = 0.35;
          group.add(vaso);
          for (let i = 0; i < 5; i++) {
            const folha = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 4), mat("#2BAF7A"));
            folha.position.set(0, 1.1, 0);
            folha.rotation.set(0.5, (i / 5) * Math.PI * 2, 0);
            group.add(folha);
          }
          const banco = new THREE.Mesh(new THREE.BoxGeometry(2, 0.22, 0.7), mat("#E9E9EE"));
          banco.position.set(1.8, 0.55, 0);
          group.add(banco);
          for (const sx of [-1, 1]) {
            const pe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.6), mat("#D8D8E0"));
            pe.position.set(1.8 + sx * 0.7, 0.28, 0);
            group.add(pe);
          }
        } else {
          // painel de luz gigante
          const painel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 2.2), mat("#D8E6F2", 0.5));
          painel.position.y = 2.2;
          group.add(painel);
          for (let i = 0; i < 3; i++) {
            const faixa = new THREE.Mesh(
              new THREE.BoxGeometry(0.28, 0.5, 1.9),
              mat([PALETTE.pink, PALETTE.cyan, PALETTE.gold][i], 0.85),
            );
            faixa.position.set(0, 1.4 + i * 0.9, 0);
            group.add(faixa);
          }
        }
        break;
      }
    }
    return group;
  }

  /** Coloca um prop na calçada, alternando os lados. */
  private spawnProp() {
    const group = this.buildProp();
    const side = Math.random() < 0.5 ? -1 : 1;
    if (group.userData.alinhado) {
      // sem sorteio de posição: encostado na calçada e virado para a pista
      group.position.set(side * (ROAD_W / 2 + 2.6), 0, SPAWN_Z);
      group.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      group.position.set(side * (ROAD_W / 2 + rand(2.2, 3.2)), 0, SPAWN_Z - rand(0, 12));
      group.rotation.y = side > 0 ? -0.3 : 0.3;
    }
    this.scene.add(group);
    this.props.push({ group, z: group.position.z });
  }

  private recycle(group: THREE.Object3D) {
    this.scene.remove(group);
    group.traverse((child) => {
      // malhas de modelo .glb são compartilhadas entre todos os obstáculos:
      // apagar aqui deixaria os próximos invisíveis
      if (child.userData.compartilhado) return;
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const mat = child.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.pool.length = 0;
  }

  private addItem(kind: ItemKind, lane: number, z: number, y: number) {
    // a moeda leva a gravação temática da área atual
    const obj = makeItemMesh(kind, this.biomeIdx);
    obj.position.set(LANES[lane], y, z);
    this.scene.add(obj);
    this.items.push({ kind, lane, z, y, obj, taken: false, fly: 0, x: LANES[lane] });
  }

  /** Solta uma cápsula de power-up numa faixa livre. */
  private spawnPower() {
    const ocupadas = this.obstacles.filter((o) => o.z < SPAWN_Z + 24).map((o) => o.lane);
    const livres = [0, 1, 2].filter((l) => !ocupadas.includes(l));
    const lane = livres.length ? pick(livres) : 1;
    const power = sortearPower();
    const obj = makePowerMesh(power);
    obj.position.set(LANES[lane], 1.5, SPAWN_Z);
    this.scene.add(obj);
    this.items.push({
      kind: "power",
      power,
      lane,
      z: SPAWN_Z,
      y: 1.5,
      obj,
      taken: false,
      fly: 0,
      x: LANES[lane],
    });
  }

  /** Aplica o efeito do power-up coletado. */
  private aplicarPower(kind: PowerKind) {
    const info = POWERS[kind];
    this.audio.play("powerativar");
    this.float(`${info.icone} ${info.nome.toUpperCase()}`, info.cor);
    this.onNotify("power", `${info.nome}: ${info.descricao}`);
    this.buzz(28);

    switch (kind) {
      case "escudo":
        this.shield = true;
        this.shieldMesh.visible = true;
        break;
      case "chance":
        this.chance = true;
        break;
      case "turbo":
        this.boost = BOOST_MS;
        this.powerTimers.set("turbo", BOOST_MS);
        break;
      case "pulo":
        this.usedDoubleJump = false;
        this.powerTimers.set(kind, info.duracao);
        break;
      default:
        this.powerTimers.set(kind, info.duracao);
        break;
    }
    this.pushHud();
  }

  // -------------------------------------------------------------------------
  // colisões
  // -------------------------------------------------------------------------
  private collisions() {
    const headTop = (this.sliding > 0 && this.y < 0.2 ? SLIDE_H : PLAYER_H) + this.y;
    const feet = this.y;
    const laneNow = this.x;

    for (const o of this.obstacles) {
      if (o.hit) continue;
      if (Math.abs(o.z) > 1.05) continue;
      if (Math.abs(LANES[o.lane] - laneNow) > 1.1) continue;

      // rampa e escada rolante funcionam como plataforma: em vez de bater,
      // a Luiza sobe nelas e é lançada ~2 blocos para cima (dá para passar por
      // cima de um ônibus).
      if (o.rampa) {
        o.hit = true;
        this.vy = RAMP_LAUNCH;
        this.sliding = 0;
        this.groundedFor = COYOTE + 1;
        this.usedDoubleJump = false;
        this.audio.play("boost");
        this.float("RAMPA!", PALETTE.lime);
        this.burst(this.x, 0.6, 0, PALETTE.lime, 18);
        this.buzz(18);
        continue;
      }

      let collides = false;
      if (o.type === "low") collides = feet < 0.85;
      else if (o.type === "high") collides = headTop > 1.6;
      else collides = feet < o.topo;

      if (collides) {
        o.hit = true;
        // o boost de velocidade NÃO dá mais invencibilidade
        const atravessa =
          this.invuln > 0 || this.admin.noclip || this.admin.god || this.powerTimers.has("fantasma");
        if (atravessa) {
          this.burst(this.x, 1, 0, PALETTE.lime, 14);
        } else if (this.shield) {
          // escudo estala e some, mas a Luiza não perde vida
          this.shield = false;
          this.shieldMesh.visible = false;
          this.invuln = 1;
          this.audio.play("escudoquebra");
          this.float("ESCUDO QUEBROU!", "#8CC9FF");
          this.burst(this.x, 1.3, 0, "#8CC9FF", 26);
          this.buzz(30);
          this.pushHud();
        } else {
          this.hit();
        }
      }
    }

    for (const it of this.items) {
      if (it.taken) continue;
      if (Math.abs(it.z) > 1.3) continue;
      if (Math.abs(it.x - laneNow) > 1.2) continue;
      const dy = Math.abs(it.y - (this.y + (this.sliding > 0 ? 0.5 : 1)));
      if (dy > 1.5) continue;
      it.taken = true;
      it.fly = 0.42; // salta em direção à HUD antes de desaparecer
      this.collect(it);
    }
  }

  private collect(it: Item) {
    // cápsula de power-up: não entra no combo, aplica o efeito na hora
    if (it.kind === "power" && it.power) {
      this.audio.play("powercoletar");
      this.burst(it.x, it.y, it.z, POWERS[it.power].cor, 22);
      this.aplicarPower(it.power);
      return;
    }

    // cada coleta segura aumenta o combo (o multiplicador zera na batida)
    this.comboHits += 1;
    this.comboTimer = COMBO_WINDOW;
    const nextCombo = Math.min(COMBO_MAX, 1 + Math.floor(this.comboHits / 6));
    if (nextCombo > this.combo) {
      this.combo = nextCombo;
      this.audio.play("combosobe");
      if (this.combo >= 3) this.onNotify("combo", `Combo x${this.combo}!`);
    }
    if (this.combo > this.comboBest) this.comboBest = this.combo;

    switch (it.kind) {
      case "coin":
        this.coins += this.combo * this.multiplicador();
        this.score += 10 * this.combo * this.multiplicador();
        this.audio.play("coin");
        this.buzz(8);
        this.burst(LANES[it.lane], it.y, it.z, PALETTE.gold, 8);
        break;
      case "special":
        this.specials += 1;
        this.score += 100 * this.combo;
        this.audio.play("photo");
        this.float("ITEM ESPECIAL!", PALETTE.cyan);
        this.onNotify("especial", "Item especial coletado");
        this.buzz(30);
        this.burst(LANES[it.lane], it.y, it.z, PALETTE.paper, 20);
        break;
      case "heart":
        if (this.lives < 3) {
          this.lives += 1;
          this.float("+1 VIDA", PALETTE.pink);
        } else {
          this.score += 50;
          this.float("+50", PALETTE.pink);
        }
        this.audio.play("heart");
        this.burst(LANES[it.lane], it.y, it.z, PALETTE.pink, 16);
        break;
      case "boost":
        this.boost = BOOST_MS;
        this.audio.play("boost");
        this.float("BOOST!", PALETTE.lime);
        this.burst(LANES[it.lane], it.y, it.z, PALETTE.lime, 20);
        break;
    }
    this.pushHud();
  }

  private hit() {
    this.lives -= 1;
    this.invuln = 1.6;
    this.shake = 1;
    this.hitFlash = 0.4;
    this.speed = Math.max(SPEED_START, this.speed * 0.72);
    this.audio.play("hit");
    this.audio.play("vidaperdida");
    this.audio.play("apito");
    this.combo = 1;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.burst(this.x, 1.2, 0, PALETTE.orange, 22);
    this.pushHud();

    if (this.lives <= 0) {
      // Segunda Chance: se estiver guardada, ela volta a correr na hora
      if (this.chance) {
        this.chance = false;
        this.lives = 1;
        this.invuln = 2.4;
        this.copSurge = 0;
        this.powerTimers.set("fuga", POWERS.fuga.duracao);
        this.audio.play("powerativar");
        this.float("SEGUNDA CHANCE!", PALETTE.pink);
        this.onNotify("power", "Segunda Chance usada — corre de novo!");
        this.burst(this.x, 1.4, 0, PALETTE.pink, 30);
        this.pushHud();
        return;
      }
      this.lives = 0;
      this.caughtTimer = 1.5;
      this.chamarPolicial(3);
      this.audio.play("sirene");
      this.setPhase("caught");
      return;
    }
    this.float(`-1 VIDA (${this.lives})`, PALETTE.pink);
    this.chamarPolicial(4); // policial e cachorro entram em cena por alguns segundos
  }

  /**
   * Chama o policial e o cachorro para a cena.
   *
   * Fora desses segundos eles ficam escondidos atrás da câmera: durante a
   * corrida normal (sem dano) a Luiza corre sozinha, como o usuário pediu.
   */
  private chamarPolicial(segundos: number) {
    this.copSurge = segundos;
    // se estiverem muito longe, aparecem já perto da borda da tela e correm
    if (this.copZ > 6) {
      this.copZ = 5.6;
      this.dogZ = 6.4;
    }
  }

  private float(text: string, color: string) {
    this.floatId += 1;
    this.onFloat({ id: this.floatId, text, color });
  }

  private pushHud() {
    this.onHud({
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      lives: this.lives,
      coins: this.coins,
      specials: this.specials,
      speedKmh: Math.round(this.speed * (this.boost > 0 ? 1.5 : 1) * 3.6),
      boostMs: Math.round(this.boost),
      boostMax: BOOST_MS,
      copHeat: Math.min(1, Math.max(0, (3 - this.lives) / 3 + (this.copSurge > 0 ? 0.2 : 0))),
      combo: this.combo,
      comboTimer: Math.max(0, this.comboTimer / COMBO_WINDOW),
      powers: [...this.powerTimers].map(([key, ms]) => ({
        key,
        icone: POWERS[key].icone,
        cor: POWERS[key].cor,
        nome: POWERS[key].nome,
        ms: Math.round(ms),
        max: POWERS[key].duracao || 1,
      })),
      shield: this.shield,
      chance: this.chance,
      area: this.biomeIdx,
      areaName: BIOMES[this.biomeIdx].name,
    });
  }

  // -------------------------------------------------------------------------
  // partículas + visual
  // -------------------------------------------------------------------------
  private burst(x: number, y: number, z: number, color: string, n: number) {
    const c = new THREE.Color(color);
    let placed = 0;
    for (const p of this.particleData) {
      if (placed >= n) break;
      if (p.life > 0) continue;
      p.x = x + rand(-0.3, 0.3);
      p.y = y + rand(-0.2, 0.4);
      p.z = z + rand(-0.3, 0.3);
      p.vx = rand(-3, 3);
      p.vy = rand(1.5, 6);
      p.vz = rand(2, 7);
      p.life = rand(0.35, 0.8);
      const idx = this.particleData.indexOf(p);
      const colors = this.particles.geometry.getAttribute("color") as THREE.BufferAttribute;
      colors.setXYZ(idx, c.r, c.g, c.b);
      colors.needsUpdate = true;
      placed++;
    }
  }

  private updateVisuals(dt: number) {
    const running = this.phase === "running" || this.phase === "caught";

    // ---- Luiza: boneco 3D com pose procedural ---------------------------
    let pose: CharPose = "run";
    if (this.hitFlash > 0) pose = "hit";
    else if (this.y > 0.15) pose = "jump";
    else if (this.sliding > 0) pose = "slide";

    const speedFactor = 0.8 + (this.speed / SPEED_MAX) * 0.6;
    this.player.animate(this.t, pose, speedFactor);
    this.player.setOpacity(this.invuln > 0 && Math.floor(this.t * 12) % 2 === 0 ? 0.45 : 1);
    this.player.group.position.set(this.x, this.y, 0);
    // Math.PI = de frente para o fundo da pista (a câmera vê as costas dela).
    // Sem isso a Luiza corria de costas, virada para a câmera.
    this.player.group.rotation.y = Math.PI + (LANES[this.lane] - this.x) * 0.25;
    this.player.group.visible = this.phase !== "over";

    // ---- policial: só aparece quando está perseguindo (depois de um dano) --
    const near = this.copSurge > 0;
    const perseguindo = running && (near || this.phase === "caught");
    this.cop.animate(this.t * 1.05, "run", speedFactor * 1.05);
    this.cop.group.position.set(this.copX, 0, this.copZ);
    this.cop.group.rotation.y = Math.PI;
    this.cop.group.visible = perseguindo;

    // ---- cachorro: entra e sai junto com o policial ----------------------
    this.dog.group.visible = perseguindo;
    if (perseguindo) {
      this.dog.group.position.set(this.dogX, 0, this.dogZ);
      this.dog.animate(this.t, this.barkTimer < 0.4);
    }

    // giroflex do policial (apagado quando ele não está em cena)
    const sirenOn = perseguindo;
    this.sirenL.intensity = sirenOn ? 14 + Math.sin(this.t * 22) * 8 : 0;
    this.sirenL.color.set(Math.floor(this.t * 6) % 2 === 0 ? PALETTE.pink : PALETTE.cyan);
    this.sirenL.position.set(this.copX, 2.6, this.copZ - 0.4);

    // free cam do admin: a câmera fica onde ele deixou
    if (this.admin.freeCam) {
      this.camera.position.copy(this.freeCamPos);
      this.camera.lookAt(this.freeCamPos.x, 1.2, this.freeCamPos.z - 16);
      this.desenharHitbox(dt);
      return;
    }

    // câmera: segue de leve a faixa, sobe com a velocidade, treme na batida
    const camTargetX = this.x * 0.42;
    const shake = this.reduceFx ? 0 : this.shake * 0.28;
    this.camera.position.x += (camTargetX - this.camera.position.x) * Math.min(1, dt * 6);
    this.camera.position.y = 5.1 + Math.min(0.7, this.speed / 60) + (this.shake > 0 ? rand(-shake, shake) : 0);
    this.camera.position.z = 8.6 + (this.boost > 0 ? 0.8 : 0) + (this.shake > 0 ? rand(-shake, shake) : 0);
    this.camera.lookAt(this.x * 0.5, 1.8 + this.y * 0.25, -12);

    // partículas
    const pos = this.particles.geometry.getAttribute("position") as THREE.BufferAttribute;
    this.particleData.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 12 * dt;
        pos.setXYZ(i, p.x, p.y, p.z);
      } else {
        pos.setXYZ(i, 0, -999, 0);
      }
    });
    pos.needsUpdate = true;

    // ---- bolha do escudo -------------------------------------------------
    this.shieldMesh.visible = this.shield && running;
    if (this.shieldMesh.visible) {
      this.shieldMesh.position.set(this.x, this.y + 1, 0);
      this.shieldMesh.rotation.y = this.t * 0.9;
      const pulso = 1 + Math.sin(this.t * 4) * 0.05;
      this.shieldMesh.scale.setScalar(pulso);
    }

    // ---- Modo Fantasma: personagem translúcida ---------------------------
    if (this.powerTimers.has("fantasma")) {
      this.player.setOpacity(0.42 + Math.sin(this.t * 6) * 0.08);
    }

    // ---- rastro do boost de velocidade -----------------------------------
    if (this.boost > 0 && !this.reduceFx && Math.floor(this.t * 30) % 2 === 0) {
      this.burst(this.x, 0.6 + this.y, 0.8, PALETTE.orange, 3);
    }

    // ---- aura pulsante do ímã --------------------------------------------
    if (this.powerTimers.has("iman") && !this.reduceFx && Math.floor(this.t * 12) % 3 === 0) {
      this.burst(this.x, 1 + this.y, 0, PALETTE.cyan, 2);
    }

    // itens: flutuam e giram devagar; os coletados saltam para a HUD
    for (const it of this.items) {
      if (it.taken) {
        it.fly = Math.max(0, it.fly - dt);
        const p = 1 - it.fly / 0.42;
        it.obj.position.set(it.x + p * 1.2, it.y + p * 2.6, it.z + p * 3.4);
        it.obj.scale.setScalar(Math.max(0.05, 1 - p));
        it.obj.rotation.y += dt * 8;
        continue;
      }
      if (it.kind === "power") animatePower(it.obj, it.y, this.t);
      else animateItem(it.kind, it.obj, it.y, this.t);
    }

    this.desenharHitbox(dt);
  }

  // -------------------------------------------------------------------------
  // conta admin — nada aqui liga sozinho numa conta normal
  // -------------------------------------------------------------------------

  /** Multiplicador de moedas/pontos (god mode usa 10 se nada foi escolhido). */
  private multiplicador() {
    if (this.admin.multiplier > 1) return this.admin.multiplier;
    return this.admin.god ? 10 : 1;
  }

  /** Liga/desliga os poderes da conta admin. */
  setAdmin(flags: Partial<AdminFlags>) {
    this.admin = { ...this.admin, ...flags };
    if (this.admin.fly) this.flyX = this.x;
    if (this.admin.freeCam) this.freeCamPos.set(this.x, 6, 12);
    if (!this.admin.hitbox) this.limparHitbox();
  }

  /** Números do overlay de debug (FPS, coordenadas, contagem de objetos). */
  getDebug(): DebugInfo {
    return {
      fps: Math.round(this.fps),
      x: Number(this.x.toFixed(2)),
      y: Number(this.y.toFixed(2)),
      lane: this.lane,
      speed: Number((this.speed * 3.6).toFixed(1)),
      distance: Math.floor(this.distance),
      obstacles: this.obstacles.length,
      items: this.items.length,
      area: BIOMES[this.biomeIdx].name,
    };
  }

  /** Enche o cofrinho da partida (moedas ilimitadas). */
  adminMoedas(quanto = 100_000) {
    this.coins += quanto;
    this.float(`+${quanto.toLocaleString("pt-BR")}`, PALETTE.gold);
    this.pushHud();
  }

  /** Força o spawn de um obstáculo do tipo escolhido, na faixa da Luiza. */
  adminSpawnObstaculo(type: SpawnKey) {
    this.addObstacle(type, this.lane, SPAWN_Z + 40);
  }

  /** Força o spawn de um power-up específico (ou sorteado). */
  adminSpawnPower(kind?: PowerKind) {
    if (!kind) {
      this.spawnPower();
      return;
    }
    const obj = makePowerMesh(kind);
    obj.position.set(LANES[this.lane], 1.5, SPAWN_Z + 40);
    this.scene.add(obj);
    this.items.push({
      kind: "power",
      power: kind,
      lane: this.lane,
      z: SPAWN_Z + 40,
      y: 1.5,
      obj,
      taken: false,
      fly: 0,
      x: LANES[this.lane],
    });
  }

  /** Limpa a pista (remove obstáculos e itens da tela). */
  adminLimparPista() {
    for (const o of this.obstacles) this.recycle(o.group);
    this.obstacles = [];
    for (const it of this.items) {
      this.scene.remove(it.obj);
      disposeItem(it.obj);
    }
    this.items = [];
  }

  /** Pula direto para o começo de um bioma, sem percorrer a distância. */
  adminIrParaBioma(idx: number) {
    const alvo = ((idx % BIOMES.length) + BIOMES.length) % BIOMES.length;
    this.distance = alvo * BIOME_LEN + 4;
    this.applyBiome(alvo);
    this.adminLimparPista();
    this.audio.playTrack(alvo);
    this.float(`→ ${BIOMES[alvo].name}`, PALETTE.cyan);
    this.pushHud();
  }

  /** Teleporte rápido: joga a Luiza para uma faixa e altura. */
  adminTeleporte(lane: number, altura = 0) {
    this.lane = Math.max(0, Math.min(2, lane));
    this.x = LANES[this.lane];
    this.flyX = this.x;
    this.y = altura;
    this.vy = 0;
  }

  /** Move a free cam / o personagem em modo fly. */
  adminMover(eixo: "x" | "y" | "z", passo: number) {
    if (this.admin.freeCam) {
      this.freeCamPos[eixo] += passo;
      return;
    }
    if (this.admin.fly) {
      if (eixo === "x") this.flyX = Math.max(-14, Math.min(14, this.flyX + passo));
      if (eixo === "y") this.y = Math.max(0, this.y + passo);
    }
  }

  private limparHitbox() {
    for (const child of [...this.hitboxGroup.children]) {
      this.hitboxGroup.remove(child);
      if (child instanceof THREE.Box3Helper) child.dispose?.();
    }
  }

  /**
   * Desenha as caixas de colisão dos obstáculos (ferramenta de teste do
   * admin). Refaz a lista 10x por segundo para não pesar.
   */
  private desenharHitbox(dt: number) {
    if (!this.admin.hitbox) return;
    this.hitboxTimer -= dt;
    if (this.hitboxTimer > 0) return;
    this.hitboxTimer = 0.1;
    this.limparHitbox();
    for (const o of this.obstacles) {
      const caixa = new THREE.Box3().setFromObject(o.group);
      const cor = o.rampa ? 0x3ce87a : o.trem ? 0xffc93c : 0xff2e7e;
      this.hitboxGroup.add(new THREE.Box3Helper(caixa, new THREE.Color(cor)));
    }
    const eu = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(this.x, this.y + (this.sliding > 0 ? SLIDE_H : PLAYER_H) / 2, 0),
      new THREE.Vector3(0.9, this.sliding > 0 ? SLIDE_H : PLAYER_H, 0.9),
    );
    this.hitboxGroup.add(new THREE.Box3Helper(eu, new THREE.Color(0x29d9ff)));
  }
}
