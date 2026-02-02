import BannerComponent from "@/components/pages/home/banner.component";
import PastEvents from "@/components/pages/home/past-events";
import TrendingEvents from "@/components/pages/home/trending-events";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div>
      <BannerComponent />
      <TrendingEvents />
      <PastEvents />
    </div>
  );
}
