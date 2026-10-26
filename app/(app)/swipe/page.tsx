import { SwipeDeck } from "@/components/swipe/SwipeDeck";

export const metadata = { title: "Swipe to discover · Lovioo" };

export default function SwipePage() {
  // The deck is deliberately left as it was: same type, same cards, same gestures.
  return (
    <div className="font-poppins text-midnight [&_h1]:font-poppins [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h2]:font-poppins [&_h2]:font-extrabold [&_h3]:font-poppins [&_h3]:font-bold">
      <SwipeDeck />
    </div>
  );
}
