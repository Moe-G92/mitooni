import { brand } from "@/config/brand";
import { Link } from "react-router";
import { Logo } from "./Logo";

export function BrandMark({ to = "/app", light = false }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className="flex shrink-0 items-center px-2" aria-label={brand.name}>
      <Logo light={light} className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
    </Link>
  );
}
