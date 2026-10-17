import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { Logger, Plugin, ResolvedConfig } from "vite";

const SETTINGS_VERSION = 1;

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
const VIDEO_TRANSCODE_EXT = /\.(mp4|mov)$/i;

const IMAGE_MIN_BYTES = 10 * 1024;
const IMAGE_MAX_DIMENSION = 2560;
const VIDEO_WARN_BYTES = 10 * 1024 * 1024;
const MIN_SAVINGS = 0.1;

const execFileAsync = promisify(execFile);

const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function cacheKey(input: Buffer): string {
  return createHash("sha256").update(`v${SETTINGS_VERSION}`).update(input).digest("hex");
}

let ffmpegAvailable: boolean | undefined;
function hasFfmpeg(): boolean {
  if (ffmpegAvailable === undefined) {
    try {
      execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
      ffmpegAvailable = true;
    } catch {
      ffmpegAvailable = false;
    }
  }
  return ffmpegAvailable;
}

async function applyCached(file: string, cached: string, skipMarker: string): Promise<boolean> {
  if (
    await fs.stat(skipMarker).then(
      () => true,
      () => false,
    )
  )
    return true;
  if (
    await fs.stat(cached).then(
      () => true,
      () => false,
    )
  ) {
    await fs.copyFile(cached, file);
    return true;
  }
  return false;
}

async function finish(
  file: string,
  rel: string,
  originalSize: number,
  result: string,
  skipMarker: string,
  logger: Logger,
): Promise<void> {
  const resultSize = (await fs.stat(result)).size;
  if (resultSize > 0 && resultSize <= originalSize * (1 - MIN_SAVINGS)) {
    await fs.copyFile(result, file);
    logger.info(
      `[asset-optimizer] ${rel}: ${mb(originalSize)} → ${mb(resultSize)} ` +
        `(${Math.round((1 - resultSize / originalSize) * 100)}% smaller)`,
    );
  } else {
    await fs.rm(result, { force: true });
    await fs.writeFile(skipMarker, "");
  }
}

async function optimizeImage(
  file: string,
  rel: string,
  cacheDir: string,
  logger: Logger,
): Promise<void> {
  const input = await fs.readFile(file);
  if (input.length < IMAGE_MIN_BYTES) return;

  const ext = path.extname(file).toLowerCase();
  const key = cacheKey(input);
  const cached = path.join(cacheDir, `${key}${ext}`);
  const skipMarker = path.join(cacheDir, `${key}.skip`);
  if (await applyCached(file, cached, skipMarker)) return;

  const sharp = (await import("sharp")).default;
  sharp.concurrency(1);
  sharp.cache(false);
  const pipeline = sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: IMAGE_MAX_DIMENSION,
      height: IMAGE_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  const output =
    ext === ".png"
      ? await pipeline.png({ compressionLevel: 9, effort: 4 }).toBuffer()
      : ext === ".webp"
        ? await pipeline.webp({ quality: 80, effort: 4 }).toBuffer()
        : await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();

  await fs.writeFile(cached, output);
  await finish(file, rel, input.length, cached, skipMarker, logger);
}

async function optimizeVideo(
  file: string,
  rel: string,
  cacheDir: string,
  logger: Logger,
): Promise<void> {
  const size = (await fs.stat(file)).size;

  const compressHint =
    `compress videos before adding them to public/ ` +
    `(target < ${mb(VIDEO_WARN_BYTES)}; e.g. 720p/1080p H.264, CRF 26–28).`;
  if (!VIDEO_TRANSCODE_EXT.test(file) || !hasFfmpeg()) {
    if (size > VIDEO_WARN_BYTES) {
      logger.warn(`[asset-optimizer] ${rel} is ${mb(size)} — ${compressHint}`);
    }
    return;
  }

  const ext = path.extname(file).toLowerCase();
  const input = await fs.readFile(file);
  const key = cacheKey(input);
  const cached = path.join(cacheDir, `${key}${ext}`);
  const skipMarker = path.join(cacheDir, `${key}.skip`);
  if (await applyCached(file, cached, skipMarker)) return;

  const tmp = path.join(cacheDir, `${key}.tmp${ext}`);
  try {
    await execFileAsync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      file,
      "-c:v",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "veryfast",
      "-vf",
      "scale='min(1920,iw)':-2",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-threads",
      "2",
      tmp,
    ]);
  } catch (error) {
    await fs.rm(tmp, { force: true });
    throw error;
  }
  await fs.rename(tmp, cached);
  await finish(file, rel, size, cached, skipMarker, logger);
  const finalSize = (await fs.stat(file)).size;
  if (finalSize > VIDEO_WARN_BYTES) {
    logger.warn(
      `[asset-optimizer] ${rel} is still ${mb(finalSize)} after transcoding — ${compressHint}`,
    );
  }
}

export default function assetOptimizerPlugin(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "asset-optimizer-plugin",
    apply: "build",
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const files = await walk(outDir).catch(() => [] as string[]);
      const images = files.filter((file) => IMAGE_EXT.test(file));
      const videos = files.filter((file) => VIDEO_EXT.test(file));
      if (images.length === 0 && videos.length === 0) return;

      const cacheDir = path.resolve(config.root, "node_modules/.cache/asset-optimizer");
      await fs.mkdir(cacheDir, { recursive: true });

      for (const file of images) {
        const rel = path.relative(outDir, file);
        await optimizeImage(file, rel, cacheDir, config.logger).catch((error) => {
          config.logger.warn(`[asset-optimizer] skipped ${rel}: ${error}`);
        });
      }
      for (const file of videos) {
        const rel = path.relative(outDir, file);
        await optimizeVideo(file, rel, cacheDir, config.logger).catch((error) => {
          config.logger.warn(`[asset-optimizer] skipped ${rel}: ${error}`);
        });
      }
    },
  };
}
