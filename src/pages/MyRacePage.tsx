import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Ticket, ArrowRight, Loader2 } from "lucide-react";

export default function MyRacePage() {
  const { events, refreshEvents, isLoading } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshEvents();
  }, []);

  const myRegistrations = useMemo(() => {
    if (!user?.email) return [];
    
    const registrations: any[] = [];
    
    events.forEach(event => {
      const userParticipant = event.participants.find(p => p.email.toLowerCase() === user.email?.toLowerCase());
      if (userParticipant) {
        registrations.push({
          event,
          participant: userParticipant
        });
      }
    });
    
    return registrations;
  }, [events, user?.email]);

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Races</h1>
        <p className="text-muted-foreground text-lg">Manage and view all your registered upcoming events</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Syncing your registrations...</p>
        </div>
      ) : myRegistrations.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-4">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">No registrations found</h2>
              <p className="text-muted-foreground">You haven't registered for any races yet. Check out the available events!</p>
            </div>
            <Button onClick={() => navigate("/")}>Browse Events</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {myRegistrations.map(({ event, participant }) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusColor(participant.status)} className="capitalize">
                          {participant.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Registered on {new Date(participant.registrationDate).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-2xl">{event.name}</CardTitle>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {new Date(event.date).toLocaleDateString(undefined, { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Ticket className="h-4 w-4 text-primary" />
                      {participant.categoryName}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                      View Event Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
