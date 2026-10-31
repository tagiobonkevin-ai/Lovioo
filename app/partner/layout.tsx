import { PartnerShell } from "@/components/partner/PartnerShell";

export const metadata = { title: "Lovioo Brand Partners", robots: { index: false } };

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PartnerShell>{children}</PartnerShell>;
}
