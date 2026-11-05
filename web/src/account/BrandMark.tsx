import { brand } from "@/config/brand";
import { Link } from "react-router";
import { Logo } from "@/components/Logo";

export function BrandMark({
  to = "/app",
  light = false,
}: {
  to?: string;
  light?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-11 min-w-11 shrink-0 items-center px-2"
      aria-label={brand.name}
    >
      <Logo
        light={light}
        className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline"
      />
    </Link>
  );
}
