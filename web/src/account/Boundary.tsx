/* eslint-disable react-refresh/only-export-components -- Class boundary and local fallback are one recovery unit. */
import { Component, type ReactNode } from "react";
import { AuthShell, titleClass } from "./AuthShell";
import { ProgressPanel } from "./AuthPanel";
import { useWords } from "./locale";
import { Button } from "./Button";
function Recovery() {
  const w = useWords();
  return (
    <AuthShell panel={<ProgressPanel variant="identify" />}>
      <h1 className={titleClass}>{w.error}</h1>
      <Button className="mt-6" onClick={() => location.reload()}>
        {w.retry}
      </Button>
    </AuthShell>
  );
}
export class Boundary extends Component<
  { children: ReactNode; resetKey: number },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous: { resetKey: number }) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed)
      this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <Recovery /> : this.props.children;
  }
}
