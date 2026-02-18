import Banner from "@/components/pages/contact/banner";
import ContactUs from "@/components/pages/contact/contact-us";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const ContactPage = () => {
  return (
    <div>
      <Banner />
      <ContactUs />
    </div>
  );
};

export default memo(ContactPage);
