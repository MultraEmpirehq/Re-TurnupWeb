import RedirectIfAuthenticated from "@/components/auth/redirect-if-authenticated";
import AdminLoginForm from "@/components/pages/auth/admin-login-form";
import type { Metadata } from "next";

// Not linked from anywhere on the site, and kept out of search.
export const metadata: Metadata = {
  title: "Admin sign-in | Turnupz",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <RedirectIfAuthenticated>
      <AdminLoginForm />
    </RedirectIfAuthenticated>
  );
}
