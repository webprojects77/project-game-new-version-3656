import * as THREE from "three";
import { PALETTE } from "./palette";
import type { BodyPalette } from "./skins";

export type CharPose = "run" | "jump" | "slide" | "hit";

function mat(color: string, opts: { rough?: number; emissive?: number } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: opts.rough ?? 0.75,
    metalness: 0.04,
    emissive: new THREE.Color(color),
    emissiveIntensity: opts.emissive ?? 0,
  });
}

function box(w: number, h: number, d: number, m: THREE.Material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
}

export class Humanoid {
  readonly group = new THREE.Group();
  private root = new THREE.Group();
  private hips = new THREE.Group();
  private torso: THREE.Mesh;
  private head: THREE.Group;
  private armL = new THREE.Group();
  private armR = new THREE.Group();
  private legL = new THREE.Group();
  private legR = new THREE.Group();
  private materials: THREE.MeshStandardMaterial[] = [];
  private bodyMats: {
    skin: THREE.MeshStandardMaterial;
    hair: THREE.MeshStandardMaterial;
    shirt: THREE.MeshStandardMaterial;
    shirtAlt: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    shoes: THREE.MeshStandardMaterial;
    detail: THREE.MeshStandardMaterial;
  };

  constructor(palette: BodyPalette, opts: { hat?: boolean; ponytail?: boolean; scale?: number } = {}) {
    const p = palette;
    const track = <T extends THREE.MeshStandardMaterial>(m: T) => {
      this.materials.push(m);
      return m;
    };
    this.bodyMats = {
      skin: track(mat(p.skin)),
      hair: track(mat(p.hair)),
      shirt: track(mat(p.shirt)),
      shirtAlt: track(mat(p.shirtAlt)),
      pants: track(mat(p.pants)),
      shoes: track(mat(p.shoes)),
      detail: track(mat(p.detail, { emissive: 0.25 })),
    };
    const m = this.bodyMats;

    this.torso = box(0.62, 0.72, 0.36, m.shirt);
    this.torso.position.y = 1.16;
    this.hips.add(this.torso);

    const belt = box(0.6, 0.16, 0.36, m.shirtAlt);
    belt.position.y = 0.78;
    this.hips.add(belt);

    const chest = box(0.5, 0.2, 0.38, m.detail);
    chest.position.set(0, 1.3, 0.02);
    this.hips.add(chest);

    this.head = new THREE.Group();
    const skull = box(0.42, 0.42, 0.4, m.skin);
    this.head.add(skull);
    const hairTop = box(0.46, 0.16, 0.44, m.hair);
    hairTop.position.y = 0.21;
    this.head.add(hairTop);
    const hairBack = box(0.44, 0.34, 0.14, m.hair);
    hairBack.position.set(0, 0.02, -0.19);
    this.head.add(hairBack);
    for (const sx of [-1, 1]) {
      const eye = box(0.07, 0.09, 0.04, track(mat(PALETTE.ink)));
      eye.position.set(sx * 0.1, 0.03, 0.21);
      this.head.add(eye);
    }
    if (opts.ponytail !== false) {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 6), m.hair);
      tail.position.set(0, -0.02, -0.32);
      tail.rotation.x = -0.6;
      this.head.add(tail);
    }
    if (opts.hat) {
      const cap = box(0.48, 0.14, 0.46, m.shirtAlt);
      cap.position.y = 0.28;
      this.head.add(cap);
      const brim = box(0.44, 0.07, 0.24, m.shirtAlt);
      brim.position.set(0, 0.22, 0.3);
      this.head.add(brim);
      const badge = box(0.14, 0.1, 0.04, m.detail);
      badge.position.set(0, 0.3, 0.24);
      this.head.add(badge);
    }
    this.head.position.y = 1.73;
    this.hips.add(this.head);

    for (const [pivot, sx] of [
      [this.armL, -1],
      [this.armR, 1],
    ] as const) {
      const upper = box(0.16, 0.42, 0.16, m.shirt);
      upper.position.y = -0.21;
      pivot.add(upper);
      const hand = box(0.17, 0.3, 0.17, m.skin);
      hand.position.y = -0.55;
      pivot.add(hand);
      pivot.position.set(sx * 0.39, 1.44, 0);
      this.hips.add(pivot);
    }

    for (const [pivot, sx] of [
      [this.legL, -1],
      [this.legR, 1],
    ] as const) {
      const thigh = box(0.22, 0.46, 0.22, m.pants);
      thigh.position.y = -0.23;
      pivot.add(thigh);
      const shin = box(0.2, 0.36, 0.2, m.pants);
      shin.position.y = -0.62;
      pivot.add(shin);
      const shoe = box(0.24, 0.16, 0.34, m.shoes);
      shoe.position.set(0, -0.86, 0.07);
      pivot.add(shoe);
      pivot.position.set(sx * 0.17, 0.86, 0);
      this.hips.add(pivot);
    }

    this.root.add(this.hips);
    this.group.add(this.root);
    if (opts.scale) this.group.scale.setScalar(opts.scale);
  }

  setPalette(p: BodyPalette) {
    this.bodyMats.skin.color.set(p.skin);
    this.bodyMats.hair.color.set(p.hair);
    this.bodyMats.shirt.color.set(p.shirt);
    this.bodyMats.shirtAlt.color.set(p.shirtAlt);
    this.bodyMats.pants.color.set(p.pants);
    this.bodyMats.shoes.color.set(p.shoes);
    this.bodyMats.detail.color.set(p.detail);
    this.bodyMats.detail.emissive.set(p.detail);
  }

  setOpacity(o: number) {
    for (const m of this.materials) {
      m.transparent = o < 1;
      m.opacity = o;
    }
  }

  animate(t: number, pose: CharPose, speed = 1) {
    const swing = Math.sin(t * 11 * speed);
    const swing2 = Math.sin(t * 22 * speed);

    if (pose === "run") {
      this.legL.rotation.x = swing * 0.95;
      this.legR.rotation.x = -swing * 0.95;
      this.armL.rotation.x = -swing * 0.85;
      this.armR.rotation.x = swing * 0.85;
      this.armL.rotation.z = 0.12;
      this.armR.rotation.z = -0.12;
      this.hips.position.y = Math.abs(swing2) * 0.045;
      this.hips.rotation.x = 0.12;
      this.hips.rotation.z = swing * 0.05;
      this.head.rotation.x = -0.08;
      this.root.rotation.x = 0;
      this.root.position.y = 0;
      this.group.scale.y = 1;
    } else if (pose === "jump") {
      this.legL.rotation.x = -1.05;
      this.legR.rotation.x = -0.35;
      this.armL.rotation.x = -2.2;
      this.armR.rotation.x = -1.9;
      this.hips.rotation.x = 0.05;
      this.hips.rotation.z = 0;
      this.hips.position.y = 0;
      this.head.rotation.x = 0.05;
      this.root.rotation.x = 0;
      this.root.position.y = 0;
    } else if (pose === "slide") {
      this.root.rotation.x = -1.24;
      this.root.position.y = 0.34;
      this.legL.rotation.x = 0.25;
      this.legR.rotation.x = 0.5;
      this.armL.rotation.x = -0.5;
      this.armR.rotation.x = -0.9;
      this.hips.rotation.x = 0;
      this.hips.rotation.z = 0;
      this.hips.position.y = 0;
      this.head.rotation.x = 0.9;
    } else {
      this.root.rotation.x = 0.35;
      this.root.position.y = 0;
      this.legL.rotation.x = -0.7;
      this.legR.rotation.x = 0.4;
      this.armL.rotation.x = -2.6;
      this.armR.rotation.x = -2.6;
      this.armL.rotation.z = 0.7;
      this.armR.rotation.z = -0.7;
      this.hips.rotation.x = -0.2;
      this.head.rotation.x = -0.4;
    }
  }

  dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    });
    for (const m of this.materials) m.dispose();
  }
}

export class Dog {
  readonly group = new THREE.Group();
  private legs: THREE.Object3D[] = [];
  private head = new THREE.Group();
  private tail: THREE.Mesh;
  private materials: THREE.MeshStandardMaterial[] = [];

  constructor() {
    const fur = mat("#D9A15C");
    const dark = mat("#A9662B");
    const ink = mat(PALETTE.ink);
    const tongue = mat("#FF6B8A");
    this.materials.push(fur, dark, ink, tongue);

    const torso = box(0.6, 0.48, 1.1, fur);
    torso.position.y = 0.68;
    this.group.add(torso);

    const chest = box(0.52, 0.44, 0.36, dark);
    chest.position.set(0, 0.72, -0.58);
    this.group.add(chest);

    const skull = box(0.42, 0.38, 0.42, fur);
    this.head.add(skull);
    const snout = box(0.24, 0.2, 0.3, dark);
    snout.position.set(0, -0.07, -0.32);
    this.head.add(snout);
    const nose = box(0.12, 0.1, 0.08, ink);
    nose.position.set(0, -0.03, -0.49);
    this.head.add(nose);
    const mouth = box(0.14, 0.06, 0.18, tongue);
    mouth.position.set(0, -0.16, -0.38);
    this.head.add(mouth);
    for (const sx of [-1, 1]) {
      const ear = box(0.12, 0.26, 0.1, dark);
      ear.position.set(sx * 0.19, 0.2, 0.02);
      ear.rotation.z = sx * 0.25;
      this.head.add(ear);
      const eye = box(0.07, 0.08, 0.05, ink);
      eye.position.set(sx * 0.12, 0.05, -0.21);
      this.head.add(eye);
    }
    this.head.position.set(0, 1.02, -0.8);
    this.group.add(this.head);

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pivot = new THREE.Group();
        const leg = box(0.16, 0.46, 0.16, dark);
        leg.position.y = -0.23;
        pivot.add(leg);
        const paw = box(0.18, 0.1, 0.24, fur);
        paw.position.set(0, -0.45, 0.03);
        pivot.add(paw);
        pivot.position.set(sx * 0.2, 0.5, sz * 0.4);
        this.group.add(pivot);
        this.legs.push(pivot);
      }
    }

    this.tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 5), fur);
    this.tail.position.set(0, 0.92, 0.6);
    this.tail.rotation.x = -1;
    this.group.add(this.tail);
  }

  animate(t: number, barking: boolean) {
    const gallop = Math.sin(t * 16);
    this.legs.forEach((leg, i) => {
      const phase = i < 2 ? gallop : -gallop;
      leg.rotation.x = phase * 0.9;
    });
    this.group.position.y = Math.abs(gallop) * 0.1;
    this.tail.rotation.z = Math.sin(t * 12) * 0.4;
    this.head.rotation.x = barking ? -0.35 + Math.sin(t * 26) * 0.18 : Math.sin(t * 4) * 0.06;
  }

  dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    });
    for (const m of this.materials) m.dispose();
  }
}

export function makeCop() {
  const cop = new Humanoid(
    {
      skin: "#D9A06B",
      hair: "#241009",
      shirt: "#2C4C8C",
      shirtAlt: "#1B2F5C",
      pants: "#1B2340",
      shoes: "#10061F",
      detail: "#FFC93C",
    },
    { hat: true, ponytail: false },
  );
  return cop;
}
