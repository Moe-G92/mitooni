import { Link } from "react-router";
import { Logo } from "./Logo";

export function BrandMark({ to = "/app" }: { to?: string }) {
  return (
    <Link to={to} className="flex shrink-0 items-center px-2" aria-label="Bandwidth">
      <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
    </Link>
  );
}
