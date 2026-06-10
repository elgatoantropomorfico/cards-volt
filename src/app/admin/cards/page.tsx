import { redirect } from "next/navigation";

export default function AdminCardsRedirect() {
  redirect("/admin#cards");
}
