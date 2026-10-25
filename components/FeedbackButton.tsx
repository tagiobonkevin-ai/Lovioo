"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLovioo } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "./Providers";

const MOODS = ["😞", "😕", "😐", "🙂", "😍"];

/** Floating "Feedback" button for MVP testers. Saves to Supabase; in demo mode it just thanks them. */
export function FeedbackButton({ className }: { className?: string }) {
  const pathname = usePathname();
  const user = useLovioo((s) => s.user);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return setError("Tell us what's on your mind.");
    setError("");
    const sb = getSupabase();
    if (sb) {
      setSending(true);
      const { error } = await sb.from("feedback").insert({
        message: text.slice(0, 4000),
        rating,
        page: pathname,
        user_id: user?.id ?? null,
        email: (user?.email || email.trim()) || null,
      });
      setSending(false);
      if (error) return setError(`Couldn't send it: ${error.message}`);
    }
    setOpen(false);
    setMessage("");
    setRating(null);
    toast({ title: "Thanks for the feedback! 💌", body: "It goes straight to the Lovioo team.", kind: "ok" });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          // On phones the swipe page needs the space above the tab bar for its action buttons.
          pathname === "/swipe" ? "hidden md:inline-flex" : "inline-flex",
          "fixed bottom-24 left-4 z-40 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-midnight shadow-soft ring-1 ring-line transition hover:scale-105 md:bottom-6 md:left-6 md:px-4 md:py-2.5 md:text-sm",
          className,
        )}
      >
        <MessageCircleHeart className="h-4 w-4 text-pink" /> Feedback
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-midnight/30 p-0 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.form
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem]"
              role="dialog"
              aria-label="Send feedback"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold">Help shape Lovioo 💖</p>
                  <p className="text-sm text-midnight/60">Bug, idea or love note — we read everything.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex justify-between gap-2" role="radiogroup" aria-label="How do you feel about Lovioo?">
                {MOODS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={rating === i + 1}
                    aria-label={`${i + 1} of 5`}
                    onClick={() => setRating(rating === i + 1 ? null : i + 1)}
                    className={cn("grid h-12 flex-1 place-items-center rounded-2xl text-2xl transition", rating === i + 1 ? "bg-pink/15 ring-2 ring-pink" : "bg-cream hover:bg-blush")}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="What should we fix, add or keep?"
                className="input mt-4 resize-none"
                aria-label="Your feedback"
              />
              {!user && (
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optional, if you'd like a reply)" className="input mt-3" aria-label="Email" />
              )}
              {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
              <button className="btn-primary mt-4 w-full !py-3" disabled={sending}>
                {sending ? "Sending…" : "Send feedback"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
