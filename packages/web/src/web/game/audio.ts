export type SfxKey =
  | "jump"
  | "slide"
  | "coin"
  | "heart"
  | "photo"
  | "boost"
  | "hit"
  | "vidaperdida"
  | "combosobe"
  | "recorde"
  | "powercoletar"
  | "powerativar"
  | "powerfim"
  | "escudoquebra"
  | "cop"
  | "apito"
  | "sirene"
  | "bark"
  | "transicao"
  | "contagem"
  | "gameover"
  | "clique"
  | "abrirtela"
  | "erro"
  | "desbloqueio";

const SFX_VOLUME: Record<SfxKey, number> = {
  jump: 0.45,
  slide: 0.5,
  coin: 0.4,
  heart: 0.6,
  photo: 0.55,
  boost: 0.6,
  hit: 0.7,
  vidaperdida: 0.65,
  combosobe: 0.45,
  recorde: 0.7,
  powercoletar: 0.55,
  powerativar: 0.6,
  powerfim: 0.4,
  escudoquebra: 0.6,
  cop: 0.5,
  apito: 0.5,
  sirene: 0.55,
  bark: 0.55,
  transicao: 0.6,
  contagem: 0.6,
  gameover: 0.7,
  clique: 0.35,
  abrirtela: 0.35,
  erro: 0.4,
  desbloqueio: 0.7,
};

const TRACKS = [
  "musica_bairro",
  "musica_escola",
  "musica_centro",
  "musica_praca",
  "musica_praia",
  "musica_shopping",
];

const MUTE_KEY = "lrs.muted";
const MUSIC_KEY = "lrs.vol.music";
const SFX_KEY = "lrs.vol.sfx";

const MUSIC_BASE = 0.32;
const FADE_MS = 1500;

function readVolume(key: string, fallback: number) {
  const raw = Number(localStorage.getItem(key));
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : fallback;
}

export class GameAudio {
  private decks: [HTMLAudioElement, HTMLAudioElement];
  private deckAtivo = 0;
  private trackAtual = -1;
  private fadeTimer: number | null = null;
  private rate = 1;

  private pools = new Map<SfxKey, HTMLAudioElement[]>();
  private cursor = new Map<SfxKey, number>();
  private muted: boolean;
  private musicWanted = false;
  private musicVol: number;
  private sfxVol: number;

  constructor() {
    this.muted = localStorage.getItem(MUTE_KEY) === "1";
    this.musicVol = readVolume(MUSIC_KEY, 0.7);
    this.sfxVol = readVolume(SFX_KEY, 0.9);

    const novoDeck = () => {
      const a = new Audio();
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      return a;
    };
    this.decks = [novoDeck(), novoDeck()];

    for (const key of Object.keys(SFX_VOLUME) as SfxKey[]) {
      const pool = Array.from({ length: 3 }, () => {
        const a = new Audio(`/audio/${key}.mp3`);
        a.volume = SFX_VOLUME[key] * this.sfxVol;
        a.preload = "auto";
        return a;
      });
      this.pools.set(key, pool);
      this.cursor.set(key, 0);
    }
  }

  get isMuted() {
    return this.muted;
  }

  get musicVolume() {
    return this.musicVol;
  }

  get sfxVolume() {
    return this.sfxVol;
  }

  private get deck() {
    return this.decks[this.deckAtivo];
  }

  private alvoVolume() {
    return this.muted ? 0 : MUSIC_BASE * this.musicVol;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0");
    if (this.muted) {
      for (const d of this.decks) d.pause();
    } else if (this.musicWanted) {
      this.deck.volume = this.alvoVolume();
      void this.deck.play().catch(() => {});
    }
    return this.muted;
  }

  setMusicVolume(v: number) {
    this.musicVol = Math.min(1, Math.max(0, v));
    localStorage.setItem(MUSIC_KEY, String(this.musicVol));
    if (this.fadeTimer === null) this.deck.volume = this.alvoVolume();
  }

  setSfxVolume(v: number) {
    this.sfxVol = Math.min(1, Math.max(0, v));
    localStorage.setItem(SFX_KEY, String(this.sfxVol));
    for (const [key, pool] of this.pools) {
      for (const a of pool) a.volume = SFX_VOLUME[key] * this.sfxVol;
    }
  }

  playTrack(area: number) {
    const idx = ((area % TRACKS.length) + TRACKS.length) % TRACKS.length;
    this.musicWanted = true;
    if (idx === this.trackAtual) {
      if (!this.muted) void this.deck.play().catch(() => {});
      return;
    }

    const antigo = this.deck;
    const proximo = this.decks[1 - this.deckAtivo];
    this.deckAtivo = 1 - this.deckAtivo;
    this.trackAtual = idx;

    proximo.src = `/audio/${TRACKS[idx]}.mp3`;
    proximo.currentTime = 0;
    proximo.playbackRate = this.rate;
    proximo.volume = 0;
    if (!this.muted) void proximo.play().catch(() => {});

    const alvo = this.alvoVolume();
    const inicio = performance.now();
    const vAntigo = antigo.volume;
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    this.fadeTimer = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - inicio) / FADE_MS);
      proximo.volume = alvo * p;
      antigo.volume = vAntigo * (1 - p);
      if (p >= 1) {
        antigo.pause();
        if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, 50);
  }

  playMusic() {
    if (this.trackAtual < 0) {
      this.playTrack(0);
      return;
    }
    this.musicWanted = true;
    if (this.muted) return;
    this.deck.volume = this.alvoVolume();
    void this.deck.play().catch(() => {});
  }

  pauseMusic() {
    this.musicWanted = false;
    for (const d of this.decks) d.pause();
  }

  setMusicRate(rate: number) {
    this.rate = Math.min(1.35, Math.max(0.85, rate));
    for (const d of this.decks) d.playbackRate = this.rate;
  }

  play(key: SfxKey) {
    if (this.muted || this.sfxVol <= 0) return;
    const pool = this.pools.get(key);
    if (!pool) return;
    const i = (this.cursor.get(key) ?? 0) % pool.length;
    this.cursor.set(key, i + 1);
    const audio = pool[i];
    try {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {
    }
  }

  dispose() {
    for (const d of this.decks) {
      d.pause();
      d.src = "";
    }
  }
}
