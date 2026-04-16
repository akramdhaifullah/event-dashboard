import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventFormDialog } from "@/components/EventFormDialog";
import { RunningEvent } from "@/data/types";
import { Plus, MapPin, CalendarDays, Users, DollarSign, Pencil } from "lucide-react";

export default function AdminEventsPage() {
  const { events, addEvent, updateEvent } = useEvents();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RunningEvent | null>(null);

  const handleCreate = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, event: RunningEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: { name: string; date: string; location: string; description: string }) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
    } else {
      await addEvent(data);
    }
    setDialogOpen(false);
  };

  const getEventStats = (event: RunningEvent) => {
    const totalRegistrations = event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);
    const totalRevenue = event.ticketTypes.reduce((sum, t) => sum + t.sold * t.price, 0);
    return { totalRegistrations, totalRevenue };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all running events and details</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Event
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const { totalRegistrations, totalRevenue } = getEventStats(event);
          return (
            <Card
              key={event.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <CardDescription className="mt-1">{event.description}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(e, event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {totalRegistrations} registered
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    ${totalRevenue.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EventFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} event={editingEvent} />
    </div>
  );
}
