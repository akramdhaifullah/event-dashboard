import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Trophy, Calendar, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export function UserNavbar() {
  const { signOut, user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = session ? [
    { title: "Events", url: "/", icon: Calendar },
    { title: "My Race", url: "/my-race", icon: Trophy },
    { title: "Profile", url: "/profile", icon: User },
  ] : [];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile Menu Trigger */}
            {session && (
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] sm:w-[350px] flex flex-col p-0">
                    <SheetHeader className="text-left border-b p-4 shrink-0">
                      <SheetTitle className="flex items-center gap-2">
                        <div className="bg-primary p-1 rounded">
                          <Calendar className="h-5 w-5 text-primary-foreground" />
                        </div>
                        Event Portal
                      </SheetTitle>
                    </SheetHeader>
                    
                    <div className="flex flex-col gap-1 flex-1 p-2">
                      {navItems.map((item) => {
                        const isActive = pathname === item.url;
                        return (
                          <Link
                            key={item.url}
                            to={item.url}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                              isActive 
                                ? "bg-primary/10 text-primary" 
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Footer section pinned to the bottom */}
                    <div className="mt-auto shrink-0 bg-muted/30">
                      <div className="px-4 py-3 border-t flex flex-col items-start">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Signed in as</span>
                        <span className="text-sm font-medium truncate w-full">{user?.email}</span>
                      </div>
                      <div className="border-t">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive transition-colors px-4 py-4 h-auto rounded-none" 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setShowLogoutConfirm(true);
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm font-medium">Log Out</span>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden xs:inline-block">Event Portal</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <div className="hidden md:flex flex-col items-end text-xs">
                  <span className="text-muted-foreground leading-tight">Signed in as</span>
                  <span className="font-medium leading-tight truncate max-w-[180px]">{user?.email}</span>
                </div>
                
                {/* Desktop Logout Button */}
                <div className="hidden md:block">
                   <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Log Out">
                          <LogOut className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will need to sign in again to access your registrations and profile.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSignOut}>Log Out</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
