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

export interface Profile {
  id: string;
  full_name: string | null;
  bib_name: string | null;
  dob: string | null;
  gender: string | null;
  blood_type: string | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  role: "admin" | "user";
}
