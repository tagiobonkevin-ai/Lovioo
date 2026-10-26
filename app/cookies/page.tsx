import Link from "next/link";
import { PrivacyChoicesButton } from "@/components/legal/ConsentBar";
import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Cookie & Tracking Notice · Lovioo",
  description: "The browser storage and analytics Lovioo uses, and how to change your choice.",
};

const Row = ({ name, purpose, kind, keep }: { name: string; purpose: string; kind: string; keep: string }) => (
  <tr className="border-t border-line/70 align-top">
    <td className="py-2 pr-3 font-mono text-[12px] text-midnight">{name}</td>
    <td className="py-2 pr-3">{purpose}</td>
    <td className="py-2 pr-3 whitespace-nowrap">{kind}</td>
    <td className="py-2">{keep}</td>
  </tr>
);

export default function CookiesPage() {
  return (
    <LegalPage
      path="/cookies"
      title="Cookie & Tracking Notice"
      intro={
        <p>
          This notice explains the technologies Lovioo uses in your browser and for analytics, which ones are essential, and how to change your choice. It
          supports our <Link href="/privacy#cookies" className="font-semibold text-pink">Privacy Policy</Link>.
        </p>
      }
      sections={[
        {
          id: "summary",
          title: "1. In short",
          body: (
            <ul>
              <li>Lovioo doesn&apos;t set advertising cookies and doesn&apos;t use advertising trackers.</li>
              <li>Essential browser storage keeps you signed in and remembers your saves and settings.</li>
              <li>Analytics run only if you choose <b>Allow</b>. You can change your mind at any time.</li>
            </ul>
          ),
        },
        {
          id: "essential",
          title: "2. Essential storage (always on)",
          body: (
            <>
              <p>These are needed for Lovioo to work and are kept in your browser&apos;s local storage, not in cookies.</p>
              <div className="mt-3 overflow-x-auto rounded-2xl bg-white p-3 shadow-soft">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-wider text-midnight/45">
                    <tr>
                      <th className="pb-1 pr-3 font-semibold">Name</th>
                      <th className="pb-1 pr-3 font-semibold">Purpose</th>
                      <th className="pb-1 pr-3 font-semibold">Type</th>
                      <th className="pb-1 font-semibold">Kept</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Row name="sb-…-auth-token" purpose="Keeps you signed in (Supabase sign-in session)" kind="Local storage" keep="Until you sign out" />
                    <Row name="lovioo-store" purpose="Your saves, swipes, price alerts, preferences and AI language" kind="Local storage" keep="Until you clear it" />
                    <Row name="lovioo-consent" purpose="Remembers your analytics and email choices" kind="Local storage" keep="Until you clear it" />
                    <Row name="lovioo-install" purpose="Remembers if you dismissed “Add to Home Screen”" kind="Local storage" keep="Until you clear it" />
                    <Row name="lovioo-v2 cache" purpose="Lets pages and images open faster and offline (installed app)" kind="Service worker cache" keep="Replaced on updates" />
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "analytics",
          title: "3. Analytics (only with your permission)",
          body: (
            <>
              <ul>
                <li>
                  <b>Vercel Web Analytics:</b> counts page visits, referrers, country and device type in aggregate. It doesn&apos;t use cookies and doesn&apos;t
                  build a profile of you. Provider: Vercel Inc.
                </li>
                <li>
                  <b>Lovioo product counts:</b> records when a product page is viewed and when you tap through to a store, so we can see which products and
                  stores are useful. Stored in Lovioo&apos;s database (Supabase) and linked to your account if you&apos;re signed in.
                </li>
              </ul>
              <p>Neither runs until you choose Allow, either on the bar at the bottom of the screen or in Profile → Privacy choices.</p>
            </>
          ),
        },
        {
          id: "advertising",
          title: "4. Advertising and affiliate tracking",
          body: (
            <>
              <p>Lovioo doesn&apos;t use advertising trackers today. If that changes, we&apos;ll update this notice and ask before they run.</p>
              <p>
                When you tap a store link, you leave Lovioo. The store or its affiliate network may then use its own cookies to attribute a purchase to Lovioo,
                under its own privacy policy. See our <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.
              </p>
            </>
          ),
        },
        {
          id: "choices",
          title: "5. Changing your choice",
          body: (
            <>
              <p>
                Use <b>Privacy choices</b> at the bottom of any page. If you&apos;re signed in, your choices are saved to your account under Profile → Privacy
                choices and apply on every device.
              </p>
              <div className="mt-3">
                <PrivacyChoicesButton />
              </div>
              <p>
                You can also clear Lovioo&apos;s storage in your browser settings. This signs you out and forgets guest saves.
              </p>
            </>
          ),
        },
        {
          id: "contact",
          title: "6. Questions",
          body: (
            <p>
              Contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
