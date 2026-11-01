import type { Metadata } from "next";
import DeleteAccount from "@/components/pages/account/delete-account";

// Public, so app stores can link to it: how to delete a Turnupz account and
// what happens, with the delete form for anyone signed in.
export const metadata: Metadata = {
  title: "Delete your account | Turnupz",
  description:
    "How to delete your Turnupz account, and what is removed or kept when you do.",
};

export default function DeleteAccountPage() {
  return <DeleteAccount />;
}
