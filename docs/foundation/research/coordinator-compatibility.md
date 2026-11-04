# Coordinator compatibility check

2026-11-04. Scope: official documentation cross-check for the ported identity seam and the next existing-stack integration. No provider account or database was contacted.

The Supabase skill was read. The public changelog index was fetched with curl after the web reader rejected its Markdown content type; a documentation MCP search returned no hits. The [Python get_user reference](https://supabase.com/docs/reference/python/auth-getuser) confirms the explicit JWT method validates with the Auth server, consistent with the ported adapter. This is not evidence of Mitooni membership or a live verification run. Local verification remains the recorded synthetic SDK/transport and identity tests.

The [changelog index](https://supabase.com/changelog.md) was inspected for relevant breaking changes. Its current CLI v3 entry is relevant to future provisioning/migrations; no CLI command or migration ran here, and the linked detail page was inaccessible through the web reader. Discover installed CLI commands afresh before that later work.

The index's May 2026 [Node support notice](https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20) says Supabase JavaScript libraries end Node 20 support on June 30, 2026. The current shell does not include that SDK and was tested on Node 26; before porting the browser Auth SDK, align the receiving engine/CI baseline with supported Node 22+ rather than carrying the source's Node 20 minimum unquestioningly.

The [October TLS notice](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) identifies removal of four old TLS 1.2 CBC suites from project HTTP APIs from November 10, 2026 at the earliest. This does not change the current local port, but real Iranian device/network verification must test the eventual supported devices and TLS stack. No live project TLS configuration or operational impact was inspected.

These are dated compatibility inputs, not an instruction to upgrade or change BarEx production. Refresh them at the affected integration checkpoint.
