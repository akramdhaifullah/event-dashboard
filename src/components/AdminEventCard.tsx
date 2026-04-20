import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RunningEvent } from "@/data/types";
import { MapPin, CalendarDays, Users, DollarSign, Pencil, Eye, EyeOff, Ticket } from "lucide-react";

interface AdminEventCardProps {
  event: RunningEvent;
  onEdit: (e: React.MouseEvent, event: RunningEvent) => void;
  onToggleVisibility: (id: string, currentStatus: boolean) => void;
}

export function AdminEventCard({ event, onEdit, onToggleVisibility }: AdminEventCardProps) {
  const navigate = useNavigate();

  const totalRegistrations = event.categories.reduce((sum, t) => sum + t.sold, 0);
  const totalRevenue = event.categories.reduce((sum, t) => sum + t.sold * t.price, 0);

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md border-muted-foreground/10 overflow-hidden flex flex-col"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="relative h-32 w-full overflow-hidden bg-muted shrink-0">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/50">
            <Ticket className="h-8 w-8 mb-1 opacity-20" />
            <span className="text-[8px] font-medium uppercase tracking-widest">Lari Terus</span>
          </div>
        )}
      </div>
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onEdit(e, event)}>
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
              onCheckedChange={() => onToggleVisibility(event.id, event.visible)}
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
}
