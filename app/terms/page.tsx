import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "Terms · Lovioo" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro="These terms apply when you use Lovioo. By creating an account or using the site, you agree to them. Lovioo is in beta, so things will change and occasionally break — thanks for helping us test."
    >
      <section>
        <h2>What Lovioo is</h2>
        <p>
          Lovioo is a discovery and price-comparison service. We don&apos;t sell products ourselves. Purchases happen on the store you click through to (for example Shopee, Lazada, TikTok
          Shop or Amazon), under that store&apos;s terms, prices, shipping and return policies.
        </p>
      </section>

      <section>
        <h2>Prices and recommendations</h2>
        <ul>
          <li>Prices, stock and shipping are set by each store and can change at any time. Always check the final price on the store before you buy.</li>
          <li>Deal scores, &ldquo;buy now or wait&rdquo; tips and Lovioo AI answers are automated guidance based on the price history we&apos;ve collected — not financial advice or a guarantee.</li>
          <li>Some links may earn Lovioo a commission from the store at no extra cost to you. This never changes the price you pay.</li>
        </ul>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>Give accurate details and keep your password private. You&apos;re responsible for activity on your account.</li>
          <li>Don&apos;t misuse Lovioo: no scraping, attacking or overloading the service, and no using it to break the law or other people&apos;s rights.</li>
          <li>We may suspend accounts that break these terms.</li>
        </ul>
      </section>

      <section>
        <h2>Beta service</h2>
        <p>
          Lovioo is provided &ldquo;as is&rdquo; while we test it. We aim for accuracy and reliability but can&apos;t promise the service will always be available or error-free, and to the
          extent the law allows we aren&apos;t liable for losses from relying on prices or recommendations shown here.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-pink">{CONTACT_EMAIL}</a> or use the Feedback button in the app.
        </p>
      </section>
    </LegalPage>
  );
}
