import type { Message, Workspace } from "./contracts";
// Python offsets count Unicode codepoints, not UTF-16 code units.
export function codepointQuote(text: string, start: number, end: number) {
  return Array.from(text).slice(start, end).join("");
}
export function messageMatchesCurrentWork(
  message: Message,
  workspace: Workspace,
) {
  if (
    message.workspaceId !== workspace.id ||
    JSON.stringify(message.provenance.bundleRef) !==
      JSON.stringify(workspace.bundleRef)
  )
    return false;
  if (
    message.provenance.contextManifestId === workspace.contextManifestId &&
    message.citations.some(
      (citation) =>
        !workspace.task.anchors.some(
          (anchor) => anchor.id === citation.anchorId,
        ),
    )
  )
    return false;
  const ref = message.provenance.workRef;
  const current =
    ref.kind === "draft" &&
    ref.id === workspace.draft.id &&
    ref.revision === workspace.draft.revision
      ? workspace.draft.text
      : ref.kind === "attempt" &&
          ref.id === workspace.attempt.id &&
          ref.revision === workspace.attempt.draftRevision
        ? workspace.attempt.responseSnapshot
        : null;
  // Historical spans were validated against their frozen server-owned snapshot at commit.
  return (
    current === null ||
    message.workSpans.every(
      (span) =>
        span.end <= Array.from(current).length &&
        codepointQuote(current, span.start, span.end) === span.quote,
    )
  );
}
