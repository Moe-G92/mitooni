import { PageHeader } from "./PageHeader";
import { useWords } from "./locale";

export default function Capability() {
  const w = useWords();
  return <PageHeader title={w.unconnected} />;
}
