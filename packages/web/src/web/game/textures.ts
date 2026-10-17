import * as THREE from "three";

export function makeRoadTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2B1B4A";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    const s = 1 + Math.random() * 2.5;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (const x of [512 / 3, (512 / 3) * 2]) {
    for (let y = 0; y < 512; y += 128) {
      ctx.fillRect(x - 4, y, 8, 74);
    }
  }
  ctx.fillStyle = "#22E1FF";
  ctx.fillRect(0, 0, 10, 512);
  ctx.fillRect(502, 0, 10, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeSkyTexture(
  stops: [string, string, string, string, string] = ["#170B2B", "#4B1B63", "#B3277A", "#FF6B3D", "#FFD23F"],
): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.42, stops[1]);
  g.addColorStop(0.68, stops[2]);
  g.addColorStop(0.86, stops[3]);
  g.addColorStop(1, stops[4]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

export function makeBuildingTexture(hue: number): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `hsl(${hue}, 62%, 26%)`;
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 12; y < 250; y += 26) {
    for (let x = 12; x < 120; x += 26) {
      const lit = Math.random() < 0.55;
      ctx.fillStyle = lit ? `hsl(${(hue + 40) % 360}, 90%, 68%)` : `hsl(${hue}, 50%, 16%)`;
      ctx.fillRect(x, y, 14, 16);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
