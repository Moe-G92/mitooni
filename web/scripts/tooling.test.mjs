import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const fontRequire = createRequire(require.resolve("ttf2woff2"));
const gypRequire = createRequire(fontRequire.resolve("node-gyp/package.json"));
const fetchRequire = createRequire(gypRequire.resolve("make-fetch-happen"));
const cacheRequire = createRequire(fetchRequire.resolve("cacache/package.json"));
function packageVersion(consumer, name) {
  let dir = path.dirname(consumer.resolve(name));
  while (dir !== path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (fs.existsSync(manifest)) {
      const data = JSON.parse(fs.readFileSync(manifest, "utf8"));
      if (data.name === name) return data.version;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`Package metadata not found: ${name}`);
}
const tmp = async (fn) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mitooni-tooling-"));
  try { return await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
};
const deny = () => { throw new Error("Network forbidden in offline tooling check"); };
require("node:net").Socket.prototype.connect = deny;
require("node:tls").connect = deny;
require("node:http").request = require("node:http").get = deny;
require("node:https").request = require("node:https").get = deny;
globalThis.fetch = deny;

test("ancestor resolutions preserve unrelated consumers", () => {
  const transformers = createRequire(require.resolve("@huggingface/transformers"));
  const estree = createRequire(require.resolve("@typescript-eslint/typescript-estree"));
  const eslint = createRequire(require.resolve("eslint"));
  assert.equal(packageVersion(transformers, "sharp"), "0.35.5");
  assert.equal(estree("minimatch/package.json").version, "11.0.1");
  assert.equal(eslint("minimatch/package.json").version, "3.1.5");
  assert.equal(cacheRequire("glob/package.json").version, "14.0.2");
  assert.equal(gypRequire("tar/package.json").version, "7.5.22");
  assert.equal(cacheRequire("tar/package.json").version, "7.5.22");
  assert.equal(fontRequire("node-gyp/package.json").version, "11.5.0");
});

test("actual cacache glob wrapper preserves matches, empty results and cancellation", async () => tmp(async (dir) => {
  const wrapper = cacheRequire(path.join(path.dirname(cacheRequire.resolve("cacache/package.json")), "lib/util/glob.js"));
  await mkdir(path.join(dir, "nested"));
  await writeFile(path.join(dir, "a.txt"), "a");
  await writeFile(path.join(dir, "nested/b.txt"), "b");
  assert.deepEqual((await wrapper("**/*.txt", { cwd: dir })).sort(), ["a.txt", "nested/b.txt"]);
  assert.deepEqual(await wrapper("**/*.missing", { cwd: dir }), []);
  const controller = new AbortController();
  const reason = new Error("bounded traversal cancelled");
  let reads = 0;
  const controlledFs = { ...fs, readdir: (...args) => {
    reads++;
    controller.abort(reason);
    return fs.readdir(...args);
  } };
  await assert.rejects(wrapper("**/*", { cwd: dir, signal: controller.signal, fs: controlledFs }), (error) => error === reason);
  await new Promise((resolve) => setImmediate(resolve));
  const afterSettlement = reads;
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(reads, afterSettlement);
  assert.ok(reads <= 1);
  const cache = cacheRequire("cacache");
  await cache.put(path.join(dir, "cache"), "synthetic-key", "synthetic-value");
  assert.equal((await cache.verify(path.join(dir, "cache"))).verifiedContent, 1);
}));

test("node-gyp actual local-tar install extracts supported files without downloads", async () => tmp(async (dir) => {
  const source = path.join(dir, "source");
  await mkdir(path.join(source, "node-test/include/node"), { recursive: true });
  await writeFile(path.join(source, "node-test/include/node/synthetic.h"), "/* synthetic header */\n");
  await writeFile(path.join(source, "node-test/skip.txt"), "not a header");
  const archive = path.join(dir, "tiny.tgz");
  await gypRequire("tar").create({ cwd: source, file: archive, gzip: true }, ["node-test"]);
  const devDir = path.join(dir, "headers");
  await gypRequire("./lib/install.js")({ opts: { tarball: archive }, devDir, package: { installVersion: 11 }, commands: { remove: async () => {} } }, ["22.23.2"]);
  assert.equal(await readFile(path.join(devDir, "22.23.2/include/node/synthetic.h"), "utf8"), "/* synthetic header */\n");
  await assert.rejects(readFile(path.join(devDir, "22.23.2/skip.txt")), { code: "ENOENT" });
}));

// Original one-triangle TrueType fixture; no external font/source asset.
function blankFont() {
  const tables = new Map();
  const table = (tag, size) => { const data = Buffer.alloc(size); tables.set(tag, data); return data; };
  const head = table("head", 54);
  head.writeUInt32BE(0x10000); head.writeUInt32BE(0x10000, 4); head.writeUInt32BE(0x5f0f3cf5, 12);
  head.writeUInt16BE(1000, 18); head.writeUInt16BE(8, 46); head.writeInt16BE(2, 48);
  const hhea = table("hhea", 36);
  hhea.writeUInt32BE(0x10000); hhea.writeInt16BE(800, 4); hhea.writeInt16BE(-200, 6); hhea.writeUInt16BE(500, 10); hhea.writeUInt16BE(1, 34);
  const maxp = table("maxp", 32); maxp.writeUInt32BE(0x10000); maxp.writeUInt16BE(1, 4); maxp.writeUInt16BE(3, 6); maxp.writeUInt16BE(1, 8); maxp.writeUInt16BE(2, 14);
  table("hmtx", 4).writeUInt16BE(500); table("loca", 4).writeUInt16BE(10, 2);
  const glyph = table("glyf", 20); glyph.writeInt16BE(1); glyph.writeInt16BE(100, 6); glyph.writeInt16BE(100, 8); glyph.writeUInt16BE(2, 10);
  Buffer.from([0x31, 0x33, 0x27, 100, 100, 100]).copy(glyph, 14);
  const cmap = table("cmap", 36);
  cmap.writeUInt16BE(1, 2); cmap.writeUInt16BE(3, 4); cmap.writeUInt16BE(1, 6); cmap.writeUInt32BE(12, 8);
  cmap.writeUInt16BE(4, 12); cmap.writeUInt16BE(24, 14); cmap.writeUInt16BE(2, 18); cmap.writeUInt16BE(2, 20);
  cmap.writeUInt16BE(0xffff, 26); cmap.writeUInt16BE(0xffff, 30); cmap.writeUInt16BE(1, 32);
  table("name", 6).writeUInt16BE(6, 4); table("post", 32).writeUInt32BE(0x30000);
  const os2 = table("OS/2", 78); os2.writeInt16BE(500, 2); os2.writeUInt16BE(400, 4); os2.writeUInt16BE(5, 6);
  os2.writeInt16BE(800, 68); os2.writeInt16BE(-200, 70); os2.writeUInt16BE(800, 74); os2.writeUInt16BE(200, 76);
  const entries = [...tables].sort(([a], [b]) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const sum = (data) => { let value = 0; for (let i = 0; i < data.length; i += 4) value = (value + data.readUInt32BE(i)) >>> 0; return value; };
  const size = 12 + entries.length * 16 + entries.reduce((n, [, data]) => n + Math.ceil(data.length / 4) * 4, 0);
  const font = Buffer.alloc(size); font.writeUInt32BE(0x10000); font.writeUInt16BE(entries.length, 4);
  const power = 2 ** Math.floor(Math.log2(entries.length)); font.writeUInt16BE(power * 16, 6); font.writeUInt16BE(Math.log2(power), 8); font.writeUInt16BE(entries.length * 16 - power * 16, 10);
  let offset = 12 + entries.length * 16; let headOffset;
  entries.forEach(([tag, data], index) => {
    const padded = Buffer.alloc(Math.ceil(data.length / 4) * 4); data.copy(padded);
    const row = 12 + index * 16; font.write(tag, row, 4, "ascii"); font.writeUInt32BE(sum(padded), row + 4); font.writeUInt32BE(offset, row + 8); font.writeUInt32BE(data.length, row + 12); padded.copy(font, offset);
    if (tag === "head") headOffset = offset;
    offset += padded.length;
  });
  font.writeUInt32BE((0xb1b0afba - sum(font)) >>> 0, headOffset + 8);
  return font;
}

test("font WASM fallback converts an original tiny font on scripts-disabled install", async () => {
  process.env.TTF2WOFF2_VERSION = "wasm";
  const { default: convert } = await import("ttf2woff2");
  const input = blankFont();
  const output = convert(input);
  assert.equal(output.toString("ascii", 0, 4), "wOF2");
  assert.equal(output.readUInt32BE(8), output.length);
  assert.equal(output.readUInt16BE(12), 10);
  assert.ok(output.length < input.length);
  const cli = path.resolve(path.dirname(require.resolve("ttf2woff2")), "../bin/ttf2woff2.js");
  const offline = "data:text/javascript," + encodeURIComponent("import net from 'node:net'; import tls from 'node:tls'; const deny=()=>{throw new Error('network denied')}; net.Socket.prototype.connect=deny; tls.connect=deny; globalThis.fetch=deny;");
  const result = spawnSync(process.execPath, ["--import", offline, cli], { input, env: { ...process.env, TTF2WOFF2_VERSION: "wasm" }, timeout: 5000 });
  assert.equal(result.status, 0, result.stderr.toString());
  assert.deepEqual(result.stdout, output, "retained font CLI and default API must agree");
});

test("sharp and Kokoro consumer imports work offline without loading speech model", async () => {
  const transformerRequire = createRequire(require.resolve("@huggingface/transformers"));
  const sharp = transformerRequire("sharp");
  const result = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#ffffff" } }).png().toBuffer();
  assert.equal((await sharp(result).metadata()).width, 2);
  const { KokoroTTS } = await import("kokoro-js");
  assert.equal(typeof KokoroTTS.from_pretrained, "function");
  // Never invoke from_pretrained/generate.
});

test("audio default/check/invalid arguments leave outputs untouched offline", async () => tmp(async (dir) => {
  const guard = path.join(dir, "offline.cjs");
  await writeFile(guard, `const deny=()=>{throw new Error('network denied')}; globalThis.fetch=deny; require('node:net').Socket.prototype.connect=deny; require('node:tls').connect=deny; require('node:module').registerHooks({load(url,context,next){if(/node_modules\\/(kokoro-js|@huggingface)/.test(url))throw new Error('model package imported by idle command');return next(url,context)}});`);
  const watched = ["public/audio", "src/mocks/fixtures/academic-1/audio-durations.ts"];
  const snapshot = async () => Promise.all(watched.map(async (name) => {
    const full = path.join(root, name); const stat = await fs.promises.stat(full);
    return [name, stat.mtimeMs, stat.isDirectory() ? await readdir(full) : await readFile(full, "utf8")];
  }));
  const before = await snapshot();
  for (const [args, code] of [[[], 0], [["--check"], 0], [["part-2"], 2]]) {
    const result = spawnSync(process.execPath, ["--require", guard, "--import", "tsx", "scripts/make-audio.ts", ...args], { cwd: root, encoding: "utf8", timeout: 15000 });
    assert.equal(result.status, code, result.stderr);
    if (args[0] === "--check") assert.deepEqual(JSON.parse(result.stdout), { generation: false, modelLoaded: false, kokoroInstalled: true, ffmpeg: true, ffprobe: true });
  }
  assert.deepEqual(await snapshot(), before);
}));
