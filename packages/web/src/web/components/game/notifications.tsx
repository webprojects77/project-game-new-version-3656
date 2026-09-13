import type { NotifyKind } from "../../game/engine3d";

export interface Toast {
  id: number;
  kind: NotifyKind;
  text: string;
}

const STYLE: Record<NotifyKind, { icon: string; color: string }> = {
  recorde: { icon: "🏆", color: "var(--lrs-gold)" },
  combo: { icon: "🔥", color: "var(--lrs-pink)" },
  especial: { icon: "📸", color: "var(--lrs-cyan)" },
  fase: { icon: "🚩", color: "var(--lrs-lime)" },
  power: { icon: "⚡", color: "var(--lrs-gold)" },
};

/** Avisos que descem do topo da tela e somem sozinhos em ~2,5s. */
export function Notifications({ items }: { items: Toast[] }) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-40 flex flex-col items-center gap-2 px-4 sm:top-28">
      {items.map((t) => {
        const style = STYLE[t.kind];
        return (
          <div
            key={t.id}
            className="lrs-panel lrs-drop flex max-w-xs items-center gap-2 rounded-2xl px-4 py-2"
            style={{ borderColor: style.color }}
          >
            <span className="text-xl leading-none">{style.icon}</span>
            <span className="lrs-display text-sm font-bold" style={{ color: style.color }}>
              {t.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
