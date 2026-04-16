import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserNavbar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const pathname = window.location.pathname;

  const navItems = [
    { title: "Events", url: "/", icon: Calendar },
    { title: "My Race", url: "/my-race", icon: Trophy },
    { title: "Profile", url: "/profile", icon: User },
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Event Portal</span>
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

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2 text-[10px]">
              <span className="text-muted-foreground leading-tight">Signed in as</span>
              <span className="font-medium leading-tight truncate max-w-[150px]">{user?.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} title="Log Out">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
