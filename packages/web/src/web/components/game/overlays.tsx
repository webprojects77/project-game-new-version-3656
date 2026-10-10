import { useEffect, useRef, useState } from "react";
import type { AdminFlags, DebugInfo, GameOverPayload, ObstacleType } from "../../game/engine3d";
import type { PowerKind } from "../../game/powerups";
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
  vibration: boolean;
  reduceFx: boolean;
  /** tamanho dos botões na tela (1 = padrão) */
  btnScale: number;
  /** altura dos botões: 0 = rente ao rodapé, 1 = no meio da tela */
  btnBottom: number;
  /** largura que a fileira de botões ocupa: 1 = tela toda, 0.4 = bem juntinhos */
  btnSpread: number;
}

/** Estilo da fileira de botões na tela, a partir das configurações do jogador. */
export function estiloBotoes(s: GameSettings) {
  const margem = (1 - s.btnSpread) * 50; // % de cada lado
  return {
    caixa: {
      left: `${margem}%`,
      right: `${margem}%`,
      bottom: `calc(1rem + ${s.btnBottom * 38}vh)`,
    } as React.CSSProperties,
    botao: {
      fontSize: `${1.25 * s.btnScale}rem`,
      paddingTop: `${0.75 * s.btnScale}rem`,
      paddingBottom: `${0.75 * s.btnScale}rem`,
    } as React.CSSProperties,
  };
}

// ---------------------------------------------------------------------------
// Regras da conta (nome e senha)
// ---------------------------------------------------------------------------

/** quanto custa, em moedas, trocar o apelido depois de criar a conta */
export const NOME_CUSTO = 20_000;
export const NOME_MIN = 4;
export const NOME_MAX = 8;
/** só pode trocar o nome uma vez por mês */
export const NOME_ESPERA_MS = 30 * 24 * 60 * 60 * 1000;
export const SENHA_MIN = 4;

/**
 * Confere as regras do apelido: sem espaços, só letras e números,
 * de 4 a 8 caracteres. Devolve o erro em texto ou null quando está tudo certo.
 */
export function validarNome(nome: string, minimo = NOME_MIN): string | null {
  if (!nome) return "Escreva um apelido.";
  if (/\s/.test(nome)) return "O apelido não pode ter espaços.";
  if (!/^[0-9A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(nome)) return "Use só letras e números.";
  if (nome.length < minimo) return `Precisa de pelo menos ${minimo} caracteres.`;
  if (nome.length > NOME_MAX) return `No máximo ${NOME_MAX} caracteres.`;
  return null;
}

/** Quantos dias ainda faltam para poder trocar o apelido de novo. */
export function diasParaTrocarNome(ultimaTroca: number | null): number {
  if (!ultimaTroca) return 0;
  const falta = ultimaTroca + NOME_ESPERA_MS - Date.now();
  return falta <= 0 ? 0 : Math.ceil(falta / (24 * 60 * 60 * 1000));
}

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(18,6,34,0.72)] p-4 backdrop-blur-[3px]">
      {children}
    </div>
  );
}

/**
 * Criação da conta: apelido + senha. Aparece antes do menu, na primeira vez.
 *
 * Detalhe escondido: clicar 5 vezes seguidas no botão "Confirmar" abre o campo
 * "Chave de acesso". Com ele aberto o mínimo de caracteres do apelido cai para
 * 3, que é o caminho da conta admin ("adm").
 */
export function NameGate({
  modoInicial = "criar",
  contas = [],
  contaAtiva = "",
  onConfirm,
  onEntrar,
  onCancel,
}: {
  modoInicial?: "criar" | "entrar";
  /** apelidos das contas já salvas neste aparelho */
  contas?: string[];
  contaAtiva?: string;
  onConfirm: (nome: string, senha: string, chave: string) => string | null;
  /** entrar numa conta existente: devolve null se deu certo, ou o erro */
  onEntrar: (nome: string, senha: string) => string | null;
  onCancel?: () => void;
}) {
  const [modo, setModo] = useState<"criar" | "entrar">(modoInicial);
  const [nome, setNome] = useState(modoInicial === "entrar" ? contaAtiva : "");
  const [senha, setSenha] = useState("");
  const [chave, setChave] = useState("");
  const [modoChave, setModoChave] = useState(false);
  const [cliques, setCliques] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const limpo = nome.trim();
  const minimo = modoChave ? 3 : NOME_MIN;

  function trocarModo(m: "criar" | "entrar") {
    setModo(m);
    setErro(null);
    setSenha("");
    setCliques(0);
    setModoChave(false);
    setNome(m === "entrar" ? contaAtiva : "");
  }

  function confirmar() {
    if (modo === "entrar") {
      if (!limpo) return setErro("Digite o apelido da conta.");
      if (!senha) return setErro("Digite a senha da conta.");
      setErro(onEntrar(limpo, senha));
      return;
    }
    // contador do atalho escondido: 5 cliques no Confirmar abrem a chave
    const n = cliques + 1;
    setCliques(n);
    if (n >= 5 && !modoChave) {
      setModoChave(true);
      setErro("Campo de chave de acesso liberado.");
      return;
    }
    const problema = validarNome(limpo, minimo);
    if (problema) {
      setErro(problema);
      return;
    }
    if (senha.length < SENHA_MIN) {
      setErro(`A senha precisa de pelo menos ${SENHA_MIN} caracteres.`);
      return;
    }
    setErro(onConfirm(limpo, senha, chave.trim()));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        confirmar();
      }}
      className="lrs-panel lrs-pop w-full max-w-sm rounded-3xl p-6 text-center"
    >
      <div className="grid grid-cols-2 gap-2">
        {(["criar", "entrar"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => trocarModo(m)}
            className={`lrs-btn rounded-xl py-2 text-sm ${
              modo === m
                ? "bg-[var(--lrs-cyan)] text-[var(--lrs-ink)]"
                : "bg-[var(--lrs-surface2)] text-white/80"
            }`}
          >
            {m === "criar" ? "Criar conta" : "Entrar"}
          </button>
        ))}
      </div>

      <h2 className="lrs-display mt-4 text-3xl font-extrabold text-[var(--lrs-cyan)]">
        {modo === "criar" ? "Criar sua conta" : "Entrar na conta"}
      </h2>
      <p className="mt-2 text-sm text-white/65">
        {modo === "criar"
          ? "O apelido e a senha identificam seu progresso neste aparelho. O placar online usa sua conta Google."
          : "Volte para uma conta que você já criou: moedas, recorde e skins voltam junto."}
      </p>

      {modo === "entrar" && contas.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {contas.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setNome(c);
                setErro(null);
              }}
              className={`lrs-btn rounded-full px-3 py-1 text-xs ${
                c.toLowerCase() === limpo.toLowerCase()
                  ? "bg-[var(--lrs-lime)] text-[var(--lrs-ink)]"
                  : "bg-[var(--lrs-surface2)] text-white/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <input
        aria-label="Apelido"
        value={nome}
        maxLength={NOME_MAX}
        onChange={(e) => {
          setNome(e.target.value);
          setErro(null);
        }}
        placeholder="Apelido"
        className="lrs-display mt-4 w-full rounded-2xl border-2 border-[var(--lrs-ink)] bg-black/30 px-4 py-3 text-center text-2xl text-white outline-none placeholder:text-white/30"
      />
      {modo === "criar" && (
        <p className="mt-1 text-[11px] text-white/45">
          Sem espaços, só letras e números, de {NOME_MIN} a {NOME_MAX} caracteres.
        </p>
      )}

      <input
        type="password"
        aria-label="Senha"
        value={senha}
        maxLength={16}
        onChange={(e) => {
          setSenha(e.target.value);
          setErro(null);
        }}
        placeholder="Senha"
        className="lrs-display mt-3 w-full rounded-2xl border-2 border-[var(--lrs-ink)] bg-black/30 px-4 py-3 text-center text-xl text-white outline-none placeholder:text-white/30"
      />
      {modo === "criar" && (
        <p className="mt-1 text-[11px] text-white/45">Guarde bem: ela é pedida para entrar de novo na conta.</p>
      )}

      {modo === "criar" && modoChave && (
        <input
          type="password"
          aria-label="Chave de acesso"
          value={chave}
          maxLength={16}
          onChange={(e) => {
            setChave(e.target.value);
            setErro(null);
          }}
          placeholder="Chave de acesso"
          className="lrs-display mt-3 w-full rounded-2xl border-2 border-[var(--lrs-lime)] bg-black/30 px-4 py-3 text-center text-xl text-[var(--lrs-lime)] outline-none placeholder:text-[var(--lrs-lime)]/40"
        />
      )}

      <button
        type="submit"
        className="lrs-btn mt-4 w-full rounded-2xl bg-[var(--lrs-pink)] py-3 text-xl text-white"
      >
        {modo === "criar" ? "Confirmar" : "Entrar"}
      </button>
      {erro && <p className="mt-2 text-[12px] text-[var(--lrs-gold)]">{erro}</p>}
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
  conta,
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
  /** conta Google usada no placar global */
  conta: ContaOnline;
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
          trocar de conta
        </button>
      </div>
      {/* estado da conta online: sem ela o recorde não vai para o placar global */}
      <div className="mt-2 flex items-center justify-center gap-2 text-xs">
        {conta.logada ? (
          <>
            <Foto url={conta.avatar} nome={conta.nome ?? "?"} />
            <span className="text-[var(--lrs-lime)]">Conta Google: {conta.nome}</span>
          </>
        ) : (
          <button type="button" onClick={conta.entrar} className="text-white/55 underline">
            Entrar com Google para aparecer no placar
          </button>
        )}
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
    ["💚 Coração verde", "recupera 1 vida (raro!)"],
    ["⚡ Boost", "5s de velocidade e pontos em dobro (não protege de batida)"],
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
      <p className="mt-5 text-sm text-white/70">
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

export function Paused({
  onResume,
  onMenu,
  onAdmin,
}: {
  onResume: () => void;
  onMenu: () => void;
  /** só existe na conta admin: abre o painel sem sair da partida */
  onAdmin?: () => void;
}) {
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
        {onAdmin && (
          <button
            type="button"
            onClick={onAdmin}
            className="lrs-btn rounded-2xl border border-[var(--lrs-lime)]/60 bg-[var(--lrs-surface2)] py-3 text-sm font-bold tracking-wide text-[var(--lrs-lime)]"
          >
            Painel admin
          </button>
        )}
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

/** Como terminou o envio da corrida para o placar global. */
export type SubmitState = "sending" | "record" | "kept" | "error" | "deslogado" | "teste";

export function GameOver({
  result,
  best,
  isNewBest,
  coinTotal,
  playerName,
  submitState,
  onEntrar,
  onRestart,
  onMenu,
  onSkins,
}: {
  result: GameOverPayload;
  best: number;
  isNewBest: boolean;
  coinTotal: number;
  playerName: string;
  submitState: SubmitState;
  /** abre o login do Google quando a corrida não pôde entrar no placar */
  onEntrar: () => void;
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
          : submitState === "deslogado"
            ? "Entre com Google antes da próxima corrida para participar do placar global."
            : submitState === "teste"
              ? "Corrida administrativa: salva apenas neste aparelho, fora do placar global."
              : "Resultado não enviado: confira a conexão ou as regras do placar.";
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
        {submitState === "deslogado" && <BotaoGoogle onClick={onEntrar} />}
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
  /** Nome + identificador da linha: diferencia contas com nomes iguais. */
  displayName?: string;
  score: number;
  distance: number;
  skin?: string | null;
  /** id da conta Google dona da linha */
  playerKey?: string;
  /** foto da conta Google */
  avatar?: string | null;
}

/** Estado da conta Google usada para entrar no placar global. */
export interface ContaOnline {
  logada: boolean;
  carregando: boolean;
  nome: string | null;
  avatar: string | null;
  id: string | null;
  entrar: () => void;
  sair: () => void;
}

function skinName(key: string | null | undefined) {
  return SKINS.find((s) => s.key === key)?.name ?? "Luiza Clássica";
}

/** Foto da conta Google; sem foto, mostra a primeira letra do nome. */
function Foto({ url, nome }: { url?: string | null; nome: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        className="h-8 w-8 shrink-0 rounded-full border-2 border-[var(--lrs-ink)] object-cover"
      />
    );
  }
  return (
    <span className="lrs-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--lrs-ink)] bg-[var(--lrs-surface2)] text-sm font-bold text-white/80">
      {nome.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Botão de login com a marca do Google. */
export function BotaoGoogle({
  onClick,
  carregando,
  texto = "Entrar com Google",
}: {
  onClick: () => void;
  carregando?: boolean;
  texto?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className="lrs-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-base font-bold text-[#1f1f1f] disabled:opacity-60"
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
        <path
          fill="#EA4335"
          d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.3 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.6c-.3 2.1-1.6 5.2-4.6 7.3l7.6 5.9c4.4-4.1 6.5-10.1 6.5-17.2z"
        />
        <path
          fill="#FBBC05"
          d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.8-6.1z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2 1.4-4.7 2.4-7.7 2.4-6.4 0-11.8-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
        />
      </svg>
      {carregando ? "Carregando..." : texto}
    </button>
  );
}

/** Cartão no topo do ranking global com o estado da conta Google. */
function ContaBox({ conta }: { conta: ContaOnline }) {
  if (conta.logada) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-[var(--lrs-lime)]/50 bg-[rgba(163,230,53,0.1)] px-3 py-2">
        <Foto url={conta.avatar} nome={conta.nome ?? "?"} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-white">{conta.nome}</div>
          <div className="text-[10px] text-[var(--lrs-lime)]">
            Conectada — seus recordes entram no placar
          </div>
        </div>
        <button
          type="button"
          onClick={conta.sair}
          className="lrs-btn rounded-xl bg-[var(--lrs-surface2)] px-3 py-1.5 text-xs text-white/80"
        >
          Sair
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border-2 border-[var(--lrs-ink)] bg-black/25 p-3">
      <p className="mb-2 text-xs text-white/70">
        O placar global é só para contas Google. Entre para salvar seus recordes online — o progresso
        deste aparelho continua salvo do mesmo jeito.
      </p>
      <BotaoGoogle onClick={conta.entrar} carregando={conta.carregando} />
    </div>
  );
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
  conta,
  onClose,
}: {
  rows: GlobalRow[] | undefined;
  loading: boolean;
  localRuns: LocalRun[];
  /** conta Google: sem ela o resultado não entra no placar global */
  conta: ContaOnline;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"local" | "global">("global");
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
          <ContaBox conta={conta} />
          <p className="pt-1 text-xs text-white/55">Melhor recorde de cada conta Google</p>
          {loading && <div className="text-sm text-white/60">Carregando...</div>}
          {!loading && (!rows || rows.length === 0) && (
            <RankingVazio texto="Ninguém no ranking ainda. Seja a primeira a subir no pódio!" />
          )}
          {rows?.map((row, i) => {
            // Sem sessão, não associa uma conta Google a um apelido local igual.
            const isMe = !!conta.id && row.playerKey === conta.id;
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
                <Foto url={row.avatar} nome={row.player} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">{row.displayName ?? `${row.player} #${row.id}`}</div>
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
  admin: "Admin",
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

    </div>
  );
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

/**
 * Slider de 0 a 100%.
 *
 * Quando `disabled` fica ligado (caso do "Mudo"), o valor mostrado desliza
 * animado até 0% e o controle trava; ao destravar, ele desliza de volta para o
 * valor que estava guardado.
 */
function Slider({
  label,
  value,
  onChange,
  disabled = false,
  min = 0,
  max = 100,
  formato,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  formato?: (v: number) => string;
}) {
  const alvo = disabled ? 0 : Math.round(value * 100);
  // valor que aparece na tela: persegue o alvo quadro a quadro (animação)
  const [mostrado, setMostrado] = useState(alvo);
  const mostradoRef = useRef(mostrado);
  mostradoRef.current = mostrado;

  useEffect(() => {
    if (mostradoRef.current === alvo) return;
    let raf = 0;
    const passo = () => {
      const atual = mostradoRef.current;
      const delta = alvo - atual;
      // chega perto o bastante: encaixa no alvo e para
      if (Math.abs(delta) <= 1) {
        setMostrado(alvo);
        return;
      }
      const proximo = atual + delta * 0.22;
      mostradoRef.current = proximo;
      setMostrado(proximo);
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo]);

  const inteiro = Math.round(mostrado);
  return (
    <div className={`block ${disabled ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-sm text-white/80">
        <span>{label}</span>
        <span className="lrs-nums text-white/50">
          {formato ? formato(inteiro) : `${inteiro}%`}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={inteiro}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-1 h-2 w-full appearance-none rounded-full bg-black/40 accent-[var(--lrs-pink)] disabled:cursor-not-allowed"
      />
    </div>
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
  coins,
  admin,
  ultimaTrocaNome,
  onSaveName,
  onChange,
  onReset,
  onRestaurar,
  onOpenButtons,
  onOpenAdmin,
  onClose,
}: {
  settings: GameSettings;
  playerName: string;
  coins: number;
  admin: boolean;
  /** quando o apelido foi trocado pela última vez (null = nunca) */
  ultimaTrocaNome: number | null;
  /** devolve null quando deu certo, ou a mensagem de erro */
  onSaveName: (nome: string) => string | null;
  onChange: (next: Partial<GameSettings>) => void;
  /** devolve null quando apagou, ou a mensagem de erro (senha errada) */
  onReset: (senha: string) => string | null;
  /** abre a tela de entrar numa conta já criada (nada é apagado) */
  onRestaurar: () => void;
  onOpenButtons: () => void;
  onOpenAdmin?: () => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [senhaReset, setSenhaReset] = useState("");
  const [erroReset, setErroReset] = useState<string | null>(null);
  const [nome, setNome] = useState(playerName);
  const [recado, setRecado] = useState<{ ok: boolean; texto: string } | null>(null);

  const nomeLimpo = nome.trim();
  const mudou = nomeLimpo.length > 0 && nomeLimpo !== playerName;
  const diasFalta = admin ? 0 : diasParaTrocarNome(ultimaTrocaNome);
  const temMoeda = admin || coins >= NOME_CUSTO;

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
            aria-label="Apelido no ranking"
            value={nome}
            maxLength={NOME_MAX}
            onChange={(e) => {
              setNome(e.target.value);
              setRecado(null);
            }}
            className="lrs-display min-w-0 flex-1 rounded-xl border-2 border-[var(--lrs-ink)] bg-black/30 px-3 py-2 text-lg text-white outline-none placeholder:text-white/30"
            placeholder="Ex.: Luiza"
          />
          <button
            type="button"
            disabled={!mudou}
            onClick={() => {
              const erro = onSaveName(nomeLimpo);
              setRecado(
                erro
                  ? { ok: false, texto: erro }
                  : { ok: true, texto: "Apelido trocado ✓" },
              );
            }}
            className="lrs-btn shrink-0 rounded-xl bg-[var(--lrs-lime)] px-4 py-2 text-sm font-bold text-[var(--lrs-ink)] disabled:opacity-40"
          >
            Trocar
          </button>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">
          {recado ? (
            <span style={{ color: recado.ok ? "var(--lrs-lime)" : "var(--lrs-gold)" }}>
              {recado.texto}
            </span>
          ) : (
            <>
              Sem espaços, só letras e números, de {NOME_MIN} a {NOME_MAX} caracteres.
              <br />
              Custa{" "}
              <strong className={temMoeda ? "text-[var(--lrs-gold)]" : "text-[var(--lrs-pink)]"}>
                {NOME_CUSTO.toLocaleString("pt-BR")} moedas
              </strong>{" "}
              e só pode 1 vez por mês.
              {admin
                ? " Conta admin: sem custo e sem espera."
                : diasFalta > 0
                  ? ` Faltam ${diasFalta} dia(s) para poder trocar de novo.`
                  : ""}
            </>
          )}
        </p>
        {admin && (
          <div className="mt-2 rounded-xl border-2 border-[var(--lrs-lime)] bg-black/30 px-3 py-2">
            <div className="text-[11px] font-bold tracking-wider text-[var(--lrs-lime)] uppercase">
              Conta admin ativa
            </div>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="lrs-btn mt-2 w-full rounded-xl bg-[var(--lrs-lime)] py-2 text-sm font-bold text-[var(--lrs-ink)]"
              >
                Abrir painel admin
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="lrs-display mt-4 text-lg font-bold text-[var(--lrs-gold)]">Som</h3>
      <div className="mt-2 space-y-3">
        <Slider
          label="Música"
          value={settings.musicVolume}
          disabled={settings.muted}
          onChange={(v) => onChange({ musicVolume: v })}
        />
        <Slider
          label="Efeitos"
          value={settings.sfxVolume}
          disabled={settings.muted}
          onChange={(v) => onChange({ sfxVolume: v })}
        />
        <Toggle
          label="Mudo"
          hint="Com o mudo ligado os volumes vão a 0% e ficam travados"
          on={settings.muted}
          onChange={(v) => onChange({ muted: v })}
        />
      </div>

      <h3 className="lrs-display mt-5 text-lg font-bold text-[var(--lrs-gold)]">Controles</h3>
      <div className="mt-2 space-y-3">
        <Toggle
          label="Botões na tela"
          hint="Mostra as setas de toque além do swipe"
          on={settings.onScreenButtons}
          onChange={(v) => onChange({ onScreenButtons: v })}
        />
        <button
          type="button"
          onClick={onOpenButtons}
          className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-[var(--lrs-ink)] bg-black/25 px-3 py-2 text-left"
        >
          <span>
            <span className="block text-sm text-white">Organizar botões</span>
            <span className="block text-[11px] text-white/45">
              Mudar o tamanho e a posição das setas na tela
            </span>
          </span>
          <span className="shrink-0 text-lg text-white/60">›</span>
        </button>
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
            Isso zera moedas, recorde, itens especiais e skins liberadas <strong>desta conta</strong> (o
            apelido e a senha continuam). Digite a senha da conta para confirmar.
          </p>
          <input
            type="password"
            aria-label="Senha da conta para zerar o progresso"
            value={senhaReset}
            maxLength={16}
            onChange={(e) => {
              setSenhaReset(e.target.value);
              setErroReset(null);
            }}
            placeholder="Senha da conta"
            className="lrs-display mt-2 w-full rounded-xl border-2 border-[var(--lrs-ink)] bg-black/30 px-3 py-2 text-center text-lg text-white outline-none placeholder:text-white/30"
          />
          {erroReset && <p className="mt-1 text-[12px] text-[var(--lrs-gold)]">{erroReset}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const erro = onReset(senhaReset);
                if (erro) {
                  setErroReset(erro);
                  return;
                }
                setSenhaReset("");
                setConfirming(false);
              }}
              className="lrs-btn rounded-xl bg-[var(--lrs-pink)] py-2 text-sm text-white"
            >
              Apagar tudo
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setSenhaReset("");
                setErroReset(null);
              }}
              className="lrs-btn rounded-xl bg-[var(--lrs-surface2)] py-2 text-sm text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={onRestaurar}
            className="lrs-btn w-full rounded-xl bg-[var(--lrs-cyan)] py-2.5 text-sm text-[var(--lrs-ink)]"
          >
            Restaurar conta (entrar com apelido e senha)
          </button>
          <p className="text-[11px] text-white/45">
            Volta para uma conta que você já criou neste aparelho, com todo o progresso dela. A conta atual
            fica salva.
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="lrs-btn w-full rounded-xl border border-[var(--lrs-pink)]/60 bg-[var(--lrs-surface2)] py-2 text-xs text-[var(--lrs-pink)]"
          >
            Zerar progresso desta conta
          </button>
        </div>
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
// Organizar botões da tela
// ---------------------------------------------------------------------------

/**
 * Editor da fileira de botões: os botões de verdade continuam aparecendo no
 * rodapé enquanto os controles são mexidos, então dá para ver o resultado na
 * hora.
 */
export function ButtonLayout({
  settings,
  onChange,
  onClose,
}: {
  settings: GameSettings;
  onChange: (next: Partial<GameSettings>) => void;
  onClose: () => void;
}) {
  return (
    <div className="lrs-panel lrs-rise w-full max-w-md rounded-3xl p-6">
      <h2 className="lrs-display text-2xl font-extrabold text-[var(--lrs-cyan)]">Organizar botões</h2>
      <p className="mt-1 text-xs text-white/60">
        As setas aí embaixo mudam junto — deixe do tamanho e no lugar que a sua mão alcança melhor.
      </p>

      <div className="mt-4 space-y-4">
        <Slider
          label="Tamanho"
          value={settings.btnScale / 2}
          min={30}
          max={90}
          formato={(v) => `${Math.round(v * 2)}%`}
          onChange={(v) => onChange({ btnScale: Math.min(1.8, Math.max(0.6, v * 2)) })}
        />
        <Slider
          label="Altura na tela"
          value={settings.btnBottom}
          formato={(v) => (v < 5 ? "rodapé" : `${v}% acima`)}
          onChange={(v) => onChange({ btnBottom: v })}
        />
        <Slider
          label="Largura da fileira"
          value={settings.btnSpread}
          min={40}
          max={100}
          onChange={(v) => onChange({ btnSpread: Math.max(0.4, v) })}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ btnScale: 1, btnBottom: 0, btnSpread: 1 })}
          className="lrs-btn rounded-xl bg-[var(--lrs-surface2)] py-2 text-sm text-white"
        >
          Voltar ao padrão
        </button>
        <button
          type="button"
          onClick={onClose}
          className="lrs-btn rounded-xl bg-[var(--lrs-pink)] py-2 text-sm text-white"
        >
          Pronto
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conta admin
// ---------------------------------------------------------------------------

/** Botãozinho quadrado usado no painel admin. */
function AdminBtn({
  children,
  on,
  onClick,
}: {
  children: React.ReactNode;
  on?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lrs-btn rounded-xl border-2 border-[var(--lrs-ink)] px-2 py-2 text-[11px] leading-tight font-bold"
      style={{
        background: on ? "var(--lrs-lime)" : "rgba(0,0,0,0.3)",
        color: on ? "var(--lrs-ink)" : "#fff",
      }}
    >
      {children}
    </button>
  );
}

function AdminTitulo({ texto }: { texto: string }) {
  return (
    <h3 className="lrs-display mt-4 text-sm font-bold tracking-wider text-[var(--lrs-lime)] uppercase">
      {texto}
    </h3>
  );
}

/**
 * Painel de poderes da conta admin. Só a conta "adm" chega aqui, e ele fala
 * direto com os métodos admin do motor 3D.
 */
export function AdminPanel({
  flags,
  debug,
  areas,
  jogando,
  onFlags,
  onMoedas,
  onSpawnObstaculo,
  onSpawnPower,
  onLimparPista,
  onIrParaBioma,
  onTeleporte,
  onMover,
  onDesbloquearTudo,
  onResetProgresso,
  onReiniciarSeed,
  onClose,
}: {
  flags: AdminFlags;
  debug: DebugInfo | null;
  areas: string[];
  jogando: boolean;
  onFlags: (next: Partial<AdminFlags>) => void;
  onMoedas: (quanto: number) => void;
  onSpawnObstaculo: (tipo: ObstacleType) => void;
  onSpawnPower: (kind?: PowerKind) => void;
  onLimparPista: () => void;
  onIrParaBioma: (idx: number) => void;
  onTeleporte: (lane: number) => void;
  onMover: (eixo: "x" | "y" | "z", passo: number) => void;
  onDesbloquearTudo: () => void;
  onResetProgresso: () => void;
  onReiniciarSeed: (seed: number) => void;
  onClose: () => void;
}) {
  const obstaculos: [ObstacleType, string][] = [
    ["low", "Baixo"],
    ["high", "Alto"],
    ["block", "Bloco"],
    ["ride", "Rampa"],
  ];
  const poderes: PowerKind[] = ["iman", "escudo", "x2", "pulo", "turbo", "fuga", "fantasma", "chance"];

  return (
    <div className="lrs-panel lrs-rise max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border-[3px] border-[var(--lrs-lime)] p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="lrs-display text-2xl font-extrabold text-[var(--lrs-lime)]">Painel admin</h2>
          <p className="text-[11px] text-white/55">
            {jogando ? "Partida em andamento — tudo vale na hora." : "Comece uma partida para usar os poderes de pista."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lrs-btn shrink-0 rounded-xl bg-[var(--lrs-surface2)] px-3 py-2 text-sm text-white"
        >
          Fechar
        </button>
      </div>

      {/* ---- overlay de debug ---- */}
      <AdminTitulo texto="Debug" />
      <div className="lrs-nums mt-1 grid grid-cols-3 gap-1 rounded-xl border-2 border-[var(--lrs-ink)] bg-black/35 p-2 text-[11px] text-white/75">
        <span>FPS {debug?.fps ?? "—"}</span>
        <span>X {debug?.x ?? "—"}</span>
        <span>Y {debug?.y ?? "—"}</span>
        <span>Faixa {debug?.lane ?? "—"}</span>
        <span>{debug?.speed ?? "—"} km/h</span>
        <span>{debug?.distance ?? "—"} m</span>
        <span>Obst. {debug?.obstacles ?? "—"}</span>
        <span>Itens {debug?.items ?? "—"}</span>
        <span className="truncate">{debug?.area ?? "—"}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="lrs-nums min-w-0 flex-1 truncate text-[11px] text-white/75" data-testid="admin-seed">
          Seed {debug ? debug.seed : "—"}
        </span>
        <button
          type="button"
          disabled={!jogando || !debug}
          onClick={() => debug && onReiniciarSeed(debug.seed)}
          className="lrs-btn shrink-0 rounded-xl border-2 border-[var(--lrs-ink)] bg-[var(--lrs-lime)] px-3 py-2 text-[11px] font-bold text-[var(--lrs-ink)] disabled:opacity-40"
        >
          Reiniciar com a mesma seed
        </button>
      </div>

      {/* ---- economia e progresso ---- */}
      <AdminTitulo texto="Economia e progresso" />
      <div className="mt-1 grid grid-cols-3 gap-2">
        <AdminBtn onClick={() => onMoedas(100_000)}>+100 mil moedas</AdminBtn>
        <AdminBtn onClick={() => onMoedas(1_000_000)}>+1 milhão</AdminBtn>
        <AdminBtn onClick={onDesbloquearTudo}>Liberar tudo</AdminBtn>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {[1, 2, 5, 20].map((m) => (
          <AdminBtn key={m} on={flags.multiplier === m} onClick={() => onFlags({ multiplier: m })}>
            Pontos x{m}
          </AdminBtn>
        ))}
      </div>
      <button
        type="button"
        onClick={onResetProgresso}
        className="lrs-btn mt-2 w-full rounded-xl bg-[var(--lrs-surface2)] py-2 text-[11px] text-white"
      >
        Zerar progresso desta conta
      </button>

      {/* ---- controle da partida ---- */}
      <AdminTitulo texto="Partida" />
      <div className="mt-1 grid grid-cols-3 gap-2">
        <AdminBtn on={flags.god} onClick={() => onFlags({ god: !flags.god })}>
          God mode
        </AdminBtn>
        <AdminBtn on={flags.invuln} onClick={() => onFlags({ invuln: !flags.invuln })}>
          Invencível
        </AdminBtn>
        <AdminBtn on={flags.hitbox} onClick={() => onFlags({ hitbox: !flags.hitbox })}>
          Hitboxes
        </AdminBtn>
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-[11px] text-white/70">
          <span>Velocidade do jogo</span>
          <span className="lrs-nums">{flags.timeScale.toFixed(1)}x</span>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-2">
          {[0.2, 0.5, 1, 2, 3].map((t) => (
            <AdminBtn key={t} on={flags.timeScale === t} onClick={() => onFlags({ timeScale: t })}>
              {t}x
            </AdminBtn>
          ))}
        </div>
      </div>

      {/* ---- spawn ---- */}
      <AdminTitulo texto="Spawnar na pista" />
      <div className="mt-1 grid grid-cols-4 gap-2">
        {obstaculos.map(([tipo, nome]) => (
          <AdminBtn key={tipo} onClick={() => onSpawnObstaculo(tipo)}>
            {nome}
          </AdminBtn>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {poderes.map((p) => (
          <AdminBtn key={p} onClick={() => onSpawnPower(p)}>
            {p}
          </AdminBtn>
        ))}
      </div>
      <button
        type="button"
        onClick={onLimparPista}
        className="lrs-btn mt-2 w-full rounded-xl bg-[var(--lrs-surface2)] py-2 text-[11px] text-white"
      >
        Limpar a pista
      </button>

      {/* ---- biomas ---- */}
      <AdminTitulo texto="Pular para a área" />
      <div className="mt-1 grid grid-cols-3 gap-2">
        {areas.map((nome, i) => (
          <AdminBtn key={nome} on={debug?.area === nome} onClick={() => onIrParaBioma(i)}>
            {nome}
          </AdminBtn>
        ))}
      </div>

      {/* ---- câmera e movimentação ---- */}
      <AdminTitulo texto="Câmera e movimentação" />
      <div className="mt-1 grid grid-cols-3 gap-2">
        <AdminBtn on={flags.freeCam} onClick={() => onFlags({ freeCam: !flags.freeCam })}>
          Free cam
        </AdminBtn>
        <AdminBtn on={flags.fly} onClick={() => onFlags({ fly: !flags.fly })}>
          Fly
        </AdminBtn>
        <AdminBtn on={flags.noclip} onClick={() => onFlags({ noclip: !flags.noclip })}>
          Noclip
        </AdminBtn>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <AdminBtn onClick={() => onMover("x", -1)}>◀ X</AdminBtn>
        <AdminBtn onClick={() => onMover("y", 1)}>▲ Y</AdminBtn>
        <AdminBtn onClick={() => onMover("x", 1)}>X ▶</AdminBtn>
        <AdminBtn onClick={() => onMover("z", -1)}>Z ↑</AdminBtn>
        <AdminBtn onClick={() => onMover("y", -1)}>▼ Y</AdminBtn>
        <AdminBtn onClick={() => onMover("z", 1)}>Z ↓</AdminBtn>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((l) => (
          <AdminBtn key={l} onClick={() => onTeleporte(l)}>
            Teleporte faixa {l + 1}
          </AdminBtn>
        ))}
      </div>
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
