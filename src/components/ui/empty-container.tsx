import React, { memo } from "react";
import { Button } from "./button";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "./empty";

const EmptyContainer: React.FC<{
  title: string;
  description: string;
  action?: () => void;
  actionText?: string;
  icon?: React.ReactNode;
}> = ({ title, description, action, actionText, icon }) => {
  return (
    <Empty className="flex flex-col items-center justify-center h-full w-full min-h-[500px]">
      <EmptyMedia variant="icon">{icon}</EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
      {action && <Button>{actionText || "Continue"}</Button>}
    </Empty>
  );
};

export default memo(EmptyContainer);
