import { useEffect, useRef, useState } from "react";
import type { HudState } from "../../game/engine3d";

function Heart({ filled, breaking }: { filled: boolean; breaking: boolean }) {
  const fill = filled
    ? "var(--lrs-lime)"
    : breaking
      ? "var(--lrs-locked)"
      : "rgba(255,246,251,0.16)";
  return (
    <span className={breaking ? "lrs-heart-break inline-block" : "inline-block"}>
      <svg viewBox="0 0 24 24" className="h-6 w-6 drop-shadow-[0_2px_0_rgba(16,6,31,0.9)] sm:h-7 sm:w-7">
        <path
          d="M12 20.5C6 16.5 3 13.6 3 10.2 3 7.6 5 5.6 7.5 5.6c1.6 0 3.1.8 4.5 2.6 1.4-1.8 2.9-2.6 4.5-2.6C19 5.6 21 7.6 21 10.2c0 3.4-3 6.3-9 10.3Z"
          fill={fill}
          stroke="var(--lrs-ink)"
          strokeWidth="2"
        />
        {breaking && (
          <path
            d="M12 7.5 10.2 11l2.6 1.4-2 3.4"
            fill="none"
            stroke="var(--lrs-ink)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </span>
  );
}

function copColor(heat: number) {
  if (heat < 0.4) return "var(--lrs-lime)";
  if (heat < 0.75) return "var(--lrs-gold)";
  return "#FF3B3B";
}

export function Hud({
  hud,
  best,
  muted,
  onPause,
  onToggleMute,
}: {
  hud: HudState;
  best: number;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}) {
  const boostPct = hud.boostMax > 0 ? Math.min(100, (hud.boostMs / hud.boostMax) * 100) : 0;
  const copPct = Math.round(Math.min(1, Math.max(0, hud.copHeat)) * 100);

  const prevLives = useRef(hud.lives);
  const [breaking, setBreaking] = useState<number | null>(null);
  useEffect(() => {
    if (hud.lives < prevLives.current) {
      const idx = hud.lives;
      setBreaking(idx);
      const id = window.setTimeout(() => setBreaking((b) => (b === idx ? null : b)), 650);
      prevLives.current = hud.lives;
      return () => window.clearTimeout(id);
    }
    prevLives.current = hud.lives;
  }, [hud.lives]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute top-3 left-3 sm:top-5 sm:left-5">
        <div className="lrs-panel rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
          <div className="lrs-display lrs-nums text-2xl leading-none font-extrabold text-[var(--lrs-gold)] sm:text-4xl">
            {hud.score.toLocaleString("pt-BR")}
          </div>
          <div className="font-body text-[10px] tracking-wider text-white/60 uppercase sm:text-xs">
            {hud.distance} m · recorde {best.toLocaleString("pt-BR")}
          </div>
        </div>
        {hud.combo > 1 && (
          <div className="lrs-display lrs-pulse mt-2 inline-block rounded-xl border-2 border-[var(--lrs-ink)] bg-[rgba(255,201,60,0.18)] px-3 py-1 text-lg font-extrabold text-[var(--lrs-gold)]">
            COMBO x{hud.combo}
          </div>
        )}
      </div>

      <div className="absolute top-3 left-1/2 w-36 -translate-x-1/2 sm:top-5 sm:w-56">
        <div className="lrs-panel rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none sm:text-lg">👮‍♀️</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-[var(--lrs-ink)] bg-black/45">
              <div
                className="h-full transition-[width,background-color] duration-200"
                style={{ width: `${copPct}%`, background: copColor(hud.copHeat) }}
              />
            </div>
          </div>
          <div className="mt-1 text-center font-body text-[9px] tracking-wider text-white/50 uppercase sm:text-[10px]">
            {hud.speedKmh} km/h
          </div>
        </div>
        <div className="mt-1 text-center font-body text-[9px] tracking-[0.18em] text-white/45 uppercase sm:text-[10px]">
          {hud.areaName}
        </div>
      </div>

      <div className="absolute top-3 right-3 flex flex-col items-end gap-2 sm:top-5 sm:right-5">
        <div className="lrs-panel flex items-center gap-1 rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2">
          {[0, 1, 2].map((i) => (
            <Heart key={i} filled={i < hud.lives} breaking={breaking === i} />
          ))}
        </div>
        {hud.shield && (
          <div className="lrs-panel lrs-pulse flex items-center gap-1.5 rounded-2xl px-2.5 py-1 text-xs font-bold text-[var(--lrs-cyan)]">
            🛡️ ESCUDO
          </div>
        )}
        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            aria-label={muted ? "Ligar som" : "Desligar som"}
            onClick={onToggleMute}
            className="lrs-btn rounded-xl bg-[var(--lrs-surface2)] px-3 py-1.5 text-sm text-white"
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            type="button"
            aria-label="Pausar"
            onClick={onPause}
            className="lrs-btn rounded-xl bg-[var(--lrs-cyan)] px-3 py-1.5 text-sm text-[var(--lrs-ink)]"
          >
            ⏸
          </button>
        </div>
      </div>

      {hud.powers.length > 0 && (
        <div className="absolute top-1/2 left-3 flex -translate-y-1/2 flex-col gap-2 sm:left-5">
          {hud.powers.map((p) => {
            const pct = p.max > 0 ? Math.max(0, Math.min(100, (p.ms / p.max) * 100)) : 0;
            return (
              <div
                key={p.key}
                className="lrs-panel flex w-24 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 sm:w-28"
                style={{ borderColor: p.cor }}
              >
                <span className="text-lg leading-none sm:text-xl">{p.icone}</span>
                <span
                  className="lrs-display text-[9px] leading-none font-bold tracking-wider uppercase"
                  style={{ color: p.cor }}
                >
                  {p.nome}
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-[var(--lrs-ink)] bg-black/50">
                  <div className="h-full" style={{ width: `${pct}%`, background: p.cor }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {boostPct > 0 && (
        <div className="absolute bottom-16 left-3 sm:bottom-8 sm:left-5">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="rgba(16,6,31,0.7)" stroke="var(--lrs-ink)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--lrs-gold)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(boostPct / 100) * 94.2} 94.2`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl">⚡</span>
          </div>
        </div>
      )}

      {hud.chance && (
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-5">
          <div
            className="lrs-panel lrs-pulse flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5"
            style={{ borderColor: "var(--lrs-pink)" }}
          >
            <span className="text-lg leading-none">🍀</span>
            <span className="lrs-display text-[9px] leading-tight font-bold tracking-wider text-[var(--lrs-pink)] uppercase">
              Segunda
              <br />
              chance
            </span>
          </div>
        </div>
      )}

      <div className="absolute right-3 bottom-16 flex flex-col items-end gap-1.5 sm:right-5 sm:bottom-8">
        <div className="lrs-panel lrs-nums lrs-display rounded-2xl px-3 py-1.5 text-lg font-bold text-[var(--lrs-gold)]">
          🪙 {hud.coins.toLocaleString("pt-BR")}
        </div>
        {hud.specials > 0 && (
          <div className="lrs-panel lrs-nums lrs-display rounded-2xl px-3 py-1 text-sm font-bold text-[var(--lrs-cyan)]">
            📸 {hud.specials}
          </div>
        )}
      </div>
    </div>
  );
}
