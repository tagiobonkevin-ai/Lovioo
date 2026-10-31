import { create } from "zustand";

/** Why a guest is being asked to create an account. */
export type NudgeReason = "save" | "alert";

/**
 * Guests can browse, swipe and save on this phone without an account. The first save of a visit, and every price
 * alert (which needs an account to keep watching), opens a short "create a free account" sheet instead of a wall.
 */
export const useSignupNudge = create<{ reason: NudgeReason | null; savePrompted: boolean }>(() => ({ reason: null, savePrompted: false }));

export function askToSignUp(reason: NudgeReason) {
  const s = useSignupNudge.getState();
  if (reason === "save") {
    if (s.savePrompted) return;
    useSignupNudge.setState({ reason, savePrompted: true });
  } else useSignupNudge.setState({ reason });
}

export const closeSignupNudge = () => useSignupNudge.setState({ reason: null });
