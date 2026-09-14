"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Layers,
  Truck,
  Settings,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ExternalLink,
  ChevronRight,
  Plus,
  Minus,
  Save,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Mail,
  Send,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import {
  updateAdminOrderStatus,
  deleteAdminOrder,
  recordInventoryAdjustment,
  updateStoreSettings,
  updateAdminProduct,
  updateResendApiKey,
  upsertStoreMailbox,
  setStoreMailboxActive,
  sendAdminTestPurchaseEmail,
} from "@/server/admin-store-actions";

type StoreTab = "dashboard" | "orders" | "products" | "stock" | "shipping" | "emails" | "settings";

type MailboxRow = {
  id: string;
  email: string;
  label: string;
  role: string;
  active: boolean;
  notes: string | null;
};

export function StoreManager({
  metrics,
  orders,
  products,
  stockMovements,
  settings,
  mailboxes,
  appHost,
}: {
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    awaitingProfileCount: number;
    readyForProductionCount: number;
    inProductionCount: number;
    readyToShipCount: number;
    lowStockProductsCount: number;
  };
  orders: any[];
  products: any[];
  stockMovements: any[];
  settings: Record<string, string>;
  mailboxes: MailboxRow[];
  appHost: string;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<StoreTab>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const canDeleteOrder = (o: { paymentStatus: string }) =>
    o.paymentStatus === "PENDING" ||
    o.paymentStatus === "REJECTED" ||
    o.paymentStatus === "CANCELLED";

  const handleDeleteOrder = async (order: { id: string; orderNumber: string; paymentStatus: string }) => {
    if (!canDeleteOrder(order)) return;
    if (
      !window.confirm(
        `¿Eliminar el pedido ${order.orderNumber} (${order.paymentStatus})? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setDeletingId(order.id);
    const res = await deleteAdminOrder(order.id);
    setDeletingId(null);
    if (!res.ok) {
      toast({ title: "No se pudo eliminar", description: res.error, variant: "error" });
      return;
    }
    if (selectedOrderId === order.id) setSelectedOrderId(null);
    toast({ title: "Pedido eliminado", description: order.orderNumber, variant: "success" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Subnavegación de Tienda */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <Button
          variant={tab === "dashboard" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("dashboard");
            setSelectedOrderId(null);
          }}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" /> Dashboard
        </Button>
        <Button
          variant={tab === "orders" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("orders")}
          className="gap-2"
        >
          <ShoppingBag className="h-4 w-4" /> Ventas / Pedidos ({orders.length})
        </Button>
        <Button
          variant={tab === "products" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("products");
            setSelectedOrderId(null);
          }}
          className="gap-2"
        >
          <Layers className="h-4 w-4" /> Catálogo ({products.length})
        </Button>
        <Button
          variant={tab === "stock" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("stock");
            setSelectedOrderId(null);
          }}
          className="gap-2"
        >
          <Package className="h-4 w-4" /> Stock & Trazabilidad
        </Button>
        <Button
          variant={tab === "shipping" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("shipping");
            setSelectedOrderId(null);
          }}
          className="gap-2"
        >
          <Truck className="h-4 w-4" /> Envíos
        </Button>
        <Button
          variant={tab === "emails" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("emails");
            setSelectedOrderId(null);
          }}
          className="gap-2"
        >
          <Mail className="h-4 w-4" /> Correos
        </Button>
        <Button
          variant={tab === "settings" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTab("settings");
            setSelectedOrderId(null);
          }}
          className="gap-2"
        >
          <Settings className="h-4 w-4" /> Configuración (MP & Envíos)
        </Button>
      </div>

      {/* DASHBOARD TAB */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Facturación Aprobada</CardDescription>
                <CardTitle className="text-2xl font-mono text-[#7000FF]">
                  ${metrics.totalRevenue.toLocaleString("es-AR")} ARS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">{metrics.totalOrders} órdenes registradas</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Listas para Producción</CardDescription>
                <CardTitle className="text-2xl font-mono text-emerald-600">
                  {metrics.readyForProductionCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">Perfil completo y confirmado</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Esperando Perfil</CardDescription>
                <CardTitle className="text-2xl font-mono text-amber-500">
                  {metrics.awaitingProfileCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">Cliente en onboarding</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Stock Bajo / Alertas</CardDescription>
                <CardTitle className="text-2xl font-mono text-rose-500">
                  {metrics.lowStockProductsCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">Menos de 5 unidades</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Flujo Operativo de Producción</CardTitle>
              <CardDescription>
                Monitoreá el estado de los pedidos físicos desde el pago hasta la entrega.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl border bg-secondary/30">
                  <div className="text-xl font-bold font-mono">{metrics.awaitingProfileCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">1. Esperando Wizard</div>
                </div>
                <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                  <div className="text-xl font-bold font-mono text-emerald-600">
                    {metrics.readyForProductionCount}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    2. Listos para Grabar
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/20">
                  <div className="text-xl font-bold font-mono text-blue-600">
                    {metrics.inProductionCount}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    3. En Fabricación / NFC
                  </div>
                </div>
                <div className="p-4 rounded-xl border bg-purple-500/10 border-purple-500/20">
                  <div className="text-xl font-bold font-mono text-purple-600">
                    {metrics.readyToShipCount}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                    4. Listo para Despachar
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ORDERS / VENTAS TAB */}
      {tab === "orders" && (
        <div className="space-y-6">
          {selectedOrder ? (
            <OrderDetailView
              order={selectedOrder}
              appHost={appHost}
              onBack={() => setSelectedOrderId(null)}
              canDelete={canDeleteOrder(selectedOrder)}
              deleting={deletingId === selectedOrder.id}
              onDelete={() => handleDeleteOrder(selectedOrder)}
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
              <table className="min-w-[850px] w-full text-sm">
                <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Pago</th>
                    <th className="px-4 py-3">Perfil Volt</th>
                    <th className="px-4 py-3">Producción</th>
                    <th className="px-4 py-3">Envío</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-xs">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-xs">{o.customerName}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                          {o.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        ${o.total.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={o.paymentStatus === "APPROVED" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {o.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {o.profile ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs">/{o.profile.slug}</span>
                            <Badge
                              variant={o.profile.profileStatus === "READY" ? "default" : "outline"}
                              className="text-[9px]"
                            >
                              {o.profile.profileStatus}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin perfil</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium">
                          {o.fulfillmentStatus === "READY_FOR_PRODUCTION" ? (
                            <span className="text-emerald-600 font-semibold">Listo Producción</span>
                          ) : (
                            o.fulfillmentStatus
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {o.shippingStatus}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {canDeleteOrder(o) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOrder(o)}
                              disabled={deletingId === o.id}
                              className="text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Eliminar pedido sin pago"
                            >
                              {deletingId === o.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrderId(o.id)}
                            className="text-xs gap-1"
                          >
                            Ver detalle <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!orders.length && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        No hay pedidos de tienda registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === "products" && <ProductsEditorSection products={products} />}

      {/* STOCK & TRAZABILIDAD TAB */}
      {tab === "stock" && (
        <StockManagementSection products={products} movements={stockMovements} />
      )}

      {/* ENVIOS TAB */}
      {tab === "shipping" && (
        <Card>
          <CardHeader>
            <CardTitle>Envíos y Logística</CardTitle>
            <CardDescription>
              Operaciones de despacho de tarjetas físicas impresas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl border bg-secondary/20 flex items-start gap-3">
              <Truck className="h-5 w-5 text-[#7000FF] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Mercado Envíos & Operadores Nacionales</p>
                <p className="text-muted-foreground">
                  Las órdenes listas para despachar pueden ser etiquetadas y despachadas desde el detalle de cada pedido o automáticamente sincronizadas.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total de pedidos despachados o en tránsito:{" "}
              {orders.filter((o) => o.shippingStatus === "SHIPPED" || o.shippingStatus === "IN_TRANSIT").length}
            </p>
          </CardContent>
        </Card>
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && <StoreSettingsSection settings={settings} />}
      {tab === "emails" && <StoreEmailsSection settings={settings} mailboxes={mailboxes} />}
    </div>
  );
}

/**
 * Editor de catálogo: precios editables (impactan landing, carrito y Mercado Pago).
 */
function ProductsEditorSection({ products }: { products: any[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Catálogo editable</CardTitle>
          <CardDescription>
            Los precios que guardés acá son la fuente de verdad: landing, carrito y preferencias de Mercado Pago los usan automáticamente.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p) => (
          <ProductEditorCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function ProductEditorCard({ product }: { product: any }) {
  const router = useRouter();
  const [name, setName] = React.useState(product.name);
  const [monthly, setMonthly] = React.useState(Number(product.monthlyPrice ?? Number(product.price) / 12));
  const [annual, setAnnual] = React.useState(Number(product.price));
  const [stock, setStock] = React.useState(Number(product.stockQuantity ?? 0));
  const [active, setActive] = React.useState(Boolean(product.active));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setName(product.name);
    setMonthly(Number(product.monthlyPrice ?? Number(product.price) / 12));
    setAnnual(Number(product.price));
    setStock(Number(product.stockQuantity ?? 0));
    setActive(Boolean(product.active));
  }, [product]);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateAdminProduct({
      productId: product.id,
      name,
      monthlyPrice: monthly,
      price: annual,
      stockQuantity: stock,
      active,
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Producto actualizado · precios vivos en tienda y MP", variant: "success" });
      router.refresh();
    } else toast({ title: "Error", description: res.error, variant: "error" });
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-36 bg-black/60 flex items-center justify-center border-b">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover opacity-90" />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground/40" />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant={active ? "success" : "secondary"}>
            {active ? "Activo en tienda" : "Inactivo"}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-mono">{product.sku || product.slug}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <label className="block font-medium mb-1">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-secondary border rounded-lg px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium mb-1">Precio mensual (ARS)</label>
            <input
              type="number"
              min={0}
              value={monthly}
              onChange={(e) => {
                const m = Number(e.target.value);
                setMonthly(m);
                setAnnual(m * 12);
              }}
              className="w-full bg-secondary border rounded-lg px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Precio anual / MP (ARS)</label>
            <input
              type="number"
              min={0}
              value={annual}
              onChange={(e) => setAnnual(Number(e.target.value))}
              className="w-full bg-secondary border rounded-lg px-3 py-2 font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block font-medium mb-1">Stock físico</label>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full bg-secondary border rounded-lg px-3 py-2 font-mono"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span className="font-medium">Visible en tienda</span>
          </label>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="w-full gap-2 mt-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Guardar precios
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Vista de detalle de venta con QR, timeline y controles operativos
 */
function OrderDetailView({
  order,
  appHost,
  onBack,
  canDelete,
  deleting,
  onDelete,
}: {
  order: any;
  appHost: string;
  onBack: () => void;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const [updating, setUpdating] = React.useState(false);
  const [fulfillment, setFulfillment] = React.useState(order.fulfillmentStatus);
  const [shipping, setShipping] = React.useState(order.shippingStatus);
  const [trackingNumber, setTrackingNumber] = React.useState(order.trackingNumber || "");

  const wizardPath = React.useMemo(() => {
    const token = order.accessToken as string | null | undefined;
    return token
      ? `/onboarding/${order.id}?t=${encodeURIComponent(token)}`
      : `/onboarding/${order.id}`;
  }, [order.accessToken, order.id]);

  const wizardUrl = React.useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : `https://${appHost}`;
    return `${origin}${wizardPath}`;
  }, [appHost, wizardPath]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    const res = await updateAdminOrderStatus({
      orderId: order.id,
      fulfillmentStatus: fulfillment,
      shippingStatus: shipping,
      trackingNumber,
      note: "Actualizado manualmente desde Superadmin Tienda",
    });
    setUpdating(false);
    if (res.ok) {
      toast({ title: "Estado del pedido actualizado", variant: "success" });
    } else {
      toast({ title: "Error", description: res.error, variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          ← Volver al listado
        </Button>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge variant="outline" className="font-mono">
            {order.orderNumber}
          </Badge>
          <Badge variant={order.paymentStatus === "APPROVED" ? "success" : "secondary"}>
            {order.paymentStatus}
          </Badge>
          {canDelete && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
              disabled={deleting}
              onClick={onDelete}
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Eliminar pedido
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Info Comercial y Cliente (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Datos del Cliente & Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b text-xs">
                <div>
                  <span className="text-muted-foreground block">Nombre:</span>
                  <span className="font-semibold">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Email:</span>
                  <span className="font-semibold">{order.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Teléfono / WhatsApp:</span>
                  <span>{order.phone || "No especificado"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">DNI / CUIL:</span>
                  <span>{order.dni || order.identificationNumber || "No especificado"}</span>
                </div>
              </div>

              {/* Link directo al wizard / configuración del perfil */}
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-violet-900">
                  Link de configuración del cliente
                </p>
                <p className="text-[11px] text-violet-800/80">
                  Es el mismo link del correo (con `?t=`). Si borrás la cuenta, el pedido queda en cero y este link vuelve a abrir el wizard desde el día 1.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={wizardPath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#7000FF] px-3 py-2 text-xs font-semibold text-white hover:bg-[#8A2BE2] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir wizard de configuración
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    onClick={async () => {
                      await navigator.clipboard.writeText(wizardUrl);
                      toast({ title: "Link copiado", description: wizardUrl, variant: "success" });
                    }}
                  >
                    Copiar link
                  </Button>
                </div>
                {order.profile?.slug && (
                  <a
                    href={`/${order.profile.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-violet-700 hover:underline"
                  >
                    Ver perfil público /{order.profile.slug} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {order.shippingAddress && (
                <div className="pt-1 text-xs">
                  <span className="text-muted-foreground block mb-1">Dirección de Entrega:</span>
                  <div className="p-3 rounded-xl bg-secondary/30 font-mono">
                    {order.shippingAddress.street} {order.shippingAddress.number}
                    {order.shippingAddress.apartment ? `, Depto ${order.shippingAddress.apartment}` : ""}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.province} (CP: {order.shippingAddress.postalCode})
                    {order.shippingAddress.notes && (
                      <div className="text-[11px] text-muted-foreground mt-1 pt-1 border-t border-border/50">
                        Nota: {order.shippingAddress.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items de la Orden */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Productos Comprados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y text-xs">
                {order.items.map((item: any) => (
                  <div key={item.id} className="py-2.5 first:pt-0 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">{item.productNameSnapshot}</div>
                      <div className="text-muted-foreground font-mono">SKU: {item.skuSnapshot}</div>
                      <div className="text-muted-foreground">
                        {item.quantity} × ${item.unitPrice.toLocaleString("es-AR")}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm">
                      ${item.subtotal.toLocaleString("es-AR")} ARS
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t mt-3 flex justify-between font-bold text-sm">
                <span>Total Abonado:</span>
                <span className="font-mono text-[#7000FF]">${order.total.toLocaleString("es-AR")} ARS</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline de Eventos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial y Timeline de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.events?.map((ev: any) => (
                  <div key={ev.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#7000FF] mt-1 shrink-0" />
                    <div>
                      <span className="font-semibold">{ev.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-2">
                        {new Date(ev.createdAt).toLocaleString("es-AR")}
                      </span>
                      {ev.detail && <p className="text-muted-foreground text-[11px] mt-0.5">{ev.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Producción, QR y Perfil Asociado (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[#7000FF]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Producción Física & QR</span>
                <Badge variant={order.fulfillmentStatus === "READY_FOR_PRODUCTION" ? "success" : "secondary"}>
                  {order.fulfillmentStatus}
                </Badge>
              </CardTitle>
              <CardDescription>
                Identificador permanente e inmutable para grabación NFC y láser QR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.profile ? (
                <div className="space-y-4">
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-muted-foreground block">Perfil Asociado:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-sm">{order.profile.fullName}</span>
                        <Link
                          href={`/${order.profile.slug}`}
                          target="_blank"
                          className="text-[#7000FF] hover:underline flex items-center gap-1 font-mono text-xs"
                        >
                          /{order.profile.slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-muted-foreground block">
                        URL Física Permanente (Grabada en NFC y QR):
                      </span>
                      <div className="p-2.5 rounded-lg bg-secondary font-mono text-xs select-all text-purple-600 dark:text-purple-400 break-all font-semibold">
                        https://{appHost}/c/{order.profile.publicId}
                      </div>
                    </div>
                  </div>

                  {/* QR Preview Oficial */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-black/5 dark:bg-black/40 space-y-3">
                    <img
                      src={`/api/qr/${order.profile.slug}`}
                      alt="QR para producción"
                      className="w-40 h-40 rounded-lg shadow-md border bg-white p-2"
                    />
                    <div className="flex gap-2">
                      <a
                        href={`/api/qr/${order.profile.slug}`}
                        download={`QR-${order.orderNumber}.png`}
                        className="px-3 py-1.5 rounded-lg bg-[#7000FF] text-white text-xs font-medium hover:bg-[#8A2BE2] transition-colors"
                      >
                        Descargar QR (.PNG)
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Esperando que el cliente finalice el pago para asociar el perfil.
                </div>
              )}

              {/* Controles de Estado Operativo */}
              <div className="pt-4 border-t space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Estado de Producción:</label>
                  <select
                    value={fulfillment}
                    onChange={(e: any) => setFulfillment(e.target.value)}
                    className="w-full bg-secondary border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="AWAITING_PROFILE">AWAITING_PROFILE (Esperando Wizard)</option>
                    <option value="READY_FOR_PRODUCTION">READY_FOR_PRODUCTION (Listo)</option>
                    <option value="IN_PRODUCTION">IN_PRODUCTION (En fabricación/NFC)</option>
                    <option value="READY_TO_SHIP">READY_TO_SHIP (Listo para despacho)</option>
                    <option value="FULFILLED">FULFILLED (Completado y entregado)</option>
                    <option value="CANCELLED">CANCELLED (Cancelado)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Estado de Envío:</label>
                  <select
                    value={shipping}
                    onChange={(e: any) => setShipping(e.target.value)}
                    className="w-full bg-secondary border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="LABEL_CREATED">LABEL_CREATED (Etiqueta lista)</option>
                    <option value="SHIPPED">SHIPPED (Despachado)</option>
                    <option value="IN_TRANSIT">IN_TRANSIT (En viaje)</option>
                    <option value="DELIVERED">DELIVERED (Entregado)</option>
                    <option value="FAILED">FAILED (Fallido)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Número de Seguimiento / Guía:</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ej. AR-928172619"
                    className="w-full bg-secondary border rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="w-full mt-2 gap-2"
                >
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Guardar Cambios Operativos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Gestión de Stock con Trazabilidad e Historial
 */
function StockManagementSection({
  products,
  movements,
}: {
  products: any[];
  movements: any[];
}) {
  const [selectedProduct, setSelectedProduct] = React.useState(products[0]?.id || "");
  const [qty, setQty] = React.useState(10);
  const [type, setType] = React.useState<"PURCHASE" | "MANUAL_ADJUSTMENT">("PURCHASE");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleAdjust = async (direction: 1 | -1) => {
    if (!selectedProduct) return;
    setLoading(true);
    const res = await recordInventoryAdjustment({
      productId: selectedProduct,
      quantityChange: qty * direction,
      type,
      note: note.trim() || `Ajuste manual de ${qty * direction} unidades`,
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Inventario actualizado con trazabilidad", variant: "success" });
      setNote("");
    } else {
      toast({ title: "Error al ajustar stock", description: res.error, variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajuste Manual de Inventario</CardTitle>
          <CardDescription>
            Registrá entradas de compra, bajas por rotura o ajustes de inventario con firma de auditoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
            <div>
              <label className="block font-medium mb-1.5">Producto:</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-secondary border rounded-lg px-3 py-2"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Actual: {p.stockQuantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1.5">Cantidad:</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full bg-secondary border rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium mb-1.5">Motivo / Tipo:</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full bg-secondary border rounded-lg px-3 py-2"
              >
                <option value="PURCHASE">Ingreso de Fabricación / Compra</option>
                <option value="MANUAL_ADJUSTMENT">Ajuste de Conteo Físico</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                disabled={loading}
                onClick={() => handleAdjust(1)}
                className="flex-1 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Sumar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={loading}
                onClick={() => handleAdjust(-1)}
                className="flex-1 gap-1"
              >
                <Minus className="h-3.5 w-3.5" /> Restar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos de Stock</CardTitle>
          <CardDescription>Auditoría inmutable de entradas y salidas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-secondary text-left text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">Producto</th>
                  <th className="px-4 py-2.5">Cantidad</th>
                  <th className="px-4 py-2.5">Tipo</th>
                  <th className="px-4 py-2.5">Nota / Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono">
                {movements?.map((m: any) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-2.5 font-sans font-medium">{m.product?.name}</td>
                    <td className="px-4 py-2.5 font-bold">
                      <span className={m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[9px]">
                        {m.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-sans text-muted-foreground">{m.note}</td>
                  </tr>
                ))}
                {!movements?.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No hay movimientos de inventario registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Sección de Configuración de Credenciales de Tienda
 */
function StoreSettingsSection({ settings }: { settings: Record<string, string> }) {
  const [token, setToken] = React.useState("");
  const [pubKey, setPubKey] = React.useState(settings.MERCADOPAGO_PUBLIC_KEY || "");
  const [secret, setSecret] = React.useState("");
  const [sandbox, setSandbox] = React.useState(settings.MERCADOPAGO_SANDBOX === "true");
  const [originAddress, setOriginAddress] = React.useState(settings.SHIPPING_ORIGIN_ADDRESS || "");
  const [originPostal, setOriginPostal] = React.useState(settings.SHIPPING_ORIGIN_POSTAL_CODE || "");
  const [loading, setLoading] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateStoreSettings({
      ...(token && !token.includes("•") ? { mpAccessToken: token } : {}),
      mpPublicKey: pubKey,
      ...(secret && !secret.includes("•") ? { mpWebhookSecret: secret } : {}),
      mpSandbox: sandbox,
      shippingOriginAddress: originAddress,
      shippingOriginPostalCode: originPostal,
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Configuración guardada en base de datos", variant: "success" });
    } else {
      toast({ title: "Error", description: "No se pudieron guardar las credenciales", variant: "error" });
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Credenciales de Mercado Pago</CardTitle>
          <CardDescription>
            Cargá tus credenciales de producción o sandbox para cobrar directamente en tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Access Token de Mercado Pago (Privado):</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={
                settings.MERCADOPAGO_ACCESS_TOKEN_SET === "true"
                  ? "•••••••• (dejar o pegar nueva para reemplazar)"
                  : "APP_USR-..."
              }
              className="w-full bg-secondary border rounded-xl px-4 py-2.5 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Se almacena de forma segura en la base de datos y nunca se expone al cliente.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Public Key de Mercado Pago:</label>
            <input
              type="text"
              value={pubKey}
              onChange={(e) => setPubKey(e.target.value)}
              placeholder="APP_USR-..."
              className="w-full bg-secondary border rounded-xl px-4 py-2.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Webhook Secret (Opcional para validación de firma):</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Token o firma secreta de webhook"
              className="w-full bg-secondary border rounded-xl px-4 py-2.5 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="sandbox-check"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="rounded border-secondary"
            />
            <label htmlFor="sandbox-check" className="text-xs font-medium cursor-pointer">
              Habilitar modo Sandbox (Pruebas con tarjetas de test de Mercado Pago)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logística y Origen de Despacho</CardTitle>
          <CardDescription>Dirección remitente para cálculo de tarifas de envío.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5">Dirección de Despacho:</label>
              <input
                type="text"
                value={originAddress}
                onChange={(e) => setOriginAddress(e.target.value)}
                placeholder="Av. del Libertador 1200"
                className="w-full bg-secondary border rounded-xl px-4 py-2.5 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5">Código Postal de Origen:</label>
              <input
                type="text"
                value={originPostal}
                onChange={(e) => setOriginPostal(e.target.value)}
                placeholder="1638"
                className="w-full bg-secondary border rounded-xl px-4 py-2.5 text-xs font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Configuración
        </Button>
      </div>
    </form>
  );
}

function StoreEmailsSection({
  settings,
  mailboxes: initialMailboxes,
}: {
  settings: Record<string, string>;
  mailboxes: MailboxRow[];
}) {
  const router = useRouter();
  const [apiKey, setApiKey] = React.useState("");
  const [savingKey, setSavingKey] = React.useState(false);
  const [testTo, setTestTo] = React.useState("");
  const [sendingTest, setSendingTest] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");
  const [newRole, setNewRole] = React.useState("GENERAL");
  const [adding, setAdding] = React.useState(false);
  const keySet = settings.RESEND_API_KEY_SET === "true";

  const saveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({ title: "Pegá la API key de Resend", variant: "error" });
      return;
    }
    setSavingKey(true);
    const res = await updateResendApiKey(apiKey);
    setSavingKey(false);
    if (res.ok) {
      setApiKey("");
      toast({ title: "API key de Resend guardada", variant: "success" });
      router.refresh();
    } else {
      toast({ title: "No se pudo guardar la API key", variant: "error" });
    }
  };

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    const res = await sendAdminTestPurchaseEmail(testTo);
    setSendingTest(false);
    if (res.ok) {
      toast({ title: "Correo de prueba enviado", description: testTo, variant: "success" });
    } else {
      toast({
        title: "Error al enviar",
        description: "error" in res ? res.error : "Revisá la API key y el dominio en Resend",
        variant: "error",
      });
    }
  };

  const addMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const res = await upsertStoreMailbox({
      email: newEmail,
      label: newLabel || newEmail,
      role: newRole,
      active: true,
    });
    setAdding(false);
    if (res.ok) {
      setNewEmail("");
      setNewLabel("");
      setNewRole("GENERAL");
      toast({ title: "Correo dado de alta", variant: "success" });
      router.refresh();
    } else {
      toast({
        title: "No se pudo agregar",
        description: "error" in res ? res.error : undefined,
        variant: "error",
      });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const res = await setStoreMailboxActive({ id, active });
    if (res.ok) {
      toast({
        title: active ? "Correo activado" : "Correo desactivado",
        variant: "success",
      });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resend · API Key</CardTitle>
          <CardDescription>
            Conectá tu cuenta de Resend. El dominio cards.voltaiagents.com debe estar verificado allí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveKey} className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={keySet ? "default" : "secondary"}>
                {keySet ? "API key configurada" : "Sin API key"}
              </Badge>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={keySet ? "Pegá una nueva key para reemplazar…" : "re_…"}
              className="w-full bg-secondary border rounded-xl px-4 py-2.5 text-xs font-mono"
            />
            <Button type="submit" disabled={savingKey} className="gap-2">
              {savingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar API key
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buzones de envío</CardTitle>
          <CardDescription>
            Activá correos verificados en Resend. <strong>Ventas</strong> se usa para el recibo de
            compra + link del wizard. Más adelante podés sumar otros y abrirlos en un cliente de correo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {initialMailboxes.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-card"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold font-mono">{m.email}</p>
                    <Badge variant="secondary">{m.role}</Badge>
                    <Badge variant={m.active ? "default" : "outline"}>
                      {m.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.label}
                    {m.notes ? ` · ${m.notes}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(m.id, !m.active)}
                >
                  {m.active ? "Desactivar" : "Activar"}
                </Button>
              </div>
            ))}
            {initialMailboxes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todavía no hay buzones. Se crea ventas@ automáticamente al cargar el catálogo.
              </p>
            )}
          </div>

          <form onSubmit={addMailbox} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo@cards.voltaiagents.com"
              className="sm:col-span-2 bg-secondary border rounded-xl px-3 py-2.5 text-xs font-mono"
              required
            />
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Etiqueta"
              className="bg-secondary border rounded-xl px-3 py-2.5 text-xs"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-secondary border rounded-xl px-3 py-2.5 text-xs"
            >
              <option value="SALES">SALES (compras)</option>
              <option value="GENERAL">GENERAL</option>
              <option value="SUPPORT">SUPPORT</option>
            </select>
            <Button type="submit" disabled={adding} className="sm:col-span-4 gap-2">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Dar de alta correo
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Correo de prueba</CardTitle>
          <CardDescription>
            Envía el mismo formato de confirmación de compra con datos mock desde el buzón de ventas activo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendTest} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 bg-secondary border rounded-xl px-4 py-2.5 text-xs"
            />
            <Button type="submit" disabled={sendingTest} className="gap-2">
              {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar prueba
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
