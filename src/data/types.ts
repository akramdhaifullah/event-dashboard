export interface RunningEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  ticketTypes: TicketType[];
  participants: Participant[];
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  ticketTypeId: string;
  ticketTypeName: string;
  registrationDate: string;
  status: "confirmed" | "pending" | "cancelled";
}
