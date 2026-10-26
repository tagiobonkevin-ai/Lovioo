import { AiFab } from "@/components/ai/AiFab";
import { MembersOnly } from "@/components/auth/MembersOnly";
import { FeedbackButton } from "@/components/FeedbackButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { LegalFooter } from "@/components/legal/LegalLinks";
import { CompareTray } from "@/components/product/CompareTray";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <main className="mx-auto max-w-[1248px] px-4 pb-32 pt-6 lg:px-6 lg:pb-16">
        <MembersOnly>{children}</MembersOnly>
        <LegalFooter />
      </main>
      <CompareTray />
      <AiFab />
      <FeedbackButton />
      <MobileTabBar />
    </div>
  );
}
