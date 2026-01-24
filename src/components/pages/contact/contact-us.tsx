import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/input-field";
import TextareaField from "@/components/ui/textarea-field";
import React, { memo } from "react";

const ContactUs = () => {
  return (
    <SectionContainer className="py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Talk with us</h1>
          <p className="text-sm opacity-70 max-w-sm">
            Questions, comments, or suggestions? Simply fill in the form and
            we&apos;ll be in touch shortly.
          </p>
        </div>
      </div>
      <form className="space-y-5">
        <InputField label="Name" placeholder="Enter your name" />
        <InputField label="Email" placeholder="Enter your email" />
        <TextareaField label="Message" placeholder="Enter your message" />
        <Button className="w-full">Submit</Button>
      </form>
    </SectionContainer>
  );
};

export default memo(ContactUs);
