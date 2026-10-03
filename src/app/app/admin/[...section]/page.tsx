import AdminComingSoon from "@/components/pages/app/admin/coming-soon/admin-coming-soon";
import { findComingSoonSection } from "@/components/pages/app/admin/shell/admin-nav";
import { ROUTES } from "@/lib/variables";
import { notFound } from "next/navigation";

// Department sections listed in the admin nav that haven't been built yet. Anything
// not in the nav is a real 404.
export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const match = findComingSoonSection(
    `${ROUTES.ADMIN_OVERVIEW.href}/${section.join("/")}`,
  );
  if (!match) {
    notFound();
  }

  return (
    <AdminComingSoon
      department={match.group.label}
      title={match.item.label}
      description={match.item.comingSoon ?? ""}
    />
  );
}
