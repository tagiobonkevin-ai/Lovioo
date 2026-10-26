import Link from "next/link";
import { LegalNote, LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, LEGAL_ADDRESS, LEGAL_OPERATOR, SITE_URL } from "@/lib/site";

export const metadata = { title: "Privacy Policy · Lovioo", description: "How Lovioo handles your personal information, and the choices you have." };

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
const site = <a href={SITE_URL}>{SITE_URL.replace(/^https?:\/\//, "")}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy Policy"
      sections={[
        {
          id: "who",
          title: "1. Who operates Lovioo?",
          body: (
            <>
              <p>Lovioo is a shopping discovery platform intended initially for users in the Philippines.</p>
              <ul>
                <li>Personal information controller / legal operator: {LEGAL_OPERATOR}</li>
                <li>Business address: {LEGAL_ADDRESS}</li>
                <li>Privacy contact: {mail}</li>
                <li>Website: {site}</li>
              </ul>
              <p>
                Lovioo uses or plans to use Supabase for database and related application services. Other service providers may also process information
                depending on the final implementation.
              </p>
            </>
          ),
        },
        {
          id: "collect",
          title: "2. Information we may collect",
          body: (
            <>
              <p>Depending on which features are implemented and used, Lovioo may collect:</p>
              <ul>
                <li><b>Account information:</b> email address, account identifier, authentication records and settings.</li>
                <li><b>Saved-product information:</b> wishlists, favourites and saved product references.</li>
                <li><b>Preferences:</b> product interests, categories and language settings supplied by users.</li>
                <li><b>AI interactions:</b> questions and other content submitted to the AI shopping assistant, and relevant technical information.</li>
                <li><b>Email-alert information:</b> alert preferences, delivery status and related settings.</li>
                <li><b>Usage and technical information:</b> pages viewed, interactions, timestamps, device or browser information, diagnostics and security logs.</li>
                <li>
                  <b>Analytics and advertising information:</b> cookie identifiers, online identifiers, usage events or other information collected through
                  analytics and advertising technologies, if enabled.
                </li>
                <li><b>Communications:</b> support requests, feedback and reports.</li>
              </ul>
              <p>Lovioo should not request payment-card details or third-party shopping account passwords for its planned affiliate-based discovery service.</p>
              <LegalNote>
                Lovioo stores your account email and name, your birthday (to confirm you&apos;re 18 or over), and, if you add them, your gender, city and
                province. If you sign up with Google, we also keep your Google name and profile photo. We store your saved products, price alerts, swipes and
                preferences, your consent choices, and feedback you send. Product views and store clicks are counted only if you allow analytics. Lovioo never asks for card details or store passwords.
              </LegalNote>
            </>
          ),
        },
        {
          id: "why",
          title: "3. Why we process information",
          body: (
            <>
              <p>Depending on the feature, we may process information to:</p>
              <ul>
                <li>Create, authenticate and manage accounts.</li>
                <li>Store and retrieve wishlists.</li>
                <li>Provide product discovery and search.</li>
                <li>Generate AI-assisted shopping recommendations.</li>
                <li>Send requested product alerts and essential account messages.</li>
                <li>Protect accounts, detect misuse and maintain system security.</li>
                <li>Diagnose errors and improve service reliability.</li>
                <li>Measure usage and campaign performance through analytics.</li>
                <li>Provide advertising or personalisation features where implemented and lawfully permitted.</li>
                <li>Respond to complaints and exercise or defend legal claims.</li>
                <li>Meet applicable legal obligations.</li>
              </ul>
              <p>
                We will not use personal information for unrelated purposes without an appropriate lawful basis and any notices or permissions required by
                law.
              </p>
            </>
          ),
        },
        {
          id: "basis",
          title: "4. Lawful basis for processing",
          body: (
            <>
              <p>
                Depending on the purpose and applicable law, processing may rely on performance of an agreement, compliance with a legal obligation,
                legitimate interests where permitted, or consent where required.
              </p>
              <p>
                We will provide information about the relevant purpose and basis as required by applicable law. Where consent is the basis, it should be
                freely given, specific, informed and capable of withdrawal.
              </p>
              <p>Acceptance of the Terms &amp; Conditions or acknowledgement of this Privacy Policy is not blanket consent for all data processing.</p>
            </>
          ),
        },
        {
          id: "providers",
          title: "5. Supabase and other service providers",
          body: (
            <>
              <p>
                Lovioo uses or plans to use Supabase for database and related application services. The exact Supabase services enabled, hosting region, data
                flows and contractual arrangements must be confirmed before launch.
              </p>
              <p>Additional providers may include:</p>
              <ul>
                <li>Email delivery providers for alerts and account communications.</li>
                <li>AI service providers for shopping-assistant responses.</li>
                <li>Analytics providers for product usage measurement.</li>
                <li>Advertising or attribution providers if advertising trackers are implemented.</li>
                <li>Security, hosting and diagnostic providers.</li>
              </ul>
              <LegalNote>
                <b>Supabase</b> stores accounts and app data (database and sign-in) in its Singapore region and sends sign-up and password emails.{" "}
                <b>Vercel</b> hosts the website and, only if you allow analytics, provides Vercel Web Analytics. No AI provider, email-marketing provider or
                advertising provider is used today.
              </LegalNote>
              <LegalNote kind="review">
                Before launch, Lovioo must identify the actual providers, the data they receive, their purposes and any relevant international transfers.
                Providers should be subject to appropriate contractual and security safeguards.
              </LegalNote>
            </>
          ),
        },
        {
          id: "ai",
          title: "6. AI shopping assistant",
          body: (
            <>
              <p>When you use Lovioo&apos;s AI shopping assistant, your prompts and related information may be processed to generate product suggestions or responses.</p>
              <p>
                Depending on the implementation, relevant information may be sent to an external AI service provider. We must identify that provider and
                describe the relevant processing before launch.
              </p>
              <p>Avoid entering passwords, payment details or unnecessary sensitive personal information into AI prompts.</p>
              <p>AI-generated recommendations can be inaccurate or outdated and may be affected by product availability and commercial relationships.</p>
              <LegalNote>
                Lovioo AI currently runs on your device using Lovioo&apos;s own rules and catalogue. Your questions are not sent to Lovioo or to any AI
                provider, and conversations are not stored.
              </LegalNote>
            </>
          ),
        },
        {
          id: "cookies",
          title: "7. Cookies, analytics and advertising trackers",
          body: (
            <>
              <p>Lovioo may use essential technologies for account sessions, security and necessary functions.</p>
              <p>
                If analytics or advertising trackers are enabled, they may collect usage events, online identifiers, browsing interactions or other technical
                information. Third-party providers may receive or process such information.
              </p>
              <p>
                Lovioo will provide the disclosures and consent choices required by applicable law. Non-essential tracking should not begin before any required
                consent has been obtained. Users should have an accessible way to review or change applicable choices.
              </p>
              <LegalNote>
                Analytics start only after you choose <b>Allow</b>, and you can change this any time with <b>Privacy choices</b> at the bottom of every page.
                Details are in the <Link href="/cookies">Cookie &amp; Tracking Notice</Link>.
              </LegalNote>
            </>
          ),
        },
        {
          id: "email",
          title: "8. Email alerts and marketing",
          body: (
            <>
              <p>Lovioo may send essential account messages and alerts users have requested.</p>
              <p>
                Promotional emails, such as marketing newsletters and product campaigns, will be handled separately from essential service messages. Where
                required, Lovioo will obtain appropriate marketing consent and provide a functional unsubscribe mechanism.
              </p>
              <p>Users can change their preferences or withdraw marketing consent without having to delete their account.</p>
              <LegalNote>
                Lovioo doesn&apos;t send marketing emails yet. If you opt in, your choice is saved for when it does, and you can turn it off in your profile under
                Privacy choices.
              </LegalNote>
            </>
          ),
        },
        {
          id: "affiliate",
          title: "9. Third-party shopping links and affiliate tracking",
          body: (
            <>
              <p>
                When you click a link to a retailer, that retailer or its affiliate network may receive information about the click or visit. Depending on the
                link and provider, tracking may be used to attribute qualifying purchases to Lovioo.
              </p>
              <p>
                Lovioo may receive commission reports or aggregated transaction information. The information actually received depends on the affiliate
                program.
              </p>
              <p>
                Third-party websites operate under their own privacy policies and terms. See our <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "10. Sharing and disclosure",
          body: (
            <>
              <p>
                Lovioo may disclose personal information to relevant service providers, professional advisers, regulators or authorities where necessary for
                the purposes described in this policy or where required or permitted by law.
              </p>
              <p>
                We do not sell personal information as a business model. Any additional commercial sharing or advertising-related disclosure must be evaluated
                under applicable law and appropriately disclosed.
              </p>
            </>
          ),
        },
        {
          id: "transfers",
          title: "11. International transfers",
          body: (
            <>
              <p>Some service providers may store or process data outside the Philippines. The actual locations must be confirmed.</p>
              <p>Where international transfers occur, Lovioo will implement the safeguards and other measures required by applicable law.</p>
              <LegalNote>Lovioo&apos;s database is in Singapore (Supabase). The website is served by Vercel&apos;s global network.</LegalNote>
            </>
          ),
        },
        {
          id: "retention",
          title: "12. Retention",
          body: (
            <>
              <p>
                Information will be retained only for as long as reasonably necessary for its declared purpose, subject to legal obligations and legitimate
                claims.
              </p>
              <LegalNote kind="review">
                Before launch, Lovioo must establish retention rules for account data, wishlists, AI conversations, alert records, analytics events, tracking
                identifiers, security logs and consent records.
              </LegalNote>
            </>
          ),
        },
        {
          id: "security",
          title: "13. Security",
          body: (
            <>
              <p>
                Lovioo will implement reasonable organisational, technical and physical safeguards designed to protect personal information against
                unauthorised access, disclosure, alteration, loss or destruction.
              </p>
              <p>
                No online service can guarantee absolute security. Security incidents and personal-data breaches will be handled in accordance with applicable
                legal requirements.
              </p>
            </>
          ),
        },
        {
          id: "rights",
          title: "14. Your rights",
          body: (
            <>
              <p>
                Subject to applicable law, you may request information about the processing of your personal data, access or correction, object to certain
                processing, request erasure or blocking where available, withdraw consent where consent is the basis, request portability where applicable, or
                lodge a complaint with the relevant authority.
              </p>
              <p>To make a request, contact {mail}. We may verify your identity before acting on a request.</p>
              <p>
                For Philippine privacy information, visit the National Privacy Commission:{" "}
                <a href="https://privacy.gov.ph/" target="_blank" rel="noopener noreferrer">
                  https://privacy.gov.ph/
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "15. Children's privacy",
          body: (
            <p>
              Lovioo will implement age-related safeguards appropriate to its intended users and applicable law. The final age requirements and procedures for
              any required parent or guardian involvement must be confirmed before launch.
            </p>
          ),
        },
        {
          id: "changes",
          title: "16. Changes to this policy",
          body: (
            <p>
              We may update this policy when the service, providers, data practices or legal requirements change. We will update the revision date and provide
              notice or obtain consent where required.
            </p>
          ),
        },
        {
          id: "contact",
          title: "17. Contact",
          body: (
            <>
              <ul>
                <li>Legal operator: {LEGAL_OPERATOR}</li>
                <li>Business address: {LEGAL_ADDRESS}</li>
                <li>Privacy email: {mail}</li>
                <li>Website: {site}</li>
              </ul>
              <LegalNote kind="review">
                This policy must be updated before launch to reflect the actual Supabase configuration, AI provider, email provider, analytics and advertising
                technologies, data retention periods and international transfers.
              </LegalNote>
            </>
          ),
        },
      ]}
    />
  );
}
