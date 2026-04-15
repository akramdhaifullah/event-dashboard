import React, { createContext, useContext, useState } from "react";
import { RunningEvent, TicketType, Participant } from "@/data/types";
import { initialEvents } from "@/data/mockData";

interface EventContextType {
  events: RunningEvent[];
  addEvent: (event: Omit<RunningEvent, "id" | "ticketTypes" | "participants">) => void;
  updateEvent: (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description">>) => void;
  deleteEvent: (id: string) => void;
  addTicketType: (eventId: string, ticket: Omit<TicketType, "id" | "eventId" | "sold">) => void;
  updateTicketType: (eventId: string, ticketId: string, data: Partial<Pick<TicketType, "name" | "price" | "capacity">>) => void;
  deleteTicketType: (eventId: string, ticketId: string) => void;
}

const EventContext = createContext<EventContextType | null>(null);

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<RunningEvent[]>(initialEvents);

  const addEvent = (data: Omit<RunningEvent, "id" | "ticketTypes" | "participants">) => {
    const newEvent: RunningEvent = {
      ...data,
      id: `e${Date.now()}`,
      ticketTypes: [],
      participants: [],
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description">>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const addTicketType = (eventId: string, ticket: Omit<TicketType, "id" | "eventId" | "sold">) => {
    const newTicket: TicketType = { ...ticket, id: `t${Date.now()}`, eventId, sold: 0 };
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ticketTypes: [...e.ticketTypes, newTicket] } : e))
    );
  };

  const updateTicketType = (eventId: string, ticketId: string, data: Partial<Pick<TicketType, "name" | "price" | "capacity">>) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, ticketTypes: e.ticketTypes.map((t) => (t.id === ticketId ? { ...t, ...data } : t)) }
          : e
      )
    );
  };

  const deleteTicketType = (eventId: string, ticketId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, ticketTypes: e.ticketTypes.filter((t) => t.id !== ticketId) } : e
      )
    );
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, addTicketType, updateTicketType, deleteTicketType }}>
      {children}
    </EventContext.Provider>
  );
};
