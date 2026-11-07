import { useRef, useState } from "react";
import type { Skill } from "../contracts";
import { useLearnerClient } from "../hooks";
import { useLearnerLocale } from "../ui";
import { AccountError } from "../../request";

type Operation = { path: string; body: unknown; method: "POST" | "PATCH"; key: ReturnType<typeof crypto.randomUUID>; done: (value: unknown) => void };
export function useOperation() {
  const { client } = useLearnerClient();
  const operation = useRef<Operation | null>(null);
  const active = useRef(false);
  const uncertain = useRef(false);
  const [pending, setPending] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function execute(op: Operation) {
    if (active.current) return;
    active.current = true; setPending(true); setError(null);
    try {
      const data = await client.mutate(op.path, op.body, op.key, op.method);
      operation.current = null; uncertain.current = false; setLocked(false); op.done(data);
    } catch (failure) {
      // A transport/5xx/invalid-response failure may follow a committed write.
      // Only the original request may be dispatched until its outcome is known.
      uncertain.current = !(failure instanceof AccountError && failure.status >= 400 && failure.status < 500 && failure.status !== 408);
      setLocked(uncertain.current); setError(failure);
    } finally { active.current = false; setPending(false); }
  }
  async function run<T>(path: string, body: unknown, done: (value: T) => void, method: "POST" | "PATCH" = "POST") {
    if (active.current || uncertain.current) return;
    const signature = JSON.stringify([path, body, method]);
    const old = operation.current;
    if (!old || JSON.stringify([old.path, old.body, old.method]) !== signature) {
      // Capture immutable JSON rather than retain a mutable form object.
      operation.current = { path, body: JSON.parse(JSON.stringify(body)), method, key: crypto.randomUUID(), done: (value) => done(value as T) };
    }
    await execute(operation.current!);
  }
  async function retry() { if (operation.current) await execute(operation.current); }
  return { run, retry, pending, locked, error };
}
export function useSkillName() {
  const { text } = useLearnerLocale();
  return (skill: Skill) => ({ reading: text("خواندن", "Reading"), listening: text("شنیدن", "Listening"), writing: text("نوشتن", "Writing"), speaking: text("صحبت کردن", "Speaking") })[skill];
}
