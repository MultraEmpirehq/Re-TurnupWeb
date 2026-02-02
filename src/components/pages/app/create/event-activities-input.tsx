import InputField from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import TextareaField from "@/components/ui/textarea-field";
import { cn } from "@/lib/utils";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

export interface IEventActivity {
  activityName: string;
  activityDate: Date;
  activityDescription: string;
}

interface IEventActivitiesInputProps {
  eventActivities: IEventActivity[];
  setEventActivities: (eventActivities: IEventActivity[]) => void;
  error?: string;
  errorClassName?: string;
}

const EventActivitiesInput: React.FC<IEventActivitiesInputProps> = ({
  eventActivities = [],
  setEventActivities,
  error,
  errorClassName,
}) => {
  const {} = useForm({});
  const [showActivityInput, setShowActivityInput] = useState(false);
  const shouldShowActivityInput = useMemo(() => {
    return (
      (eventActivities?.filter(Boolean)?.length || 0) < 1 || showActivityInput
    );
  }, [eventActivities, showActivityInput]);
  const handleRemoveActivity = useCallback(
    (index: number) => {
      setEventActivities(eventActivities.filter((_, i) => i !== index));
    },
    [eventActivities, setEventActivities]
  );
  const handleAddActivity = useCallback(() => {}, [setShowActivityInput]);
  return (
    <div className="space-y-6 col-span-2">
      <Label className="opacity-70">Event Activities</Label>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <InputField label="Name" type="text" />
          <InputField label="Time" type="time" />
        </div>
        <TextareaField label="Description" />
      </div>
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

export default memo(EventActivitiesInput);
