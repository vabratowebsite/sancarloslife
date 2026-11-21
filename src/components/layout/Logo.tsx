import Link from "next/link";

export function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const big = size === "lg";
  return (
    <Link href="/" className="inline-flex flex-col items-center no-underline">
      <span
        className={`font-heading font-bold leading-none text-teal-700 ${big ? "text-[34px]" : "text-[22px]"}`}
      >
        SanCarlos<span className="text-teal-500">Life</span>
        {big && <span className="font-sans text-sm font-normal text-ink-500">.com</span>}
      </span>
      {big && <span className="mt-1 text-xs text-ink-500">By Vabrato Real Estate</span>}
    </Link>
  );
}
