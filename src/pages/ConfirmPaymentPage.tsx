import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, ArrowRight, Home, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export default function ConfirmPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

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
      // Using supabase.functions.invoke handles CORS and Auth headers automatically
      // if the project is correctly configured. 
      const { data, error } = await supabase.functions.invoke("midtrans-verify", {
        body: { orderId },
      });

      if (error) throw error;
      
      console.log("Verification result:", data);
      setIsVerified(data.result === true);
    } catch (error) {
      console.error("Verification error:", error);
      // If backend check fails, we stay in the current state or fallback to URL hint
      setIsVerified(null);
    } finally {
      setIsVerifying(false);
    }
  }, [orderId]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  // Priority: 
  // 1. If verified by backend -> Success
  // 2. If not verified by backend yet, check URL hint (for initial feedback)
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
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {isSuccess ? (
                <Button size="lg" onClick={() => navigate("/")} className="w-full sm:w-auto">
                  Back to Home <Home className="ml-2 h-4 w-4" />
                </Button>
              ) : isPending ? (
                <>
                  <Button size="lg" onClick={() => verifyPayment()} className="w-full sm:w-auto">
                    Refresh Status <RefreshCcw className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate("/")} className="w-full sm:w-auto">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
