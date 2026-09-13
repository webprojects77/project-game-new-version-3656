import { useEffect, useState } from "react";
import type { GameOverPayload } from "../../game/engine3d";
import { estaConcluida, type Mission, type MissionProgress } from "../../game/missions";
import {
  isUnlocked,
  type Progress,
  requirementLabel,
  SKINS,
  type SkinInfo,
  type SkinKey,
} from "../../game/skins";

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  onScreenButtons: boolean;
  swipeSensitivity: number;
  vibration: boolean;
  reduceFx: boolean;
}

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(18,6,34,0.72)] p-4 backdrop-blur-[3px]">
      {children}
    </div>
  );
}

/** Tela de apelido: aparece antes do menu, na primeira vez. */
export function NameGate({
  initial,
  onConfirm,
  onCancel,
}: {
  initial: string;
  onConfirm: (name: string) => void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initial);
  const clean = value.trim();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (clean) onConfirm(clean);
      }}
      className="lrs-panel lrs-pop w-full max-w-sm rounded-3xl p-6 text-center"
    >
      <h2 className="lrs-display text-3xl font-extrabold text-[var(--lrs-cyan)]">Qual é o seu apelido?</h2>
      <p className="mt-2 text-sm text-white/65">
        Ele fica salvo neste aparelho e vai direto para o ranking. Cada apelido guarda só o melhor recorde.
      </p>
      <input
        autoFocus
        value={value}
        maxLength={16}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ex.: Luiza"
        className="lrs-display mt-5 w-full rounded-2xl border-2 border-[var(--lrs-ink)] bg-black/30 px-4 py-3 text-center text-2xl text-white outline-none placeholder:text-white/30"
      />
      <button
        type="submit"
        disabled={!clean}
        className="lrs-btn mt-4 w-full rounded-2xl bg-[var(--lrs-pink)] py-3 text-xl text-white disabled:opacity-40"
      >
        Continuar
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-3 text-xs text-white/50 underline">
          Cancelar
        </button>
      )}
    </form>
  );
}

export function Menu({
  best,
  coins,
  playerName,
  onPlay,
  onHowTo,
  onRanking,
  onSkins,
  onSettings,
  onChangeName,
  onMissions,
  missionsDone,
  missionsTotal,
  muted,
  onToggleMute,
}: {
  best: number;
  coins: number;
  playerName: string;
  onPlay: () => void;
  onHowTo: () => void;
  onRanking: () => void;
  onSkins: () => void;
  onSettings: () => void;
  onChangeName: () => void;
  onMissions: () => void;
  missionsDone: number;
  missionsTotal: number;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="lrs-rise w-full max-w-md text-center">
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onMissions}
          className="lrs-btn relative rounded-xl bg-[var(--lrs-surface2)] px-3 py-1.5 text-lg text-white"
        >
          🎯
          <span className="lrs-nums absolute -top-2 -right-2 rounded-full border-2 border-[var(--lrs-ink)] bg-[var(--lrs-lime)] px-1.5 text-[10px] font-bold text-[var(--lrs-ink)]">
            {missionsDone}/{missionsTotal}
          </span>
        </button>
        <button
          type="button"
          aria-label="Configurações"
          onClick={onSettings}
          className="lrs-btn rounded-xl bg-[var(--lrs-surface2)] px-3 py-1.5 text-lg text-white"
        >
          ⚙️
        </button>
      </div>
      <div className="lrs-display text-[13vw] leading-[0.85] font-extrabold text-[var(--lrs-pink)] sm:text-7xl">
        <span className="lrs-stroke block">LUIZA</span>
        <span className="lrs-stroke block text-[var(--lrs-cyan)]">RUN SURFS</span>
      </div>
      <p className="mt-3 text-sm text-white/70">
        Corra, desvie, colete e fuja da versão policial da Luiza. A velocidade só aumenta.
      </p>
      <div className="mt-4 text-sm text-white/75">
        Jogando como <strong className="text-[var(--lrs-lime)]">{playerName}</strong>{" "}
        <button type="button" onClick={onChangeName} className="text-white/50 underline">
          trocar apelido
        </button>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={onPlay}
          className="lrs-btn rounded-2xl bg-[var(--lrs-pink)] py-4 text-2xl text-white"
        >
          ▶ JOGAR
        </button>
        <button
          type="button"
          onClick={onSkins}
          className="lrs-btn rounded-2xl bg-[var(--lrs-lime)] py-3 text-lg text-[var(--lrs-ink)]"
        >
          Personagens
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onHowTo}
            className="lrs-btn rounded-2xl bg-[var(--lrs-surface2)] py-3 text-sm text-white"
          >
            Como jogar
          </button>
          <button
            type="button"
            onClick={onRanking}
            className="lrs-btn rounded-2xl bg-[var(--lrs-gold)] py-3 text-sm text-[var(--lrs-ink)]"
          >
            Ranking
          </button>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-center gap-4 text-xs text-white/55">
        <span className="lrs-nums">
          Recorde: <strong className="text-[var(--lrs-gold)]">{best.toLocaleString("pt-BR")}</strong>
        </span>
        <span className="lrs-nums">
          🪙 <strong className="text-[var(--lrs-gold)]">{coins.toLocaleString("pt-BR")}</strong>
        </span>
        <button type="button" onClick={onToggleMute} className="underline">
          {muted ? "Som desligado" : "Som ligado"}
        </button>
      </div>
    </div>
  );
}

export function HowTo({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["Swipe ◀ ▶ / A D / setas", "trocar de faixa"],
    ["Swipe ▲ / W / Espaço / toque", "pular (obstáculos baixos)"],
    ["Swipe ▼ / S / seta baixo", "deslizar (placas altas)"],
    ["Pular durante o slide", "cancela o slide na hora"],
    ["P / Esc", "pausar"],
  ];
  const items: [string, string][] = [
    ["🪙 Moeda", "+10 pontos e +1 moeda para as skins"],
    ["💚 Coração verde", "recupera 1 vida (máx. 3)"],
    ["⚡ Boost", "5s invencível, velocidade e pontos em dobro"],
    ["📸 Item especial", "+100 pontos e libera a skin Polaroid"],
  ];
  return (
    <div className="lrs-panel lrs-rise max-h-full w-full max-w-lg overflow-y-auto rounded-3xl p-6 text-left">
      <h2 className="lrs-display text-3xl font-extrabold text-[var(--lrs-cyan)]">Como jogar</h2>
      <div className="mt-4 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-sm">
            <span className="font-semibold text-white">{k}</span>
            <span className="text-right text-white/65">{v}</span>
          </div>
        ))}
      </div>
      <h3 className="lrs-display mt-5 text-xl font-bold text-[var(--lrs-gold)]">Itens</h3>
      <div className="mt-2 space-y-1.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-sm">
            <span className="font-semibold text-white">{k}</span>
            <span className="text-right text-white/65">{v}</span>
          </div>
        ))}
      </div>
      <h3 className="lrs-display mt-5 text-xl font-bold text-[var(--lrs-lime)]">Combo</h3>
      <p className="mt-2 text-sm text-white/70">
        Colete sem parar para subir o combo até <strong className="text-[var(--lrs-gold)]">x8</strong>: ele
        multiplica pontos e moedas. Se você demorar demais entre duas coletas, o combo zera.
      </p>
      <h3 className="lrs-display mt-5 text-xl font-bold text-[var(--lrs-lime)]">Fases</h3>
      <p className="mt-2 text-sm text-white/70">
        O cenário muda a cada 750 m: <strong className="text-white">Bairro</strong> (manhã) →{" "}
        <strong className="text-white">Escola</strong> (meio-dia) → <strong className="text-white">Centro</strong>{" "}
        (fim de tarde) → <strong className="text-white">Praça</strong> (noite). Um portal com faixa de pedestre
        gigante avisa a troca.
      </p>
      <p className="mt-3 text-sm text-white/70">
        Você tem <strong className="text-[var(--lrs-pink)]">3 vidas</strong>. Cada batida deixa o policial mais
        perto — e o <strong className="text-[var(--lrs-gold)]">cachorro</strong> late correndo do lado dele. Sem
        vidas, ele te alcança: Game Over.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="lrs-btn mt-6 w-full rounded-2xl bg-[var(--lrs-pink)] py-3 text-lg text-white"
      >
        Entendi
      </button>
    </div>
  );
}

export function Paused({ onResume, onMenu }: { onResume: () => void; onMenu: () => void }) {
  return (
    <div className="lrs-panel lrs-pop w-full max-w-sm rounded-3xl p-6 text-center">
      <h2 className="lrs-display text-4xl font-extrabold text-[var(--lrs-cyan)]">Pausado</h2>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onResume}
          className="lrs-btn rounded-2xl bg-[var(--lrs-pink)] py-3 text-xl text-white"
        >
          Continuar
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="lrs-btn rounded-2xl bg-[var(--lrs-surface2)] py-3 text-white"
        >
          Menu
        </button>
      </div>
    </div>
  );
}

export function GameOver({
  result,
  best,
  isNewBest,
  coinTotal,
  playerName,
  submitState,
  onRestart,
  onMenu,
  onSkins,
}: {
  result: GameOverPayload;
  best: number;
  isNewBest: boolean;
  coinTotal: number;
  playerName: string;
  submitState: "sending" | "record" | "kept" | "error";
  onRestart: () => void;
  onMenu: () => void;
  onSkins: () => void;
}) {
  // o saldo do cofrinho sobe animado até o total, somando as moedas da corrida
  const inicio = Math.max(0, coinTotal - result.coins);
  const [cofrinho, setCofrinho] = useState(inicio);
  useEffect(() => {
    setCofrinho(inicio);
    if (coinTotal <= inicio) return;
    const dur = 900;
    const t0 = performance.now();
    let raf = 0;
    const passo = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      setCofrinho(Math.round(inicio + (coinTotal - inicio) * k));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [inicio, coinTotal]);

  const submitLabel =
    submitState === "sending"
      ? "Enviando para o ranking..."
      : submitState === "record"
        ? `Novo recorde de ${playerName} no ranking!`
        : submitState === "kept"
          ? `Seu melhor recorde no ranking continua maior, ${playerName}.`
          : "Não deu para enviar ao ranking (sem conexão?).";
  return (
    <div className="lrs-panel lrs-pop max-h-full w-full max-w-md overflow-y-auto rounded-3xl p-6 text-center">
      <h2 className="lrs-display text-4xl font-extrabold text-[var(--lrs-pink)]">Game Over</h2>
      <p className="mt-1 text-sm text-white/65">O policial te pegou!</p>

      <div className="lrs-nums lrs-display mt-5 text-6xl font-extrabold text-[var(--lrs-gold)]">
        {result.score.toLocaleString("pt-BR")}
      </div>
      <div className="text-xs tracking-wider text-white/55 uppercase">pontos</div>

      {isNewBest && (
        <div className="lrs-display mt-2 text-lg font-bold text-[var(--lrs-lime)]">🎉 Novo recorde!</div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
        {[
          ["Distância", `${result.distance} m`],
          ["Moedas", `+${result.coins}`],
          ["Combo", `x${result.combo}`],
          ["Especiais", String(result.specials)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border-2 border-[var(--lrs-ink)] bg-black/25 px-1.5 py-2">
            <div className="lrs-display lrs-nums text-base font-bold text-[var(--lrs-cyan)]">{v}</div>
            <div className="text-[9px] tracking-wider text-white/50 uppercase">{k}</div>
          </div>
        ))}
      </div>

      {/* moedas da corrida voando para o cofrinho */}
      <div className="relative mt-3">
        <div className="pointer-events-none absolute inset-x-0 -top-6 flex justify-center gap-3">
          {result.coins > 0 &&
            [0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="lrs-coin-fly text-lg"
                style={{
                  animationDelay: `${i * 0.09}s`,
                  ["--lrs-fly-x" as string]: `${(i - 2) * -14}px`,
                  ["--lrs-fly-y" as string]: "34px",
                }}
              >
                🪙
              </span>
            ))}
        </div>
        <div className="lrs-nums text-sm text-white/70">
          Cofrinho:{" "}
          <strong className="text-[var(--lrs-gold)]">🪙 {cofrinho.toLocaleString("pt-BR")}</strong>
        </div>
      </div>

      <p className={`mt-3 text-xs ${submitState === "record" ? "text-[var(--lrs-lime)]" : "text-white/55"}`}>
        {submitLabel}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="lrs-btn rounded-2xl bg-[var(--lrs-pink)] py-3 text-xl text-white"
        >
          Jogar novamente
        </button>
        <button
          type="button"
          onClick={onSkins}
          className="lrs-btn rounded-2xl bg-[var(--lrs-lime)] py-3 text-[var(--lrs-ink)]"
        >
          Personagens
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="lrs-btn rounded-2xl bg-[var(--lrs-surface2)] py-3 text-white"
        >
          Menu
        </button>
      </div>
      <div className="lrs-nums mt-3 text-xs text-white/45">Recorde: {best.toLocaleString("pt-BR")}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ranking com abas Local / Global
// ---------------------------------------------------------------------------

export interface LocalRun {
  score: number;
  distance: number;
  coins: number;
  skin: SkinKey;
  at: number;
}

export interface GlobalRow {
  id: number;
  player: string;
  score: number;
  distance: number;
  skin?: string | null;
}

function skinName(key: string | null | undefined) {
  return SKINS.find((s) => s.key === key)?.name ?? "Luiza Clássica";
}

/** Ilustração simples para quando ainda não existe nenhum recorde. */
function RankingVazio({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--lrs-locked)] bg-black/20 px-4 py-7 text-center">
      <svg viewBox="0 0 64 44" className="h-16 w-24">
        <title>Pódio vazio</title>
        <rect x="2" y="24" width="18" height="18" rx="2" fill="var(--lrs-surface2)" stroke="var(--lrs-ink)" strokeWidth="2" />
        <rect x="23" y="14" width="18" height="28" rx="2" fill="var(--lrs-gold)" stroke="var(--lrs-ink)" strokeWidth="2" />
        <rect x="44" y="30" width="18" height="12" rx="2" fill="var(--lrs-surface2)" stroke="var(--lrs-ink)" strokeWidth="2" />
        <path
          d="M32 2 34.4 7.2 40 8 36 12.1 37 18 32 15.2 27 18 28 12.1 24 8 29.6 7.2Z"
          fill="var(--lrs-cyan)"
          stroke="var(--lrs-ink)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm text-white/60">{texto}</p>
    </div>
  );
}

export function Ranking({
  rows,
  loading,
  localRuns,
  me,
  onClose,
}: {
  rows: GlobalRow[] | undefined;
  loading: boolean;
  localRuns: LocalRun[];
  me: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"local" | "global">("global");
  const mine = me.trim().toLowerCase();
  return (
    <div className="lrs-panel lrs-rise max-h-full w-full max-w-md overflow-y-auto rounded-3xl p-6">
      <h2 className="lrs-display text-3xl font-extrabold text-[var(--lrs-gold)]">Ranking</h2>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["local", "global"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`lrs-btn rounded-xl py-2 text-sm ${
              tab === t
                ? "bg-[var(--lrs-cyan)] text-[var(--lrs-ink)]"
                : "bg-[var(--lrs-surface2)] text-white/80"
            }`}
          >
            {t === "local" ? "Neste aparelho" : "Global"}
          </button>
        ))}
      </div>

      {tab === "global" ? (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs text-white/55">Melhor recorde de cada jogador</p>
          {loading && <div className="text-sm text-white/60">Carregando...</div>}
          {!loading && (!rows || rows.length === 0) && (
            <RankingVazio texto="Ninguém no ranking ainda. Seja a primeira a subir no pódio!" />
          )}
          {rows?.map((row, i) => {
            const isMe = row.player.trim().toLowerCase() === mine;
            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${
                  isMe
                    ? "border-[var(--lrs-gold)] bg-[rgba(255,201,60,0.14)] shadow-[0_0_14px_rgba(255,201,60,0.55)]"
                    : "border-[var(--lrs-ink)] bg-black/25"
                }`}
              >
                <span className="lrs-display w-6 text-lg font-bold text-[var(--lrs-cyan)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">{row.player}</div>
                  <div className="truncate text-[10px] text-white/45">{skinName(row.skin)}</div>
                </div>
                <span className="lrs-nums text-xs text-white/50">{row.distance} m</span>
                <span className="lrs-nums lrs-display font-bold text-[var(--lrs-gold)]">
                  {row.score.toLocaleString("pt-BR")}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs text-white/55">Suas últimas corridas neste aparelho</p>
          {localRuns.length === 0 && (
            <RankingVazio texto="Nenhuma corrida salva ainda neste aparelho. Bora correr!" />
          )}
          {[...localRuns]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((run, i) => (
              <div
                key={`${run.at}-${i}`}
                className="flex items-center gap-3 rounded-xl border-2 border-[var(--lrs-ink)] bg-black/25 px-3 py-2"
              >
                <span className="lrs-display w-6 text-lg font-bold text-[var(--lrs-cyan)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">{skinName(run.skin)}</div>
                  <div className="lrs-nums truncate text-[10px] text-white/45">
                    {run.distance} m · 🪙 {run.coins}
                  </div>
                </div>
                <span className="lrs-nums lrs-display font-bold text-[var(--lrs-gold)]">
                  {run.score.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="lrs-btn mt-6 w-full rounded-2xl bg-[var(--lrs-pink)] py-3 text-lg text-white"
      >
        Voltar
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Personagens (skins 3D)
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<SkinInfo["tier"], string> = {
  padrao: "Padrão",
  comum: "Comum",
  rara: "Rara",
  epica: "Épica",
  especial: "Especial",
};

/** Miniatura low poly da skin em SVG — mesmas cores do boneco 3D. */
function SkinThumb({ skin, locked }: { skin: SkinInfo; locked: boolean }) {
  const b = skin.body;
  const c = (color: string) => (locked ? "var(--lrs-locked)" : color);
  return (
    <svg viewBox="0 0 40 64" className="h-full w-full">
      <rect x="14" y="4" width="12" height="12" rx="2" fill={c(b.skin)} />
      <rect x="12" y="2" width="16" height="6" rx="2" fill={c(b.hair)} />
      <rect x="13" y="16" width="14" height="18" rx="3" fill={c(b.shirt)} />
      <rect x="13" y="26" width="14" height="8" fill={c(b.shirtAlt)} />
      <rect x="9" y="18" width="4" height="14" rx="2" fill={c(b.skin)} />
      <rect x="27" y="18" width="4" height="14" rx="2" fill={c(b.skin)} />
      <rect x="14" y="34" width="5" height="18" rx="2" fill={c(b.pants)} />
      <rect x="21" y="34" width="5" height="18" rx="2" fill={c(b.pants)} />
      <rect x="13" y="52" width="7" height="5" rx="2" fill={c(b.shoes)} />
      <rect x="20" y="52" width="7" height="5" rx="2" fill={c(b.shoes)} />
      <rect x="17" y="18" width="6" height="3" rx="1" fill={c(b.detail)} />
    </svg>
  );
}

export function SkinPicker({
  selected,
  progress,
  onSelect,
  onClose,
}: {
  selected: SkinKey;
  progress: Progress;
  onSelect: (skin: SkinKey) => void;
  onClose: () => void;
}) {
  // personagem em destaque no painel de preview (começa no que está em uso)
  const [preview, setPreview] = useState<SkinKey>(selected);
  const skin = SKINS.find((s) => s.key === preview) ?? SKINS[0];
  const unlocked = isUnlocked(skin, progress);
  const active = selected === skin.key;
  const reqs = requirementLabel(skin, progress);

  return (
    <div className="lrs-panel lrs-rise max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl p-4 sm:p-6">
      {/* ---- topo: seta de voltar, título e carteira ---- */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Voltar"
          onClick={onClose}
          className="lrs-btn shrink-0 rounded-xl bg-[var(--lrs-surface2)] px-3 py-2 text-lg leading-none text-white"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="lrs-display text-2xl font-extrabold text-[var(--lrs-lime)] sm:text-3xl">
            Personagens
          </h2>
          <p className="text-xs text-white/60 sm:text-sm">
            Todas jogam igual — muda só o visual, tudo em 3D.
          </p>
        </div>
        <div className="lrs-nums lrs-display shrink-0 rounded-2xl border-2 border-[var(--lrs-ink)] bg-black/30 px-3 py-2 text-right">
          <div className="text-base font-bold text-[var(--lrs-gold)] sm:text-lg">
            🪙 {progress.coins.toLocaleString("pt-BR")}
          </div>
          <div className="text-[10px] tracking-wider text-white/50 uppercase">
            📸 {progress.specials} especiais
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
        {/* ---- preview grande do personagem ---- */}
        <div
          className="flex flex-col rounded-2xl border-[3px] bg-[rgba(16,6,31,0.55)] p-3"
          style={{ borderColor: active ? "var(--lrs-pink)" : unlocked ? "var(--lrs-cyan)" : "var(--lrs-locked)" }}
        >
          <div className="relative mx-auto flex h-40 w-28 items-center justify-center sm:h-52 sm:w-36">
            <SkinThumb skin={skin} locked={!unlocked} />
            {!unlocked && (
              <span className="absolute inset-0 flex items-center justify-center text-4xl">🔒</span>
            )}
          </div>
          <div
            className="mt-2 text-center text-[10px] font-bold tracking-wider uppercase"
            style={{ color: unlocked ? skin.tierColor : "var(--lrs-muted)" }}
          >
            {TIER_LABEL[skin.tier]}
          </div>
          <div className="lrs-display text-center text-lg leading-tight font-bold text-white">
            {skin.name}
          </div>
          <p className="mt-1 text-center text-[11px] text-white/60">{skin.desc}</p>

          {unlocked ? (
            <button
              type="button"
              disabled={active}
              onClick={() => onSelect(skin.key)}
              className="lrs-btn mt-3 w-full rounded-2xl py-2.5 text-sm font-bold disabled:opacity-70"
              style={{
                background: active ? "var(--lrs-surface2)" : "var(--lrs-pink)",
                color: "#fff",
              }}
            >
              {active ? "Em uso ✓" : "Selecionar"}
            </button>
          ) : (
            <div className="mt-3 space-y-1 rounded-xl border-2 border-[var(--lrs-ink)] bg-black/30 px-2 py-2">
              <div className="text-center text-[10px] tracking-wider text-white/45 uppercase">
                Falta para liberar
              </div>
              {reqs.map((r) => (
                <div key={r} className="lrs-nums text-center text-[11px] leading-tight text-[var(--lrs-muted)]">
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- grade de personagens ---- */}
        <div className="grid grid-cols-3 gap-2 self-start sm:grid-cols-4">
          {SKINS.map((s) => {
            const ok = isUnlocked(s, progress);
            const emUso = selected === s.key;
            const vendo = preview === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setPreview(s.key)}
                className="flex flex-col rounded-2xl border-[3px] bg-black/30 p-1.5 text-left transition"
                style={{
                  borderColor: emUso
                    ? "var(--lrs-pink)"
                    : ok
                      ? "var(--lrs-cyan)"
                      : "var(--lrs-locked)",
                  boxShadow: vendo ? "0 0 0 3px rgba(255,246,251,0.35)" : undefined,
                }}
              >
                <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-xl bg-[rgba(16,6,31,0.55)]">
                  <SkinThumb skin={s} locked={!ok} />
                  {!ok && (
                    <span className="absolute inset-0 flex items-center justify-center text-xl">🔒</span>
                  )}
                </div>
                <div className="lrs-display mt-1 truncate text-[10px] font-bold text-white">{s.name}</div>
                <div
                  className="text-[8px] font-bold tracking-wider uppercase"
                  style={{ color: ok ? s.tierColor : "var(--lrs-muted)" }}
                >
                  {emUso ? "em uso" : TIER_LABEL[s.tier]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-white/50">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--lrs-cyan)]" />
          borda ciano = liberada
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--lrs-pink)]" />
          borda rosa = em uso
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm text-white/80">
        <span>{label}</span>
        <span className="lrs-nums text-white/50">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-1 h-2 w-full appearance-none rounded-full bg-black/40 accent-[var(--lrs-pink)]"
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-[var(--lrs-ink)] bg-black/25 px-3 py-2 text-left"
    >
      <span>
        <span className="block text-sm text-white">{label}</span>
        {hint && <span className="block text-[11px] text-white/45">{hint}</span>}
      </span>
      <span
        className="shrink-0 rounded-full border-2 border-[var(--lrs-ink)] px-3 py-1 text-xs font-bold"
        style={{
          background: on ? "var(--lrs-lime)" : "var(--lrs-locked)",
          color: on ? "var(--lrs-ink)" : "#fff",
        }}
      >
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export const GAME_VERSION = "1.0";

export function Settings({
  settings,
  playerName,
  onSaveName,
  onChange,
  onReset,
  onClose,
}: {
  settings: GameSettings;
  playerName: string;
  onSaveName: (name: string) => void;
  onChange: (next: Partial<GameSettings>) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [nome, setNome] = useState(playerName);
  const [salvo, setSalvo] = useState(false);
  const nomeLimpo = nome.trim();
  const mudou = nomeLimpo.length > 0 && nomeLimpo !== playerName;
  return (
    <div className="lrs-panel lrs-rise max-h-full w-full max-w-md overflow-y-auto rounded-3xl p-6">
      <h2 className="lrs-display text-3xl font-extrabold text-[var(--lrs-cyan)]">Configurações</h2>

      <h3 className="lrs-display mt-4 text-lg font-bold text-[var(--lrs-gold)]">Conta</h3>
      <div className="mt-2">
        <label className="block text-sm text-white/80" htmlFor="lrs-apelido">
          Apelido no ranking
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="lrs-apelido"
            value={nome}
            maxLength={16}
            onChange={(e) => {
              setNome(e.target.value);
              setSalvo(false);
            }}
            className="lrs-display min-w-0 flex-1 rounded-xl border-2 border-[var(--lrs-ink)] bg-black/30 px-3 py-2 text-lg text-white outline-none placeholder:text-white/30"
            placeholder="Ex.: Luiza"
          />
          <button
            type="button"
            disabled={!mudou}
            onClick={() => {
              onSaveName(nomeLimpo);
              setSalvo(true);
            }}
            className="lrs-btn shrink-0 rounded-xl bg-[var(--lrs-lime)] px-4 py-2 text-sm font-bold text-[var(--lrs-ink)] disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
        <p className="mt-1 text-[11px] text-white/45">
          {salvo && !mudou ? (
            <span className="text-[var(--lrs-lime)]">Apelido salvo ✓</span>
          ) : (
            "Cada apelido guarda só o melhor recorde no ranking global."
          )}
        </p>
      </div>

      <h3 className="lrs-display mt-4 text-lg font-bold text-[var(--lrs-gold)]">Som</h3>
      <div className="mt-2 space-y-3">
        <Slider
          label="Música"
          value={settings.musicVolume}
          onChange={(v) => onChange({ musicVolume: v })}
        />
        <Slider label="Efeitos" value={settings.sfxVolume} onChange={(v) => onChange({ sfxVolume: v })} />
        <Toggle label="Mudo" on={settings.muted} onChange={(v) => onChange({ muted: v })} />
      </div>

      <h3 className="lrs-display mt-5 text-lg font-bold text-[var(--lrs-gold)]">Controles</h3>
      <div className="mt-2 space-y-3">
        <Toggle
          label="Botões na tela"
          hint="Mostra as setas de toque além do swipe"
          on={settings.onScreenButtons}
          onChange={(v) => onChange({ onScreenButtons: v })}
        />
        <Slider
          label="Sensibilidade do swipe"
          value={settings.swipeSensitivity}
          onChange={(v) => onChange({ swipeSensitivity: v })}
        />
        <Toggle
          label="Vibração"
          hint="Só em celulares compatíveis"
          on={settings.vibration}
          onChange={(v) => onChange({ vibration: v })}
        />
      </div>

      <h3 className="lrs-display mt-5 text-lg font-bold text-[var(--lrs-gold)]">Tela</h3>
      <div className="mt-2">
        <Toggle
          label="Reduzir efeitos"
          hint="Menos tremida de câmera e brilhos — ajuda em aparelhos lentos"
          on={settings.reduceFx}
          onChange={(v) => onChange({ reduceFx: v })}
        />
      </div>

      <h3 className="lrs-display mt-5 text-lg font-bold text-[var(--lrs-pink)]">Progresso</h3>
      {confirming ? (
        <div className="mt-2 rounded-xl border-2 border-[var(--lrs-pink)] bg-black/30 p-3">
          <p className="text-sm text-white/80">
            Isso apaga moedas, recorde, itens especiais e skins liberadas. Tem certeza?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
              className="lrs-btn rounded-xl bg-[var(--lrs-pink)] py-2 text-sm text-white"
            >
              Apagar tudo
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="lrs-btn rounded-xl bg-[var(--lrs-surface2)] py-2 text-sm text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="lrs-btn mt-2 w-full rounded-xl bg-[var(--lrs-surface2)] py-2 text-sm text-white"
        >
          Restaurar progresso
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="lrs-btn mt-6 w-full rounded-2xl bg-[var(--lrs-pink)] py-3 text-lg text-white"
      >
        Voltar
      </button>

      <p className="lrs-nums mt-4 text-center text-[10px] tracking-wider text-white/35 uppercase">
        Luiza Run Surfs · versão {GAME_VERSION}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Missões diárias
// ---------------------------------------------------------------------------

export function Missions({
  missoes,
  progresso,
  onClose,
}: {
  missoes: Mission[];
  progresso: MissionProgress;
  onClose: () => void;
}) {
  const prontas = missoes.filter((m) => estaConcluida(m, progresso)).length;
  return (
    <div className="lrs-panel lrs-rise max-h-full w-full max-w-md overflow-y-auto rounded-3xl p-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Voltar"
          onClick={onClose}
          className="lrs-btn shrink-0 rounded-xl bg-[var(--lrs-surface2)] px-3 py-2 text-lg leading-none text-white"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="lrs-display text-3xl font-extrabold text-[var(--lrs-lime)]">Missões do dia</h2>
          <p className="text-xs text-white/60">
            Trocam todo dia à meia-noite · {prontas}/{missoes.length} concluídas
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {missoes.map((m) => {
          const feito = Math.min(progresso.feito[m.id] ?? 0, m.alvo);
          const ok = estaConcluida(m, progresso);
          const pct = Math.round((feito / m.alvo) * 100);
          return (
            <div
              key={m.id}
              className="rounded-2xl border-2 px-3 py-2.5"
              style={{
                borderColor: ok ? "var(--lrs-lime)" : "var(--lrs-ink)",
                background: ok ? "rgba(60,232,122,0.12)" : "rgba(0,0,0,0.25)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{ok ? "✅" : m.icone}</span>
                <span className="flex-1 text-sm text-white">{m.texto}</span>
                <span className="lrs-nums lrs-display shrink-0 text-sm font-bold text-[var(--lrs-gold)]">
                  🪙 {m.recompensa.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-[var(--lrs-ink)] bg-black/45">
                <div
                  className="h-full transition-[width] duration-300"
                  style={{ width: `${pct}%`, background: ok ? "var(--lrs-lime)" : "var(--lrs-cyan)" }}
                />
              </div>
              <div className="lrs-nums mt-1 text-right text-[10px] text-white/50">
                {ok
                  ? "recompensa paga"
                  : `${feito.toLocaleString("pt-BR")} / ${m.alvo.toLocaleString("pt-BR")}`}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="lrs-btn mt-6 w-full rounded-2xl bg-[var(--lrs-pink)] py-3 text-lg text-white"
      >
        Voltar
      </button>
    </div>
  );
}
