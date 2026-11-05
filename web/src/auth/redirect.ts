export function safeNext(value: string | null) {
  if (
    !value ||
    /[\\?#]/.test(value) ||
    Array.from(value).some(
      (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    )
  )
    return "/app/settings";
  return value &&
    (/^\/app(?:\/(?:settings|practice|mocks|results|progress|vocabulary|coach))?$/.test(
      value,
    ) ||
      /^\/study\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        value,
      ))
    ? value
    : "/app/settings";
}
