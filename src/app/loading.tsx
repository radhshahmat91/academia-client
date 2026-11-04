import { LogoMark } from "@/components/shell/brand";

export default function Loading() {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-label="Loading">
      <LogoMark className="size-14 animate-pulse" />
    </div>
  );
}
