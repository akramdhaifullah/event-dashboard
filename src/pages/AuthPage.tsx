import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRegister = location.pathname === "/register";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Registration successful",
          description: "Please check your email for the confirmation link.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-muted-foreground/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Link to="/" className="text-primary hover:opacity-80 transition-opacity">
              <div className="bg-primary/10 p-2 rounded-full">
                <ArrowLeft className="h-6 w-6 text-primary" />
              </div>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isRegister ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isRegister 
              ? "Enter your details below to create your account" 
              : "Enter your email and password to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                {!isRegister && (
                  <Link 
                    to="/login" 
                    className="text-xs text-muted-foreground hover:text-primary transition-colors w-fit"
                  >
                    Forgot your password?
                  </Link>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegister ? "Register" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {isRegister ? (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Sign Up
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
