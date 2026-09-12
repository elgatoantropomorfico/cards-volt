import { redirect } from "next/navigation";
import { handleApprovedOrder } from "@/server/order-fulfillment";

export const dynamic = "force-dynamic";

/**
 * Dev simulation helper when Mercado Pago credentials are not loaded yet in environment.
 * Immediately marks order approved and redirects to checkout/success.
 */
export default async function SimulateMpPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  if (orderId) {
    await handleApprovedOrder({
      orderId,
      paymentId: `sim-pay-${Date.now()}`,
      paymentMethod: "visa_simulated",
    });
    redirect(`/checkout/success?orderId=${orderId}`);
  }

  redirect("/");
}
