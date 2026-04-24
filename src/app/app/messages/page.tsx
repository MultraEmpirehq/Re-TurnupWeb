import React, { memo } from "react";

export const dynamic = "force-dynamic";

const MessagesPage = () => {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,35,95,0.2)]">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-primary">
        Chats
      </p>
      <h1 className="text-3xl font-semibold tracking-[-0.04em] text-secondary-950">
        Customer conversations are coming here.
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-secondary-500">
        This page is ready for your Turnupz messaging experience. We can now
        design the chat layout and thread view without blocking the rest of the
        dashboard shell.
      </p>
    </div>
  );
};

export default memo(MessagesPage);
