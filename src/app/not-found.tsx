import NotFoundContent from "@/components/pages/not-found/not-found-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found | Turnupz",
};

export default function NotFound() {
  return <NotFoundContent />;
}
