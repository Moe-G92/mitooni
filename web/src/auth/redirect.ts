export function safeNext(value: string | null) {
  return value &&
    /^\/app(?:\/(?:settings|practice|mocks|results|progress|vocabulary|coach))?$/.test(
      value,
    )
    ? value
    : "/app/settings";
}
