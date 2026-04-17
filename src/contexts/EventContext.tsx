import React, { createContext, useContext, useState, useEffect } from "react";
import { RunningEvent, TicketType, Participant } from "@/data/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface EventContextType {
  events: RunningEvent[];
  isLoading: boolean;
  addEvent: (event: Omit<RunningEvent, "id" | "ticketTypes" | "participants" | "visible">) => Promise<void>;
  updateEvent: (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description" | "visible">>) => Promise<void>;
  toggleEventVisibility: (id: string, currentStatus: boolean) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addTicketType: (eventId: string, ticket: Omit<TicketType, "id" | "eventId" | "sold">) => Promise<void>;
  updateTicketType: (eventId: string, ticketId: string, data: Partial<Pick<TicketType, "name" | "price" | "capacity">>) => Promise<void>;
  deleteTicketType: (eventId: string, ticketId: string) => Promise<void>;
  addParticipant: (eventId: string, data: { name: string; email: string; ticketTypeId: string }) => Promise<void>;
  processRegistrationWithPayment: (eventId: string, ticketTypeId: string, userData: { name: string; email: string }) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | null>(null);

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<RunningEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*");

      if (eventsError) throw eventsError;

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("ticket_types")
        .select("*");

      if (ticketsError) throw ticketsError;

      const { data: participantsData, error: participantsError } = await supabase
        .from("participants")
        .select("*");

      if (participantsError) throw participantsError;

      const combinedEvents: RunningEvent[] = eventsData.map((event) => ({
        ...event,
        visible: event.visible ?? true, // Default to true if null
        ticketTypes: ticketsData.filter((t) => t.event_id === event.id).map(t => ({
            id: t.id,
            eventId: t.event_id,
            name: t.name,
            price: t.price,
            capacity: t.capacity,
            sold: t.sold
        })),
        participants: participantsData.filter((p) => p.event_id === event.id).map(p => {
            const ticketType = ticketsData.find(t => t.id === p.ticket_type_id);
            return {
                id: p.id,
                eventId: p.event_id,
                name: p.name,
                email: p.email,
                ticketTypeId: p.ticket_type_id,
                ticketTypeName: ticketType ? ticketType.name : "Unknown",
                registrationDate: p.registration_date,
                status: p.status
            };
        }),
      }));

      setEvents(combinedEvents);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching events",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (data: Omit<RunningEvent, "id" | "ticketTypes" | "participants" | "visible">) => {
    try {
      const { error } = await supabase.from("events").insert([{ ...data, visible: false }]);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding event",
        description: error.message,
      });
    }
  };

  const updateEvent = async (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description" | "visible">>) => {
    try {
      const { error } = await supabase.from("events").update(data).eq("id", id);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating event",
        description: error.message,
      });
    }
  };

  const toggleEventVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ visible: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: !currentStatus ? "Event visible" : "Event hidden",
        description: !currentStatus ? "Event is now visible to users." : "Event is now hidden from users.",
      });
      
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating visibility",
        description: error.message,
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting event",
        description: error.message,
      });
    }
  };

  const addTicketType = async (eventId: string, ticket: Omit<TicketType, "id" | "eventId" | "sold">) => {
    try {
      const { error } = await supabase.from("ticket_types").insert([{
        ...ticket,
        event_id: eventId,
        sold: 0
      }]);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding ticket type",
        description: error.message,
      });
    }
  };

  const updateTicketType = async (eventId: string, ticketId: string, data: Partial<Pick<TicketType, "name" | "price" | "capacity">>) => {
    try {
      const { error } = await supabase.from("ticket_types").update(data).eq("id", ticketId);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating ticket type",
        description: error.message,
      });
    }
  };

  const deleteTicketType = async (eventId: string, ticketId: string) => {
    try {
      const { error } = await supabase.from("ticket_types").delete().eq("id", ticketId);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting ticket type",
        description: error.message,
      });
    }
  };

  const addParticipant = async (eventId: string, data: { name: string; email: string; ticketTypeId: string }) => {
    try {
      const { error: participantError } = await supabase.from("participants").insert([{
        event_id: eventId,
        name: data.name,
        email: data.email,
        ticket_type_id: data.ticketTypeId,
        registration_date: new Date().toISOString(),
        status: "confirmed"
      }]);
      
      if (participantError) throw participantError;

      // Update sold count for ticket type
      const event = events.find(e => e.id === eventId);
      const ticketType = event?.ticketTypes.find(t => t.id === data.ticketTypeId);
      if (ticketType) {
        const { error: ticketError } = await supabase
          .from("ticket_types")
          .update({ sold: (ticketType.sold || 0) + 1 })
          .eq("id", data.ticketTypeId);
        if (ticketError) throw ticketError;
      }

      toast({
        title: "Registration Successful!",
        description: "You have been registered for the event.",
      });
      
      await fetchEvents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error during registration",
        description: error.message,
      });
      throw error;
    }
  };

  const processRegistrationWithPayment = async (eventId: string, ticketTypeId: string, userData: { name: string; email: string }) => {
    try {
      const event = events.find(e => e.id === eventId);
      const ticketType = event?.ticketTypes.find(t => t.id === ticketTypeId);
      
      if (!event || !ticketType) {
        throw new Error("Event or ticket type not found.");
      }

      // 1. Call Supabase Edge Function to get Snap Token
      const { data: functionData, error: functionError } = await supabase.functions.invoke('midtrans-snap', {
        body: {
          transaction_details: {
            order_id: `REG-${Date.now()}-${userData.email.split('@')[0]}`,
            gross_amount: ticketType.price
          },
          customer_details: {
            first_name: userData.name,
            email: userData.email
          },
          item_details: [{
            id: ticketType.id,
            price: ticketType.price,
            quantity: 1,
            name: `${event.name} - ${ticketType.name}`
          }],
          credit_card: { secure: true },
        },
      });

      if (functionError) {
        throw new Error(functionError.message || "Failed to initialize payment.");
      }

      const { token } = functionData;

      // 2. Open Midtrans Snap Popup
      return new Promise<void>((resolve, reject) => {
        window.snap.pay(token, {
          onSuccess: async (result) => {
            console.log("Payment Success:", result);
            try {
              await addParticipant(eventId, {
                name: userData.name,
                email: userData.email,
                ticketTypeId: ticketTypeId
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          onPending: (result) => {
            console.log("Payment Pending:", result);
            toast({
              title: "Payment Pending",
              description: "Your payment is being processed. Please complete it to finish registration.",
            });
            resolve();
          },
          onError: (result) => {
            console.error("Payment Error:", result);
            toast({
              variant: "destructive",
              title: "Payment Failed",
              description: "Something went wrong during payment. Please try again.",
            });
            reject(new Error("Payment failed."));
          },
          onClose: () => {
            console.log("Payment Popup Closed");
            reject(new Error("Payment process cancelled."));
          }
        });
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message,
      });
      throw error;
    }
  };

  return (
    <EventContext.Provider value={{ 
        events, 
        isLoading, 
        addEvent, 
        updateEvent, 
        toggleEventVisibility,
        deleteEvent, 
        addTicketType, 
        updateTicketType, 
        deleteTicketType,
        addParticipant,
        processRegistrationWithPayment,
        refreshEvents: fetchEvents 
    }}>
      {children}
    </EventContext.Provider>
  );
};
