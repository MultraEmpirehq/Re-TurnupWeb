import CustomImageComponent from "@/components/ui/custom-image.component";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import React, { memo } from "react";

const MagicLinkModal: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  email: string;
}> = ({ open, setOpen, email }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="text-center flex flex-col items-center justify-center gap-10 w-sm py-10"
        showCloseButton={false}
      >
        <CustomImageComponent className="size-20" alt="email" src={""} />
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center">
            We&apos;ve sent a login link to {email}?
          </DialogTitle>
          <DialogDescription className="text-center">
            Please check your email. If not seen, be sure to check your spam
            folder. Need help?{" "}
            <Link href="/contact" className="text-blue-500">
              Contact support.
            </Link>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default memo(MagicLinkModal);
