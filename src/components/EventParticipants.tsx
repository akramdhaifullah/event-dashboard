import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { RunningEvent } from "@/data/types";

interface EventParticipantsProps {
  event: RunningEvent;
}

export function EventParticipants({ event }: EventParticipantsProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const filteredParticipants = useMemo(() => {
    return event.participants.filter((p) => {
      const matchesSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.email.toLowerCase().includes(search.toLowerCase());
      const matchesType = !filterType || p.ticketTypeName === filterType;
      return matchesSearch && matchesType;
    });
  }, [event.participants, search, filterType]);

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Participants</CardTitle>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9" 
            />
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
  );
}
