import { redirect } from "next/navigation"

/** Left over from the old sign-up (setup call and pre-approved welcome). The new flow has no such step. */
export default function Old() {
  redirect("/signup/about")
}
