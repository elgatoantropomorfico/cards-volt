import { NextResponse } from "next/server";
import { getLiveCatalog } from "@/server/get-live-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Live catalog prices for the public storefront.
 * Source of truth = database (editable from Superadmin).
 */
export async function GET() {
  const { products } = await getLiveCatalog();

  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
