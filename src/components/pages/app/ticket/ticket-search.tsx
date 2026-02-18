import InputField from "@/components/ui/input-field";
import { SearchIcon } from "lucide-react";
import React, { memo } from "react";

const TicketSearch = () => {
  return (
    <div className="w-full flex-row flex items-center justify-between">
      <div className="flex-row items-center gap-4"></div>
      <InputField
        className="w-full max-w-[300px]"
        placeholder="Search by name, event etc"
        rightIcon={<SearchIcon className="size-4" />}
      />
    </div>
  );
};

export default memo(TicketSearch);
