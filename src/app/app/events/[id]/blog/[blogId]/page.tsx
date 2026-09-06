import VendorEventBlogPostView from "@/components/pages/app/vendor-event-blog-post-view";
import React from "react";

const VendorEventBlogPostPage = async ({
  params,
}: {
  params: Promise<{ id: string; blogId: string }>;
}) => {
  const { id, blogId } = await params;

  return <VendorEventBlogPostView eventId={id} blogId={blogId} />;
};

export default VendorEventBlogPostPage;
