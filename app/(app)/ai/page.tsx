import { AiChat } from "@/components/ai/AiChat";

export const metadata = { title: "Lovioo AI · Lovioo" };

export default function AiPage() {
  return (
    <div className="mx-auto h-[calc(100dvh-12rem)] max-w-3xl md:h-[calc(100vh-9rem)]">
      <AiChat />
    </div>
  );
}
