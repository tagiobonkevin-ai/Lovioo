import { LogoMark } from "@/components/brand/Logo";

/** Shown while a shopper page streams in, so a slow connection never flashes a blank screen. */
export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <LogoMark className="h-10 w-10 animate-pulse" />
      <p className="mt-3 text-sm text-ink/50" role="status">
        Loading…
      </p>
    </div>
  );
}
