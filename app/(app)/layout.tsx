import { AiFab } from "@/components/ai/AiFab";
import { FeedbackButton } from "@/components/FeedbackButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CompareTray } from "@/components/product/CompareTray";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 pb-32 pt-6 md:pb-16 lg:px-6">{children}</main>
      <CompareTray />
      <AiFab />
      <FeedbackButton />
      <MobileTabBar />
    </div>
  );
}
