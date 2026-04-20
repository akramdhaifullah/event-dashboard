import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { RunningEvent, Category, Participant } from "@/data/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface EventContextType {
  events: RunningEvent[];
  isLoading: boolean;
  addEvent: (event: Omit<RunningEvent, "id" | "categories" | "participants" | "visible">) => Promise<void>;
  updateEvent: (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description" | "image_url" | "visible">>) => Promise<void>;
  toggleEventVisibility: (id: string, currentStatus: boolean) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addCategory: (eventId: string, category: Omit<Category, "id" | "eventId" | "sold">) => Promise<void>;
  updateCategory: (eventId: string, categoryId: string, data: Partial<Pick<Category, "name" | "price" | "capacity">>) => Promise<void>;
  deleteCategory: (eventId: string, categoryId: string) => Promise<void>;
  addParticipant: (eventId: string, data: { name: string; email: string; categoryId: string }, status?: "confirmed" | "pending" | "cancelled") => Promise<void>;
  processRegistrationWithPayment: (eventId: string, categoryId: string, userData: { name: string; email: string }) => Promise<void>;
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

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Optimize: Fetch all resources concurrently
      const [eventsRes, ticketsRes, participantsRes] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("ticket_types").select("*"),
        supabase.from("participants").select("*")
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      if (participantsRes.error) throw participantsRes.error;

      const combinedEvents: RunningEvent[] = eventsRes.data.map((event) => ({
        ...event,
        visible: event.visible ?? true,
        categories: ticketsRes.data
          .filter((t) => t.event_id === event.id)
          .map(t => ({
            id: t.id,
            eventId: t.event_id,
            name: t.name,
            price: t.price,
            capacity: t.capacity,
            sold: t.sold
          })),
        participants: participantsRes.data
          .filter((p) => p.event_id === event.id)
          .map(p => {
            const ticketType = ticketsRes.data.find(t => t.id === p.ticket_type_id);
            return {
              id: p.id,
              eventId: p.event_id,
              name: p.name,
              email: p.email,
              categoryId: p.ticket_type_id,
              categoryName: ticketType ? ticketType.name : "Unknown",
              registrationDate: p.registration_date,
              status: p.status
            };
          }),
      }));

      setEvents(combinedEvents);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSupabaseError = (error: any, title: string) => {
    toast({
      variant: "destructive",
      title,
      description: error.message,
    });
  };

  const addEvent = async (data: Omit<RunningEvent, "id" | "categories" | "participants" | "visible">) => {
    try {
      const { error } = await supabase.from("events").insert([{ ...data, visible: false }]);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error adding event");
    }
  };

  const updateEvent = async (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description" | "image_url" | "visible">>) => {
    try {
      const { error } = await supabase.from("events").update(data).eq("id", id);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error updating event");
    }
  };

  const toggleEventVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("events").update({ visible: !currentStatus }).eq("id", id);
      if (error) throw error;
      toast({
        title: !currentStatus ? "Event visible" : "Event hidden",
        description: !currentStatus ? "Event is now visible to users." : "Event is now hidden from users.",
      });
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error updating visibility");
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error deleting event");
    }
  };

  const addCategory = async (eventId: string, category: Omit<Category, "id" | "eventId" | "sold">) => {
    try {
      const { error } = await supabase.from("ticket_types").insert([{ ...category, event_id: eventId, sold: 0 }]);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error adding category");
    }
  };

  const updateCategory = async (eventId: string, categoryId: string, data: Partial<Pick<Category, "name" | "price" | "capacity">>) => {
    try {
      const { error } = await supabase.from("ticket_types").update(data).eq("id", categoryId);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error updating category");
    }
  };

  const deleteCategory = async (eventId: string, categoryId: string) => {
    try {
      const { error } = await supabase.from("ticket_types").delete().eq("id", categoryId);
      if (error) throw error;
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error deleting category");
    }
  };

  const addParticipant = async (eventId: string, data: { name: string; email: string; categoryId: string }, status: "confirmed" | "pending" | "cancelled" = "confirmed") => {
    try {
      const { data: existingParticipant, error: checkError } = await supabase
        .from("participants")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("email", data.email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingParticipant) {
        if (existingParticipant.status !== status) {
          const { error: updateError } = await supabase.from("participants").update({ status }).eq("id", existingParticipant.id);
          if (updateError) throw updateError;
        }
      } else {
        const { error: participantError } = await supabase.from("participants").insert([{
          event_id: eventId,
          name: data.name,
          email: data.email,
          ticket_type_id: data.categoryId,
          registration_date: new Date().toISOString(),
          status: status
        }]);
        if (participantError) throw participantError;

        const event = events.find(e => e.id === eventId);
        const category = event?.categories.find(t => t.id === data.categoryId);
        if (category) {
          const { error: ticketError } = await supabase.from("ticket_types").update({ sold: (category.sold || 0) + 1 }).eq("id", data.categoryId);
          if (ticketError) throw ticketError;
        }
      }

      if (status === "confirmed") {
        toast({ title: "Registration Successful!", description: "You have been registered for the event." });
      }
      await fetchEvents();
    } catch (error: any) {
      handleSupabaseError(error, "Error during registration");
      throw error;
    }
  };

  const processRegistrationWithPayment = async (eventId: string, categoryId: string, userData: { name: string; email: string }) => {
    try {
      const event = events.find(e => e.id === eventId);
      const category = event?.categories.find(t => t.id === categoryId);
      if (!event || !category) throw new Error("Event or category not found.");

      const { data: functionData, error: functionError } = await supabase.functions.invoke('midtrans-snap', {
        body: {
          transaction_details: { order_id: `REG-${Date.now()}-${userData.email.split('@')[0]}`, gross_amount: category.price },
          customer_details: { first_name: userData.name, email: userData.email },
          item_details: [{ id: category.id, price: category.price, quantity: 1, name: `${event.name} - ${category.name}` }],
          credit_card: { secure: true },
        },
      });

      if (functionError) throw new Error(functionError.message || "Failed to initialize payment.");

      return new Promise<void>((resolve, reject) => {
        const participantData = { ...userData, categoryId };
        window.snap.pay(functionData.token, {
          onSuccess: async () => {
            try { await addParticipant(eventId, participantData, "confirmed"); resolve(); } catch (err) { reject(err); }
          },
          onPending: async () => {
            try { 
              await addParticipant(eventId, participantData, "pending"); 
              toast({ title: "Payment Pending", description: "Your payment is being processed. You can find this race in 'My Race' tab." });
              resolve(); 
            } catch (err) { reject(err); }
          },
          onError: () => {
            toast({ variant: "destructive", title: "Payment Failed", description: "Something went wrong during payment. Please try again." });
            reject(new Error("Payment failed."));
          },
          onClose: async () => {
            try {
              await addParticipant(eventId, participantData, "pending");
              toast({ title: "Registration Pending", description: "Payment was not completed. Your registration has been saved as pending." });
              resolve();
            } catch (err) { reject(err); }
          }
        });
      });
    } catch (error: any) {
      handleSupabaseError(error, "Payment Error");
      throw error;
    }
  };

  return (
    <EventContext.Provider value={{ 
        events, isLoading, addEvent, updateEvent, toggleEventVisibility, deleteEvent, 
        addCategory, updateCategory, deleteCategory, addParticipant, 
        processRegistrationWithPayment, refreshEvents: fetchEvents 
    }}>
      {children}
    </EventContext.Provider>
  );
};
