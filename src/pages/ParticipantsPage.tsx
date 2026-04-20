import { useState, useMemo, useEffect } from "react";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export default function ParticipantsPage() {
  const { events, refreshEvents, isLoading } = useEvents();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState("");

  useEffect(() => {
    refreshEvents();
  }, []);

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

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Participants</h1>
        <p className="text-muted-foreground">View all registered participants across events</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm max-w-sm"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
        >
          <option value="">All events</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Participants List ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse text-sm">Refreshing participants list...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="min-w-[150px] font-semibold">Name</TableHead>
                    <TableHead className="min-w-[200px] font-semibold">Email</TableHead>
                    <TableHead className="min-w-[180px] font-semibold">Event</TableHead>
                    <TableHead className="min-w-[150px] font-semibold">Category</TableHead>
                    <TableHead className="min-w-[150px] font-semibold">Registration Date</TableHead>
                    <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.eventName}</TableCell>
                      <TableCell>{p.categoryName}</TableCell>
                      <TableCell>{new Date(p.registrationDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusColor(p.status)} className="capitalize">{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        No participants found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
