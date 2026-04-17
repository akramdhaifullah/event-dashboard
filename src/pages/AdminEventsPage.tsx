import { useState, useEffect } from "react";
import { useEvents } from "@/contexts/EventContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventFormDialog } from "@/components/EventFormDialog";
import { RunningEvent } from "@/data/types";
import { Plus, CalendarDays } from "lucide-react";
import { AdminEventCard } from "@/components/AdminEventCard";

export default function AdminEventsPage() {
  const { events, addEvent, updateEvent, toggleEventVisibility, isLoading, refreshEvents } = useEvents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RunningEvent | null>(null);

  useEffect(() => {
    refreshEvents();
  }, []);

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
          {events.map((event) => (
            <AdminEventCard 
              key={event.id} 
              event={event} 
              onEdit={handleEdit} 
              onToggleVisibility={toggleEventVisibility} 
            />
          ))}
          
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
