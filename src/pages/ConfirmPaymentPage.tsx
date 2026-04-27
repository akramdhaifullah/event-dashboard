import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, ArrowRight, Home, Loader2, RefreshCcw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export default function ConfirmPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isChangingPayment, setIsChangingPayment] = useState(false);

  const orderId = searchParams.get("order_id") || "Unknown";
  const statusCode = searchParams.get("status_code");
  const transactionStatus = searchParams.get("transaction_status") || "pending";

  const verifyPayment = useCallback(async (showLoading = true) => {
    if (orderId === "Unknown") {
      setIsVerifying(false);
      return;
    }

    if (showLoading) setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("midtrans-verify", {
        body: { orderId },
      });

      if (error) throw error;

      console.log("Verification result:", data);
      setIsVerified(data.result === true);
    } catch (error) {
      console.error("Verification error:", error);
      setIsVerified(null);
    } finally {
      setIsVerifying(false);
    }
  }, [orderId]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  const handleChangePayment = async () => {
    if (orderId === "Unknown") return;
    setIsChangingPayment(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("status, snap_token")
        .eq("id", orderId)
        .single();

      if (orderError) throw new Error("Could not load order details.");

      if (order.status === "settlement" || order.status === "capture" || order.status === "paid") {
        toast({ title: "Already paid", description: "This order has already been paid." });
        await verifyPayment(false);
        setIsChangingPayment(false);
        return;
      }

      if (order.status === "cancel" || order.status === "deny" || order.status === "expire") {
        toast({
          variant: "destructive",
          title: "Order unavailable",
          description: "This order has been cancelled or expired. Please start a new order.",
        });
        setIsChangingPayment(false);
        return;
      }

      if (!order.snap_token) {
        toast({
          variant: "destructive",
          title: "Payment session unavailable",
          description: "No payment session found for this order. Please contact support.",
        });
        setIsChangingPayment(false);
        return;
      }

      window.snap.pay(order.snap_token, {
        onSuccess: (result) => {
          const r = result as { finish_redirect_url?: string };
          if (r.finish_redirect_url) {
            window.location.href = r.finish_redirect_url;
          } else {
            verifyPayment();
          }
        },
        onPending: (result) => {
          const r = result as { finish_redirect_url?: string };
          if (r.finish_redirect_url) {
            window.location.href = r.finish_redirect_url;
          } else {
            verifyPayment();
          }
          setIsChangingPayment(false);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Payment failed", description: "Something went wrong. Please try again." });
          setIsChangingPayment(false);
        },
        onClose: () => {
          setIsChangingPayment(false);
        },
      });
    } catch (error) {
      console.error("Change payment error:", error);
      toast({
        variant: "destructive",
        title: "Could not change payment",
        description: error instanceof Error ? error.message : "Please try again later.",
      });
      setIsChangingPayment(false);
    }
  };

  const isSuccess = isVerified === true || (isVerified === null && (transactionStatus === "settlement" || transactionStatus === "capture"));
  const isPending = !isSuccess && transactionStatus === "pending";
  const isFailed = !isVerifying && !isSuccess && !isPending;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8 bg-muted/20">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-5 gap-8">

        {/* Left Section: Status Message */}
        <div className="md:col-span-3 flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            {isVerifying ? (
              <div className="flex flex-col items-start space-y-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <h1 className="text-3xl font-bold tracking-tight">Verifying your payment...</h1>
                <p className="text-muted-foreground">Please wait while we confirm your transaction with Midtrans.</p>
              </div>
            ) : isSuccess ? (
              <>
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Payment Successful!</h1>
                <p className="text-lg text-muted-foreground">
                  Thank you for your registration. Your payment has been confirmed and your spot is secured.
                </p>
              </>
            ) : isPending ? (
              <>
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Payment Pending</h1>
                <p className="text-lg text-muted-foreground">
                  We are currently processing your payment. This usually takes just a few minutes.
                  You will receive an email confirmation once it's complete.
                </p>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Payment Failed</h1>
                <p className="text-lg text-muted-foreground">
                  Unfortunately, we couldn't process your payment. Please try again or use a different payment method.
                </p>
              </>
            )}
          </div>

          {!isVerifying && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 flex-wrap">
              {isSuccess ? (
                <Button size="lg" onClick={() => navigate("/")} className="w-full sm:w-auto">
                  Back to Home <Home className="ml-2 h-4 w-4" />
                </Button>
              ) : isPending ? (
                <>
                  <Button
                    size="lg"
                    variant="default"
                    onClick={handleChangePayment}
                    disabled={isChangingPayment}
                    className="w-full sm:w-auto"
                  >
                    {isChangingPayment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    {isChangingPayment ? "Opening payment..." : "Change Payment Method"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => verifyPayment()}
                    className="w-full sm:w-auto"
                  >
                    Refresh Status <RefreshCcw className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => navigate("/")}
                    className="w-full sm:w-auto"
                  >
                    Back to Home
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate("/cart")} className="w-full sm:w-auto">
                    Try Again <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate("/")} className="w-full sm:w-auto">
                    Back to Home
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Transaction Details */}
        <div className="md:col-span-2 flex items-center">
          <Card className="w-full shadow-lg border-primary/10">
            <CardHeader className="bg-muted/50 pb-4 border-b">
              <CardTitle className="text-lg">Transaction Details</CardTitle>
              <CardDescription>Overview of your recent activity</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                  {isVerifying ? (
                    <Badge variant="outline" className="animate-pulse">Verifying...</Badge>
                  ) : isSuccess ? (
                    <Badge className="bg-green-500 hover:bg-green-600 border-transparent text-white font-medium">Settled</Badge>
                  ) : isPending ? (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-transparent">Pending</Badge>
                  ) : (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </div>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-sm break-all bg-muted p-2 rounded-md">{orderId}</p>
              </div>

              {statusCode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Status Code</p>
                  <p className="text-sm">{statusCode}</p>
                </div>
              )}

              {isPending && !isVerifying && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">
                    Need to pay via a different method? Use "Change Payment Method" to reopen the payment popup.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
