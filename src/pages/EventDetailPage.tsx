import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketFormDialog } from "@/components/TicketFormDialog";
import { TicketType } from "@/data/types";
import { ArrowLeft, Users, DollarSign, Ticket, BarChart3, Plus, Pencil, Trash2, Search, Loader2, CheckCircle2 } from "lucide-react";
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

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, addTicketType, updateTicketType, deleteTicketType, addParticipant, processRegistrationWithPayment, deleteEvent } = useEvents();
  const { isAdmin, user, profile } = useAuth();
  const event = events.find((e) => e.id === id);

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [registeringTicketId, setRegisteringTicketId] = useState<string | null>(null);
  
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketType | null>(null);

  const totalRegistrations = event?.ticketTypes.reduce((s, t) => s + t.sold, 0) ?? 0;
  const totalRevenue = event?.ticketTypes.reduce((s, t) => s + t.sold * t.price, 0) ?? 0;
  const totalCapacity = event?.ticketTypes.reduce((s, t) => s + t.capacity, 0) ?? 0;
  const remaining = totalCapacity - totalRegistrations;

  // Check if user is already registered for this event
  const isAlreadyRegistered = useMemo(() => {
    if (!event || !user?.email) return false;
    return event.participants.some(p => p.email.toLowerCase() === user.email?.toLowerCase());
  }, [event, user?.email]);

  const filteredParticipants = useMemo(() => {
    if (!event) return [];
    return event.participants.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
      const matchesType = !filterType || p.ticketTypeName === filterType;
      return matchesSearch && matchesType;
    });
  }, [event?.participants, search, filterType]);

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
    
    // Use full name from profile if available
    const name = profile?.full_name || user.email?.split('@')[0] || "Guest";
    
    setRegisteringTicketId(ticketTypeId);
    try {
      await processRegistrationWithPayment(event.id, ticketTypeId, {
        name,
        email: user.email || "",
      });
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setRegisteringTicketId(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    await deleteEvent(event.id);
    navigate("/");
  };

  const handleDeleteTicket = async () => {
    if (!event || !ticketToDelete) return;
    await deleteTicketType(event.id, ticketToDelete.id);
    setTicketToDelete(null);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "default";
    }
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
      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Registrations", value: totalRegistrations, icon: Users },
            { label: "Revenue", value: `IDR ${totalRevenue.toLocaleString()}`, icon: DollarSign },
            { label: "Ticket Types", value: event.ticketTypes.length, icon: Ticket },
            { label: "Remaining Spots", value: remaining, icon: BarChart3 },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participants</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All ticket types</option>
                {event.ticketTypes.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ticket Type</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.ticketTypeName}</TableCell>
                    <TableCell>{new Date(p.registrationDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredParticipants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No participants found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
