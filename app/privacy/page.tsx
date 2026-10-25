import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "Privacy · Lovioo" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="Lovioo helps you discover products and compare prices across online stores. This page explains what we collect, why, and the choices you have. We wrote it to be read, not skimmed past."
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><b>Account details:</b> your name and email when you create an account, and your password (stored only as a secure hash by our authentication provider).</li>
          <li><b>Preferences:</b> the interests, budget range and favourite stores you choose during onboarding or in your profile.</li>
          <li><b>Activity in Lovioo:</b> items you save, price alerts you set, how you swipe, and which products you view or click through to a store.</li>
          <li><b>Feedback:</b> anything you send us with the Feedback button, plus the page you sent it from and, if you choose, your email.</li>
          <li><b>Technical data:</b> basic, privacy-friendly usage statistics (pages visited, device type, country) that do not identify you personally.</li>
        </ul>
        <p className="mt-3">If you use Lovioo without an account, your saves and swipes stay in your browser and are not sent to us.</p>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To run your account and keep your saves, alerts and preferences in sync across devices.</li>
          <li>To personalise your swipe deck and recommendations.</li>
          <li>To understand which features and products are useful, so we can improve Lovioo.</li>
          <li>To reply to feedback and, in future, to notify you about price alerts you set.</li>
        </ul>
        <p className="mt-3">We do not sell your personal information, and we do not show third-party ads.</p>
      </section>

      <section>
        <h2>Who processes it for us</h2>
        <ul>
          <li><b>Supabase</b> stores our database and handles sign-in (servers in Singapore).</li>
          <li><b>Vercel</b> hosts the website and provides anonymous usage statistics.</li>
        </ul>
        <p className="mt-3">
          When you click through to a store such as Shopee, Lazada, TikTok Shop or Amazon, you leave Lovioo and that store&apos;s own privacy policy applies.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Under the Philippine Data Privacy Act of 2012 (RA 10173) and similar laws, you can ask to access, correct or delete your personal data, or object to how we use it. Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-pink">{CONTACT_EMAIL}</a> and we&apos;ll respond within 15 days. Deleting your account removes your
          saves, alerts and swipes.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>We keep your account data while your account is open. Anonymous usage statistics are kept in aggregate. Feedback is kept until it&apos;s been dealt with, then periodically cleared.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>Lovioo is in beta and this policy may change as we add features. We&apos;ll update the date at the top and tell signed-in users about important changes.</p>
      </section>
    </LegalPage>
  );
}
