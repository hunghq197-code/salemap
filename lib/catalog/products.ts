import "server-only";

import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type CatalogProductType =
  | "base_plan"
  | "recurring_addon"
  | "quota_pack"
  | "service_package";

export type CatalogProduct = {
  activePrice: CatalogPrice | null;
  description?: string | null;
  displayOrder: number;
  id: string;
  isActive: boolean;
  isPublic: boolean;
  name: string;
  productCode: string;
  productType: CatalogProductType;
  slug: string;
};

export type CatalogPrice = {
  amount: number;
  billingPeriod: "monthly" | "one_time";
  currency: "VND";
  entitlementTemplate: Record<string, unknown>;
  id: string;
  isActive: boolean;
  priceCode: string;
  productId: string;
};

type ProductRow = {
  description?: string | null;
  display_order?: number | null;
  id: string;
  is_active?: boolean | null;
  is_public?: boolean | null;
  name?: string | null;
  product_code?: string | null;
  product_type?: CatalogProductType | null;
  slug?: string | null;
};

type PriceRow = {
  amount?: number | null;
  billing_period?: "monthly" | "one_time" | null;
  currency?: "VND" | null;
  entitlement_template?: Record<string, unknown> | null;
  id: string;
  is_active?: boolean | null;
  price_code?: string | null;
  product_id?: string | null;
};

function mapPrice(row: PriceRow): CatalogPrice {
  return {
    amount: Number(row.amount ?? 0),
    billingPeriod: row.billing_period || "one_time",
    currency: row.currency || "VND",
    entitlementTemplate: row.entitlement_template || {},
    id: row.id,
    isActive: Boolean(row.is_active ?? true),
    priceCode: row.price_code || "",
    productId: row.product_id || "",
  };
}

function mapProduct(row: ProductRow, price: CatalogPrice | null): CatalogProduct {
  return {
    activePrice: price,
    description: row.description ?? null,
    displayOrder: Number(row.display_order ?? 100),
    id: row.id,
    isActive: Boolean(row.is_active ?? true),
    isPublic: Boolean(row.is_public ?? true),
    name: row.name || "",
    productCode: row.product_code || "",
    productType: row.product_type || "quota_pack",
    slug: row.slug || "",
  };
}

async function listProducts(input?: {
  activeOnly?: boolean;
  publicOnly?: boolean;
  productTypes?: CatalogProductType[];
}) {
  const supabase = createSupabaseAdminClient();
  let productQuery = supabase
    .from("products")
    .select(
      "id,product_code,slug,name,description,product_type,is_active,is_public,display_order",
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (input?.activeOnly) productQuery = productQuery.eq("is_active", true);
  if (input?.publicOnly) productQuery = productQuery.eq("is_public", true);
  if (input?.productTypes?.length) {
    productQuery = productQuery.in("product_type", input.productTypes);
  }

  const { data: products, error } = await productQuery.limit(200);

  if (error) {
    return {
      items: [] as CatalogProduct[],
      schemaReady: false,
    };
  }

  const productRows = (products ?? []) as ProductRow[];
  const productIds = productRows.map((product) => product.id);
  let prices = new Map<string, CatalogPrice>();

  if (productIds.length > 0) {
    const { data: priceRows } = await supabase
      .from("product_prices")
      .select(
        "id,product_id,price_code,currency,amount,billing_period,is_active,entitlement_template",
      )
      .in("product_id", productIds)
      .eq("is_active", true)
      .order("starts_at", { ascending: false });

    prices = new Map(
      ((priceRows ?? []) as PriceRow[])
        .map(mapPrice)
        .filter((price) => price.productId)
        .map((price) => [price.productId, price]),
    );
  }

  return {
    items: productRows.map((product) => mapProduct(product, prices.get(product.id) ?? null)),
    schemaReady: true,
  };
}

export async function getAdminCatalogProducts() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CATALOG);

  return listProducts();
}

export async function getPublicAddOnCatalog() {
  return listProducts({
    activeOnly: true,
    productTypes: ["quota_pack", "recurring_addon", "service_package"],
    publicOnly: true,
  });
}

export async function getActiveCatalogPrice(priceId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: price, error: priceError } = await supabase
    .from("product_prices")
    .select(
      "id,product_id,price_code,currency,amount,billing_period,is_active,entitlement_template",
    )
    .eq("id", priceId)
    .eq("is_active", true)
    .maybeSingle();

  if (priceError || !price) return null;

  const mappedPrice = mapPrice(price as PriceRow);
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      "id,product_code,slug,name,description,product_type,is_active,is_public,display_order",
    )
    .eq("id", mappedPrice.productId)
    .eq("is_active", true)
    .maybeSingle();

  if (productError || !product) return null;

  return {
    price: mappedPrice,
    product: mapProduct(product as ProductRow, mappedPrice),
  };
}
