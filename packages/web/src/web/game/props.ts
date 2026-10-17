import * as THREE from "three";
import { makeModelo, type ModeloKey } from "./models";
import { PALETTE } from "./palette";
import { rand } from "./visual-random";

export function construirProp(biomeIdx: number): THREE.Object3D {
  const group = new THREE.Group();
  const mat = (color: string, emissive = 0) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: emissive,
      roughness: 0.7,
    });

  const modelado: (ModeloKey | undefined)[] = ["casinha", "cone", "placa", undefined, undefined, undefined];
  const alvo = modelado[biomeIdx];
  if (alvo && Math.random() < 0.6) {
    const peca = makeModelo(alvo);
    if (peca) {
      group.add(peca);
      group.userData.alinhado = true;
      return group;
    }
  }

  switch (biomeIdx) {
    case 0: {
      if (Math.random() < 0.5) {
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
