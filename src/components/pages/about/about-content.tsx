import { ExploreBanner } from "@/assets/images";
import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import React, { memo } from "react";

const values = [
  {
    title: "Our Expertise",
    description:
      "Our team combines deep expertise in software development, user experience design, and digital strategy to build a powerful platform that simplifies event discovery, ticketing, and management.",
    className: "bg-sky-50",
  },
  {
    title: "Core Values",
    description:
      "We believe great events are built on trust, collaboration, and shared experiences. That's why our culture is rooted in transparency, integrity, and a constant openness to feedback.",
    className: "bg-slate-50",
  },
  {
    title: "Client-Centric Approach",
    description:
      "Whether you're hosting a private gathering or a large-scale festival, we tailor our tools and support to match your unique needs. Your success is our priority because when your event thrives, so do we.",
    className: "bg-pink-50",
  },
  {
    title: "Pioneering Innovation",
    description:
      "From intuitive dashboards to seamless ticketing and real-time insights, we're redefining how events are planned and experienced. Innovation fuels everything we do, ensuring our platform stays ahead of the curve.",
    className: "bg-slate-50",
  },
  {
    title: "Your Digital Transformation Partner",
    description:
      "As events evolve, we're here to help you evolve with them. Whether you're stepping into hybrid events, mobile-first experiences, or smart audience engagement, Turnupz is your partner in digital transformation.",
    className: "bg-sky-50",
  },
];

const features = [
  {
    title: "Discover Events:",
    description:
      "Explore curated experiences based on your interests, location, or trending vibes.",
  },
  {
    title: "Create Events:",
    description:
      "Hosting something special? List your event, set your details, and share it with the world all in minutes.",
  },
  {
    title: "Manage & Track:",
    description:
      "From RSVPs to ticket sales, Turnupz gives you full control to make your event a success.",
  },
  {
    title: "Engage Your Crowd:",
    description:
      "Reach more people with our built-in sharing tools, reminders, and user-friendly interface.",
  },
];

const AboutContent = () => {
  return (
    <SectionContainer className="py-10 md:py-16 space-y-16 md:space-y-24">
      <div className="space-y-8">
        <h2 className="text-center text-[clamp(1.5rem,3vw,2.25rem)] font-bold">
          About Turnupz
        </h2>
        <div className="space-y-4 text-sm md:text-base opacity-80">
          <p>
            We&apos;re your go-to platform for discovering the best events
            around you from concerts, festivals, conferences, parties,
            workshops, and everything in between. Whether you&apos;re looking to
            attend or planning to host, Turnupz makes it easy, seamless, and
            exciting.
          </p>
          <p>
            At our core, Turnupz connects people through experiences. We
            believe events are more than just dates on a calendar they&apos;re
            memories in the making. That&apos;s why we empower individuals,
            brands, and organizations to create, promote, and manage events
            effortlessly while giving attendees a fun, simple way to find and
            join events they love.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {values.map((value) => (
          <div
            key={value.title}
            className={`${value.className} rounded-xl p-6 space-y-3 text-center`}
          >
            <h3 className="font-bold">{value.title}</h3>
            <p className="text-sm opacity-70">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="aspect-square w-full rounded-xl overflow-hidden relative">
          <CustomImageComponent
            src={ExploreBanner}
            alt="What you can do on Turnupz"
            fill
            className="rounded-none"
            imageClassName="object-cover object-center"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold">
            What You Can Do on Turnupz
          </h2>
          <div className="space-y-4">
            {features.map((feature) => (
              <p key={feature.title} className="text-sm md:text-base">
                <span className="font-bold">{feature.title}</span>{" "}
                <span className="opacity-80">{feature.description}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default memo(AboutContent);
