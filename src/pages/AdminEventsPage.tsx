import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EventFormDialog } from "@/components/EventFormDialog";
import { RunningEvent } from "@/data/types";
import { Plus, MapPin, CalendarDays, Users, DollarSign, Pencil, Eye, EyeOff } from "lucide-react";

export default function AdminEventsPage() {
  const { events, addEvent, updateEvent, toggleEventVisibility, isLoading } = useEvents();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all running events and details</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground animate-pulse">Fetching dashboard data...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const { totalRegistrations, totalRevenue } = getEventStats(event);
            return (
              <Card
                key={event.id}
                className="cursor-pointer transition-shadow hover:shadow-md border-muted-foreground/10"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {event.visible ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Visible
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-muted-foreground/20 flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-1">{event.description}</CardDescription>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(e, event)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {totalRegistrations} registered
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      IDR {totalRevenue.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`visibility-${event.id}`} 
                        checked={event.visible}
                        onCheckedChange={() => toggleEventVisibility(event.id, event.visible)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label htmlFor={`visibility-${event.id}`} className="text-xs font-medium cursor-pointer">
                        Show in User Portal
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {events.length === 0 && (
            <Card className="col-span-full py-12 border-dashed">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                  <CalendarDays className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No events found</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    You haven't created any events yet. Click the "New Event" button at the top to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <EventFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} event={editingEvent} />
    </div>
  );
}
