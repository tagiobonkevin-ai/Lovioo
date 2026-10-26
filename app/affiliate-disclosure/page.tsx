import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Affiliate disclosure · Lovioo",
  description: "How Lovioo earns commissions from some store links, and how that can affect what you see.",
};

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage
      path="/affiliate-disclosure"
      title="Affiliate disclosure"
      intro="Lovioo helps users discover products, explore offers and visit third-party retailers."
      sections={[
        {
          id: "commissions",
          title: "How Lovioo earns commissions",
          body: (
            <>
              <p>
                Some links on Lovioo may be affiliate links. If you click an eligible link and complete a qualifying purchase or action, Lovioo may earn a
                commission or other compensation.
              </p>
              <p>
                Where applicable, using an affiliate link does not add an affiliate commission to the price you pay. The retailer&apos;s own prices, delivery
                fees and other charges may still apply.
              </p>
            </>
          ),
        },
        {
          id: "discovery",
          title: "How affiliate relationships affect product discovery",
          body: (
            <>
              <p>
                Commercial relationships may influence which products, retailers or offers Lovioo features. We aim to make material commercial relationships
                clear and provide useful product information.
              </p>
              <p>
                A product shown on Lovioo is not necessarily the lowest-priced product, the best available deal or an endorsement by the retailer.
              </p>
            </>
          ),
        },
        {
          id: "prices",
          title: "Prices and promotions",
          body: (
            <p>
              Prices, discount percentages, coupons, stock and promotion conditions may change. Always confirm the final price and terms on the retailer&apos;s
              website before purchasing.
            </p>
          ),
        },
        {
          id: "purchases",
          title: "Third-party purchases",
          body: (
            <>
              <p>
                Purchases are generally completed on the third-party retailer&apos;s website. The retailer&apos;s terms, privacy policy, fulfilment, delivery,
                return and refund rules apply, subject to applicable law.
              </p>
              <p>The appearance of a retailer&apos;s name or logo does not by itself mean Lovioo has an official partnership with that retailer.</p>
            </>
          ),
        },
        {
          id: "questions",
          title: "Questions",
          body: (
            <p>
              For questions about affiliate links or commercial relationships, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          ),
        },
      ]}
    >
      <p className="text-center text-sm font-semibold text-ink/50">Lovioo — Swipe. Love. Shop.</p>
    </LegalPage>
  );
}
