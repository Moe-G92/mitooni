# Media measurement cache design — 7 November 2026

Owner: review_beta_backend, gpt-6.1-sol / medium. Checkpoint: DESIGN, no implementation yet. Explicitly reread root/application AGENTS. Own only backend content_pipeline.py, focused cache-integrity tests and this record. No model/provider call, database change, live-service probe, local preview or lifecycle mutation.

## Four preflight answers

1. A professional treats the cache as a shortcut for expensive deterministic measurements, never an admission/authority cache; preserves exact byte/path/schema/provenance checks, measures concurrent behavior, and proves corrupted or replaced files cannot reuse earlier attestation. Startup warming and decoder failure recovery matter as much as the usual happy path.
2. Raw material is actual verify_package_assets/measured_media/decoded_audio_duration source, frozen855...095's28 actual media assets, existing metadata/decoder boundary tests, installed decoding tools and root's actual live request timings. Summaries alone cannot prove which work repeats or what is still verified.
3. Read/instrument two actual package loads to count measurement calls and wall time; propose bounded process-local scalar metadata LRU behind one mutex with verified-content keys and post-measurement rehash; test exact failure/race/concurrency/invalidation boundaries. Root independently owns live concurrent readiness probes and later deployment; no local DB reset or preview changes.
4. Evidence: successive actual loads decode each unchanged asset only once per process, every load still hashes actual bytes and checks safe paths/closed inventory/expected metadata, tamper/missing/symlink/TOCTOU probes fail, callers cannot mutate cached values, concurrency decodes once, exceptions release the lock, eviction remains bounded, and live concurrent ready paths regain clear margin under the15s frontend timeout.

## Observed baseline

Source SHA256 before edits: `229fce38a5ff12bcbb24f5bd63e18183863ed11e50224400efe9d23a30de089c` for platform/backend/app/services/content_pipeline.py. Every load_package performs closed path inventory, full JSON/schema/hash/binding checks, then verify_package_assets. That function hashes every binary and has only a per-call measurements dictionary. Each MP3 then invokes ffprobe and a bounded full PCM decode again. Exact frozen package remains85551608ca700e5c30719932b03a061e7ca359a0f3e41e1eeabbee265f2ac095.

This worker instrumented measured_media without editing source or data: actual local load1=2.440s, load2=2.328s; BOTH measured18PNG+10MP3,28 assets total. Root separately reports live readiness6.863s solo, and three simultaneous live /ready requests200 in12.865/12.892/13.253s; review client timeout15s plus actual Auth cost around1.35s. These are different environments and should not be compared as a claimed speedup.

## Smallest proposed change

Add one private metadata helper called only from verify_package_assets after current safe_file and actual byte size/SHA checks. Cache key is `(resolved path, actual verified SHA256, MIME)`. Store flat measured scalar dictionaries only, not bytes, manifests, content projections, identities, reviewer assignments or request responses. Use a bounded128-entry OrderedDict/LRU and return a new dictionary on every result. measured_media remains the uncached measurement primitive for authoring/intake and existing direct decoder checks.

Use one process-wide mutex around lookup and cache miss measurement/posthash/store. This deliberately serializes first-time decoders on the cheap1CPU workload and makes identical concurrent requests single-flight without per-key pending maps or unbounded bookkeeping. All lock paths release on failure. Errors are not cached: a later waiting caller retries measurement rather than receiving a stored exception. Warm cache hits need only a short lock; a miss may temporarily block unrelated hits, accepted here because current hosted startup eagerly validates the whole immutable edition before admitting requests. Multiple service processes have independent cold caches; no cross-process cache claim.

On miss, call existing measured_media unchanged, then re-read actual bytes and require matching verified SHA AND size before publishing metadata. If a file changed during probe/decode, reject and do not populate the cache. Every call still validates safe path/symlink containment and actual binary size/SHA BEFORE cache lookup; every call still compares measured fields to current declared duration/rate/channels/dimensions with the existing25ms tolerance. JSON/package/schema/spec/source/binding/closed-inventory checks remain untouched. Cache never conveys publication or reviewer authority. No TTL is needed for verified content-addressed scalar metadata in a pinned process; process restart clears it, decoder/toolchain changes require a new reviewed process/image.

## Acceptance and challenge

Focused tests: unchanged warm reuse with actual byte re-verification; same-size tamper, missing file and symlink rejection after priming; expected metadata drift denied on hit; same path with changed correctly declared bytes measured again; MIME/path separation; returned-result mutation isolation; changed file during first measurement denied/no poison; failed measurement retried and concurrent callers unblocked; concurrent successful misses measure once; LRU eviction bound. Test fixture clears private cache under its mutex before/after these tests; no production reset endpoint.

After approval, owner measures actual frozen cold/warm loads with call counts and root measures public /ready concurrency after the new reviewed image. Proposed live acceptance is all three warm /ready requests at most5s, leaving margin for Auth and actual review work under15s; root may set the final threshold from its deployment constraints. No timing promise is made before measurement. Cold startup retains full measurement cost and must not be reported as a warm-path result.

Rejected full-package cache or mtime-only keys because they could hide changed content/authority; rejected removing duration checks or widening tolerances because the issue is duplicated work. Per-key future/condition machinery would permit unrelated first-time decodes in parallel but adds failure/pending state and1CPU contention without value for this one immutable edition. Independent security reviewer received this precise design and has not yet returned its challenge. Stop at design checkpoint for root/security decision.

## Approved implementation and frozen evidence

Root approved the proposed128-entry OrderedDict/global cold-miss mutex after independent security challenge. Added only private _cached_asset_measurement in content_pipeline.py and focused tests/test_content_media_cache.py. Existing measured_media remains uncached for authoring/direct measurement. verify_package_assets freshly performs safe_file/read/size/SHA for every asset on every call, then obtains scalar metadata by resolvedpath/actualverifiedSHA/MIME. Cache values are immutable item tuples, returned as new dictionaries. Cold misses re-run safe_file (including path-component/symlink checks), read bytes and compare resolved path/size/SHA after decode and before insertion. Any exception exits the mutex and inserts nothing; later waiters may retry. Expected dimensions/duration/rate/channels and25ms tolerance checks remain after lookup on every call; package/provenance/spec/binding/closed inventory and reviewer authority are unchanged.

Owner command `.venv/bin/python -m pytest -q tests/test_content_media_cache.py tests/test_content_pipeline.py tests/test_content_review.py tests/test_content_review_assets.py tests/test_content_review_http.py`: **119 passed in9.29s**, inherited Starlette/httpx test-client deprecation warning only. New focused cases cover fresh warm reads, same-size tamper/missing/symlink denial after priming, expected metadata drift, changed digest on same path, path/MIME identity, result mutation isolation, bytes/symlink changes during first measurement with no cache poisoning, concurrent single measurement, leader failure/unlock/retry and bounded LRU eviction. New module's fixture clears only this private cache under its mutex before/after tests; no application reset route exists.

Actual immutable855...095 owner profiling in a new local process: cold2.416s, measuring18PNG+10MP3 into28 entries; warm0.083s and warm-again0.081s, zero further measured_media calls. Package hash unchanged. This is local file/package evidence, not a hosted latency guarantee.

Frozen source hashes:

```text
ece33ca2ea27d556f0e5b246f67f205fa41e4537068d10ab8d2661343b60a98a  platform/backend/app/services/content_pipeline.py
c22b5ee9c8e82c8aa61c04ef0dd5021ae20e83d16902e1fd1ed9b860d50ab036  platform/backend/tests/test_content_media_cache.py
```

Independent security reviewer verified both hashes and explicitly AGREED. Reviewer reports its own warm-tamper/missing/symlink/metadata/race,8-concurrent single-flight and failure-release probes passed; duration+24ms accepted/+26ms rejected, preserving tolerance. Its direct frozen package profile: cold2.4511s, warm0.0824s, three concurrent warm loads0.2881/0.2864/0.2855s with no additional18PNG/10MP3 measurements and unchanged hash. Reviewer separately reproduced82 focused cache/pipeline tests in8.33s. This paragraph is attributed reviewer evidence; owner119-test result is above.

Restrictions remain explicit: process-local128-entry metadata cache for one eagerly validated immutable edition; no bodies, binaries, identities, permissions, assignments or publication state cached. A cold miss can block warm hits on the global mutex, and wait latency is not strictly bounded across arbitrary cold files. Current hosted startup fills the fixed edition before accepting requests; multiple worker processes warm independently. No runtime cache-clear/API or changed decoder tolerance. No DB, provider/model, local preview lifecycle or production mutation was performed by owner/reviewer in this task.

Checkpoint: implementation frozen and independent security review agreed. Root/hosting owns fresh context/image/redeployment and actual three-way public readiness checks against its15s-client margin. Hosted after-change performance remains unmeasured here; do not reuse old image evidence or claim deployment complete from local tests.
