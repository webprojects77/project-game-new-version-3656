/**
 * Modelos 3D em arquivo (.glb) usados no jogo.
 *
 * A ideia é simples: cada arquivo é baixado UMA vez quando o jogo abre e
 * depois só clonamos o resultado para cada obstáculo. Clonar é barato porque
 * a malha e a textura continuam sendo as mesmas na memória da placa de vídeo.
 *
 * Todo mesh clonado sai marcado com `userData.compartilhado = true`: é assim
 * que o motor sabe que NÃO deve apagar a geometria/textura quando o obstáculo
 * sai da tela (senão o próximo obstáculo viria vazio).
 *
 * Os arquivos vêm do Meshy com ~100 mil triângulos e textura 2K. Antes de
 * entrar no jogo eles passaram pelo gltf-transform (malha simplificada,
 * textura webp e compressão meshopt), caindo de ~19 MB para ~1,2 MB no total.
 */
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** cada modelo e as medidas que ele tem que ter dentro do jogo */
export type ModeloKey =
  | "cerquinha"
  | "cercaMadeira"
  | "caixas"
  | "cone"
  | "placa"
  | "onibus"
  | "carro"
  | "rampa"
  | "casinha";

interface Receita {
  /** arquivo em /public/models */
  arquivo: string;
  /** largura desejada (eixo X, atravessando a faixa) */
  largura: number;
  /** teto de altura: o que passar disso é reduzido junto */
  alturaMax: number;
  /** giro em Y, em voltas (0.5 = meia volta) — para o modelo olhar a câmera */
  giro?: number;
}

const RECEITAS: Record<ModeloKey, Receita> = {
  // obstáculos de pular (baixos)
  cerquinha: { arquivo: "cerquinha.glb", largura: 2.15, alturaMax: 1.35 },
  cercaMadeira: { arquivo: "cerca-madeira.glb", largura: 2.15, alturaMax: 1.3 },
  cone: { arquivo: "cone.glb", largura: 1.1, alturaMax: 1.25 },
  // a rampa tem que subir de frente pra trás (a Luiza entra pela parte baixa)
  rampa: { arquivo: "rampa.glb", largura: 2.2, alturaMax: 1.6 },
  // obstáculos que bloqueiam a faixa (desviar)
  caixas: { arquivo: "caixas.glb", largura: 2.1, alturaMax: 2.7 },
  // carro e ônibus vêm do Meshy com o comprimento no eixo X: sem o giro de
  // 1/4 de volta eles ficavam de lado e a normalização pela largura os
  // achatava (o ônibus saía menor que uma cerca).
  carro: { arquivo: "carro.glb", largura: 2.15, alturaMax: 2.4, giro: 0.25 },
  onibus: { arquivo: "linha-azul.glb", largura: 2.4, alturaMax: 3.4, giro: 0.25 },
  // obstáculo alto (deslizar)
  placa: { arquivo: "placa.glb", largura: 1.5, alturaMax: 3.2 },
  // cenário de calçada
  casinha: { arquivo: "casinha.glb", largura: 5.2, alturaMax: 5, giro: 0.5 },
};

const prontos = new Map<ModeloKey, THREE.Object3D>();
let carregamento: Promise<void> | null = null;

/**
 * Deixa o modelo utilizável: material que reage à luz da cena, pés no chão
 * (y = 0), centro no meio da faixa e do tamanho pedido pela receita.
 */
function preparar(raiz: THREE.Object3D, r: Receita) {
  // O Meshy exporta metalness 1.0 e a nossa cena não tem mapa de ambiente,
  // então sem isso o modelo ficaria quase preto.
  raiz.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.metalness = Math.min(m.metalness, 0.15);
        m.roughness = Math.max(m.roughness, 0.55);
        m.envMapIntensity = 0.4;
        m.side = THREE.FrontSide;
        m.needsUpdate = true;
      }
    }
    child.castShadow = false;
    child.receiveShadow = false;
  });

  if (r.giro) raiz.rotation.y = r.giro * Math.PI * 2;

  // normaliza a escala pela largura pedida, sem passar da altura máxima
  raiz.updateWorldMatrix(true, true);
  const caixa = new THREE.Box3().setFromObject(raiz);
  const tam = caixa.getSize(new THREE.Vector3());
  const escala = Math.min(r.largura / (tam.x || 1), r.alturaMax / (tam.y || 1));
  raiz.scale.setScalar(escala);

  // recentraliza: pés no chão e centro no meio da faixa
  raiz.updateWorldMatrix(true, true);
  const caixa2 = new THREE.Box3().setFromObject(raiz);
  const centro = caixa2.getCenter(new THREE.Vector3());
  raiz.position.x -= centro.x;
  raiz.position.z -= centro.z;
  raiz.position.y -= caixa2.min.y;

  const suporte = new THREE.Group();
  suporte.add(raiz);
  return suporte;
}

/** Começa a baixar os modelos. Pode ser chamado várias vezes sem problema. */
export function carregarModelos(): Promise<void> {
  if (carregamento) return carregamento;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const tarefas = (Object.entries(RECEITAS) as [ModeloKey, Receita][]).map(
    ([key, r]) =>
      new Promise<void>((resolve) => {
        loader.load(
          `/models/${r.arquivo}`,
          (gltf) => {
            prontos.set(key, preparar(gltf.scene, r));
            resolve();
          },
          undefined,
          // se um arquivo falhar, o jogo segue com a peça desenhada em código
          () => resolve(),
        );
      }),
  );
  carregamento = Promise.all(tarefas).then(() => undefined);
  return carregamento;
}

/** true quando aquele modelo já está pronto para ser usado. */
export function modeloPronto(key: ModeloKey) {
  return prontos.has(key);
}

/**
 * Devolve uma cópia do modelo pronta para entrar na cena, ou `null` se o
 * arquivo ainda não terminou de carregar (aí o motor usa a peça antiga).
 */
export function makeModelo(key: ModeloKey): THREE.Object3D | null {
  const base = prontos.get(key);
  if (!base) return null;
  const copia = base.clone(true);
  copia.traverse((child) => {
    child.userData.compartilhado = true;
  });
  return copia;
}
