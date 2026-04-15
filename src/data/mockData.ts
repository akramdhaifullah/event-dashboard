import { RunningEvent, TicketType, Participant } from "./types";

const ticketTypes: TicketType[] = [
  { id: "t1", eventId: "e1", name: "5K Fun Run", price: 25, capacity: 200, sold: 142 },
  { id: "t2", eventId: "e1", name: "10K Race", price: 45, capacity: 150, sold: 98 },
  { id: "t3", eventId: "e1", name: "Half Marathon", price: 75, capacity: 100, sold: 67 },
  { id: "t4", eventId: "e2", name: "5K", price: 20, capacity: 300, sold: 210 },
  { id: "t5", eventId: "e2", name: "10K", price: 40, capacity: 200, sold: 155 },
  { id: "t6", eventId: "e3", name: "10K Trail", price: 50, capacity: 80, sold: 45 },
  { id: "t7", eventId: "e3", name: "25K Ultra Trail", price: 90, capacity: 50, sold: 32 },
  { id: "t8", eventId: "e4", name: "5K", price: 15, capacity: 500, sold: 320 },
  { id: "t9", eventId: "e4", name: "10K", price: 30, capacity: 300, sold: 198 },
  { id: "t10", eventId: "e4", name: "Half Marathon", price: 60, capacity: 150, sold: 89 },
];

const participants: Participant[] = [
  { id: "p1", eventId: "e1", name: "Alice Johnson", email: "alice@email.com", ticketTypeId: "t1", ticketTypeName: "5K Fun Run", registrationDate: "2026-02-15", status: "confirmed" },
  { id: "p2", eventId: "e1", name: "Bob Smith", email: "bob@email.com", ticketTypeId: "t2", ticketTypeName: "10K Race", registrationDate: "2026-02-18", status: "confirmed" },
  { id: "p3", eventId: "e1", name: "Carol Davis", email: "carol@email.com", ticketTypeId: "t3", ticketTypeName: "Half Marathon", registrationDate: "2026-03-01", status: "pending" },
  { id: "p4", eventId: "e1", name: "Dan Wilson", email: "dan@email.com", ticketTypeId: "t1", ticketTypeName: "5K Fun Run", registrationDate: "2026-03-05", status: "confirmed" },
  { id: "p5", eventId: "e1", name: "Eve Brown", email: "eve@email.com", ticketTypeId: "t2", ticketTypeName: "10K Race", registrationDate: "2026-03-10", status: "cancelled" },
  { id: "p6", eventId: "e2", name: "Frank Lee", email: "frank@email.com", ticketTypeId: "t4", ticketTypeName: "5K", registrationDate: "2026-03-20", status: "confirmed" },
  { id: "p7", eventId: "e2", name: "Grace Kim", email: "grace@email.com", ticketTypeId: "t5", ticketTypeName: "10K", registrationDate: "2026-03-22", status: "confirmed" },
  { id: "p8", eventId: "e2", name: "Henry Chen", email: "henry@email.com", ticketTypeId: "t4", ticketTypeName: "5K", registrationDate: "2026-03-25", status: "pending" },
  { id: "p9", eventId: "e2", name: "Iris Wang", email: "iris@email.com", ticketTypeId: "t5", ticketTypeName: "10K", registrationDate: "2026-04-01", status: "confirmed" },
  { id: "p10", eventId: "e3", name: "Jack Taylor", email: "jack@email.com", ticketTypeId: "t6", ticketTypeName: "10K Trail", registrationDate: "2026-04-10", status: "confirmed" },
  { id: "p11", eventId: "e3", name: "Kate Moore", email: "kate@email.com", ticketTypeId: "t7", ticketTypeName: "25K Ultra Trail", registrationDate: "2026-04-12", status: "confirmed" },
  { id: "p12", eventId: "e3", name: "Leo Garcia", email: "leo@email.com", ticketTypeId: "t6", ticketTypeName: "10K Trail", registrationDate: "2026-04-15", status: "pending" },
  { id: "p13", eventId: "e4", name: "Mia Clark", email: "mia@email.com", ticketTypeId: "t8", ticketTypeName: "5K", registrationDate: "2026-05-01", status: "confirmed" },
  { id: "p14", eventId: "e4", name: "Noah Hill", email: "noah@email.com", ticketTypeId: "t9", ticketTypeName: "10K", registrationDate: "2026-05-03", status: "confirmed" },
  { id: "p15", eventId: "e4", name: "Olivia Scott", email: "olivia@email.com", ticketTypeId: "t10", ticketTypeName: "Half Marathon", registrationDate: "2026-05-05", status: "confirmed" },
  { id: "p16", eventId: "e4", name: "Paul Adams", email: "paul@email.com", ticketTypeId: "t8", ticketTypeName: "5K", registrationDate: "2026-05-08", status: "cancelled" },
  { id: "p17", eventId: "e1", name: "Quinn Foster", email: "quinn@email.com", ticketTypeId: "t3", ticketTypeName: "Half Marathon", registrationDate: "2026-03-12", status: "confirmed" },
  { id: "p18", eventId: "e2", name: "Rachel Young", email: "rachel@email.com", ticketTypeId: "t4", ticketTypeName: "5K", registrationDate: "2026-04-02", status: "confirmed" },
];

export const initialEvents: RunningEvent[] = [
  {
    id: "e1",
    name: "Spring City Marathon",
    date: "2026-05-15",
    location: "Central Park, New York",
    description: "Annual spring running event through the heart of the city.",
    ticketTypes: ticketTypes.filter((t) => t.eventId === "e1"),
    participants: participants.filter((p) => p.eventId === "e1"),
  },
  {
    id: "e2",
    name: "Sunset Beach Run",
    date: "2026-06-20",
    location: "Santa Monica, CA",
    description: "A scenic run along the Pacific coastline at sunset.",
    ticketTypes: ticketTypes.filter((t) => t.eventId === "e2"),
    participants: participants.filter((p) => p.eventId === "e2"),
  },
  {
    id: "e3",
    name: "Mountain Trail Challenge",
    date: "2026-07-10",
    location: "Aspen, CO",
    description: "Challenging trail run through mountain terrain.",
    ticketTypes: ticketTypes.filter((t) => t.eventId === "e3"),
    participants: participants.filter((p) => p.eventId === "e3"),
  },
  {
    id: "e4",
    name: "Autumn Classic 5K/10K",
    date: "2026-10-03",
    location: "Boston, MA",
    description: "Family-friendly fall race with multiple distance options.",
    ticketTypes: ticketTypes.filter((t) => t.eventId === "e4"),
    participants: participants.filter((p) => p.eventId === "e4"),
  },
];
