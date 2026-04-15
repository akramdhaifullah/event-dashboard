import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TicketFormDialog } from "@/components/TicketFormDialog";
import { TicketType } from "@/data/types";
import { ArrowLeft, Users, DollarSign, Ticket, BarChart3, Plus, Pencil, Trash2, Search } from "lucide-react";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, addTicketType, updateTicketType, deleteTicketType } = useEvents();
  const event = events.find((e) => e.id === id);

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const totalRegistrations = event?.ticketTypes.reduce((s, t) => s + t.sold, 0) ?? 0;
  const totalRevenue = event?.ticketTypes.reduce((s, t) => s + t.sold * t.price, 0) ?? 0;
  const totalCapacity = event?.ticketTypes.reduce((s, t) => s + t.capacity, 0) ?? 0;
  const remaining = totalCapacity - totalRegistrations;

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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-muted-foreground">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Registrations", value: totalRegistrations, icon: Users },
          { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
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

      {/* Ticket Types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Ticket Types</CardTitle>
          <Button size="sm" onClick={() => { setEditingTicket(null); setTicketDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Ticket
          </Button>
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
              {event.ticketTypes.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.name}</TableCell>
                  <TableCell>${ticket.price}</TableCell>
                  <TableCell>{ticket.capacity}</TableCell>
                  <TableCell>{ticket.sold}</TableCell>
                  <TableCell>{ticket.capacity - ticket.sold}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTicket(ticket); setTicketDialogOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTicketType(event.id, ticket.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

      <TicketFormDialog open={ticketDialogOpen} onClose={() => setTicketDialogOpen(false)} onSubmit={handleTicketSubmit} ticket={editingTicket} />
    </div>
  );
}
