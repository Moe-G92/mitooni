# Tutor backend dependencies — 5 November 2026

Owner: dependency evidence and remediation specialist, gpt-6.1-sol / medium. Current checkpoint: approved Python dependency remediation completed and independently agreed for this exact scope. Owned scope: platform/backend/pyproject.toml, uv.lock, isolated dependency incident regression test and this record. Branch codex/foundation-review-20261104; baseline2c667827. Application/Host/privacy changes belong to the backend lead. No provider, production, credential or database action is authorized for this specialist.

The intake, initial findings and proposal below are historical pre-remediation evidence. The final remediation section supersedes their old versions and read-only ownership boundary.

## Preflight

1. A top professional would compare resolved, installed and actually imported graphs; separate introduced from inherited advisories; trace affected request/response processing instead of equating installation with exploitability; and preserve the reviewed runtime tests during remediation.
2. Rawest permitted evidence: receiving pyproject.toml/uv.lock, installed distribution metadata, source handlers/provider adapter, baseline Git objects and current maintainer advisory records. No environment files, credentials, provider calls, customer content or database reads.
3. Methods: standard-library metadata and TOML graph comparison, a trusted ephemeral Python dependency auditor with no project installation/resolution, official advisory verification and bounded static API-path tracing. The implementer confirmed a stable package/lock window and reported170 passing tests; this reviewer will not touch the shared database or invent an independent runtime rerun.
4. Independent proof: exact installed/lock versions, dated successful audit results with explicit source/coverage limits, affected API paths and exact tested configuration. An unreachable optional feature is a scoped exposure observation, not a blanket security claim.

## Intake

Current root/app instructions were read. Backend implementer confirms package/lock stability: openai2.21.0 and openai-agents0.9.3 retained, temporary unused ChatKit/Jinja2/MarkupSafe removed. Relative to baseline2c667827, the first lock comparison reports20 added packages, no version changes and no removals; temporary additions/removals within this checkpoint must not be presented as removals from that baseline. Installed Python is3.13.11. An initial uv pip list failed because its default cache location was outside the permitted path; standard-library importlib.metadata provided the installed inventory without mutating the environment.


## Audit result and exact receiving scope

Audit completed on5 November2026, before the15:45:51UTC local reachability probe. pip-audit2.10.1, PyPI advisory service, exact pinned requirements, --no-deps --disable-pip: installed78 distributions and baseline60 locked package versions each return71 records in14 packages. Deduplicating by (canonical package name, advisory ID) yields46 IDs in each scope; the two sets are identical. No installed finding was introduced by the new OpenAI/Agents packages. No package was skipped. Duplicate feed records explain the raw71; this is not71 distinct vulnerabilities or an exploit count.

The current universal lock has80 external package names/81 name-version pairs, plus the local root. Compared with2c667827:20 new names, no retained-name version changes, no baseline removals. Installed Python3.13.11 selects MCP1.30.0. Python>=3.14 selects MCP1.27.2 because the frozen FastAPI/Starlette constraints otherwise conflict; this alternate version adds five unique advisory IDs (six feed records). Windows-only pywin32312 has no returned findings; unchanged Windows-only tzdata2026.6 was covered by the baseline audit. Thus the installed audit alone would miss the new vulnerable alternate branch. SDKs OpenAI2.21.0, Agents0.9.3, MCP1.30.0 and python-multipart0.0.33 return no known finding in this feed.

Audited source hashes: pyproject.toml a602c972b779472f2f8b96667ee8a6eb8812a6e7fe6d5759d394749307d6af3a; uv.lock e80486a676f623217cb17cfae93ce1467cc2d698f03b82e615e36348b6eff89d. These describe the pre-remediation receiving graph, not a future patch. No environment/credential/provider/database read occurred.

## Reachable mechanisms and limits

- **Starlette URL reconstruction reaches actual privacy behavior.** app/main.py classifies private paths and sanitized error responses via request.url.path. The maintainer Host-poisoning advisory affects that property. With network disabled, actual TestClient(create_app()) GET /api/me with an ordinary synthetic Host returns503 plus Cache-Control:private,no-store and Vary:Authorization. A malformed synthetic Host makes the same request return503 without either header. A separate Request object demonstrates raw scope path /api/study/journey versus reconstructed /health. Authentication stays bound to route dependencies and still fails closed; no authorization bypass or customer-data exposure was demonstrated. Replace classification with scope['path'] and reject malformed Host independently, then preserve a regression for both headers and sanitized errors.
- **TLS trust is a real configured transport boundary.** Certifi's compromised emSign-root advisory is rated critical by the maintainer and fixed2026.10.18. HTTPX's default TLS verification uses this trust bundle; configured identity and future allowed provider HTTPS paths can reach it. No real TLS/provider call was made. AnyIO's critical internationalized-host handling requires non-ASCII targets; current provider origin is fixedASCII and the Supabase origin is explicit configuration, so no learner-controlled internationalized-target path was established. Its separate subprocess-pool issue was not exercised.
- **Current learner APIs use JSON DTOs.** app/routers/account.py and study.py receive Pydantic bodies; study text/message caps are20,000/3,000 characters and additional candidate/collection limits apply. Those checks occur after JSON decoding. This is not evidence of an upstream HTTP body-byte limit; proxy/body-budget behavior remains unverified. No Form/UploadFile/request.form, StaticFiles/FileResponse or class HTTPEndpoint surface is configured in the receiving application, so the corresponding multipart, range/static and class-dispatch Starlette mechanisms were not reached. This limits exposure, not the package advisory inventory.
- **Provider path is constrained JSON/SSE, not arbitrary tool transport.** app/providers/agents_runner.py prepares a bounded allowlisted JSON projection (65,536-byte aggregate input), uses explicit OpenAIResponsesModel/Runner.run_streamed, disables tracing, uses trust_env=False for its client, and validates a typed candidate. Its tools are only approved_anchor, learning_snapshot and next_options. No MCP server/client is configured; the new MCP advisories need those specific transports, bearer verifier or remote tool-schema resolver. MCP merely being installed is not evidence those paths are invoked. The Python>=3.14 branch still needs remediation because unsupported future configuration must not silently inherit known vulnerable code.
- **PyJWT findings do not establish a receiving verifier bypass.** The identity verifier calls Supabase auth.get_user(token), whose installed implementation performs a remote GET user using the token; receiving code does not call PyJWT.decode/PyJWKClient/get_claims or reuse a mutable decode options dictionary. The installed SDK imports cryptographic helpers and contains optional local-claim paths, but those are not the selected receiving verification method. Cryptography's certificate/PKCS7/buffer/wheel-OpenSSL findings therefore need feature-specific follow-up; HTTPX TLS is Python ssl rather than proof that PyCA's optional certificate-verifier API is used.
- **Inherited storage/formatting/test chains remain installed.** Supabase→storage3→pyiceberg brings fsspec, Requests/urllib3 and rich/Pygments. No receiving API exposes arbitrary reference-filesystem JSON, uploaded source lexing, ZIP trust-bundle extraction or multidict items-view set operations. HTTP/2 is disabled on the REST transport and not enabled in the new Agents HTTPX client; h2/hpack server-header attack paths were not observed. pytest is development/testing, with a local temp-directory attack advisory. No reachability claim here is an exhaustive whole-package call-graph proof.

## Bounded remediation proposal for remaining foundations

This is necessary foundation work before exposed/provider-enabled acceptance, not a deferred post-release note. Do not treat the earlier frontend zero-audit result as covering this Python closure.

1. Preserve the current170-pass functional proof (implementer-reported32studyPG+31accountPG+107unit/provider/mock checks). First fix the locally reproduced raw-path/privacy behavior with synthetic Host/error regressions. Keep identity/ownership and private response contracts unchanged.
2. Change inherited pinned constraints to the minimum finite patched floors covering the reported mechanisms: anyio4.14.2, certifi2026.10.18, cryptography50.0.0, fsspec2026.6.0, h24.4.1, hpack4.2.0, idna3.15, multidict6.9.1, Pygments2.20.0, PyJWT2.15.0, pytest9.0.3, Requests2.33.0, urllib32.8.0 and Starlette1.3.1. These are candidate security floors, not an assertion of API compatibility; cryptography/framework major changes and pytest major changes require reviewed regression evidence. One PyJWT advisory reports no explicit patched version; candidate2.15 must be re-audited rather than advertised as fixing an unpatched issue by assumption.
3. FastAPI0.115.14 requires Starlette<0.47, so overriding only Starlette would violate its declared contract. Official metadata: FastAPI0.131/0.132 retain Starlette<1, FastAPI0.133.0 removes that cap (>=0.40), and0.134+ start at>=0.46. Candidate **FastAPI0.133.0 + Starlette1.3.1 + MCP1.30.0** is the smallest uncapped release boundary verified in this focused comparison; it avoids latest FastAPI0.162's additional mandatory OpenTelemetry dependency. Verify metadata-only resolution for all advertised Python branches, then install/test in an isolated receiving environment before adoption. A successful resolver is not runtime compatibility evidence.
4. If the framework transition cannot be safely completed, an honest temporary alternative is a tested Python<3.14 range plus explicit MCP1.30 constraint and raw-path/Host mitigation; this removes the untested vulnerable MCP alternate branch while retaining unresolved inherited framework findings. It is not a zero-audit solution or permission to expose unsafe optional features. Exact Python3.11 and3.14 runtime behavior has not been tested in this review; installed3.13.11 is the observed runtime.
5. After approved changes: repeat installed and all-marker advisory audits; verify no unexpected dependency/extra addition; reproduce the full170-test suite and real local PG boundary checks via their owner, identity/DTO/provider mock tests, fresh Host/privacy tests, and check disabled trace/log behavior. No live provider, native/model build, database reset by this specialist, or blanket upgrade is authorized.

## Fourteen inherited package findings

Severity below is the maximum current GitHub advisory severity for the package, not an application-level exploitability rating. All14 are inherited relative to2c667827. The next section maps every one of46 unique IDs to severity and first patched version from official GitHub advisory metadata fetched5 November.

| Package | Installed | Unique IDs | Maximum severity | Candidate floor / caveat |
| --- | --- | --- | --- | --- |
| anyio | 4.12.1 | 2 | critical | 4.14.2 |
| certifi | 2026.1.4 | 1 | critical | 2026.10.18 |
| cryptography | 46.0.5 | 6 | high | 50.0.0 (major transition) |
| fsspec | 2026.2.0 | 1 | high | 2026.6.0 |
| h2 | 4.3.0 | 1 | medium | 4.4.1 |
| hpack | 4.1.0 | 1 | medium | 4.2.0 |
| idna | 3.11 | 1 | medium | 3.15 |
| multidict | 6.7.1 | 1 | medium | 6.9.1 |
| pygments | 2.19.2 | 1 | low | 2.20.0 |
| pyjwt | 2.11.0 | 17 | critical | 2.15.0; one advisory lists no patch |
| pytest | 8.4.2 | 1 | medium | 9.0.3 (test dependency) |
| requests | 2.32.5 | 1 | medium | 2.33.0 |
| starlette | 0.46.2 | 7 | high | 1.3.1 (requires framework transition) |
| urllib3 | 2.6.3 | 5 | high | 2.8.0 |

## Exact46-ID severity and patch map

ID aliases and metadata are retained so the feed duplicates cannot inflate the count. “None listed” preserves the source gap; a fix floor is not a compatibility approval.

| Package | Audit ID / official advisory | Severity | First patched version |
| --- | --- | --- | --- |
| anyio | PYSEC-2026-4024; [GHSA-5p39-cfhj-2xmp](https://github.com/advisories/GHSA-5p39-cfhj-2xmp) | medium | 4.14.2 |
| anyio | PYSEC-2026-4025; [GHSA-82r6-8w77-94w6](https://github.com/advisories/GHSA-82r6-8w77-94w6) | critical | 4.14.2 |
| certifi | PYSEC-2026-4320; [GHSA-6q48-6c7w-9gw2](https://github.com/advisories/GHSA-6q48-6c7w-9gw2) | critical | 2026.10.18 |
| cryptography | GHSA-537c-gmf6-5ccf; [GHSA-537c-gmf6-5ccf](https://github.com/advisories/GHSA-537c-gmf6-5ccf) | high | 48.0.1 |
| cryptography | PYSEC-2026-35; [GHSA-m959-cc7f-wv43](https://github.com/advisories/GHSA-m959-cc7f-wv43) | low | 46.0.6 |
| cryptography | PYSEC-2026-3552; [GHSA-g6cj-pr64-35w5](https://github.com/advisories/GHSA-g6cj-pr64-35w5) | high | 50.0.0 |
| cryptography | PYSEC-2026-3553; [GHSA-jwv3-5hgf-82ww](https://github.com/advisories/GHSA-jwv3-5hgf-82ww) | high | 49.0.0 |
| cryptography | PYSEC-2026-3554; [GHSA-m2h6-j472-rp4c](https://github.com/advisories/GHSA-m2h6-j472-rp4c) | medium | 49.0.0 |
| cryptography | PYSEC-2026-36; [GHSA-p423-j2cm-9vmq](https://github.com/advisories/GHSA-p423-j2cm-9vmq) | medium | 46.0.7 |
| fsspec | PYSEC-2026-4217; [GHSA-27vj-qcqg-25rc](https://github.com/advisories/GHSA-27vj-qcqg-25rc) | high | 2026.6.0 |
| h2 | PYSEC-2026-3628; [GHSA-6hr6-w5qg-qmwg](https://github.com/advisories/GHSA-6hr6-w5qg-qmwg) | medium | 4.4.1 |
| hpack | PYSEC-2026-4053; [GHSA-8v8h-hg4w-mvq2](https://github.com/advisories/GHSA-8v8h-hg4w-mvq2) | medium | 4.2.0 |
| idna | PYSEC-2026-215; [GHSA-65pc-fj4g-8rjx](https://github.com/advisories/GHSA-65pc-fj4g-8rjx) | medium | 3.15 |
| multidict | PYSEC-2026-4244; [GHSA-54p9-h82j-f925](https://github.com/advisories/GHSA-54p9-h82j-f925) | medium | 6.9.1 |
| pygments | PYSEC-2026-2987; [GHSA-5239-wwwm-4pmq](https://github.com/advisories/GHSA-5239-wwwm-4pmq) | low | 2.20.0 |
| pyjwt | GHSA-pxh4-856f-4h89; [GHSA-pxh4-856f-4h89](https://github.com/advisories/GHSA-pxh4-856f-4h89) | high | 2.14.0 |
| pyjwt | PYSEC-2026-120; [GHSA-752w-5fwx-jx9f](https://github.com/advisories/GHSA-752w-5fwx-jx9f) | high | 2.12.0 |
| pyjwt | PYSEC-2026-175; [GHSA-993g-76c3-p5m4](https://github.com/advisories/GHSA-993g-76c3-p5m4) | medium | 2.13.0 |
| pyjwt | PYSEC-2026-176; [GHSA-jq35-7prp-9v3f](https://github.com/advisories/GHSA-jq35-7prp-9v3f) | medium | 2.13.0 |
| pyjwt | PYSEC-2026-177; [GHSA-fhv5-28vv-h8m8](https://github.com/advisories/GHSA-fhv5-28vv-h8m8) | low | 2.13.0 |
| pyjwt | PYSEC-2026-178; [GHSA-w7vc-732c-9m39](https://github.com/advisories/GHSA-w7vc-732c-9m39) | medium | 2.13.0 |
| pyjwt | PYSEC-2026-179; [GHSA-xgmm-8j9v-c9wx](https://github.com/advisories/GHSA-xgmm-8j9v-c9wx) | high | 2.13.0 |
| pyjwt | PYSEC-2026-4140; [GHSA-2gx3-rcp4-g85q](https://github.com/advisories/GHSA-2gx3-rcp4-g85q) | medium | 2.14.0 |
| pyjwt | PYSEC-2026-4141; [GHSA-42vr-xj54-vc7v](https://github.com/advisories/GHSA-42vr-xj54-vc7v) | medium | 2.15.0 |
| pyjwt | PYSEC-2026-4144; [GHSA-9v7f-9g4p-ffgj](https://github.com/advisories/GHSA-9v7f-9g4p-ffgj) | high | 2.14.0 |
| pyjwt | PYSEC-2026-4145; [GHSA-ffc3-869f-jxw9](https://github.com/advisories/GHSA-ffc3-869f-jxw9) | critical | 2.14.0 |
| pyjwt | PYSEC-2026-4146; [GHSA-gvp8-978c-rx2q](https://github.com/advisories/GHSA-gvp8-978c-rx2q) | medium | None listed |
| pyjwt | PYSEC-2026-4147; [GHSA-hxm8-2xgr-2p9m](https://github.com/advisories/GHSA-hxm8-2xgr-2p9m) | medium | 2.14.0 |
| pyjwt | PYSEC-2026-4148; [GHSA-jwrc-g2q2-pq5p](https://github.com/advisories/GHSA-jwrc-g2q2-pq5p) | medium | 2.14.0 |
| pyjwt | PYSEC-2026-4149; [GHSA-p4g4-x82p-q773](https://github.com/advisories/GHSA-p4g4-x82p-q773) | high | 2.14.0 |
| pyjwt | PYSEC-2026-4152; [GHSA-w6j9-cwv2-h6wq](https://github.com/advisories/GHSA-w6j9-cwv2-h6wq) | medium | 2.14.0 |
| pyjwt | PYSEC-2026-4183; [GHSA-x33g-cr3x-6449](https://github.com/advisories/GHSA-x33g-cr3x-6449) | medium | 2.15.0 |
| pytest | PYSEC-2026-1845; [GHSA-6w46-j5rx-g56g](https://github.com/advisories/GHSA-6w46-j5rx-g56g) | medium | 9.0.3 |
| requests | PYSEC-2026-2275; [GHSA-gc5v-m9x4-r6x2](https://github.com/advisories/GHSA-gc5v-m9x4-r6x2) | medium | 2.33.0 |
| starlette | PYSEC-2026-161; [GHSA-86qp-5c8j-p5mr](https://github.com/advisories/GHSA-86qp-5c8j-p5mr) | medium | 1.0.1 |
| starlette | PYSEC-2026-1941; [GHSA-2c2j-9gv5-cj73](https://github.com/advisories/GHSA-2c2j-9gv5-cj73) | medium | 0.47.2 |
| starlette | PYSEC-2026-1942; [GHSA-7f5h-v6xp-fcq8](https://github.com/advisories/GHSA-7f5h-v6xp-fcq8) | high | 0.49.1 |
| starlette | PYSEC-2026-2280; [GHSA-x746-7m8f-x49c](https://github.com/advisories/GHSA-x746-7m8f-x49c) | medium | 1.1.0 |
| starlette | PYSEC-2026-2281; [GHSA-wqp7-x3pw-xc5r](https://github.com/advisories/GHSA-wqp7-x3pw-xc5r) | high | 1.1.0 |
| starlette | PYSEC-2026-248; [GHSA-jp82-jpqv-5vv3](https://github.com/advisories/GHSA-jp82-jpqv-5vv3) | low | 1.3.0 |
| starlette | PYSEC-2026-249; [GHSA-82w8-qh3p-5jfq](https://github.com/advisories/GHSA-82w8-qh3p-5jfq) | high | 1.3.1 |
| urllib3 | PYSEC-2026-141; [GHSA-qccp-gfcp-xxvc](https://github.com/advisories/GHSA-qccp-gfcp-xxvc) | high | 2.7.0 |
| urllib3 | PYSEC-2026-142; [GHSA-mf9v-mfxr-j63j](https://github.com/advisories/GHSA-mf9v-mfxr-j63j) | high | 2.7.0 |
| urllib3 | PYSEC-2026-4175; [GHSA-8988-9cw3-xx77](https://github.com/advisories/GHSA-8988-9cw3-xx77) | high | 2.8.0 |
| urllib3 | PYSEC-2026-4176; [GHSA-gh4c-6fx4-qh6g](https://github.com/advisories/GHSA-gh4c-6fx4-qh6g) | medium | 2.8.0 |
| urllib3 | PYSEC-2026-4177; [GHSA-vxq7-64xx-v4gw](https://github.com/advisories/GHSA-vxq7-64xx-v4gw) | high | 2.8.0 |

## Introduced alternate-Python MCP findings

These five unique IDs apply to locked MCP1.27.2 under Python>=3.14, not installed MCP1.30.0 on3.13. The receiving application configures no MCP transport.

| Audit ID / advisory | Severity | First patched1.x | Mechanism |
| --- | --- | --- | --- |
| CVE-2026-116684; [GHSA-w4fh-qvv9-3v23](https://github.com/advisories/GHSA-w4fh-qvv9-3v23) | medium | 1.30.0 | resource-server token audience checking |
| CVE-2026-116685; [GHSA-5h93-6whr-6q8j](https://github.com/advisories/GHSA-5h93-6whr-6q8j) | medium | 1.30.0 | cross-origin HTTP redirect headers/bodies |
| CVE-2026-116686; [GHSA-rwrf-2pqf-9j8j](https://github.com/advisories/GHSA-rwrf-2pqf-9j8j) | medium | 1.30.0 | remote tool-schema reference URL/file resolution |
| CVE-2026-59951; [GHSA-84m7-p3x7-pcfv](https://github.com/advisories/GHSA-84m7-p3x7-pcfv) | medium | 1.30.0 | stateful HTTP session retention |
| PYSEC-2026-3483; [GHSA-vj7q-gjh5-988w](https://github.com/advisories/GHSA-vj7q-gjh5-988w) | high | 1.28.1 | deprecated WebSocket Host/Origin validation |

## Method, successful and abandoned checks

The isolated auditor was fetched into task-owned temporary storage with uv tool run --isolated --no-config --no-env-file --no-build; no project dependency was installed or resolved by the audit. Requirements were generated from importlib.metadata for installed78 and from baseline Git TOML for60, exact name==version pins. pip-audit used --no-deps --disable-pip, --format json, an explicit temporary HTTP cache and output path, no --fix. GitHub advisory API metadata independently supplies51 GHSA severity/patch records (46 current+five alternate); all lookups succeeded. Framework versions were read from official PyPI release metadata. This is a time-bounded known-advisory check, not exhaustive security assurance.

The initial all-marker requirements file flattened both MCP versions without markers; pip-audit rejected that duplicate. Auditing actual installed closure and the alternate marker versions separately corrected the method. An initial default uv metadata command failed on a protected default cache; the standard-library inventory and explicit task cache resolved it. No failed collection was called a clean audit. A temporary framework metadata helper had a missing import after returning its data; it was corrected and rerun. No project file was involved.

Reproduce against a stable graph: generate exact installed requirements with the receiving .venv's importlib.metadata; audit them using the isolated pip-audit2.10.1 command above, then separately audit the other versioned marker branches from uv.lock. Normalize names and deduplicate by(package,ID), preserve raw record counts and skip/error states. Compare to git show2c667827:platform/backend/uv.lock using TOML, retaining multiple versions per name. Temporary source/audit JSON and inventories are under /private/tmp/mitooni-backend-dependency-audit; this record preserves the durable findings and versions if temporary data is cleaned.

The implementer's170-pass suite is preserved as reported functional evidence, not independently rerun by this dependency reviewer. Only the tiny network-disabled ASGI/Request probes were executed here; no shared PostgreSQL fixture or provider was contacted. No files outside this assigned report and ephemeral temporary artifacts were changed.

## Exact installed inventory

```text
PyJWT==2.11.0
Pygments==2.19.2
StrEnum==0.4.15
annotated-types==0.7.0
anyio==4.12.1
attrs==26.1.0
cachetools==6.2.6
certifi==2026.1.4
cffi==2.0.0
charset-normalizer==3.4.4
click==8.3.1
colorama==0.4.6
cryptography==46.0.5
deprecation==2.1.0
distro==1.9.0
fastapi==0.115.14
fsspec==2026.2.0
griffe==1.15.0
h11==0.16.0
h2==4.3.0
hpack==4.1.0
httpcore==1.0.9
httpx-sse==0.4.3
httpx==0.28.1
hyperframe==6.1.0
idna==3.11
iniconfig==2.3.0
jiter==0.18.0
jsonschema-specifications==2025.9.1
jsonschema==4.26.0
markdown-it-py==4.0.0
mcp==1.30.0
mdurl==0.1.2
mmh3==5.2.0
multidict==6.7.1
openai-agents==0.9.3
openai==2.21.0
packaging==26.0
pluggy==1.6.0
postgrest==2.28.0
propcache==0.4.1
psycopg-binary==3.2.13
psycopg==3.2.13
pycparser==3.0
pydantic-settings==2.16.2
pydantic==2.12.5
pydantic_core==2.41.5
pyiceberg==0.11.0
pyparsing==3.3.2
pyroaring==1.0.3
pytest==8.4.2
python-dateutil==2.9.0.post0
python-dotenv==1.2.4
python-multipart==0.0.33
realtime==2.28.0
referencing==0.37.0
requests==2.32.5
rich==14.3.3
rpds-py==2026.9.1
six==1.17.0
sniffio==1.3.1
sse-starlette==3.0.3
starlette==0.46.2
storage3==2.28.0
strictyaml==1.7.3
supabase-auth==2.28.0
supabase-functions==2.28.0
supabase==2.28.0
tenacity==9.1.4
tqdm==4.70.1
types-requests==2.33.0.20261030
typing-inspection==0.4.2
typing_extensions==4.15.0
urllib3==2.6.3
uvicorn==0.36.1
websockets==15.0.1
yarl==1.22.0
zstandard==0.25.0
```

Historical read-only checkpoint: material findings and concrete candidate changes were sent before mutation. The coordinator subsequently authorized the bounded remediation below; this historical stop state no longer describes the receiving files.


## Authorized remediation and final receiving evidence

On 5 November 2026 the coordinator approved the minimal reviewed security-floor experiment and transferred exclusive manifest/lock ownership to this specialist. Four preflight answers above remain applicable; the methods expanded to isolated wheels-only resolution/install, actual SDK/framework regression checks and a second all-marker audit. Acceptance requires compatible declared constraints, no vulnerable hidden marker branch, installed and universal audits with no known findings/skips, receiving regression coverage and independent review. This is a dependency checkpoint, not general product or release approval.

The adopted changes are exactly the fourteen candidate floors documented above, FastAPI0.133.0 for declared Starlette1.3.1 compatibility, MCP1.30.0 on every supported branch and one required new transitive package annotated-doc0.0.2. Explicit sse-starlette3.0.3 preserves the existing reviewed dependency instead of accepting an unrelated resolver upgrade to3.6.0. Existing OpenAI2.21.0, openai-agents0.9.3, HTTPX0.28.1, Supabase2.28.0, Pydantic2.12.5/core2.41.5, psycopg3.2.13, PyIceberg0.11.0 and uvicorn0.36.1 remain unchanged. No capability was removed to obtain an empty audit.

The approved Python range is **>=3.11,<3.14**. Python3.13.11 was executed. Python3.11/3.12 are metadata-resolved only, without runtime validation; no matching installed interpreters were available. An actual existing Python3.14.3 wheels-only installation attempt failed because inherited PyIceberg0.11.0 has no suitable wheel. No source/native build or Python download was attempted. The coordinator chose an explicit support boundary rather than an unrelated PyIceberg capability upgrade. This boundary is not used to hide advisory findings: every remaining universal package/version pair is audited. The lock contains only MCP1.30.0, with no vulnerable1.27.2 alternate.

Observed final dependency delta from the pre-remediation receiving graph:

| Package | Before | Final |
| --- | --- | --- |
| anyio | 4.12.1 | 4.14.2 |
| certifi | 2026.1.4 | 2026.10.18 |
| cryptography | 46.0.5 | 50.0.0 |
| fastapi | 0.115.14 | 0.133.0 |
| fsspec | 2026.2.0 | 2026.6.0 |
| h2 | 4.3.0 | 4.4.1 |
| hpack | 4.1.0 | 4.2.0 |
| idna | 3.11 | 3.15 |
| multidict | 6.7.1 | 6.9.1 |
| pygments | 2.19.2 | 2.20.0 |
| pyjwt | 2.11.0 | 2.15.0 |
| pytest | 8.4.2 | 9.0.3 |
| requests | 2.32.5 | 2.33.0 |
| starlette | 0.46.2 | 1.3.1 |
| urllib3 | 2.6.3 | 2.8.0 |
| annotated-doc | absent | 0.0.2 |
| mcp alternate | 1.27.2 on >=3.14 | absent; supported branches retain1.30.0 |

### Reproducible commands and results

All commands run in platform/backend unless a project path is explicit. The isolated auditor installs only a trusted check tool into task-only temporary cache; requirements auditing disables package installation/resolution. Wheel-only install avoids executing dependency build scripts. No environment-file, model, provider or production action occurred.

```sh
uv lock --project /private/tmp/mitooni-backend-dependency-candidate --no-config --no-build --no-python-downloads --cache-dir /private/tmp/mitooni-backend-audit-cache --python /Users/arashshahrokhi/Projects/mitooni/app/platform/backend/.venv/bin/python
uv sync --frozen --no-config --no-build --no-python-downloads --cache-dir /private/tmp/mitooni-backend-audit-cache --python .venv/bin/python
uv lock --no-config --no-build --no-python-downloads --cache-dir /private/tmp/mitooni-backend-audit-cache --python .venv/bin/python --offline
uv pip check --python .venv/bin/python --cache-dir /private/tmp/mitooni-backend-audit-cache
.venv/bin/python -m pytest -q tests/test_dependency_security.py
uv tool run --isolated --no-config --no-env-file --no-build --cache-dir /private/tmp/mitooni-backend-audit-cache --from pip-audit==2.10.1 pip-audit -r /private/tmp/mitooni-backend-dependency-audit/final-universal.txt --no-deps --disable-pip --format json --progress-spinner off --cache-dir /private/tmp/mitooni-backend-dependency-audit/http-final-universal --output /private/tmp/mitooni-backend-dependency-audit/final-universal.json
```

The analogous audit used final-installed.txt, http-final-installed and final-installed.json. Input generation uses importlib.metadata distributions for installed pins and all non-root uv.lock package name/version pairs for universal pins; sorted canonical names deduplicate exact pairs without evaluating away alternate markers.

- Isolated Python3.13.11 candidate: successful universal resolution, successful frozen wheels-only installation and107 unit/provider/mock tests passed before receiving adoption. Provider tests use actual SDK with denied external transport; this is not a live model call.
- Receiving frozen install: successful,79 installed distributions; compatibility check reports all installed packages compatible. Final range-only offline lock regeneration resolved82 entries including root;81 external pairs. An initially restricted offline lock invocation panicked in macOS system-configuration; the same command with permitted execution succeeded. This was a tool-environment failure, not a failed compatibility check.
- Fresh5 November2026 PyPI advisory audits: installed79 entries **0 known findings,0 skips**; universal81 external name/version entries **0 known findings,0 skips**. These are successful feed observations, not proof no unknown vulnerability exists. All previously observed46 inherited unique IDs and five alternate-MCP IDs are absent from the final feed results; the historical exact severity/fix map remains above.
- The final range-only regenerated universal pins were byte-identical to the audited pins. After interruption, actual Python3.13.11,79 installed distributions, final hashes, universal81 count and saved successful audit coverage were rechecked. Canonical actual installed79 name/version pairs also exactly matched the audited input, rather than merely matching its count. git diff --check passed for both manifests. The three incident regressions were rerun:3 passed in0.07sec.
- Incident regressions cover PyJWT unverified decode not mutating later verification policy, removal of compromised emSign trust roots while SSL still loads the bundle, and no universal MCP fallback below1.30.0. The PyJWT2.15.0 behavioral check supplements the advisory's ambiguous patched-version metadata; an empty feed alone was not treated as proof of the mechanism.
- Backend integration owner reported271 tests passed in7.21sec on the patched receiving framework/SDK with actual local PostgreSQL, including the three dependency tests and new Host/privacy/resume regressions. One Starlette TestClient/httpx deprecation warning remains; no gratuitous httpx2 change was made. This first result is owner-attributed. After recovery, security_finish independently reproduced271 passed in6.88sec against the patched local PostgreSQL/SDK configuration, including the three incident regressions, and verified an actual database restart.

Final hashes, reverified after interruption:

```text
platform/backend/pyproject.toml da219d2edd9b67aa7505b3ecf8ef72de6cef880fb591b83eb4c20ce39454c771
platform/backend/uv.lock aae8937fb72a0c28db40b7aa1b15fe74d6eb74a074baa1178a70be227e7bc585
platform/backend/tests/test_dependency_security.py 1a6c0f8cfec8fbdbfe6c885c1bb90159ac7f2703cd1c320351e8872048af4fc2
```

### Remaining evidence and restart

Manifest, lock and environment are frozen for the integration lead and independent reviewer. Independent security_finish regenerated installed79 and universal81 inventories, confirmed canonical version identity with the owner inputs and exact manifest/lock hashes, and freshly reproduced both PyPI pip-audit2.10.1 audits:0 findings,0 skips. The reviewer explicitly recorded AGREED for this final dependency scope and independently reproduced271 tests plus actual database restart. See the independent security research record for its complete application/provider/privacy scope; this report does not transfer that verdict to unreviewed configurations. No exact3.11/3.12 runtime, other operating system, live TLS/provider, hosted deployment, teaching efficacy or general untrusted-input claim is made. Host/privacy application remediation is separately owned and reviewed; the old reachable failure above remains historical reproduction, not an assertion that the final app still fails.

Restart from this record, current pyproject/uv.lock hashes, the current tutor checkpoint and independent security record. Temporary audit artifacts are under /private/tmp/mitooni-backend-dependency-audit; regenerate inventories from actual files before repeating current-feed audits. Coordinate any local database test window with the integration lead. Do not silently widen Python support or change pins after review. No staging, commit, merge, provider call or release is authorized by this checkpoint.


Final stop state: bounded dependency remediation complete, independent scoped agreement received; manifest/lock/environment remain frozen for coordinator integration. No dependency residual with an available upstream fix remains in the successful current-feed installed or universal audit. Unknown vulnerabilities and the explicit runtime/platform/provider limitations above remain. Coordinator owns overall engineering acceptance and Arash retains separate release approval.
