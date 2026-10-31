import { create } from "zustand";

/** Why a guest is being asked to create an account. */
export type NudgeReason = "save" | "alert" | "preview";

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

/**
 * Saves a product, or — for the home page preview, whose products aren't in the catalogue the visitor has — asks a
 * guest to join instead. Members on the home page are pointed to the product rather than saving a preview copy.
 */
export function saveOrJoin(id: string, save: (id: string) => void, signedIn: boolean) {
  if (!id.startsWith("deal-")) return save(id);
  if (!signedIn) useSignupNudge.setState({ reason: "preview" });
}

export const closeSignupNudge = () => useSignupNudge.setState({ reason: null });
