import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AdminFlags,
  BIOMES,
  type DebugInfo,
  type FloatingText,
  Game3D,
  type GameOverPayload,
  type HudState,
  type InputAction,
  type NotifyKind,
  type ObstacleType,
  type Phase,
} from "../../game/engine3d";
import type { PowerKind } from "../../game/powerups";
import { GameAudio } from "../../game/audio";
import { DEFAULT_SKIN, findSkin, isUnlocked, type Progress, SKINS, type SkinKey } from "../../game/skins";
import {
  aplicarCorrida,
  carregarProgresso,
  estaConcluida,
  type MissionProgress,
  missoesDoDia,
  salvarProgresso,
} from "../../game/missions";
import { useSubmitScore, useTopScores } from "../../queries/scores";
import { Hud } from "./hud";
import { Notifications, type Toast } from "./notifications";
import {
  AdminPanel,
  ButtonLayout,
  diasParaTrocarNome,
  estiloBotoes,
  Frame,
  GameOver,
  type GameSettings,
  HowTo,
  type LocalRun,
  Menu,
  NameGate,
  NOME_CUSTO,
  Paused,
  Ranking,
  Missions,
  Settings,
  SkinPicker,
  type SubmitState,
  validarNome,
} from "./overlays";
import { authClient } from "../../lib/auth";

const BEST_KEY = "lrs.best";
const NAME_KEY = "lrs.name";
const COINS_KEY = "lrs.coins.total";
const SPECIALS_KEY = "lrs.specials";
const SETTINGS_KEY = "lrs.settings";
const SKIN_KEY = "lrs.skin";
const RUNS_KEY = "lrs.local.runs";
const PASS_KEY = "lrs.pass";
const NAME_AT_KEY = "lrs.name.lastChange";
const ADMIN_KEY = "lrs.admin";

/** Credenciais da conta admin (vêm da especificação do trabalho). */
const ADMIN_NAME = "adm";
const ADMIN_PASS = "9764";

/** Interruptores admin desligados — estado de uma conta normal. */
const ADMIN_OFF: AdminFlags = {
  god: false,
  invuln: false,
  noclip: false,
  fly: false,
  freeCam: false,
  hitbox: false,
  timeScale: 1,
  multiplier: 1,
};

type Panel =
  | "none"
  | "howto"
  | "ranking"
  | "name"
  | "skins"
  | "settings"
  | "missions"
  | "botoes"
  | "admin";

const EMPTY_HUD: HudState = {
  score: 0,
  distance: 0,
  lives: 3,
  coins: 0,
  specials: 0,
  speedKmh: 0,
  boostMs: 0,
  boostMax: 5000,
  copHeat: 0,
  combo: 1,
  comboTimer: 0,
  powers: [],
  shield: false,
  chance: false,
  area: 0,
  areaName: "BAIRRO DA LUIZA",
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.7,
  sfxVolume: 0.9,
  muted: false,
  onScreenButtons: false,
  vibration: true,
  reduceFx: false,
  btnScale: 1,
  btnBottom: 0,
  btnSpread: 1,
};

/** distância de swipe (px) para contar como gesto de faixa/pulo/slide */
const SWIPE_LIMIAR = 31;

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, muted: localStorage.getItem("lrs.muted") === "1" };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadRuns(): LocalRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    return raw ? (JSON.parse(raw) as LocalRun[]) : [];
  } catch {
    return [];
  }
}

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game3D | null>(null);
  const audioRef = useRef<GameAudio | null>(null);

  const [phase, setPhase] = useState<Phase>("menu");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [result, setResult] = useState<GameOverPayload | null>(null);
  const [panel, setPanel] = useState<Panel>("none");
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) || 0));
  const [isNewBest, setIsNewBest] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [submitState, setSubmitState] = useState<SubmitState>("sending");
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [coins, setCoins] = useState(() => Number(localStorage.getItem(COINS_KEY) || 0));
  const [specials, setSpecials] = useState(() => Number(localStorage.getItem(SPECIALS_KEY) || 0));
  const [runs, setRuns] = useState<LocalRun[]>(loadRuns);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [skin, setSkin] = useState<SkinKey>(() => {
    const saved = localStorage.getItem(SKIN_KEY) as SkinKey | null;
    return saved && SKINS.some((s) => s.key === saved) ? saved : DEFAULT_SKIN;
  });
  const [fatal, setFatal] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(ADMIN_KEY) === "1");
  const [adminFlags, setAdminFlags] = useState<AdminFlags>(ADMIN_OFF);
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [nameChangedAt, setNameChangedAt] = useState<number | null>(() => {
    const raw = localStorage.getItem(NAME_AT_KEY);
    return raw ? Number(raw) : null;
  });
  const [missoes] = useState(() => missoesDoDia());
  const [missionProgress, setMissionProgress] = useState<MissionProgress>(carregarProgresso);
  const missoesRef = useRef(missoes);
  missoesRef.current = missoes;
  const missionRef = useRef(missionProgress);
  missionRef.current = missionProgress;

  const topScores = useTopScores();
  const submitScore = useSubmitScore();

  // ---- conta Google (obrigatória para entrar no placar global) -----------
  const sessao = authClient.useSession();
  const usuario = sessao.data?.user ?? null;
  const entrarGoogle = useCallback(() => {
    void authClient.managedAuth.signIn({ provider: "google" });
  }, []);
  const sairGoogle = useCallback(() => {
    void authClient.signOut().then(() => sessao.refetch());
  }, [sessao]);
  const conta = {
    logada: !!usuario,
    carregando: sessao.isPending,
    nome: usuario?.name || usuario?.email || null,
    avatar: usuario?.image ?? null,
    id: usuario?.id ?? null,
    entrar: entrarGoogle,
    sair: sairGoogle,
  };
  const logadoRef = useRef(!!usuario);
  logadoRef.current = !!usuario;

  const nameRef = useRef(playerName);
  nameRef.current = playerName;
  const submitRef = useRef(submitScore);
  submitRef.current = submitScore;
  const skinRef = useRef(skin);
  skinRef.current = skin;
  const bestRef = useRef(best);
  bestRef.current = best;

  const progress: Progress = { coins, best, specials, admin: isAdmin };

  const notify = useCallback((kind: NotifyKind, text: string) => {
    const toast: Toast = { id: Date.now() + Math.random(), kind, text };
    setToasts((prev) => [...prev.slice(-2), toast]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 2600);
  }, []);

  // ---- setup do motor 3D -------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return;
    const audio = new GameAudio();
    audioRef.current = audio;

    const onGameOver = (payload: GameOverPayload) => {
      setResult(payload);

      // missões diárias: aplica a corrida e paga a recompensa das que fecharam
      const upd = aplicarCorrida(missoesRef.current, missionRef.current, {
        score: payload.score,
        distance: payload.distance,
        coins: payload.coins,
        specials: payload.specials,
        combo: payload.combo,
      });
      missionRef.current = upd.progresso;
      setMissionProgress(upd.progresso);
      salvarProgresso(upd.progresso);
      for (const m of upd.concluidas) {
        notify("power", `Missão feita: +${m.recompensa.toLocaleString("pt-BR")} moedas!`);
      }
      if (upd.recompensa > 0) audio.play("desbloqueio");

      // moedas e itens especiais entram no cofrinho para sempre
      let newTotal = 0;
      setCoins((prev) => {
        newTotal = prev + payload.coins + upd.recompensa;
        localStorage.setItem(COINS_KEY, String(newTotal));
        return newTotal;
      });
      if (payload.specials > 0) {
        setSpecials((prev) => {
          const next = prev + payload.specials;
          localStorage.setItem(SPECIALS_KEY, String(next));
          return next;
        });
      }

      setBest((prev) => {
        if (payload.score > prev) {
          localStorage.setItem(BEST_KEY, String(payload.score));
          setIsNewBest(true);
          gameRef.current?.setBest(payload.score);
          return payload.score;
        }
        setIsNewBest(false);
        return prev;
      });

      // histórico local das corridas (aba "Neste aparelho" do ranking)
      setRuns((prev) => {
        const next = [
          {
            score: payload.score,
            distance: payload.distance,
            coins: payload.coins,
            skin: skinRef.current,
            at: Date.now(),
          },
          ...prev,
        ].slice(0, 20);
        localStorage.setItem(RUNS_KEY, JSON.stringify(next));
        return next;
      });

      // só vai para o placar global quem está logada com a conta Google:
      // o servidor amarra o recorde ao id da conta, então ninguém usa o nome de outra
      if (!logadoRef.current) {
        setSubmitState("deslogado");
        return;
      }
      setSubmitState("sending");
      submitRef.current.mutate(
        {
          score: payload.score,
          distance: payload.distance,
          coins: payload.coins,
          specials: payload.specials,
          skin: skinRef.current,
        },
        {
          onSuccess: (res) => setSubmitState(res.improved ? "record" : "kept"),
          onError: () => setSubmitState("error"),
        },
      );
    };

    const onFloat = (t: FloatingText) => {
      setFloats((prev) => [...prev.slice(-5), t]);
      window.setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== t.id)), 900);
    };

    let game: Game3D;
    try {
      game = new Game3D({
        canvas: canvasRef.current,
        audio,
        onHud: setHud,
        onPhaseChange: setPhase,
        onFloat,
        onGameOver,
        onNotify: notify,
      });
    } catch {
      // sem WebGL não há 3D: avisamos em vez de deixar a tela em branco
      setFatal(
        "Este navegador não conseguiu iniciar o 3D (WebGL indisponível). Tente o Chrome atualizado ou ligue a aceleração de hardware nas configurações.",
      );
      audio.dispose();
      audioRef.current = null;
      return;
    }
    gameRef.current = game;
    game.setSkin(skinRef.current);
    game.setBest(bestRef.current);

    const onResize = () => game.resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      game.destroy();
      audio.dispose();
      gameRef.current = null;
      audioRef.current = null;
    };
  }, [notify]);

  // ---- aplica as configurações no motor e no som ------------------------
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    const audio = audioRef.current;
    if (audio) {
      audio.setMusicVolume(settings.musicVolume);
      audio.setSfxVolume(settings.sfxVolume);
      if (audio.isMuted !== settings.muted) audio.toggleMute();
    }
    gameRef.current?.setReduceFx(settings.reduceFx);
    gameRef.current?.setVibration(settings.vibration);
  }, [settings]);

  const input = useCallback((action: InputAction) => gameRef.current?.input(action), []);

  const startGame = useCallback(() => {
    setPanel("none");
    setResult(null);
    setIsNewBest(false);
    setFloats([]);
    setToasts([]);
    gameRef.current?.start();
  }, []);

  // ---- teclado ----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const game = gameRef.current;
      if (!game) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "spacebar"].includes(k)) e.preventDefault();
      if (k === "arrowleft" || k === "a") input("left");
      else if (k === "arrowright" || k === "d") input("right");
      else if (k === "arrowup" || k === "w" || k === " " || k === "spacebar") input("jump");
      else if (k === "arrowdown" || k === "s") input("slide");
      else if (k === "p" || k === "escape") {
        if (game.phase === "running") game.pause();
        else if (game.phase === "paused") game.resume();
      } else if (k === "enter") {
        if (game.phase === "menu" || game.phase === "over") startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, startGame]);

  // ---- swipe / toque ----------------------------------------------------
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const threshold = SWIPE_LIMIAR;
    let sx = 0;
    let sy = 0;
    let time = 0;
    const down = (e: PointerEvent) => {
      sx = e.clientX;
      sy = e.clientY;
      time = performance.now();
    };
    const up = (e: PointerEvent) => {
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      const dt = performance.now() - time;
      const dist = Math.hypot(dx, dy);
      if (dist < threshold) {
        if (dt < 350) input("jump");
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) input(dx > 0 ? "right" : "left");
      else input(dy > 0 ? "slide" : "jump");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [input]);

  // ---- conta admin: repassa os interruptores para o motor ---------------
  useEffect(() => {
    gameRef.current?.setAdmin(isAdmin ? adminFlags : ADMIN_OFF);
  }, [adminFlags, isAdmin]);

  // ---- overlay de debug: lê os números do motor 3x por segundo ----------
  useEffect(() => {
    if (!isAdmin || panel !== "admin") return;
    const id = window.setInterval(() => {
      const g = gameRef.current;
      if (g) setDebug(g.getDebug());
    }, 330);
    return () => window.clearInterval(id);
  }, [isAdmin, panel]);

  // ---- ações ------------------------------------------------------------
  /** som curtinho de interface */
  const sfx = useCallback((key: Parameters<GameAudio["play"]>[0]) => {
    audioRef.current?.play(key);
  }, []);

  /** abre um painel do menu com o som de abrir tela */
  function abrirPainel(next: Panel) {
    sfx(next === "none" ? "clique" : "abrirtela");
    setPanel(next);
  }

  function toMenu() {
    sfx("clique");
    setResult(null);
    setPanel("none");
    gameRef.current?.toMenu();
  }

  function toggleMute() {
    setSettings((s) => ({ ...s, muted: !s.muted }));
  }

  function chooseSkin(next: SkinKey) {
    const info = findSkin(next);
    if (!isUnlocked(info, { coins, best, specials })) {
      sfx("erro");
      return;
    }
    sfx(next === skin ? "clique" : "desbloqueio");
    setSkin(next);
    localStorage.setItem(SKIN_KEY, next);
    gameRef.current?.setSkin(next);
  }

  /**
   * Criação da conta (tela inicial): apelido + senha, com o caminho escondido
   * da conta admin. Devolve null quando deu certo ou o texto do erro.
   */
  function criarConta(nome: string, senha: string, chave: string): string | null {
    const admin = nome.toLowerCase() === ADMIN_NAME && chave === ADMIN_PASS;

    // a conta admin tem 3 letras, então ela só passa pelo campo de chave
    if (!admin) {
      const problema = validarNome(nome);
      if (problema) {
        sfx("erro");
        return problema;
      }
      if (nome.toLowerCase() === ADMIN_NAME) {
        sfx("erro");
        return "Esse apelido é reservado.";
      }
    }

    sfx(admin ? "desbloqueio" : "clique");
    localStorage.setItem(NAME_KEY, nome);
    localStorage.setItem(PASS_KEY, senha);
    localStorage.setItem(ADMIN_KEY, admin ? "1" : "0");
    setPlayerName(nome);
    setIsAdmin(admin);
    setPanel("none");
    if (admin) notify("power", "Conta admin liberada — painel nas configurações.");
    return null;
  }

  /**
   * Troca de apelido pelas configurações: cobra 20.000 moedas e só libera
   * uma vez por mês. A conta admin passa direto.
   */
  function trocarNome(nome: string): string | null {
    if (isAdmin) {
      localStorage.setItem(NAME_KEY, nome);
      setPlayerName(nome);
      sfx("desbloqueio");
      return null;
    }

    const problema = validarNome(nome);
    if (problema) {
      sfx("erro");
      return problema;
    }
    if (nome.toLowerCase() === ADMIN_NAME) {
      sfx("erro");
      return "Esse apelido é reservado.";
    }
    const dias = diasParaTrocarNome(nameChangedAt);
    if (dias > 0) {
      sfx("erro");
      return `Só 1 troca por mês — faltam ${dias} dia(s).`;
    }
    if (coins < NOME_CUSTO) {
      sfx("erro");
      return `Faltam ${(NOME_CUSTO - coins).toLocaleString("pt-BR")} moedas.`;
    }

    const restante = coins - NOME_CUSTO;
    const agora = Date.now();
    localStorage.setItem(COINS_KEY, String(restante));
    localStorage.setItem(NAME_KEY, nome);
    localStorage.setItem(NAME_AT_KEY, String(agora));
    setCoins(restante);
    setPlayerName(nome);
    setNameChangedAt(agora);
    sfx("desbloqueio");
    return null;
  }

  /** Restaurar progresso: exige a senha da conta (ou nada, na admin). */
  function resetProgressComSenha(senha: string): string | null {
    const salva = localStorage.getItem(PASS_KEY);
    if (!isAdmin && salva && senha !== salva) {
      sfx("erro");
      return "Senha incorreta.";
    }
    sfx("clique");
    resetProgress();
    return null;
  }

  function resetProgress() {
    for (const key of [BEST_KEY, COINS_KEY, SPECIALS_KEY, RUNS_KEY, NAME_AT_KEY]) {
      localStorage.removeItem(key);
    }
    setNameChangedAt(null);
    localStorage.setItem(SKIN_KEY, DEFAULT_SKIN);
    setBest(0);
    setCoins(0);
    setSpecials(0);
    setRuns([]);
    setSkin(DEFAULT_SKIN);
    gameRef.current?.setSkin(DEFAULT_SKIN);
    gameRef.current?.setBest(0);
  }

  // ---- poderes da conta admin -------------------------------------------
  /** liga/desliga interruptores e repassa para o motor pelo efeito */
  function mudarFlags(next: Partial<AdminFlags>) {
    sfx("clique");
    setAdminFlags((f) => ({ ...f, ...next }));
  }

  /** moedas ilimitadas: entram no cofrinho salvo e também na partida */
  function adminMoedas(quanto: number) {
    sfx("desbloqueio");
    const total = coins + quanto;
    localStorage.setItem(COINS_KEY, String(total));
    setCoins(total);
    gameRef.current?.adminMoedas(quanto);
  }

  /** libera tudo: moedas, recorde e itens especiais no teto */
  function adminLiberarTudo() {
    sfx("desbloqueio");
    localStorage.setItem(COINS_KEY, String(9_999_999));
    localStorage.setItem(BEST_KEY, String(9_999_999));
    localStorage.setItem(SPECIALS_KEY, String(99));
    setCoins(9_999_999);
    setBest(9_999_999);
    setSpecials(99);
    gameRef.current?.setBest(9_999_999);
    notify("power", "Tudo liberado nesta conta.");
  }

  const showHud = phase === "running" || phase === "paused" || phase === "caught";
  const needsName = !playerName.trim();
  const btnEstilo = estiloBotoes(settings);
  /** quantas missões do dia já estão concluídas (badge do menu) */
  const missionsDone = missoes.filter((m) => estaConcluida(m, missionProgress)).length;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--lrs-bg)] select-none">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />

      {/* textos flutuantes (+10, +100, vida...) */}
      <div className="pointer-events-none absolute inset-x-0 top-[38%] z-20 flex flex-col items-center gap-1">
        {floats.map((f) => (
          <span
            key={f.id}
            className="lrs-display lrs-rise lrs-stroke text-2xl font-extrabold"
            style={{ color: f.color }}
          >
            {f.text}
          </span>
        ))}
      </div>

      <Notifications items={toasts} />

      {fatal && (
        <Frame>
          <div className="lrs-panel lrs-pop w-full max-w-sm rounded-3xl p-6 text-center">
            <h2 className="lrs-display text-2xl font-extrabold text-[var(--lrs-pink)]">Ops!</h2>
            <p className="mt-3 text-sm text-white/75">{fatal}</p>
          </div>
        </Frame>
      )}

      {showHud && (
        <>
          <Hud
            hud={hud}
            best={best}
            muted={settings.muted}
            onPause={() => gameRef.current?.pause()}
            onToggleMute={toggleMute}
          />
          {settings.onScreenButtons ? (
            <div className="absolute z-20 grid grid-cols-4 gap-2 px-2" style={btnEstilo.caixa}>
              {(
                [
                  ["◀", "left"],
                  ["▲", "jump"],
                  ["▼", "slide"],
                  ["▶", "right"],
                ] as [string, InputAction][]
              ).map(([label, action]) => (
                <button
                  key={action}
                  type="button"
                  aria-label={action}
                  onClick={() => input(action)}
                  style={btnEstilo.botao}
                  className="lrs-btn rounded-2xl bg-[rgba(51,22,90,0.75)] text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="rounded-full bg-black/35 px-4 py-1 text-center text-[11px] text-white/60">
                Swipe ou setas/WASD · toque = pular · P pausa
              </span>
            </div>
          )}
        </>
      )}

      {phase === "menu" && (needsName || panel === "name") && (
        <Frame>
          <NameGate
            initial={playerName}
            onConfirm={criarConta}
            onCancel={needsName ? undefined : () => setPanel("none")}
          />
        </Frame>
      )}

      {phase === "menu" && !needsName && panel === "none" && (
        <Frame>
          <Menu
            best={best}
            coins={coins}
            playerName={playerName}
            conta={conta}
            muted={settings.muted}
            onToggleMute={toggleMute}
            onPlay={startGame}
            onHowTo={() => abrirPainel("howto")}
            onSkins={() => abrirPainel("skins")}
            onSettings={() => abrirPainel("settings")}
            onChangeName={() => abrirPainel("name")}
            onMissions={() => abrirPainel("missions")}
            missionsDone={missionsDone}
            missionsTotal={missoes.length}
            onRanking={() => {
              abrirPainel("ranking");
              void topScores.refetch();
            }}
          />
        </Frame>
      )}

      {panel === "howto" && (
        <Frame>
          <HowTo onClose={() => abrirPainel("none")} />
        </Frame>
      )}

      {panel === "ranking" && (
        <Frame>
          <Ranking
            rows={topScores.data}
            loading={topScores.isLoading}
            localRuns={runs}
            me={playerName}
            conta={conta}
            onClose={() => abrirPainel("none")}
          />
        </Frame>
      )}

      {panel === "skins" && (
        <Frame>
          <SkinPicker
            selected={skin}
            progress={progress}
            onSelect={chooseSkin}
            onClose={() => abrirPainel("none")}
          />
        </Frame>
      )}

      {panel === "missions" && (
        <Frame>
          <Missions
            missoes={missoes}
            progresso={missionProgress}
            onClose={() => abrirPainel("none")}
          />
        </Frame>
      )}

      {panel === "settings" && (
        <Frame>
          <Settings
            settings={settings}
            onChange={(next) => setSettings((s) => ({ ...s, ...next }))}
            onReset={resetProgressComSenha}
            playerName={playerName}
            coins={coins}
            admin={isAdmin}
            ultimaTrocaNome={nameChangedAt}
            onSaveName={trocarNome}
            onOpenButtons={() => abrirPainel("botoes")}
            onOpenAdmin={isAdmin ? () => abrirPainel("admin") : undefined}
            onClose={() => abrirPainel("none")}
          />
        </Frame>
      )}

      {panel === "botoes" && (
        <>
          <Frame>
            <ButtonLayout
              settings={settings}
              onChange={(next) => setSettings((s) => ({ ...s, ...next }))}
              onClose={() => abrirPainel("settings")}
            />
          </Frame>
          {/* prévia ao vivo: as setas de verdade, por cima do painel */}
          <div
            className="pointer-events-none absolute z-40 grid grid-cols-4 gap-2 px-2"
            style={btnEstilo.caixa}
          >
            {["◀", "▲", "▼", "▶"].map((label) => (
              <span
                key={label}
                style={btnEstilo.botao}
                className="lrs-btn rounded-2xl bg-[rgba(51,22,90,0.9)] text-center text-white"
              >
                {label}
              </span>
            ))}
          </div>
        </>
      )}

      {panel === "admin" && isAdmin && (
        <Frame>
          <AdminPanel
            flags={adminFlags}
            debug={debug}
            areas={BIOMES.map((b) => b.name)}
            jogando={phase === "running" || phase === "paused"}
            onFlags={mudarFlags}
            onMoedas={adminMoedas}
            onSpawnObstaculo={(t: ObstacleType) => gameRef.current?.adminSpawnObstaculo(t)}
            onSpawnPower={(k?: PowerKind) => gameRef.current?.adminSpawnPower(k)}
            onLimparPista={() => gameRef.current?.adminLimparPista()}
            onIrParaBioma={(i) => gameRef.current?.adminIrParaBioma(i)}
            onTeleporte={(l) => gameRef.current?.adminTeleporte(l)}
            onMover={(eixo, passo) => gameRef.current?.adminMover(eixo, passo)}
            onDesbloquearTudo={adminLiberarTudo}
            onResetProgresso={resetProgress}
            // durante a partida o Fechar volta para a pausa; no menu volta às configurações
            onClose={() => abrirPainel(phase === "paused" || phase === "running" ? "none" : "settings")}
          />
        </Frame>
      )}

      {phase === "paused" && panel === "none" && (
        <Frame>
          <Paused
            onResume={() => gameRef.current?.resume()}
            onMenu={toMenu}
            onAdmin={isAdmin ? () => abrirPainel("admin") : undefined}
          />
        </Frame>
      )}

      {phase === "over" && result && (
        <Frame>
          <GameOver
            result={result}
            best={best}
            isNewBest={isNewBest}
            coinTotal={coins}
            playerName={playerName}
            submitState={submitState}
            onEntrar={entrarGoogle}
            onRestart={startGame}
            onMenu={toMenu}
            onSkins={() => abrirPainel("skins")}
          />
        </Frame>
      )}
    </div>
  );
}
