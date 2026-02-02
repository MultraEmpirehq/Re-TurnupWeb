import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PlusIcon, TrashIcon } from "lucide-react";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";

interface IAdditionalInformationProps {
  guestNames: string[];
  setGuestNames: (additionalInformation: string[]) => void;
  error?: string;
  errorClassName?: string;
}

const GuestNamesInput: React.FC<IAdditionalInformationProps> = ({
  guestNames = ["Guest One"],
  setGuestNames,
  error,
  errorClassName,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTextArea, setShowTextArea] = useState(false);
  const parsedGuestNames = useMemo(() => {
    return guestNames?.filter(Boolean);
  }, [guestNames]);
  const [guestNamesInput, setGuestNamesInput] = useState("");
  const shouldShowTextArea = useMemo(() => {
    return (guestNames?.filter(Boolean)?.length || 0) < 1 || showTextArea;
  }, [guestNames, showTextArea]);
  const handleRemoveGuestName = useCallback(
    (index: number) => {
      setGuestNames(guestNames?.filter((_, i) => i !== index));
    },
    [guestNames, setGuestNames]
  );
  const handleAddGuestName = useCallback(() => {
    if (guestNamesInput?.trim() === "") return;
    setGuestNames([...guestNames, guestNamesInput]);
    setGuestNamesInput("");
    setShowTextArea(false);
  }, [guestNames, guestNamesInput, setGuestNames]);
  return (
    <div className="space-y-2 col-span-2">
      <Label className="opacity-70">Special Guests</Label>
      {guestNames.length > 0 && (
        <div className="flex flex-col gap-2">
          {parsedGuestNames?.map((guestName, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-between px-4 py-1 bg-muted rounded-md"
            >
              <div className="flex-1 flex-row flex items-center gap-2">
                <Avatar>
                  <AvatarFallback className="bg-white">
                    {guestName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs">{guestName}</p>
              </div>
              <Button
                onClick={() => handleRemoveGuestName(index)}
                variant="ghost"
                className="text-xs inline-flex items-center gap-2 text-red-500"
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {shouldShowTextArea && (
        <>
          <InputField
            ref={inputRef}
            value={guestNamesInput}
            placeholder="Enter guest name"
            onChange={(e) => setGuestNamesInput(e?.target?.value || "")}
          />
          <div className="flex justify-end gap-2">
            {parsedGuestNames.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowTextArea(false)}
                className="text-xs inline-flex items-center gap-2 text-red-500 border-red-300"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleAddGuestName}
              variant="outline"
              className="text-xs inline-flex items-center gap-2"
            >
              Add
            </Button>
          </div>
        </>
      )}
      {!shouldShowTextArea && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowTextArea(true);
              setTimeout(() => {
                inputRef?.current?.focus();
              }, 100);
            }}
            className={"text-xs inline-flex items-center gap-2"}
          >
            Add Guest <PlusIcon className="size-4" />
          </Button>
        </div>
      )}
      {error && (
        <p
          className={cn(
            "text-sm",

            error && errorClassName,
            error && "text-destructive"
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default memo(GuestNamesInput);
