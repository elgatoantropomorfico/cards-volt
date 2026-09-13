import { LandingStore } from "@/components/marketing/store/LandingStore";
import { getLiveCatalog } from "@/server/get-live-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const { products, prices } = await getLiveCatalog();

  return <LandingStore catalogProducts={products} initialPrices={prices} />;
}
