import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import TextareaField from "@/components/ui/textarea-field";
import { cn } from "@/lib/utils";
import { PlusIcon, TrashIcon } from "lucide-react";
import React, { memo, useCallback, useMemo, useState } from "react";

interface IAdditionalInformationProps {
  additionalInformation: string[];
  setAdditionalInformation: (additionalInformation: string[]) => void;
  error?: string;
  errorClassName?: string;
}

const AdditionalInformation: React.FC<IAdditionalInformationProps> = ({
  additionalInformation = [],
  setAdditionalInformation,
  error,
  errorClassName,
}) => {
  const [showTextArea, setShowTextArea] = useState(false);
  const parsedAdditionalInformation = useMemo(() => {
    return additionalInformation.filter(Boolean);
  }, [additionalInformation]);
  const [additionalInformationInput, setAdditionalInformationInput] =
    useState("");
  const shouldShowTextArea = useMemo(() => {
    return (
      (additionalInformation?.filter(Boolean)?.length || 0) < 1 || showTextArea
    );
  }, [additionalInformation, showTextArea]);
  const handleRemoveAdditionalInformation = useCallback(
    (index: number) => {
      setAdditionalInformation(
        additionalInformation.filter((_, i) => i !== index)
      );
    },
    [additionalInformation, setAdditionalInformation]
  );
  const handleAddAdditionalInformation = useCallback(() => {
    if (additionalInformationInput?.trim() === "") return;
    setAdditionalInformation([
      ...additionalInformation,
      additionalInformationInput,
    ]);
    setAdditionalInformationInput("");
    setShowTextArea(false);
  }, [
    additionalInformation,
    additionalInformationInput,
    setAdditionalInformation,
  ]);
  return (
    <div className="space-y-2 col-span-2">
      <Label className="opacity-70">Additional Information</Label>
      {additionalInformation.length > 0 && (
        <div className="flex flex-col gap-2">
          {parsedAdditionalInformation?.map((information, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-between px-4 py-1 bg-muted rounded-md"
            >
              <div className="flex-1">
                <p className="text-xs">{information}</p>
              </div>
              <Button
                onClick={() => handleRemoveAdditionalInformation(index)}
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
          <TextareaField
            value={additionalInformationInput}
            placeholder="Enter additional information"
            onChange={(e) =>
              setAdditionalInformationInput(e?.target?.value || "")
            }
          />
          <div className="flex justify-end gap-2">
            {parsedAdditionalInformation.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowTextArea(false)}
                className="text-xs inline-flex items-center gap-2 text-red-500 border-red-300"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleAddAdditionalInformation}
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
            onClick={() => setShowTextArea(true)}
            className={"text-xs inline-flex items-center gap-2"}
          >
            Add Additional Information <PlusIcon className="size-4" />
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

export default memo(AdditionalInformation);
