import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FloatingText,
  Game3D,
  type GameOverPayload,
  type HudState,
  type InputAction,
  type NotifyKind,
  type Phase,
} from "../../game/engine3d";
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
  Frame,
  GameOver,
  type GameSettings,
  HowTo,
  type LocalRun,
  Menu,
  NameGate,
  Paused,
  Ranking,
  Missions,
  Settings,
  SkinPicker,
} from "./overlays";

const BEST_KEY = "lrs.best";
const NAME_KEY = "lrs.name";
const COINS_KEY = "lrs.coins.total";
const SPECIALS_KEY = "lrs.specials";
const SETTINGS_KEY = "lrs.settings";
const SKIN_KEY = "lrs.skin";
const RUNS_KEY = "lrs.local.runs";

type Panel = "none" | "howto" | "ranking" | "name" | "skins" | "settings" | "missions";

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
  swipeSensitivity: 0.5,
  vibration: true,
  reduceFx: false,
};

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
  const [submitState, setSubmitState] = useState<"sending" | "record" | "kept" | "error">("sending");
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
  const [missoes] = useState(() => missoesDoDia());
  const [missionProgress, setMissionProgress] = useState<MissionProgress>(carregarProgresso);
  const missoesRef = useRef(missoes);
  missoesRef.current = missoes;
  const missionRef = useRef(missionProgress);
  missionRef.current = missionProgress;

  const topScores = useTopScores();
  const submitScore = useSubmitScore();
  const nameRef = useRef(playerName);
  nameRef.current = playerName;
  const submitRef = useRef(submitScore);
  submitRef.current = submitScore;
  const skinRef = useRef(skin);
  skinRef.current = skin;
  const bestRef = useRef(best);
  bestRef.current = best;

  const progress: Progress = { coins, best, specials };

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

      // envio automático para o ranking com o apelido salvo
      const player = nameRef.current.trim();
      if (!player) return;
      setSubmitState("sending");
      submitRef.current.mutate(
        {
          player,
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
    // sensibilidade 0 = precisa de swipe longo (48px); 1 = swipe curtinho (14px)
    const threshold = 48 - settings.swipeSensitivity * 34;
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
  }, [input, settings.swipeSensitivity]);

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

  function saveName(name: string) {
    const clean = name.trim().slice(0, 16);
    if (!clean) {
      sfx("erro");
      return;
    }
    sfx("clique");
    localStorage.setItem(NAME_KEY, clean);
    setPlayerName(clean);
    setPanel("none");
  }

  /** apelido salvo pela seção Conta das configurações (não fecha o painel) */
  function saveNameInline(name: string) {
    const clean = name.trim().slice(0, 16);
    if (!clean) {
      sfx("erro");
      return;
    }
    sfx("desbloqueio");
    localStorage.setItem(NAME_KEY, clean);
    setPlayerName(clean);
  }

  function resetProgress() {
    for (const key of [BEST_KEY, COINS_KEY, SPECIALS_KEY, RUNS_KEY]) localStorage.removeItem(key);
    localStorage.setItem(SKIN_KEY, DEFAULT_SKIN);
    setBest(0);
    setCoins(0);
    setSpecials(0);
    setRuns([]);
    setSkin(DEFAULT_SKIN);
    gameRef.current?.setSkin(DEFAULT_SKIN);
    gameRef.current?.setBest(0);
  }

  const showHud = phase === "running" || phase === "paused" || phase === "caught";
  const needsName = !playerName.trim();
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
            <div className="absolute inset-x-0 bottom-4 z-20 grid grid-cols-4 gap-2 px-4">
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
                  className="lrs-btn rounded-2xl bg-[rgba(51,22,90,0.75)] py-3 text-xl text-white"
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
            onConfirm={saveName}
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
            onReset={resetProgress}
            playerName={playerName}
            onSaveName={saveNameInline}
            onClose={() => abrirPainel("none")}
          />
        </Frame>
      )}

      {phase === "paused" && panel === "none" && (
        <Frame>
          <Paused onResume={() => gameRef.current?.resume()} onMenu={toMenu} />
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
            onRestart={startGame}
            onMenu={toMenu}
            onSkins={() => abrirPainel("skins")}
          />
        </Frame>
      )}
    </div>
  );
}
