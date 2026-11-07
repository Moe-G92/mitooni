# Corpus authoring

Use Python **3.13.11** in an isolated environment. The exact tested tool closure is
[corpus-authoring.requirements.txt](corpus-authoring.requirements.txt). It includes
pip 25.3 so the bootstrap tool is reproducible. These requirements are separate
from the serving environment and application lockfile.

Run these commands from the application checkout:

```sh
umask 077
mkdir -p review/corpus-20261106
python3.13 -c 'import sys; assert sys.version_info[:3] == (3, 13, 11)'
python3.13 -m venv review/corpus-20261106/authoring-venv
review/corpus-20261106/authoring-venv/bin/python -m pip --cache-dir review/corpus-20261106/pip-cache install -r platform/backend/corpus-authoring.requirements.txt
```

The standard-library environment creation and this exact package closure were
validated locally. The initial installation used a private uv cache after an
offline cache miss; pip can install the same pinned closure using the private
cache command above. Do not install these packages into the serving environment
or change its lockfile. Package download is separate from source processing and
does not upload source files.

Run the source and admission checks without skipping native PDF validation:

```sh
PYTHONPATH=platform/backend review/corpus-20261106/authoring-venv/bin/python -m pytest -q platform/backend/tests/test_corpus_ingestion.py platform/backend/tests/test_corpus_admission.py
```

Those 26 checks passed in the pinned environment. Eight existing real admission
proofs also reproduced their original hashes, including source pixels, native
text and encoded images. Runtime and wheel/hash evidence stay in the ignored
private review directory. The research record records the tested scope and
remaining source defects; passing these checks does not approve teaching content.

Use the same interpreter for the authoring tools:

```sh
PYTHONPATH=platform/backend review/corpus-20261106/authoring-venv/bin/python platform/backend/scripts/synthesise_licensed_corpus.py --help
PYTHONPATH=platform/backend review/corpus-20261106/authoring-venv/bin/python platform/backend/scripts/plan_multimodal_corpus.py --help
PYTHONPATH=platform/backend review/corpus-20261106/authoring-venv/bin/python platform/backend/scripts/dispatch_licensed_corpus.py --help
```

Help and planning are not permission to submit requests, spend, publish or change
production. Keep source originals read-only and raw authoring data outside Git
and learner APIs. Use the accepted terminal pointer and its separate integrity
overlay, not a globally latest or nonempty extraction. Complete-source gates stay
in force; a selected-page admission binds only its exact reviewed target and
withheld dependencies.

The ingestion CLI requires locally working OCR. The tested source run used Apple
Vision on macOS, plus ffprobe for audio metadata and LibreOffice for the supplied
DOC. Those system capabilities are not installed by the Python requirements.
Missing native/OCR capabilities and source decoding failures must remain explicit
holds. Rebuildable images may be regenerated only when source/render/image hashes
match. Do not reset the private SQLite store to retry a run.

Use an owner-only private directory (0700), data files (0600) and executable tools
(0700). The ingestion CLI sets process-local umask 077; other dedicated authoring
processes should use the same private creation policy. Never alter permissions on
source originals or unrelated files.
