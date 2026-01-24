import { ErrorAnimation } from "@/assets/lotties";
import { Player } from "@lottiefiles/react-lottie-player";
import React, { memo } from "react";
import { Button } from "../ui/button";

const ErrorContainer: React.FC<{
  retryFunction?: () => void;
  disabled?: boolean;
  error: string;
}> = ({ retryFunction, error, disabled }) => {
  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      <div className="">
        <Player
          autoplay
          loop
          src={ErrorAnimation}
          className="w-[70px] overflow-hidden"
        ></Player>
      </div>
      <div className="space-y-2 flex flex-col items-center text-center">
        <h1 className="font-bold text-2xl">Unknown error!</h1>
        <p className="text-sm opacity-70">{error}</p>
      </div>
      {retryFunction && (
        <Button
          onClick={retryFunction}
          disabled={disabled}
          variant={"outline"}
          className="text-primary border-primary"
        >
          Retry
        </Button>
      )}
    </div>
  );
};

export default memo(ErrorContainer);
