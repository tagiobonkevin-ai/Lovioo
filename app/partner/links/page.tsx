"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useAdminQuery } from "@/components/admin/useAdmin";
import { PageHeader, Panel } from "@/components/admin/ui";
import { usePartner } from "@/components/partner/PartnerShell";
import { SITE_URL } from "@/lib/site";

/**
 * Lovioo referral links for the partner's own website and socials. Every link carries ?ref=<brand>: visits and new
 * Lovioo sign-ups from them show on the dashboard (counted without any personal data).
 */
export default function PartnerLinks() {
  const { brand } = usePartner();
  const products = useAdminQuery(
    (sb) => sb.from("products").select("id, slug, name, published").eq("brand_id", brand.id).eq("published", true).order("name"),
    [brand.id],
  );
  const ref = `ref=${encodeURIComponent(brand.id)}`;
  const brandLink = `${SITE_URL}/brand/${brand.id}?${ref}`;
  const homeLink = `${SITE_URL}/?${ref}`;
  const badge = `<a href="${brandLink}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;background:#FF4FB8;color:#fff;font:600 14px/1 system-ui,sans-serif;text-decoration:none">💗 Find us on Lovioo</a>`;

  return (
    <div>
      <PageHeader
        title="Referral links"
        sub="Put these links on your website, Instagram, TikTok or Facebook. Visits and new Lovioo sign-ups that come from them show on your dashboard."
      />
      <div className="space-y-5">
        {!brand.is_partner && (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Your links start counting once Lovioo switches on your Brand Partner listing.</p>
        )}
        <Panel title="Your brand page">
          <CopyRow label="Brand page on Lovioo" value={brandLink} />
          <CopyRow label="Lovioo home page" value={homeLink} />
        </Panel>

        <Panel title="“Find us on Lovioo” button">
          <p className="-mt-1 mb-3 text-xs text-ink/55">Paste this HTML into your website. It links to your brand page with your referral tag.</p>
          <div className="mb-3 rounded-2xl bg-ink/[0.03] p-4" dangerouslySetInnerHTML={{ __html: badge }} />
          <CopyRow label="HTML" value={badge} mono />
        </Panel>

        <Panel title="Product links">
          {products.data?.length ? (
            products.data.map((p) => <CopyRow key={p.id} label={p.name} value={`${SITE_URL}/product/${p.slug}?${ref}`} />)
          ) : (
            <p className="py-4 text-center text-sm text-ink/50">Links for each product appear here once Lovioo puts it live.</p>
          )}
        </Panel>
        <p className="text-xs text-ink/50">
          Lovioo&apos;s catalogue is for members, so visitors are asked to join (free) before they see products. That&apos;s how sign-ups from your site are
          counted.
        </p>
      </div>
    </div>
  );
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the text is selectable */
    }
  };
  return (
    <div className="border-b border-ink/5 py-3 last:border-0">
      <p className="text-xs font-semibold text-ink/60">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className={`min-w-0 flex-1 truncate rounded-xl bg-ink/[0.04] px-3 py-2 text-[12px] ${mono ? "font-mono" : ""}`} title={value}>
          {value}
        </code>
        <button onClick={copy} className="btn-ghost shrink-0 !px-3 !py-2 text-xs" aria-label={`Copy ${label}`}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
