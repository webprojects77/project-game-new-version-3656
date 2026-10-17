import * as THREE from "three";
import { GameAudio } from "./audio";
import { type CharPose, Dog, Humanoid, makeCop } from "./characters";
import { animateItem, disposeItem, type ItemKind, makeItemMesh } from "./items";
import { carregarModelos } from "./models";
import { PALETTE } from "./palette";
import { animatePower, makePowerMesh, POWERS, type PowerKind, sortearPower } from "./powerups";
import { DEFAULT_SKIN, findSkin, type SkinKey } from "./skins";
import { makeBuildingTexture, makeRoadTexture, makeSkyTexture } from "./textures";
import { novaSeed, Sorteio } from "./random";
import { PlanejadorPista, SPAWN, type ObstacleType } from "./spawn";
import { bateNoObstaculo, COLISAO } from "./collision-rules";
import { BIOMES } from "./biomes";
import { construirObstaculo, modeloDoObstaculo } from "./obstacle-meshes";
import { construirProp } from "./props";
import { pick, rand } from "./visual-random";

export type { ObstacleType } from "./spawn";
export { BIOMES } from "./biomes";

export type Phase = "menu" | "running" | "paused" | "caught" | "over";
export type InputAction = "left" | "right" | "jump" | "slide";
export type NotifyKind = "recorde" | "combo" | "especial" | "fase" | "power";

export type SpawnKey = ObstacleType;

export interface AdminFlags {
  god: boolean;
  invuln: boolean;
  noclip: boolean;
  fly: boolean;
  freeCam: boolean;
  hitbox: boolean;
  timeScale: number;
  multiplier: number;
}

export interface DebugInfo {
  seed: number;
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
  powers: ActivePower[];
  shield: boolean;
  chance: boolean;
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
const SPEED_MAX = 48;
const SPEED_RAMP = 0.0055;

const RAMP_LAUNCH = 16.2;
const ONIBUS_TOP = 2.9;
const TREM_LEN = 9;

const SPAWN_Z = -135;
const DESPAWN_Z = 16;

const PLAYER_H = 1.85;
const SLIDE_H = 0.85;

const BIOME_LEN = 2200;

const COMBO_WINDOW = 3.2;
const COMBO_MAX = 8;
const BOOST_MS = 5000;

interface Obstacle {
  type: ObstacleType;
  lane: number;
  z: number;
  group: THREE.Object3D;
  hit: boolean;
  topo: number;
  rampa: boolean;
  trem: boolean;
}

interface Item {
  kind: ItemKind | "power";
  power?: PowerKind;
  lane: number;
  z: number;
  y: number;
  obj: THREE.Object3D;
  taken: boolean;
  fly: number;
  x: number;
}

interface Building {
  mesh: THREE.Mesh;
  side: -1 | 1;
}

export class Game3D {
  private canvas: HTMLCanvasElement;
  private audio: GameAudio;
  private onHud: (hud: HudState) => void;
  private onGameOver: (payload: GameOverPayload) => void;
  private onPhaseChange: (phase: Phase) => void;
  private onFloat: (text: FloatingText) => void;
  private onNotify: (kind: NotifyKind, text: string) => void;

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

  private skyTextures: THREE.Texture[] = [];
  private hemi!: THREE.HemisphereLight;
  private sun!: THREE.DirectionalLight;
  private rim!: THREE.DirectionalLight;
  private walks: THREE.Mesh[] = [];
  private neons: THREE.Mesh[] = [];
  private biomeIdx = 0;
  private gates: { group: THREE.Object3D; z: number }[] = [];
  private props: { group: THREE.Object3D; z: number }[] = [];
  private nextProp = 24;

  private dog!: Dog;
  private dogZ = 8;
  private dogX = 1.6;
  private barkTimer = 2;

  private skin: SkinKey = DEFAULT_SKIN;

  private reduceFx = false;
  private vibrate = true;
  private best = 0;
  private beatRecord = false;

  phase: Phase = "menu";
  private raf = 0;
  private lastTs = 0;
  private t = 0;
  private hudTimer = 0;
  private floatId = 0;

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
  private combo = 1;
  private comboBest = 1;
  private comboHits = 0;
  private comboTimer = 0;
  private boost = 0;
  private powerTimers = new Map<PowerKind, number>();
  private shield = false;
  private chance = false;
  private usedDoubleJump = false;
  private shieldMesh!: THREE.Mesh;
  private nextPower = 0;
  private heartCooldown = 1200;
  private specialSpawned = false;
  private countdown = 0;
  private countdownStep = 0;
  private invuln = 0;
  private shake = 0;
  private hitFlash = 0;
  private caughtTimer = 0;

  private copZ = 6.2;
  private copX = -1.6;
  private copTargetZ = 6.2;
  private copSurge = 0;

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
  private flyX = 0;
  private fps = 60;
  private hitboxGroup = new THREE.Group();
  private hitboxTimer = 0;
  private freeCamPos = new THREE.Vector3(0, 6, 12);

  private nextSpawn = 40;
  private seed = novaSeed();
  private planejador = new PlanejadorPista(this.seed);
  private powerRng = new Sorteio(this.seed ^ 0xa5a5a5a5);
  private ultimoPower: PowerKind | undefined;
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
    carregarModelos();
    this.buildWorld();
    this.resize();
    this.pushHud();
    const w = window as unknown as Record<string, unknown>;
    if (!w.__gs) w.__gs = [];
    (w.__gs as unknown[]).push(this);
    this.raf = requestAnimationFrame(this.loop);
  }

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

    this.roadTex.repeat.set(1, ROAD_LEN / 9);
    const roadMat = new THREE.MeshStandardMaterial({ map: this.roadTex, roughness: 0.85, metalness: 0.05 });
    this.road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, ROAD_LEN), roadMat);
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.z = -ROAD_LEN / 2 + 20;
    this.scene.add(this.road);

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

    this.player = new Humanoid(findSkin(this.skin).body, { ponytail: true });
    this.scene.add(this.player.group);
    this.cop = makeCop();
    this.scene.add(this.cop.group);

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

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.75 ? 74 : 62;
    this.camera.updateProjectionMatrix();
  }

  start(seed = novaSeed()) {
    this.seed = seed >>> 0;
    this.planejador = new PlanejadorPista(this.seed);
    this.powerRng = new Sorteio(this.seed ^ 0xa5a5a5a5);
    this.ultimoPower = undefined;
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
    this.copSurge = 0;
    this.nextSpawn = 46;
    this.dogZ = 28;
    this.barkTimer = 2.5;
    this.powerTimers.clear();
    this.shield = false;
    this.chance = false;
    this.usedDoubleJump = false;
    this.shieldMesh.visible = false;
    this.nextPower = this.powerRng.entre(SPAWN.powerIntervaloMinimo, SPAWN.powerIntervaloMaximo);
    this.heartCooldown = SPAWN.coracaoIntervaloMetros;
    this.specialSpawned = false;
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

  setSkin(skin: SkinKey) {
    this.skin = skin;
    this.player.setPalette(findSkin(skin).body);
  }

  setBest(best: number) {
    this.best = best;
  }

  setReduceFx(on: boolean) {
    this.reduceFx = on;
  }

  setVibration(on: boolean) {
    this.vibrate = on;
  }

  private buzz(ms: number) {
    if (!this.vibrate) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
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
        if (this.y > 0.1) this.vy = Math.min(this.vy, -16);
        if (this.sliding <= 0.1) this.audio.play("slide");
        this.sliding = SLIDE_TIME;
        break;
    }
  }

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

  private faixaTravada(lane: number) {
    if (this.admin.noclip || this.admin.fly) return false;
    return this.obstacles.some((o) => o.trem && o.lane === lane && o.z > -TREM_LEN && o.z < 5.5);
  }

  private tryJump() {
    const canJump = this.groundedFor <= COYOTE;
    if (canJump) {
      this.vy = JUMP_V;
      this.sliding = 0;
      this.groundedFor = COYOTE + 1;
      this.jumpBuffer = 0;
      this.usedDoubleJump = false;
      this.audio.play("jump");
      this.burst(this.x, 0.15, 0, PALETTE.cyan, 8);
      return;
    }
    if (this.powerTimers.has("pulo") && !this.usedDoubleJump) {
      this.usedDoubleJump = true;
      this.vy = JUMP_V * 0.92;
      this.sliding = 0;
      this.audio.play("jump");
      this.burst(this.x, this.y + 0.4, 0, PALETTE.lime, 14);
      return;
    }
    this.jumpBuffer = BUFFER;
  }

  private loop = (ts: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const real = Math.min(0.05, (ts - this.lastTs) / 1000 || 0);
    this.lastTs = ts;
    if (real > 0) this.fps += (1 / real - this.fps) * 0.1;
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

    const target = Math.min(SPEED_MAX, SPEED_START + this.distance * SPEED_RAMP);
    this.speed += (target - this.speed) * Math.min(1, dt * 1.2);
    const boosting = this.boost > 0;
    const effSpeed = this.speed * (boosting ? 1.5 : 1);
    if (boosting) this.boost = Math.max(0, this.boost - dt * 1000);
    this.audio.setMusicRate(0.95 + (effSpeed / SPEED_MAX) * 0.28);

    for (const [key, ms] of this.powerTimers) {
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

    this.x += (LANES[this.lane] - this.x) * Math.min(1, dt * 13);

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

    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= dt;
      if (this.groundedFor <= COYOTE) this.tryJump();
    }

    if (this.sliding > 0) this.sliding -= dt;
    if (this.admin.god || this.admin.invuln) this.invuln = Math.max(this.invuln, 0.5);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.2);

    if (this.copSurge > 0) this.copSurge -= dt;
    const fugindo = this.powerTimers.has("fuga");
    this.copTargetZ = fugindo ? 30 : this.copSurge > 0 ? 3.1 : 26;
    this.copZ += (this.copTargetZ - this.copZ) * Math.min(1, dt * (this.copSurge > 0 ? 3.4 : 1.6));
    const copSide = this.x >= 0 ? -1 : 1;
    this.copX += (this.x + copSide * 1.5 - this.copX) * Math.min(1, dt * 2.2);

    const wantBiome = Math.floor(this.distance / BIOME_LEN) % BIOMES.length;
    if (wantBiome !== this.biomeIdx) {
      this.applyBiome(wantBiome);
      this.spawnGate();
      this.burst(this.x, 1.4, -4, PALETTE.gold, 24);
      this.audio.playTrack(wantBiome);
      this.audio.play("transicao");
      this.buzz(24);
    }

    const dogSide = this.x >= 0 ? -1 : 1;
    this.dogZ += (this.copZ - 1.5 - this.dogZ) * Math.min(1, dt * 1.8);
    this.dogX += (this.x + dogSide * 2.2 - this.dogX) * Math.min(1, dt * 2.6);
    this.barkTimer -= dt;
    if (this.barkTimer <= 0) {
      this.barkTimer = this.copSurge > 0 ? rand(1.1, 2) : rand(3.5, 6.5);
      if (this.copSurge > 0) this.audio.play("bark");
    }

    if (this.powerTimers.has("iman")) {
      for (const it of this.items) {
        if (it.taken || it.kind !== "coin") continue;
        if (it.z < -26 || it.z > 6) continue;
        it.x += (this.x - it.x) * Math.min(1, dt * 4.5);
        it.obj.position.x = it.x;
      }
    }

    if (!this.beatRecord && this.best > 0 && this.score > this.best) {
      this.beatRecord = true;
      this.onNotify("recorde", "Novo recorde pessoal!");
      this.audio.play("recorde");
      this.burst(this.x, 1.6, 0, PALETTE.gold, 26);
      this.buzz(40);
    }

    this.scroll(travelled);
    this.spawn(travelled, effSpeed);

    this.nextPower -= dt;
    if (this.nextPower <= 0) {
      this.nextPower = this.spawnPower()
        ? this.powerRng.entre(SPAWN.powerIntervaloMinimo, SPAWN.powerIntervaloMaximo)
        : SPAWN.powerNovaTentativa;
    }

    this.collisions();

    this.hudTimer += dt;
    if (this.hudTimer > 0.1) {
      this.hudTimer = 0;
      this.pushHud();
    }
  }

  private scroll(d: number) {
    this.roadTex.offset.y -= d / 9;

    for (const o of this.obstacles) {
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

    this.nextProp -= d;
    if (this.nextProp <= 0) {
      this.nextProp = rand(16, 30);
      this.spawnProp();
    }

    for (const b of this.buildings) {
      b.mesh.position.z += d;
      if (b.mesh.position.z > 40) this.placeBuilding(b, b.mesh.position.z - 26 * 16);
    }

    const gone = this.obstacles.filter((o) => o.z > DESPAWN_Z);
    for (const o of gone) this.recycle(o.group);
    this.obstacles = this.obstacles.filter((o) => o.z <= DESPAWN_Z);

    for (const it of this.items.filter((i) => i.z > DESPAWN_Z || (i.taken && i.fly <= 0))) {
      this.scene.remove(it.obj);
      disposeItem(it.obj);
    }
    this.items = this.items.filter((i) => i.z <= DESPAWN_Z && (!i.taken || i.fly > 0));
  }

  private spawn(travelled: number, effSpeed: number) {
    this.nextSpawn -= travelled;
    if (this.nextSpawn > 0) return;

    const linha = this.planejador.proxima({
      distance: this.distance,
      biome: this.biomeIdx,
      speed: effSpeed,
      lives: this.lives,
      heartCooldown: this.heartCooldown,
      specialSpawned: this.specialSpawned,
    });
    for (const lane of linha.lanes) this.addObstacle(linha.type, lane, SPAWN_Z);

    if (linha.item === "coin") {
      for (let i = 0; i < linha.moedas; i++) {
        this.addItem("coin", linha.livre, SPAWN_Z - i * SPAWN.moedaEspaco, SPAWN.moedaAltura);
      }
    } else {
      if (linha.item === "heart") this.heartCooldown = SPAWN.coracaoIntervaloMetros;
      if (linha.item === "special") this.specialSpawned = true;
      this.addItem(linha.item, linha.livre, SPAWN_Z,
        linha.item === "special" ? SPAWN.especialAltura : SPAWN.itemAltura);
    }
    this.nextSpawn = linha.distanciaProxima;
  }

  private metaDoObstaculo(type: ObstacleType): { topo: number; rampa: boolean; trem: boolean } {
    if (type === "ride") return { topo: 1.15, rampa: true, trem: false };
    if (type === "block") {
      const modelo = modeloDoObstaculo(type, this.biomeIdx);
      if (modelo === "onibus") return { topo: ONIBUS_TOP, rampa: false, trem: true };
      if (modelo === "carro") return { topo: Infinity, rampa: false, trem: true };
      return { topo: Infinity, rampa: false, trem: false };
    }
    return { topo: type === "low" ? 0.95 : Infinity, rampa: false, trem: false };
  }

  private addObstacle(type: ObstacleType, lane: number, z: number) {
    const group = construirObstaculo(type, this.biomeIdx);
    group.position.set(LANES[lane], 0, z);
    this.scene.add(group);
    const meta = this.metaDoObstaculo(type);
    this.obstacles.push({ type, lane, z, group, hit: false, ...meta });
  }

  private spawnProp() {
    const group = construirProp(this.biomeIdx);
    const side = Math.random() < 0.5 ? -1 : 1;
    if (group.userData.alinhado) {
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
    const obj = makeItemMesh(kind, this.biomeIdx);
    obj.position.set(LANES[lane], y, z);
    this.scene.add(obj);
    this.items.push({ kind, lane, z, y, obj, taken: false, fly: 0, x: LANES[lane] });
  }

  private spawnPower(): boolean {
    const ocupadas = this.obstacles.filter((o) => o.z < SPAWN_Z + SPAWN.powerJanelaLivre).map((o) => o.lane);
    const livres = [0, 1, 2].filter((l) => !ocupadas.includes(l));
    if (!livres.length) return false;
    const lane = this.powerRng.escolher(livres);
    const power = sortearPower(this.powerRng.proximo, this.ultimoPower);
    this.ultimoPower = power;
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
    return true;
  }

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

  private collisions() {
    const headTop = (this.sliding > 0 && this.y < 0.2 ? SLIDE_H : PLAYER_H) + this.y;
    const feet = this.y;
    const laneNow = this.x;

    for (const o of this.obstacles) {
      if (o.hit) continue;
      if (Math.abs(o.z) > 1.05) continue;
      if (Math.abs(LANES[o.lane] - laneNow) > COLISAO.faixaTolerancia) continue;

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

      const collides = bateNoObstaculo(o.type, feet, headTop, o.topo);

      if (collides) {
        o.hit = true;
        const atravessa =
          this.invuln > 0 || this.admin.noclip || this.admin.god || this.powerTimers.has("fantasma");
        if (atravessa) {
          this.burst(this.x, 1, 0, PALETTE.lime, 14);
        } else if (this.shield) {
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
      if (Math.abs(it.z) > COLISAO.itemProfundidade) continue;
      if (Math.abs(it.x - laneNow) > COLISAO.itemFaixaTolerancia) continue;
      const dy = Math.abs(it.y - (this.y + (this.sliding > 0 ? 0.5 : 1)));
      if (dy > COLISAO.itemAlturaTolerancia) continue;
      it.taken = true;
      it.fly = 0.42;
      this.collect(it);
    }
  }

  private collect(it: Item) {
    if (it.kind === "power" && it.power) {
      this.audio.play("powercoletar");
      this.burst(it.x, it.y, it.z, POWERS[it.power].cor, 22);
      this.aplicarPower(it.power);
      return;
    }

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
    this.chamarPolicial(4);
  }

  private chamarPolicial(segundos: number) {
    this.copSurge = segundos;
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

    let pose: CharPose = "run";
    if (this.hitFlash > 0) pose = "hit";
    else if (this.y > 0.15) pose = "jump";
    else if (this.sliding > 0) pose = "slide";

    const speedFactor = 0.8 + (this.speed / SPEED_MAX) * 0.6;
    this.player.animate(this.t, pose, speedFactor);
    this.player.setOpacity(this.invuln > 0 && Math.floor(this.t * 12) % 2 === 0 ? 0.45 : 1);
    this.player.group.position.set(this.x, this.y, 0);
    this.player.group.rotation.y = Math.PI + (LANES[this.lane] - this.x) * 0.25;
    this.player.group.visible = this.phase !== "over";

    const near = this.copSurge > 0;
    const perseguindo = running && (near || this.phase === "caught");
    this.cop.animate(this.t * 1.05, "run", speedFactor * 1.05);
    this.cop.group.position.set(this.copX, 0, this.copZ);
    this.cop.group.rotation.y = Math.PI;
    this.cop.group.visible = perseguindo;

    this.dog.group.visible = perseguindo;
    if (perseguindo) {
      this.dog.group.position.set(this.dogX, 0, this.dogZ);
      this.dog.animate(this.t, this.barkTimer < 0.4);
    }

    const sirenOn = perseguindo;
    this.sirenL.intensity = sirenOn ? 14 + Math.sin(this.t * 22) * 8 : 0;
    this.sirenL.color.set(Math.floor(this.t * 6) % 2 === 0 ? PALETTE.pink : PALETTE.cyan);
    this.sirenL.position.set(this.copX, 2.6, this.copZ - 0.4);

    if (this.admin.freeCam) {
      this.camera.position.copy(this.freeCamPos);
      this.camera.lookAt(this.freeCamPos.x, 1.2, this.freeCamPos.z - 16);
      this.desenharHitbox(dt);
      return;
    }

    const camTargetX = this.x * 0.42;
    const shake = this.reduceFx ? 0 : this.shake * 0.28;
    this.camera.position.x += (camTargetX - this.camera.position.x) * Math.min(1, dt * 6);
    this.camera.position.y = 5.1 + Math.min(0.7, this.speed / 60) + (this.shake > 0 ? rand(-shake, shake) : 0);
    this.camera.position.z = 8.6 + (this.boost > 0 ? 0.8 : 0) + (this.shake > 0 ? rand(-shake, shake) : 0);
    this.camera.lookAt(this.x * 0.5, 1.8 + this.y * 0.25, -12);

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

    this.shieldMesh.visible = this.shield && running;
    if (this.shieldMesh.visible) {
      this.shieldMesh.position.set(this.x, this.y + 1, 0);
      this.shieldMesh.rotation.y = this.t * 0.9;
      const pulso = 1 + Math.sin(this.t * 4) * 0.05;
      this.shieldMesh.scale.setScalar(pulso);
    }

    if (this.powerTimers.has("fantasma")) {
      this.player.setOpacity(0.42 + Math.sin(this.t * 6) * 0.08);
    }

    if (this.boost > 0 && !this.reduceFx && Math.floor(this.t * 30) % 2 === 0) {
      this.burst(this.x, 0.6 + this.y, 0.8, PALETTE.orange, 3);
    }

    if (this.powerTimers.has("iman") && !this.reduceFx && Math.floor(this.t * 12) % 3 === 0) {
      this.burst(this.x, 1 + this.y, 0, PALETTE.cyan, 2);
    }

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

  private multiplicador() {
    if (this.admin.multiplier > 1) return this.admin.multiplier;
    return this.admin.god ? 10 : 1;
  }

  setAdmin(flags: Partial<AdminFlags>) {
    this.admin = { ...this.admin, ...flags };
    if (this.admin.fly) this.flyX = this.x;
    if (this.admin.freeCam) this.freeCamPos.set(this.x, 6, 12);
    if (!this.admin.hitbox) this.limparHitbox();
  }

  getDebug(): DebugInfo {
    return {
      seed: this.seed,
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

  adminMoedas(quanto = 100_000) {
    this.coins += quanto;
    this.float(`+${quanto.toLocaleString("pt-BR")}`, PALETTE.gold);
    this.pushHud();
  }

  adminSpawnObstaculo(type: SpawnKey) {
    this.addObstacle(type, this.lane, SPAWN_Z + 40);
  }

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

  adminLimparPista() {
    for (const o of this.obstacles) this.recycle(o.group);
    this.obstacles = [];
    for (const it of this.items) {
      this.scene.remove(it.obj);
      disposeItem(it.obj);
    }
    this.items = [];
  }

  adminIrParaBioma(idx: number) {
    const alvo = ((idx % BIOMES.length) + BIOMES.length) % BIOMES.length;
    this.distance = alvo * BIOME_LEN + 4;
    this.applyBiome(alvo);
    this.adminLimparPista();
    this.audio.playTrack(alvo);
    this.float(`→ ${BIOMES[alvo].name}`, PALETTE.cyan);
    this.pushHud();
  }

  adminTeleporte(lane: number, altura = 0) {
    this.lane = Math.max(0, Math.min(2, lane));
    this.x = LANES[this.lane];
    this.flyX = this.x;
    this.y = altura;
    this.vy = 0;
  }

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
    for (let i = this.hitboxGroup.children.length - 1; i >= 0; i--) {
      const child = this.hitboxGroup.children[i];
      this.hitboxGroup.remove(child);
      if (child instanceof THREE.Box3Helper) child.dispose?.();
    }
  }

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
