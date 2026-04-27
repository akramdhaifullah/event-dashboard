import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle, ArrowRight, ShoppingBag, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; Icon: typeof CheckCircle2; color: string; bg: string }> = {
  settlement: { label: "Paid", Icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
  capture: { label: "Paid", Icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
  paid: { label: "Paid", Icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
  pending: { label: "Pending", Icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
  unpaid: { label: "Pending", Icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: "Failed", Icon: XCircle, color: "text-red-600", bg: "bg-red-100" };
}

function isPending(status: string) {
  return status === "pending" || status === "unpaid";
}

export default function MyPaymentsPage() {
  const [email, setEmail] = useState(() => localStorage.getItem("lastPaymentEmail") || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const lookupOrders = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", trimmedEmail)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData.length === 0) {
        setOrders([]);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", ordersData.map((o) => o.id));

      if (itemsError) throw itemsError;

      const combined: Order[] = ordersData.map((order) => ({
        ...order,
        items: itemsData.filter((i) => i.order_id === order.id),
      }));

      setOrders(combined);
      localStorage.setItem("lastPaymentEmail", trimmedEmail);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lookup failed",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
        <p className="text-muted-foreground mt-1">Look up your payment history using your email address.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupOrders()}
              className="flex-1"
            />
            <Button onClick={lookupOrders} disabled={isLoading || !email.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && !isLoading && (
        orders.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border-2 border-dashed">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No orders found for this email.</p>
            <p className="text-sm text-muted-foreground mt-1">Double-check the email you used during checkout.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""} found</p>
            {orders.map((order) => {
              const { label, Icon, color, bg } = getStatusConfig(order.status);
              return (
                <Card key={order.id} className="border-muted-foreground/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle className="text-sm font-mono text-muted-foreground">{order.id}</CardTitle>
                        <CardDescription className="mt-0.5 text-xs">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </CardDescription>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                        <span className={`text-xs font-semibold ${color}`}>{label}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.item_name} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            IDR {(item.unit_price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="font-semibold text-sm">
                        Total: IDR {order.total_amount.toLocaleString()}
                      </span>
                      {isPending(order.status) && (
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/confirm-payment?order_id=${order.id}&transaction_status=pending`
                            )
                          }
                        >
                          Continue Payment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
