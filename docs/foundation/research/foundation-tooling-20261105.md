# Foundation tooling — 5 November 2026

Owner: dependency/tooling specialist, gpt-6.1-sol / medium. Receiving revision: 2c667827b4729312820a059ce0ad7f359559c8a0, branch codex/foundation-review-20261104. Stage: remediation checkpoint complete; independent security reviewer agrees on the exact local tooling scope. No release approval.

## Preflight

1. A top professional would trace each advisory to the actual locked graph and invocation path, separate propagated findings from distinct vulnerabilities, verify upgrade API/engine compatibility, and preserve audio/font capability rather than hide findings by deleting tools. Installation scripts and model auto-downloads are separate hazards to control.
2. Rawest material: receiving package.json/package-lock.json, installed package metadata, current registry audit response, actual tooling source and upstream maintainer advisories/release manifests. Existing account security review is a pointer to verify, not proof. BarEx uncommitted work and all production/learner/source materials are excluded.
3. Methods: read-only npm audit/npm ls and package metadata, narrow official advisory/release lookups, static import/script tracing; compare exact patched overrides, compatible direct upgrades and explicit tooling isolation. After approval, locked scripts-disabled installation, complete/prod audits, focused synthetic/offline tool checks and frontend test/build checks will test the resulting graph and preserved capabilities.
4. Independent evidence: exact baseline/final lock graph and advisory IDs, install/audit exits, synthetic font round-trip or format validation, offline audio preflight without model/provider invocation, unchanged account runtime behavior and independent security diff review. A clean audit alone will not establish tool compatibility or secure arbitrary input handling.

## Intake observations

Root and app instructions plus the latest checkpoint and prior security/implementation evidence were read. A modified learning-proposal Word artifact is unrelated and untouched. No source BarEx read is needed for this assignment. No nested web instructions were discovered.

Initial npm audit --json --ignore-scripts reproduced 16 affected package findings: 10 moderate, five high and one critical. This is 16 vulnerable package nodes, including propagated parent findings, not 16 independent CVEs. Installed npm ls confirms the graph. A later npm audit --omit=dev failed with ENOTFOUND for registry.npmjs.org; no zero-finding claim is made. Read-only registry metadata requests also encountered network failure; results remain pending.

No dependency or script files have been changed. The existing make-audio.ts imports Kokoro and calls from_pretrained at top level, which would download a model on first run; it was inspected but not executed. No font conversion script or package command is currently present; ttf2woff2 is installed as a development capability.

## Exact affected graph and advisory evidence

The all-dependency audit reports the following 16 package findings; installed and locked versions agree. Every affected node has dev:true. npm audit --omit=dev --json --ignore-scripts was retried with authorized network access and returned zero findings, exit 0. This bounds registry-reported production dependencies; it does not certify tooling safety or prove emitted browser reachability. The prior independent account review inspected emitted modules; this checkpoint will repeat the affected-name check after a fresh build.

| Affected package | Locked version | Finding route |
| --- | --- | --- |
| kokoro-js | 1.2.1 | transformers → sharp |
| @huggingface/transformers | 3.8.1 | sharp |
| sharp | 0.34.5 | three upstream native-library advisories |
| ttf2woff2 | 6.0.1 | node-gyp |
| node-gyp | 10.3.1 | glob, make-fetch-happen, tar |
| make-fetch-happen | 13.0.1 | cacache |
| cacache | 18.0.4 | glob, tar |
| glob | 10.5.0 | cancellation advisory and minimatch |
| tar | 6.2.1 | 12 direct advisories; highest registry severity critical |
| minimatch | 9.0.9 (glob); 10.2.6 (estree) | globparts amplification |
| typescript-eslint | 8.72.1 | plugin/parser/estree/utils |
| @typescript-eslint/eslint-plugin | 8.72.1 | type-utils/utils |
| @typescript-eslint/parser | 8.72.1 | estree |
| @typescript-eslint/type-utils | 8.72.1 | estree/utils |
| @typescript-eslint/typescript-estree | 8.72.1 | minimatch |
| @typescript-eslint/utils | 8.72.1 | estree |

ESLint's separate minimatch 3.1.5 is not in the reported affected range and must not be replaced globally. ONNX's separate tar 7.5.22 is already outside the reported tar ranges. These distinctions rule out a blanket override of every minimatch/tar instance.

Upstream evidence accessed 5 November 2026:

- [minimatch maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249) identifies globparts amplification and patch 11.0.1. Registry audit reports affected >=7.0.0 <11.0.1. This affects lint patterns and font build traversal, not a public browser request path established here.
- [glob maintainer advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) identifies background traversal continuing after AbortSignal cancellation; affected 9.0.0–14.0.1, patched 14.0.2. A timeout around an affected traversal is not a complete mitigation.
- Sharp's three native dependency findings are [libvips](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) patched 0.35.0, [libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) patched 0.35.4, and [librsvg](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) patched 0.35.5. Some exploitation conditions are Linux/native-library specific; this Mac does not make the dependency safe for later CI or receiving environments. Blocking one image loader would not fix all three chains.
- Tar registry audit lists [34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97), [83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx), [qffp-2rhf-9h96](https://github.com/advisories/GHSA-qffp-2rhf-9h96), [9ppj-qmqm-q256](https://github.com/advisories/GHSA-9ppj-qmqm-q256), [r6q2-hw4h-h46w](https://github.com/advisories/GHSA-r6q2-hw4h-h46w), [vmf3-w455-68vh](https://github.com/advisories/GHSA-vmf3-w455-68vh), [w8wr-v893-vjvp](https://github.com/advisories/GHSA-w8wr-v893-vjvp), [23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw), [8x88-c5mf-7j5w](https://github.com/advisories/GHSA-8x88-c5mf-7j5w), [gvwx-54wh-qm9j](https://github.com/advisories/GHSA-gvwx-54wh-qm9j), and [r292-9mhp-454m](https://github.com/advisories/GHSA-r292-9mhp-454m). They cover hardlink/symlink traversal and overwrite, macOS path races, parser/size handling and availability failures. The last/highest affected range ends at 7.5.20; 7.5.22 clears every reported range. The critical [unlimited decompression advisory](https://github.com/advisories/GHSA-23hp-3jrh-7fpw) and latest [recursive member-selection advisory](https://github.com/advisories/GHSA-r292-9mhp-454m) were separately opened and verified. The remaining tar IDs/ranges come from the executed registry audit, not an independent exploit reproduction.

Read-only npm view confirmed: current typescript-eslint is still 8.72.1, so an ordinary update cannot fix its minimatch chain; patched minimatch 11.0.1 and glob 14.0.2 support Node 18/20/>=22; sharp 0.35.5 requires Node>=20.9.0. The repository requires Node>=22.12; this machine is Node26.9.0/npm11.19.1. Registry metadata for ttf2woff2 8.0.1 retains Node>=20.11.1, default conversion export and WASM fallback but updates node-gyp to ^11.2.0. [Upstream versioned source](https://raw.githubusercontent.com/nfroidure/ttf2woff2/v8.0.1/src/index.ts) confirms the default function and native/WASM choice. Its install script still attempts a native build; scripts-disabled installation remains mandatory.

## Alternatives and proposed smallest robust change

**A — bounded upgrade plus narrow overrides (recommended for a tested attempt).** Change only direct ttf2woff2 6→exact8.0.1. Keep Kokoro1.2.1, transformers3.8.1 and typescript-eslint8.72.1; scoped exact overrides select sharp0.35.5 only below transformers and minimatch11.0.1 only below estree. Within the font tool's node-gyp/cacache subtree, select glob14.0.2 and tar7.5.22; glob's minimatch must resolve outside the advisory range. Do not change ESLint's minimatch3 or already-safe ONNX tar. Lock the resulting graph with install scripts disabled.

This crosses a sharp pre-1.0 minor and glob/minimatch major boundaries, so it is a compatibility hypothesis pending focused tests, not a semver-safe claim. Receiving installed source calls the preserved named glob() Promise API in node-gyp/lib/build.js and cacache/lib/util/glob.js, and tar.extract() in node-gyp/lib/install.js. Focused synthetic tests must exercise those consumer entry paths, not merely import the replacement module. The direct font8 move avoids forcing node-gyp10's tar6 contract directly onto tar7. Do not attempt native compilation or header download; use the published WASM fallback.

**B — isolate retained tooling into an explicit separately locked developer package.** Keep audio/font source and intentional commands, but make an ordinary web install/build independent of optional generation packages. An audio wrapper must explain and fail closed when the isolated tool is not installed; installation is explicit and scripts-disabled. This is an honest reduction of default exposure, not remediation of an isolated vulnerable graph. It adds another lock/package boundary and preserves residual findings, so use it only if A cannot demonstrate compatibility without a broader unsupported upgrade. Never silently remove the audio capability or declare zero total findings by auditing only the web package.

**Rejected:** npm audit fix --force; global minimatch/tar overrides; replacing the inference stack; deleting unused-looking tool roots; relying only on dev:true/browser absence; running native install scripts; downloading a model to “test” the upgrade.

**Command safety:** add audio --check that validates dependency availability/API and ffmpeg/ffprobe availability without loading a model, processing content or writing outputs. Move the Kokoro import/model loading below argument handling; require explicit generation intent before the model-capable path, with clear download implications. The concrete flag/default behavior will be challenged before implementation; no model call or download is authorized in this checkpoint. Font currently has no package script; retain the conversion package/API and add only a bounded validation command if needed to make the existing capability reviewable. Synthetic font conversion must not use adjacent licensed/customer sources.

## Proposed acceptance checks (not yet run)

1. Lock update restricted to the approved tooling chains; npm ci --ignore-scripts using that exact lock. Record no broad runtime updates, install-script execution, native compiler or model download.
2. npm audit --json --ignore-scripts and npm audit --omit=dev --json --ignore-scripts; preserve complete result and graph. If findings remain, identify package/path, affected input path and real isolation boundary rather than hiding them.
3. Focused offline synthetic checks: consumer-resolved estree minimatch behavior, node-gyp/cacache glob behavior including cancellation, tar round-trip of tiny task-owned fixtures, font WASM conversion with WOFF2 header/decoder validation, sharp load plus tiny synthetic image operation, Kokoro import/API presence with network denied, and audio --check/guard exits with zero output mutation. No adversarial bomb, model invocation, corpus input or provider access.
4. npm run typecheck, npm run lint, npm test, npm run build and npm run build:prototype. Build/account graph check must show no audited tool module in emitted browser code. Existing frontend behavior tests remain the appropriate account regression.
5. Independent security reviewer examines actual manifest/lock/script diff, reproduces relevant focused checks and audits, and records compatibility limits. A successful offline import cannot claim actual speech-generation/model compatibility.

## Design checkpoint (before approval)

Coordinator and independent security reviewer receive this concrete proposal before package/lock/script mutation. Only this internal record has changed. Stop at this design checkpoint until the reviewed path and compatibility expectations are accepted.

## Approved experiment and observed implementation

Coordinator approved A on 5 November before dependency/script edits. Independent security challenge required exact ancestor resolution, actual consumer-path tests, scripts-disabled clean installation, idle audio before heavy imports, explicit Node-version limits and no model/native invocation.

Implemented only web/package.json, package-lock.json, scripts/make-audio.ts and scripts/tooling.test.mjs, plus this record. Direct ttf2woff2 is exact 8.0.1. Overrides are exact-version ancestors: transformers3.8.1→sharp0.35.5; estree8.72.1→minimatch11.0.1; ttf2woff2 8.0.1's node-gyp→tar7.5.22 and cacache→glob14.0.2/tar7.5.22. Installed graph resolves node-gyp11.5.0, make-fetch-happen14.0.3, cacache19.0.1 and glob's minimatch11.0.4. Node-gyp11.5 itself now imports tinyglobby, so the originally proposed node-gyp→glob override was unnecessary and removed; the real glob replacement consumer is cacache. ESLint retains minimatch3.1.5; ONNX retains safe tar7.5.22. npm ls over the affected graph exits 0 with no invalid/extraneous nodes.

Lock comparison against 2c667827 shows no added/changed runtime package versions. Changed versions, new platform packages and transitive changes are dev-marked and belong to the updated image/font/lint tooling chains. Some existing optional WASM runtime dependencies relocate to nested Tailwind paths after native-image dependency deduplication changes; Tailwind's own version is unchanged. The lock is larger than a one-line update because sharp has platform-specific binaries and node-gyp changes its dependency subtree.

Audio now requires explicit --generate [filename-filter] for its model-capable path. Default is an idle explanatory exit; --check only resolves dependency presence and checks ffmpeg/ffprobe executable availability, returning structured status without importing Kokoro or loading a model. Invalid old positional-only generation intent exits 2 and explains the explicit flag. The original script/fixture content and output paths remain; actual generation remains untested and unauthorized here. Font conversion remains available via its original package default API with a published WASM fallback; no native build was enabled.

### Checks observed so far

- Initial scripts-disabled clean npm ci hit registry EIDLETIMEOUT. Retrying the identical lock with --prefer-offline --maxsockets=3 --fetch-retries=1 --fetch-timeout=60000 succeeded, 549 packages installed. Neither attempt ran lifecycle scripts. The observed deprecation notices for boolean3.2.0 and ESLint9.39.5 remain separate maintenance information, not silently fixed by expanding this security task.
- Full npm audit --json --ignore-scripts: zero known findings, exit 0. Production-only audit: zero, exit 0. Registry counts changed from 684 total/479 dev/206 prod to 662 total/457 dev/206 prod; those categories overlap with optional packages and are not independent installed-package totals.
- npm run test:tooling: six tests pass under Node26.9.0 and existing Node22.23.2. Node22.23.2 validates an available Node22 release, not the precise minimum22.12.0. All probes deny network. Actual cacache wrapper returns expected matches/empty results, rejects the cancellation reason and reaches observed quiescence after rejection; actual cacache put/verify succeeds. Actual node-gyp local-tar installation extracts an original tiny header fixture and rejects a non-header path via the consumer's filter, without downloads/compilers. Original triangle-font conversion uses the WASM path and validates WOFF2 signature, length/table count and compression. Sharp loads through the transformers consumer resolver and processes a synthetic2×2 PNG; Kokoro imports and exposes from_pretrained without invoking it.
- Idle audio checks run as child processes with network denied and a module-load hook that rejects Kokoro/HuggingFace import. Default and --check exit0, invalid positional invocation exits2; watched outputs remain unchanged. ffmpeg and ffprobe were available locally. No speech-model, real recording, licensed source or learner payload was processed.
- npm run lint and npm run typecheck pass. npm test passes71 tests across11 files on the current receiving tree; another specialist's concurrent account-only work is outside this tooling diff. Separate final build checks and independent actual-diff review are still pending at this entry.

### Failed probes and corrections

The first resolution assertion tried sharp/package.json, which the updated package does not export; the test now reads the package manifest by walking from the actual resolved entrypoint, without changing production code. The first authored blank-font fixture parsed as TrueType but was rejected by the compressor; correcting its glyph/loca representation still did not establish a useful all-empty-font conversion. An original one-triangle glyph fixture then passed. A trusted installed ReportLab test font also converted in a separate local check, confirming this was a fixture limitation rather than evidence of an upgrade failure; no font binary was copied into this repository. No decoder or image vulnerability exploit payload was executed. Existing source code, rather than suppressed assertion failures, drove each correction.

### Remaining acceptance boundaries

No inference/model load, speech output, native font compilation, Windows/Linux binary execution, hosted/provider integration or untrusted-input processing was performed. Zero registry findings is time-bounded advisory evidence, not an assertion that arbitrary image/font/archive inputs are safe. A later model-capable workflow still needs its own bounded input/resource policy and actual generation compatibility checks. Builds, reviewer agreement and restart notes will be finalized below.

## Final local checks and restart

By 14:33 UTC on 5 November, the final six tooling tests pass on Node26.9.0 and Node22.23.2, including retained font CLI stdin→WOFF2 byte parity with its default API. Both runtimes pass lint/typecheck and the current71-test frontend suite. A fresh Vite write:false build inspected205 emitted modules with zero module paths matching the16 audited tool package names. Separate actual npm run build and npm run build:prototype pass on Node22.23.2. The account artifact is index-BQxzVAPm.js465.37kB; prototype emits its existing large-chunk warning (prototype711.47kB, MSW browser512.96kB). Zod annotation warnings are retained; no tooling-remediation performance claim is made. Account-only UI changes and bundle reductions belong to the parallel specialist's review, not this dependency change.

An actual npm run audio -- --check invocation initially failed because the inherited tsx CLI creates an IPC listener denied in this restricted environment. The audio command now uses node --import tsx scripts/make-audio.ts; actual idle and --check commands pass. This preserves TypeScript loading without the unnecessary CLI IPC server. Other unrelated script commands were not rewritten. The child guard also denies loading Kokoro/HuggingFace modules during idle/check. Font CLI/default API and synthetic image operations were tested, but speech generation was deliberately not tested.

Post-build lint exposed another inherited command-order problem: ESLint ignored dist but not the separate dist-prototype output, so lint inspected generated minified prototype bundles and reported4176 errors. The owned package lint command now adds the exact --ignore-pattern dist-prototype argument. All source/tooling/config checks remain included; generated output is excluded just as the account dist output already was. Post-build lint then passed under Node26.9.0 and Node22.23.2. This was not a source-code finding or a justification to suppress application rules.

Run from web/:

```sh
npm ci --ignore-scripts --no-audit --fund=false
npm audit --json --ignore-scripts
npm audit --omit=dev --json --ignore-scripts
npm run test:tooling
npm run audio -- --check
npm run typecheck
npm run lint
npm test
npm run build
npm run build:prototype
```

For the existing Node22 runtime, prepend /opt/homebrew/opt/node@22/bin to PATH. The tested version is22.23.2; the exact22.12 minimum remains untested. Keep package lifecycle scripts disabled and do not run audio --generate, native rebuilds or source/resource processing as part of this restart. Ordinary package-cache/registry access is distinct from downloading a speech model; only package installation was performed here. No production queries were run in this checkpoint.

No unrelated file is staged or edited by this specialist. The modified Word artifact remains outside this assignment. A later dependency update must re-evaluate these scoped overrides against the new ancestors rather than preserving them blindly. If a parent version changes, the version-qualified override may no longer apply; the consumer-resolution regression and full audit must catch that drift.

## Independent agreement and stop state

The independent security reviewer inspected the actual final diff and reproduced all six offline tests under both tested Node versions, full/prod audits with zero findings, npm ls with no problems, post-build lint and the emitted-module check. Its lock comparison identifies102 changed nodes, all nonroot changes dev-marked and no nondev version delta. It explicitly records **AGREED for the exact final tooling scope**, with no material objection; see tutor-security-review-20261105.md. This is receiving compatibility/security evidence, not a speech-generation, native-build, arbitrary-file-processing or go-live verdict.

Final SHA-256 values:

- web/package.json: 82985c2f945db5fd10e81772508d1696050bcc53301aa8c8e7cae2ee34e57492
- web/package-lock.json: 98b12dd92edfd59976e77488928f0eb0a06e8c3cf0042d609cbf3bad16e86098
- web/scripts/make-audio.ts: 28dba90e525930f918e712a918681a476d5f3ff2a84776efb2551f97c0979a45
- web/scripts/tooling.test.mjs: e0ec8b5a54abc264931e540924e4122dec7bf03066cb6a2f115807a4640a41d0

Reviewer set digest: cab3d24dbbb628fc226bd8fc1823899f6cf05b0bbdd3102bdacbc1d3ac7bde49 over ordered path, NUL, file hash, newline records. The coordinator owns integration and the wider checkpoint. This specialist stops here; no background generation, native build, production query, staging, commit or release work is left running.
