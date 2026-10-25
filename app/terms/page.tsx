import Link from "next/link";
import { LegalNote, LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, LEGAL_ADDRESS, LEGAL_OPERATOR, SITE_URL } from "@/lib/site";

export const metadata = { title: "Terms & Conditions · Lovioo", description: "The terms for using Lovioo, the shopping discovery app." };

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

function Operator() {
  return (
    <ul>
      <li>Legal operator: {LEGAL_OPERATOR}</li>
      <li>Business address: {LEGAL_ADDRESS}</li>
      <li>Contact email: {mail}</li>
      <li>
        Website: <a href={SITE_URL}>{SITE_URL.replace(/^https?:\/\//, "")}</a>
      </li>
    </ul>
  );
}

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms & Conditions"
      intro={<p className="font-semibold">Lovioo — Swipe. Love. Shop.</p>}
      sections={[
        {
          id: "about",
          title: "1. About Lovioo",
          body: (
            <>
              <p>
                Lovioo is a shopping discovery platform intended to help users discover products, explore offers, save favourite products and use
                AI-assisted shopping discovery.
              </p>
              <p>
                Lovioo&apos;s initial target market is the Philippines. The service is intended to provide product discovery and links to third-party
                retailers, rather than operate as a direct seller, unless expressly stated otherwise.
              </p>
              <Operator />
            </>
          ),
        },
        {
          id: "acceptance",
          title: "2. Acceptance of these terms",
          body: (
            <>
              <p>
                By creating a Lovioo account, you agree to these Terms &amp; Conditions. Please also read the <Link href="/privacy">Privacy Policy</Link>,
                which explains how your personal information is handled.
              </p>
              <p>If you do not agree, do not create an account or use features requiring acceptance of these terms.</p>
              <p>
                You must provide accurate information and meet the age and legal-capacity requirements applicable to your use of Lovioo. Where parental or
                guardian involvement is legally required, the applicable requirements must be satisfied.
              </p>
            </>
          ),
        },
        {
          id: "features",
          title: "3. Lovioo features",
          body: (
            <>
              <p>Depending on availability, Lovioo may provide:</p>
              <ul>
                <li>Product discovery and search.</li>
                <li>Saved products and wishlists.</li>
                <li>Product links to third-party retailers.</li>
                <li>AI-assisted shopping recommendations.</li>
                <li>Email alerts about saved products, deals or other requested updates.</li>
                <li>Analytics and personalised experiences, where implemented and permitted.</li>
              </ul>
              <p>Features may change as the service develops. We will not intentionally represent an unimplemented feature as currently available.</p>
            </>
          ),
        },
        {
          id: "product-information",
          title: "4. Product information and deals",
          body: (
            <>
              <p>
                Product details, photographs, prices, discounts, availability and descriptions may be obtained from retailers, marketplaces, affiliate
                networks or other data providers.
              </p>
              <p>
                Information may become outdated or contain errors. Prices, coupons, stock, delivery fees, promotional conditions and eligibility can change.
              </p>
              <p>
                Users should confirm the final price, seller, product specifications, availability and purchase conditions on the retailer&apos;s website
                before purchasing.
              </p>
              <p>
                Lovioo does not guarantee the lowest price, a particular discount, product authenticity or the continued availability of any offer unless
                expressly stated and substantiated.
              </p>
            </>
          ),
        },
        {
          id: "affiliate",
          title: "5. Affiliate links and commissions",
          body: (
            <>
              <p>
                Lovioo may use affiliate links. We may receive a commission or other compensation when a user follows an eligible link and completes a
                qualifying purchase or action.
              </p>
              <p>
                Affiliate compensation may influence which products are featured or how they are presented. We aim to disclose material commercial
                relationships clearly.
              </p>
              <p>
                A product appearing on Lovioo does not necessarily mean it is the cheapest product, the best available offer or endorsed by the retailer. See
                our <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.
              </p>
            </>
          ),
        },
        {
          id: "retailers",
          title: "6. Third-party retailers and purchases",
          body: (
            <>
              <p>
                When you follow a link to an external retailer, you leave Lovioo and interact with that third party under its own applicable terms and
                privacy practices.
              </p>
              <p>
                Unless Lovioo expressly states otherwise, the retailer is responsible for its checkout, payment processing, fulfilment, shipping, returns,
                refunds and warranties, subject to applicable law.
              </p>
              <p>Lovioo does not represent itself as an official partner of a retailer unless that relationship has been verified.</p>
              <p>Nothing in these terms excludes obligations Lovioo may have under applicable consumer-protection or e-commerce laws.</p>
            </>
          ),
        },
        {
          id: "ai",
          title: "7. AI shopping assistant",
          body: (
            <>
              <p>
                Lovioo&apos;s AI shopping assistant may use information available to it and details you provide to suggest products or answer
                shopping-related questions.
              </p>
              <p>
                AI outputs may be inaccurate, incomplete or outdated. They are suggestions, not guarantees of price, quality, authenticity, suitability or
                availability.
              </p>
              <p>
                Verify important information with the retailer before purchasing. Do not enter passwords, payment-card information or unnecessary sensitive
                personal information into AI conversations.
              </p>
              <p>
                Information submitted to the AI assistant may be processed by Lovioo and relevant AI service providers as explained in the{" "}
                <Link href="/privacy#ai">Privacy Policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: "accounts",
          title: "8. Accounts and saved products",
          body: (
            <>
              <p>You are responsible for providing accurate account information and taking reasonable steps to protect your login credentials.</p>
              <p>Notify Lovioo if you suspect unauthorised access to your account.</p>
              <p>
                Saved products and alerts depend on available product information. A saved item may become unavailable, change price or be removed from a
                retailer&apos;s listing.
              </p>
              <p>
                You may request account deletion through the process described in the <Link href="/privacy#rights">Privacy Policy</Link>.
              </p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "9. Acceptable use",
          body: (
            <>
              <p>
                You must not use Lovioo to commit fraud, violate the law, interfere with service security, attempt unauthorised access, distribute malicious
                code or misuse another person&apos;s account or personal information.
              </p>
              <p>
                You must not scrape, reproduce or commercially exploit Lovioo&apos;s content or systems except as permitted by law or with the appropriate
                permission.
              </p>
              <p>We may take reasonable measures to investigate suspected misuse and protect users and the service.</p>
            </>
          ),
        },
        {
          id: "ip",
          title: "10. Intellectual property",
          body: (
            <>
              <p>Lovioo&apos;s original branding, software, design and original content are owned by or licensed to the relevant rights holder.</p>
              <p>
                Third-party names, logos, trademarks and product images remain the property of their respective owners. Their display does not by itself
                imply endorsement or partnership.
              </p>
            </>
          ),
        },
        {
          id: "availability",
          title: "11. Availability and changes",
          body: (
            <>
              <p>Lovioo may update, suspend or discontinue features for operational, maintenance, security or legal reasons.</p>
              <p>We will take reasonable steps to communicate material changes where appropriate. We do not guarantee uninterrupted service.</p>
            </>
          ),
        },
        {
          id: "liability",
          title: "12. Liability and consumer rights",
          body: (
            <>
              <p>
                To the extent permitted by applicable law, Lovioo is not responsible for third-party retailer acts or omissions, inaccurate third-party
                information, unavailable offers or service interruptions beyond its reasonable control.
              </p>
              <p>Nothing in these terms excludes or limits liability, remedies or consumer rights that cannot lawfully be excluded or limited.</p>
            </>
          ),
        },
        {
          id: "suspension",
          title: "13. Suspension and termination",
          body: (
            <>
              <p>
                Lovioo may restrict or suspend an account when reasonably necessary to address fraud, security threats, unlawful conduct or material breaches
                of these terms.
              </p>
              <p>Where appropriate and legally permitted, we will provide notice and an opportunity to resolve the issue.</p>
              <p>You may stop using Lovioo and request account deletion, subject to lawful retention requirements.</p>
            </>
          ),
        },
        {
          id: "privacy",
          title: "14. Privacy and communications",
          body: (
            <>
              <p>
                Our <Link href="/privacy">Privacy Policy</Link> describes how personal information is processed, the purposes of processing, relevant
                service providers and how you may exercise your rights.
              </p>
              <p>
                Marketing communications are subject to your preferences and applicable law. Essential account and security messages may still be sent when
                necessary.
              </p>
            </>
          ),
        },
        {
          id: "complaints",
          title: "15. Complaints and contact",
          body: (
            <>
              <p>For support, complaints or product-listing reports, contact:</p>
              <ul>
                <li>Email: {mail}</li>
                <li>Business address: {LEGAL_ADDRESS}</li>
              </ul>
            </>
          ),
        },
        {
          id: "law",
          title: "16. Governing law and disputes",
          body: (
            <>
              <p>
                These terms are intended to operate consistently with applicable Philippine laws, including relevant privacy, consumer-protection and
                e-commerce laws. The applicable law and competent forum for a dispute will be determined under applicable law.
              </p>
              <p>Nothing in this section removes mandatory rights available to consumers.</p>
            </>
          ),
        },
        {
          id: "changes",
          title: "17. Changes to these terms",
          body: (
            <p>
              Lovioo may revise these terms as its features, operations or legal obligations change. We will update the revision date and provide notice or
              request renewed acceptance where appropriate, particularly for material changes.
            </p>
          ),
        },
        {
          id: "operator",
          title: "18. Operator details",
          body: (
            <>
              <Operator />
              <LegalNote kind="review">The legal operator&apos;s name and business address must be confirmed before publication.</LegalNote>
            </>
          ),
        },
      ]}
    />
  );
}
