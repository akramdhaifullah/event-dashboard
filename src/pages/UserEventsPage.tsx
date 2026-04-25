import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, CalendarDays, Ticket, Search } from "lucide-react";

export default function UserEventsPage() {
  const { events, refreshEvents, isLoading } = useEvents();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    refreshEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => event.visible) // Only show visible events
      .filter(event => 
        (event.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (event.location?.toLowerCase() || "").includes(search.toLowerCase())
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

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
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
            const totalCapacity = event.categories.reduce((sum, t) => sum + t.capacity, 0);
            const totalSold = event.categories.reduce((sum, t) => sum + t.sold, 0);
            const isSoldOut = totalSold >= totalCapacity && totalCapacity > 0;

            return (
              <Card
                key={event.id}
                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden border-muted-foreground/10 flex flex-col h-full"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {/* Event Image Placeholder/Display */}
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  {event.image_url ? (
                    <img 
                      src={event.image_url} 
                      alt={event.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/50">
                      <div className="h-12 w-12 mb-2 bg-primary/10 rounded flex items-center justify-center">
                         <Ticket className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Lari Terus</span>
                    </div>
                  )}
                  {isSoldOut && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-destructive text-destructive-foreground rounded shadow-lg">
                      Sold Out
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">{event.name}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2 text-sm">{event.description}</CardDescription>
                    </div>
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
