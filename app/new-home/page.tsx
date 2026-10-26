import { redirect } from "next/navigation";

// The preview became the home page; keep old links working.
export default function NewHome() {
  redirect("/");
}
