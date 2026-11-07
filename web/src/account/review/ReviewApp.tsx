import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { useAccount } from "../state";
import { BrandMark } from "../BrandMark";
import { TopControls } from "../TopControls";
import { Button } from "../Button";
import { AccountError } from "../request";
import { ReviewClient, type Operation } from "./client";
import { type CatalogData, type SnapshotData } from "./contracts";
import { useReviewWords, valueLabel } from "./words";
import { SpeakingPanel } from "./SpeakingPanel";
import { MediaAsset } from "./MediaAsset";
import { SourceTree } from "./SourceTree";
const control =
  "min-h-11 min-w-0 rounded-[10px] border border-input bg-card px-3 py-2 text-base";
const panel = "min-w-0 rounded-card border border-border bg-card p-4 sm:p-6";
export default function ReviewApp() {
  const { session, http, epoch } = useAccount();
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const location = useLocation();
  const client = useMemo(() => new ReviewClient(http), [http]);
  const { w } = useReviewWords();
  if (snap.phase === "initializing") return <p role="status">{w.load}</p>;
  if (!snap.session)
    return (
      <Navigate
        replace
        to={`/sign-in?next=${encodeURIComponent(location.pathname)}`}
      />
    );
  return <ReviewScreen key={epoch} client={client} />;
}
function ReviewScreen({ client }: { client: ReviewClient }) {
  const { w } = useReviewWords();
  const { targetId } = useParams();
  const [denied, setDenied] = useState(false);
  const main = useRef<HTMLHeadingElement>(null);
  const deny = useCallback(() => setDenied(true), []);
  useEffect(() => {
    main.current?.focus();
  }, [targetId]);
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#review-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-3"
      >
        {w.title}
      </a>
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
        <BrandMark />
        <div className="ms-auto">
          <TopControls />
        </div>
      </header>
      <main
        id="review-main"
        className="mx-auto max-w-[1244px] px-4 py-6 [overflow-wrap:anywhere] md:px-8"
      >
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1
            ref={main}
            tabIndex={-1}
            className="font-archivo text-2xl font-extrabold text-midnight-iris md:text-3xl"
          >
            {w.title}
          </h1>
          {!targetId && (
            <Link
              className="ms-auto inline-flex min-h-11 items-center rounded-lg px-3"
              to="/app"
            >
              {w.exit}
            </Link>
          )}
        </div>
        {denied ? (
          <p role="alert">{w.denied}</p>
        ) : targetId ? (
          <Detail key={targetId} id={targetId} client={client} deny={deny} />
        ) : (
          <CatalogView client={client} deny={deny} />
        )}
      </main>
    </div>
  );
}
function CatalogView({
  client,
  deny,
}: {
  client: ReviewClient;
  deny: () => void;
}) {
  const { w } = useReviewWords();
  const [catalog, setCatalog] = useState<CatalogData | null>(null),
    [error, setError] = useState(false),
    [refresh, setRefresh] = useState(0),
    [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    track: "",
    path: "",
    skill: "",
    state: "",
  });
  useEffect(() => {
    const abort = new AbortController();
    setError(false);
    void client
      .catalog(abort.signal)
      .then((data) => {
        if (!abort.signal.aborted) setCatalog(data);
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          if (e instanceof AccountError && e.status === 403) {
            setCatalog(null);
            deny();
          } else setError(true);
        }
      });
    return () => abort.abort();
  }, [client, refresh, deny]);
  const targets =
    catalog?.targets.filter(
      (t) =>
        (!filters.track || t.examTrack === filters.track) &&
        (!filters.path || t.pathwayIds.includes(filters.path)) &&
        (!filters.skill || t.skill === filters.skill) &&
        (!filters.state || (t.decision ?? "unreviewed") === filters.state),
    ) ?? [];
  async function download() {
    setExporting(true);
    setError(false);
    try {
      const owner = client.http.session.capture();
      const data = await client.export();
      client.http.session.assert(owner);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "mitooni-content-reviews.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof AccountError && e.status === 403) {
        setCatalog(null);
        deny();
      } else setError(true);
    } finally {
      setExporting(false);
    }
  }
  return (
    <section className={panel} aria-label={w.back}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">
          {w.back}
          {catalog && (
            <span className="ms-2 text-sm font-normal tabular-nums">
              {targets.length} {w.count}
            </span>
          )}
        </h2>
        <Button
          variant="outline"
          className="ms-auto"
          disabled={!catalog || exporting}
          onClick={() => void download()}
        >
          {w.export}
        </Button>
      </div>
      <details className="mb-4">
        <summary className="min-h-11 cursor-pointer py-2">{w.filters}</summary>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["track", "path", "skill", "state"] as const).map((key) => {
            const values =
              key === "state"
                ? [
                    "unreviewed",
                    "comment",
                    "changes_needed",
                    "ready_for_editor",
                  ]
                : [
                    ...new Set(
                      catalog?.targets
                        .flatMap((t) =>
                          key === "path"
                            ? t.pathwayIds
                            : [key === "track" ? t.examTrack : t.skill],
                        )
                        .filter((v): v is string => Boolean(v)),
                    ),
                  ];
            return (
              <label key={key} className="grid gap-1 text-sm">
                {w[key]}
                <select
                  className={control}
                  value={filters[key]}
                  onChange={(e) =>
                    setFilters({ ...filters, [key]: e.target.value })
                  }
                >
                  <option value="">{w.all}</option>
                  {values.map((v) => (
                    <option key={v} value={v}>
                      {valueLabel(v, w)}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </details>
      {error && (
        <div role="alert" className="mb-4">
          <p>{w.failed}</p>
          <Button variant="outline" onClick={() => setRefresh((v) => v + 1)}>
            {w.retry}
          </Button>
        </div>
      )}
      {!catalog ? (
        <p role="status">{error ? "" : w.load}</p>
      ) : !targets.length ? (
        <p>{w.empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {targets.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold" lang="en" dir="ltr">
                  {t.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[
                    t.examTrack,
                    t.skill,
                    ...t.pathwayIds,
                    t.stage,
                    t.decision ?? "unreviewed",
                  ]
                    .filter(Boolean)
                    .map((v) => valueLabel(v!, w))
                    .join(" · ")}
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 shrink-0 items-center rounded-[10px] border border-input px-3"
                to={`/app/content-review/${encodeURIComponent(t.id)}`}
              >
                {w.open}
                <span className="sr-only"> {t.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
function Detail({
  id,
  client,
  deny,
}: {
  id: string;
  client: ReviewClient;
  deny: () => void;
}) {
  const { w } = useReviewWords();
  const navigate = useNavigate();
  const [s, setS] = useState<SnapshotData | null>(null),
    [refresh, setRefresh] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [review, setReview] = useState<NonNullable<SnapshotData["review"]>>({
      decision: "comment",
      comment: "",
      itemComments: [],
    });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<"load" | "conflict" | "uncertain" | null>(
      null,
    ),
    [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speakingBusy, setSpeakingBusy] = useState(false);
  const [speakingResults, setSpeakingResults] = useState<HTMLElement | null>(
    null,
  );
  const pending = useRef<Operation | null>(null),
    mounted = useRef(true);
  const session = client.http.session;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current = null;
    };
  }, []);
  function commit(next: SnapshotData) {
    setS(next);
    setAnswers(
      Object.fromEntries(next.draft.answers.map((a) => [a.questionId, a.text])),
    );
    setReview(
      next.review ?? { decision: "comment", comment: "", itemComments: [] },
    );
  }
  useEffect(() => {
    const abort = new AbortController();
    setError(null);
    setLoading(true);
    void client
      .target(id, abort.signal)
      .then((next) => {
        if (!abort.signal.aborted) commit(next);
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          if (e instanceof AccountError && e.status === 403) {
            setS(null);
            setAnswers({});
            pending.current = null;
            deny();
          } else setError("load");
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [client, id, refresh, deny]);
  const questions =
    s?.task.sections.flatMap((section) => section.questions) ?? [];
  const questionNumbers = new Map(questions.map((q, i) => [q.id, i + 1]));
  const dirty = Boolean(
    s &&
    questions.some(
      (q) =>
        (answers[q.id] ?? "") !==
        (s.draft.answers.find((a) => a.questionId === q.id)?.text ?? ""),
    ),
  );
  const reviewDirty = Boolean(
    s?.revealedAt &&
    JSON.stringify(review) !==
      JSON.stringify(
        s.review ?? { decision: "comment", comment: "", itemComments: [] },
      ),
  );
  async function act(action?: Operation["action"]) {
    if (!s || busy || loading) return;
    const owner = session.capture();
    if (!pending.current && action)
      pending.current = client.operation(
        s,
        action,
        action === "draft"
          ? {
              answers: questions.map((q) => ({
                questionId: q.id,
                text: answers[q.id] ?? "",
              })),
            }
          : action === "review"
            ? review
            : {},
      );
    const op = pending.current;
    if (!op) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const next = await client.mutate(op);
      session.assert(owner);
      if (mounted.current) {
        commit(next);
        pending.current = null;
        setSaved(true);
      }
    } catch (e) {
      try {
        session.assert(owner);
        if (mounted.current) {
          if (e instanceof AccountError && e.status === 403) {
            pending.current = null;
            setS(null);
            setAnswers({});
            setReview({ decision: "comment", comment: "", itemComments: [] });
            deny();
          } else if (
            e instanceof AccountError &&
            e.status >= 400 &&
            e.status < 500
          ) {
            pending.current = null;
            setError("conflict");
          } else setError("uncertain");
        }
      } catch {
        /* Old account discarded. */
      }
    } finally {
      try {
        session.assert(owner);
        if (mounted.current) setBusy(false);
      } catch {
        /* Old account. */
      }
    }
  }
  const reviewLocked =
    loading || busy || error === "uncertain" || error === "conflict";
  const locked = reviewLocked || speakingBusy;
  return (
    <>
      <Button
        variant="outline"
        disabled={locked || dirty || reviewDirty}
        onClick={() => navigate("/app/content-review")}
      >
        {w.back}
      </Button>
      {(dirty || reviewDirty) && !locked && s && (
        <Button variant="ghost" onClick={() => commit(s)}>
          {w.discard}
        </Button>
      )}
      {error && (
        <div role="alert" className="my-4">
          <p>
            {error === "conflict"
              ? w.conflict
              : error === "uncertain"
                ? w.uncertain
                : w.failed}
          </p>
          {error === "uncertain" ? (
            <Button disabled={busy} onClick={() => void act()}>
              {w.retry}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                pending.current = null;
                setRefresh((v) => v + 1);
              }}
            >
              {w.reload}
            </Button>
          )}
        </div>
      )}
      {!s ? (
        <p role="status" className="mt-4">
          {w.load}
        </p>
      ) : (
        <>
          <h2
            lang="en"
            dir="ltr"
            className="my-5 text-xl font-semibold break-words"
          >
            {s.target.title}
          </h2>
          <p role="status" className="mb-4 text-sm">
            {busy
              ? w.load
              : dirty || reviewDirty
                ? w.unsaved
                : saved
                  ? w.saved
                  : s.submission
                    ? w.submitted
                    : ""}
          </p>
          {s.target.deliveryStatus === "audio_pending" && (
            <p className="mb-4">{w.listening}</p>
          )}
          {questions.length ? (
            <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <section className={panel} lang="en" dir="ltr">
                <Instructions value={s.task.instructions} />
                {s.task.assets.map((asset) => (
                  <MediaAsset
                    key={asset.id}
                    http={client.http}
                    snapshot={s}
                    asset={asset}
                    deny={deny}
                  />
                ))}
                {s.task.sections.map((section) => (
                  <section key={section.id} className="mt-6 first:mt-0">
                    <h3 className="mb-3 text-lg font-semibold">
                      {section.title}
                    </h3>
                    <Instructions value={section.instructions} />
                    {section.minimumWords !== null && (
                      <p className="my-2">
                        Minimum {section.minimumWords} words
                      </p>
                    )}
                    {section.table && (
                      <div className="my-4 overflow-x-auto">
                        <table className="w-full text-start [overflow-wrap:normal]">
                          <caption className="mb-3 text-start">
                            {section.table.title} · {section.table.description}{" "}
                            · {section.table.unit}
                          </caption>
                          <thead>
                            <tr>
                              {section.table.columns.map((c) => (
                                <th
                                  key={c.key}
                                  scope="col"
                                  className="border-b border-border p-2 text-start"
                                >
                                  {c.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.table.rows.map((row, i) => (
                              <tr key={i}>
                                {section.table!.columns.map((c, j) =>
                                  j === 0 ? (
                                    <th
                                      key={c.key}
                                      scope="row"
                                      className="border-b border-border p-2 text-start"
                                    >
                                      {row[c.key]}
                                    </th>
                                  ) : (
                                    <td
                                      key={c.key}
                                      className="border-b border-border p-2 text-end tabular-nums"
                                    >
                                      {row[c.key]}
                                    </td>
                                  ),
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {section.text && (
                      <p className="whitespace-pre-wrap break-words leading-7">
                        {section.text}
                      </p>
                    )}
                    {section.questions.map((q) => (
                      <div key={q.id} className="mt-5">
                        <h4 className="font-semibold">
                          {questionNumbers.get(q.id)}. {q.prompt}
                        </h4>
                        {q.instructions && (
                          <p className="mt-2 whitespace-pre-wrap">
                            {q.instructions}
                          </p>
                        )}
                        {q.wordLimit !== null && (
                          <p className="mt-2 text-sm">
                            Word limit: {q.wordLimit}
                          </p>
                        )}
                        {q.options.length > 0 && (
                          <ul className="mt-2 space-y-2">
                            {q.options.map((o) => (
                              <li key={o.id}>
                                {o.id}. {o.text}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </section>
                ))}
              </section>
              <div className="min-w-0">
                {s.target.skill === "speaking" &&
                  s.task.speaking?.permissionGranted && (
                    <SpeakingPanel
                      snapshot={s}
                      http={client.http}
                      disabled={reviewLocked}
                      deny={deny}
                      onBusy={setSpeakingBusy}
                      resultsContainer={speakingResults}
                    />
                  )}
                <section className={panel}>
                  <h3 className="mb-4 text-lg font-semibold">{w.response}</h3>
                  {s.target.skill === "speaking" && (
                    <p className="mb-4">{w.speaking}</p>
                  )}
                  <fieldset
                    disabled={
                      loading ||
                      busy ||
                      error === "uncertain" ||
                      Boolean(s.submission)
                    }
                    className="space-y-5"
                  >
                    {questions.map((q) => (
                      <label key={q.id} className="grid gap-2">
                        <span lang="en" dir="ltr" className="text-sm">
                          {questionNumbers.get(q.id)}. {q.prompt}
                        </span>
                        <textarea
                          lang="en"
                          dir="ltr"
                          className={`${control} w-full resize-y`}
                          rows={
                            q.responseType === "extended_text" ||
                            q.responseType === "spoken_response"
                              ? 8
                              : 2
                          }
                          readOnly={error === "conflict"}
                          maxLength={20000}
                          value={answers[q.id] ?? ""}
                          onChange={(e) => {
                            setAnswers({ ...answers, [q.id]: e.target.value });
                            setSaved(false);
                          }}
                        />
                      </label>
                    ))}
                  </fieldset>
                  {s.submission ? (
                    <p className="mt-4">
                      {s.submission.conditions === "blind"
                        ? w.blind
                        : w.exposed}{" "}
                      · {s.submission.submittedAt}
                    </p>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        disabled={
                          locked ||
                          !dirty ||
                          Object.values(answers).reduce(
                            (n, t) => n + t.length,
                            0,
                          ) > 100000
                        }
                        onClick={() => void act("draft")}
                      >
                        {w.save}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={
                          locked ||
                          dirty ||
                          !s.draft.answers.some((a) => a.text.trim())
                        }
                        onClick={() => void act("submit")}
                      >
                        {w.submit}
                      </Button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : (
            <p className="mt-5">{w.document}</p>
          )}
          {s.target.skill === "speaking" &&
            s.task.speaking?.permissionGranted && (
              <div className="mt-6" ref={setSpeakingResults} />
            )}
          {!s.revealedAt ? (
            <section className={`${panel} mt-6`}>
              <h3 className="text-lg font-semibold">{w.notes}</h3>
              <p className="my-4">{w.revealWarning}</p>
              <Button
                disabled={locked || dirty}
                onClick={() => void act("reveal")}
              >
                {w.reveal}
              </Button>
            </section>
          ) : (
            <>
              <section className={`${panel} mt-6`}>
                <h3 className="mb-5 text-lg font-semibold">{w.notes}</h3>
                {s.privateContent && (
                  <div lang="en" dir="ltr" className="break-words">
                    <SourceTree value={s.privateContent} />
                  </div>
                )}
              </section>
              <section className={`${panel} mt-6`}>
                <h3 className="mb-4 text-lg font-semibold">{w.review}</h3>
                <fieldset
                  disabled={loading || busy || error === "uncertain"}
                  className="grid gap-4"
                >
                  <label className="grid gap-2">
                    {w.decision}
                    <select
                      className={control}
                      value={review.decision}
                      onChange={(e) =>
                        setReview({
                          ...review,
                          decision: e.target.value as typeof review.decision,
                        })
                      }
                    >
                      {(
                        [
                          "comment",
                          "changes_needed",
                          "ready_for_editor",
                        ] as const
                      ).map((d) => (
                        <option key={d} value={d}>
                          {w[d]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    {w.comment}
                    <textarea
                      dir="auto"
                      className={control}
                      rows={5}
                      readOnly={error === "conflict"}
                      maxLength={4000}
                      value={review.comment}
                      onChange={(e) =>
                        setReview({ ...review, comment: e.target.value })
                      }
                    />
                  </label>
                  <h4 className="font-semibold">{w.item}</h4>
                  {review.itemComments.map((item, i) => (
                    <div
                      key={i}
                      className="grid gap-2 border-t border-border pt-3"
                    >
                      <label className="grid gap-1">
                        {w.question}
                        <select
                          className={control}
                          value={item.itemId}
                          onChange={(e) =>
                            setReview({
                              ...review,
                              itemComments: review.itemComments.map((a, j) =>
                                j === i ? { ...a, itemId: e.target.value } : a,
                              ),
                            })
                          }
                        >
                          {[
                            s.target.id,
                            ...s.task.sections.map((section) => section.id),
                            ...questions.map((q) => q.id),
                          ]
                            .filter((v, j, a) => a.indexOf(v) === j)
                            .map((q) => (
                              <option key={q} value={q}>
                                {q}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        {w.decision}
                        <select
                          className={control}
                          value={item.decision}
                          onChange={(e) =>
                            setReview({
                              ...review,
                              itemComments: review.itemComments.map((a, j) =>
                                j === i
                                  ? {
                                      ...a,
                                      decision: e.target
                                        .value as typeof item.decision,
                                    }
                                  : a,
                              ),
                            })
                          }
                        >
                          {(
                            [
                              "comment",
                              "changes_needed",
                              "ready_for_editor",
                            ] as const
                          ).map((d) => (
                            <option key={d} value={d}>
                              {w[d]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        {w.comment}
                        <textarea
                          className={control}
                          dir="auto"
                          rows={3}
                          readOnly={error === "conflict"}
                          maxLength={4000}
                          value={item.comment}
                          onChange={(e) =>
                            setReview({
                              ...review,
                              itemComments: review.itemComments.map((a, j) =>
                                j === i ? { ...a, comment: e.target.value } : a,
                              ),
                            })
                          }
                        />
                      </label>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setReview({
                            ...review,
                            itemComments: review.itemComments.filter(
                              (_, j) => j !== i,
                            ),
                          })
                        }
                      >
                        {w.remove}
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    disabled={locked || review.itemComments.length >= 100}
                    onClick={() =>
                      setReview({
                        ...review,
                        itemComments: [
                          ...review.itemComments,
                          {
                            itemId: s.target.id,
                            comment: "",
                            decision: "comment",
                          },
                        ],
                      })
                    }
                  >
                    {w.add}
                  </Button>
                  <Button
                    disabled={
                      locked ||
                      new Set(review.itemComments.map((i) => i.itemId)).size !==
                        review.itemComments.length ||
                      review.comment.length +
                        review.itemComments.reduce(
                          (n, i) => n + i.comment.length,
                          0,
                        ) >
                        40000
                    }
                    onClick={() => void act("review")}
                  >
                    {w.reviewSave}
                  </Button>
                </fieldset>
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}
function Instructions({ value }: { value: string | string[] }) {
  return (
    <>
      {(Array.isArray(value) ? value : [value])
        .filter(Boolean)
        .map((line, i) => (
          <p key={i} className="mb-3 whitespace-pre-wrap break-words">
            {line}
          </p>
        ))}
    </>
  );
}
