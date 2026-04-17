import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketFormDialog } from "@/components/TicketFormDialog";
import { TicketType } from "@/data/types";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, CheckCircle2 } from "lucide-react";
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
import { EventKPICards } from "@/components/EventKPICards";
import { EventParticipants } from "@/components/EventParticipants";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, addTicketType, updateTicketType, deleteTicketType, processRegistrationWithPayment, deleteEvent } = useEvents();
  const { isAdmin, user, profile } = useAuth();
  
  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [registeringTicketId, setRegisteringTicketId] = useState<string | null>(null);
  
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketType | null>(null);

  const isAlreadyRegistered = useMemo(() => {
    if (!event || !user?.email) return false;
    return event.participants.some(p => p.email.toLowerCase() === user.email?.toLowerCase());
  }, [event, user?.email]);

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="link" onClick={() => navigate("/")}>Back to events</Button>
      </div>
    );
  }

  const handleTicketSubmit = (data: { name: string; price: number; capacity: number }) => {
    if (editingTicket) {
      updateTicketType(event.id, editingTicket.id, data);
    } else {
      addTicketType(event.id, data);
    }
  };

  const handleRegister = async (ticketTypeId: string) => {
    if (!event || !user || isAlreadyRegistered) return;
    
    const name = profile?.full_name || user.email?.split('@')[0] || "Guest";
    setRegisteringTicketId(ticketTypeId);
    try {
      await processRegistrationWithPayment(event.id, ticketTypeId, { name, email: user.email || "" });
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setRegisteringTicketId(null);
    }
  };

  const handleDeleteEvent = async () => {
    await deleteEvent(event.id);
    navigate("/");
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    await deleteTicketType(event.id, ticketToDelete.id);
    setTicketToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-muted-foreground">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
          </div>
        </div>
        {isAdmin && (
          <AlertDialog open={showDeleteEventConfirm} onOpenChange={setShowDeleteEventConfirm}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event
                  "{event.name}", including all associated ticket types and participant records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {isAlreadyRegistered && !isAdmin && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3 text-primary animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">You are registered for this event. See your details below.</p>
        </div>
      )}

      {/* KPI Cards */}
      {isAdmin && <EventKPICards event={event} />}

      {/* Ticket Types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Ticket Types</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => { setEditingTicket(null); setTicketDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Ticket
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.ticketTypes.map((ticket) => {
                const isProcessing = registeringTicketId === ticket.id;
                const isSoldOut = ticket.sold >= ticket.capacity;
                
                return (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.name}</TableCell>
                    <TableCell>IDR {ticket.price.toLocaleString()}</TableCell>
                    <TableCell>{ticket.capacity}</TableCell>
                    <TableCell>{ticket.sold}</TableCell>
                    <TableCell>{ticket.capacity - ticket.sold}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTicket(ticket); setTicketDialogOpen(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive" 
                            onClick={() => setTicketToDelete(ticket)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={isSoldOut || registeringTicketId !== null || isAlreadyRegistered}
                          onClick={() => handleRegister(ticket.id)}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isAlreadyRegistered ? "Already Registered" : (isSoldOut ? "Sold Out" : (isProcessing ? "Processing..." : "Register"))}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {event.ticketTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No ticket types yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Participants */}
      {isAdmin && <EventParticipants event={event} />}

      {/* Delete Ticket Confirmation Dialog */}
      <AlertDialog open={!!ticketToDelete} onOpenChange={(open) => !open && setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{ticketToDelete?.name}" ticket type? 
              This will remove this option from the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TicketFormDialog open={ticketDialogOpen} onClose={() => setTicketDialogOpen(false)} onSubmit={handleTicketSubmit} ticket={editingTicket} />
    </div>
  );
}
