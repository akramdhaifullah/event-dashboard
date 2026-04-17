import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Ticket, BarChart3 } from "lucide-react";
import { RunningEvent } from "@/data/types";

interface EventKPICardsProps {
  event: RunningEvent;
}

export function EventKPICards({ event }: EventKPICardsProps) {
  const totalRegistrations = event.ticketTypes.reduce((s, t) => s + t.sold, 0);
  const totalRevenue = event.ticketTypes.reduce((s, t) => s + t.sold * t.price, 0);
  const totalCapacity = event.ticketTypes.reduce((s, t) => s + t.capacity, 0);
  const remaining = totalCapacity - totalRegistrations;

  const kpis = [
    { label: "Registrations", value: totalRegistrations, icon: Users },
    { label: "Revenue", value: `IDR ${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { label: "Ticket Types", value: event.ticketTypes.length, icon: Ticket },
    { label: "Remaining Spots", value: remaining, icon: BarChart3 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
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
  );
}
