import { useState, useMemo } from "react";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export default function ParticipantsPage() {
  const { events } = useEvents();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const allParticipants = useMemo(() => {
    return events.flatMap((e) =>
      e.participants.map((p) => ({ ...p, eventName: e.name }))
    );
  }, [events]);

  const filtered = useMemo(() => {
    return allParticipants.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
      const matchesEvent = !filterEvent || p.eventId === filterEvent;
      return matchesSearch && matchesEvent;
    });
  }, [allParticipants, search, filterEvent]);

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">All Participants</h1>
      <p className="text-muted-foreground mb-6">View all registered participants across events</p>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
            >
              <option value="">All events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
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
                <TableHead>Event</TableHead>
                <TableHead>Ticket Type</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.eventName}</TableCell>
                  <TableCell>{p.ticketTypeName}</TableCell>
                  <TableCell>{new Date(p.registrationDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No participants found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
