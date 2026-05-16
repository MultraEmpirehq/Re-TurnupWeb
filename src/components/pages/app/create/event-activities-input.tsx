import InputField from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import TextareaField from "@/components/ui/textarea-field";
import { cn } from "@/lib/utils";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { PlusIcon, TrashIcon } from "lucide-react";

/** Parses "HH:mm" and returns a Date with that time on the given date. */
function timeStringToDate(timeString: string, baseDate: Date): Date {
  const [hours = 0, minutes = 0] = timeString.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Formats a Date as "HH:mm" for input type="time". */
function dateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

const schema = Joi.object({
  activityName: Joi.string().required().messages({
    "string.empty": "Activity name is required",
    "any.required": "Activity name is required",
  }),
  activityDate: Joi.date().required().messages({
    "date.empty": "Activity date is required",
    "any.required": "Activity date is required",
  }),
  activityDescription: Joi.string().required().messages({
    "string.empty": "Activity description is required",
    "any.required": "Activity description is required",
  }),
});

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
  selectedDate?: Date;
}

const defaultValues: IEventActivity = {
  activityName: "",
  activityDate: new Date(),
  activityDescription: "",
};

const EventActivitiesInput: React.FC<IEventActivitiesInputProps> = ({
  eventActivities = [],
  selectedDate,
  setEventActivities,
  error,
  errorClassName,
}) => {
  const baseDateForTime = useMemo(
    () => selectedDate ?? new Date(),
    [selectedDate],
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
    setFocus,
  } = useForm({
    defaultValues,
    resolver: joiResolver(schema),
    mode: "onChange",
  });
  const [showActivityInput, setShowActivityInput] = useState(false);
  const parsedEventActivities = useMemo(() => {
    return eventActivities?.filter(Boolean);
  }, [eventActivities]);
  const shouldShowActivityInput = useMemo(() => {
    return (
      (eventActivities?.filter(Boolean)?.length || 0) < 1 || showActivityInput
    );
  }, [eventActivities, showActivityInput]);
  const handleRemoveActivity = useCallback(
    (index: number) => {
      setEventActivities(eventActivities.filter((_, i) => i !== index));
    },
    [eventActivities, setEventActivities],
  );
  const handleAddActivity = useCallback(
    (data: IEventActivity) => {
      setEventActivities([...eventActivities, data]);
      setShowActivityInput(false);
      reset();
    },
    [eventActivities, setEventActivities, setShowActivityInput, reset],
  );
  return (
    <div className="space-y-6 lg:col-span-2">
      <Label className="opacity-70">Event Activities</Label>

      {parsedEventActivities?.length > 0 &&
        parsedEventActivities?.map((activity, index) => (
          <div
            key={index}
            className="flex flex-row items-start gap-2 py-2 px-4 bg-black/5 rounded-md"
          >
            <div key={index} className="space-y-2 flex-1">
              <p className="font-medium">{activity?.activityName}</p>
              <p className="text-sm opacity-60">
                {activity?.activityDescription}
              </p>
              <p className="text-xs opacity-60">
                {format(activity?.activityDate, "HH:mm")}
              </p>
            </div>
            <Button
              variant="ghost"
              type="button"
              className="text-xs inline-flex items-center gap-2 text-red-500"
              onClick={() => handleRemoveActivity(index)}
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        ))}
      {shouldShowActivityInput && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Name"
              error={errors?.activityName?.message}
              type="text"
              placeholder="Enter activity name"
              {...register("activityName", {})}
            />
            <Controller
              name="activityDate"
              control={control}
              render={({ field, fieldState }) => (
                <InputField
                  label="Time"
                  type="time"
                  error={fieldState?.error?.message}
                  placeholder="Select time"
                  value={dateToTimeString(field.value)}
                  onChange={(e) => {
                    const timeString = e?.target?.value;
                    if (timeString) {
                      field.onChange(
                        timeStringToDate(timeString, baseDateForTime),
                      );
                    }
                  }}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <TextareaField
            label="Description"
            error={errors?.activityDescription?.message}
            placeholder="Enter activity description"
            {...register("activityDescription")}
          />
          <div className="flex justify-end gap-4">
            {parsedEventActivities?.length > 0 && (
              <Button
                variant="outline"
                type="button"
                className="text-xs inline-flex items-center gap-2 border-red-300 text-red-500"
                onClick={() => {
                  setShowActivityInput(false);
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              disabled={isSubmitting || !isValid}
              variant="outline"
              type="button"
              className="text-xs inline-flex items-center gap-2"
              onClick={handleSubmit(handleAddActivity)}
            >
              Add
            </Button>
          </div>
        </div>
      )}
      {!shouldShowActivityInput && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowActivityInput(true);
              setTimeout(() => {
                setFocus("activityName");
              }, 100);
            }}
          >
            Add Activity <PlusIcon className="size-4" />
          </Button>
        </div>
      )}
      {error && (
        <p
          className={cn(
            "text-sm",

            error && errorClassName,
            error && "text-destructive",
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default memo(EventActivitiesInput);
