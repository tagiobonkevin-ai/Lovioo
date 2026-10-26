"use client";

import { ArrowDown, ArrowUp, ImageOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { adminInput } from "@/components/admin/ui";
import { isHttpsUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

/** Extra photos a product carries, beside the cover. The database allows 7 (migration 20261103000100). */
export const MAX_EXTRA_PHOTOS = 7;

/**
 * The product editor's photo slides: paste a link per photo, see it straight away, reorder or remove it.
 * The cover photo is edited separately and always leads the gallery.
 */
export function PhotoSlides({ cover, photos, onChange, disabled }: { cover: string; photos: string[]; onChange: (next: string[]) => void; disabled?: boolean }) {
  const [broken, setBroken] = useState<Record<number, boolean>>({});

  const update = (i: number, value: string) => {
    setBroken((b) => ({ ...b, [i]: false }));
    onChange(photos.map((p, n) => (n === i ? value : p)));
  };
  const remove = (i: number) => {
    setBroken({});
    onChange(photos.filter((_, n) => n !== i));
  };
  const move = (i: number, by: number) => {
    const to = i + by;
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    [next[i], next[to]] = [next[to], next[i]];
    setBroken({});
    onChange(next);
  };

  const filled = photos.filter((p) => p.trim());
  const badLink = photos.find((p) => p.trim() && !isHttpsUrl(p));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45">Photo slides</p>
        <span className="text-[11px] text-ink/40">
          {filled.length} of {MAX_EXTRA_PHOTOS} extra
        </span>
      </div>

      {/* What the shopper will swipe through: the cover first, then each extra photo. */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        <Thumb src={cover} label="Cover" />
        {photos.map((p, i) => (
          <Thumb key={i} src={p} label={`${i + 2}`} broken={broken[i]} onBroken={() => setBroken((b) => ({ ...b, [i]: true }))} />
        ))}
        {!filled.length && <p className="self-center pl-2 text-xs text-ink/45">Add photos to build a slideshow.</p>}
      </div>

      <div className="mt-3 space-y-2">
        {photos.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-[11px] text-ink/40">{i + 2}</span>
            <input
              className={cn(adminInput, "!py-2", p.trim() && !isHttpsUrl(p) && "!border-coral")}
              value={p}
              onChange={(e) => update(i, e.target.value)}
              placeholder="https://… photo link"
              aria-label={`Photo ${i + 2} link`}
              aria-invalid={!!(p.trim() && !isHttpsUrl(p))}
              disabled={disabled}
            />
            <div className="flex shrink-0 gap-1">
              <IconButton label={`Move photo ${i + 2} up`} onClick={() => move(i, -1)} disabled={disabled || i === 0}>
                <ArrowUp className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label={`Move photo ${i + 2} down`} onClick={() => move(i, 1)} disabled={disabled || i === photos.length - 1}>
                <ArrowDown className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label={`Remove photo ${i + 2}`} onClick={() => remove(i)} disabled={disabled} danger>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...photos, ""])}
        disabled={disabled || photos.length >= MAX_EXTRA_PHOTOS}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-ink/40 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" /> Add photo
      </button>

      {badLink && <p className="mt-2 text-[11px] font-medium text-coral">Every photo link must start with https://</p>}
      {Object.values(broken).some(Boolean) && (
        <p className="mt-1 text-[11px] text-[#9A5B00]">A photo marked with a broken icon didn&apos;t load. Use a direct link to a .jpg, .png or .webp file.</p>
      )}
      <p className="mt-2 text-[11px] text-ink/40">Shoppers swipe through these on the product page. The cover photo is always first.</p>
    </div>
  );
}

function Thumb({ src, label, broken, onBroken }: { src: string; label: string; broken?: boolean; onBroken?: () => void }) {
  return (
    <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/[0.04] ring-1 ring-ink/10">
      {src.trim() && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" onError={onBroken} />
      ) : (
        <span className="grid h-full w-full place-items-center text-ink/30">
          <ImageOff className="h-4 w-4" />
        </span>
      )}
      <span className="absolute bottom-0 left-0 bg-ink/75 px-1 text-[9px] font-medium text-white">{label}</span>
    </span>
  );
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full border border-ink/15 transition disabled:opacity-30",
        danger ? "text-coral hover:border-coral/50" : "text-ink/60 hover:border-ink/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
