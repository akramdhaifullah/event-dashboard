import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, CalendarDays, Ticket, Search, Filter } from "lucide-react";

export default function UserEventsPage() {
  const { events } = useEvents();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter(event => 
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-muted-foreground text-lg">Discover and register for the best running events around you.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto md:mx-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by event name or location..." 
          className="pl-10 h-12 text-base shadow-sm bg-background border-muted-foreground/20 focus-visible:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border-2 border-dashed">
          <p className="text-muted-foreground text-lg">No events found matching your search.</p>
          <button 
            onClick={() => setSearch("")}
            className="text-primary font-medium mt-2 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const totalCapacity = event.ticketTypes.reduce((sum, t) => sum + t.capacity, 0);
            const totalSold = event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);
            const isSoldOut = totalSold >= totalCapacity && totalCapacity > 0;

            return (
              <Card
                key={event.id}
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden border-muted-foreground/10 flex flex-col h-full"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="h-2 bg-primary/80 group-hover:h-3 transition-all" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">{event.name}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2 text-sm">{event.description}</CardDescription>
                    </div>
                    {isSoldOut && (
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-destructive text-destructive-foreground rounded shadow-sm">
                        Sold Out
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-4 border-t bg-muted/5">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary/70" />
                      <span>
                        {new Date(event.date).toLocaleDateString(undefined, { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 font-medium text-foreground">
                      <Ticket className="h-4 w-4 shrink-0 text-primary/70" />
                      <span>{event.ticketTypes.length} Ticket Options</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
