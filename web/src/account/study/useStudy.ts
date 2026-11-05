import { useMemo } from "react";
import { useAccount } from "../state";
import { StudyClient } from "./client";
export function useStudy() {
  const account = useAccount();
  const client = useMemo(() => new StudyClient(account.http), [account.http]);
  return { ...account, client };
}
