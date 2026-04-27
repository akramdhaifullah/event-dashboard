import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { RunningEvent, Category, Participant, CartItem, RegistrationField } from "@/data/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";

interface EventContextType {
  events: RunningEvent[];
  isLoading: boolean;
  addEvent: (event: Omit<RunningEvent, "id" | "categories" | "participants" | "visible">) => Promise<void>;
  updateEvent: (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description" | "image_url" | "visible" | "registration_setup">>) => Promise<void>;
  toggleEventVisibility: (id: string, currentStatus: boolean) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addCategory: (eventId: string, category: Omit<Category, "id" | "eventId" | "sold">) => Promise<void>;
  updateCategory: (eventId: string, categoryId: string, data: Partial<Pick<Category, "name" | "price" | "capacity">>) => Promise<void>;
  deleteCategory: (eventId: string, categoryId: string) => Promise<void>;
  addParticipant: (eventId: string, data: { 
    name: string; 
    email: string; 
    categoryId: string;
    bib_name?: string;
    dob?: string;
    gender?: string;
    blood_type?: string;
    phone_number?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    custom_fields?: Record<string, unknown>;
  }, status?: "confirmed" | "pending" | "cancelled", orderId?: string) => Promise<void>;
  addOrder: (order: { id: string; customer_email: string; total_amount: number; status: string }) => Promise<void>;
  updateOrder: (id: string, status: string) => Promise<void>;
  addOrderItems: (items: Array<{ order_id: string; item_id: string; item_name: string; quantity: number; unit_price: number }>) => Promise<void>;
  processRegistrationWithPayment: (eventId: string, categoryId: string, userData: { 
    name: string; 
    email: string; 
    phone?: string;
    bib_name?: string;
    dob?: string;
    gender?: string;
    blood_type?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    custom_fields?: Record<string, unknown>;
  }) => Promise<void>;
  processBulkRegistrationWithPayment: (cart: CartItem[], participantsData: Array<{
    name: string;
    email: string;
    phone?: string;
    bib_name?: string;
    dob?: string;
    gender?: string;
    blood_type?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    categoryId: string;
    eventId: string;
    custom_fields?: Record<string, unknown>;
  }>) => Promise<void>;

  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | null>(null);

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used within EventProvider");
  return ctx;
};

const DEFAULT_REGISTRATION_SETUP: RegistrationField[] = [
  { id: "1", name: "name", label: "Full Name", type: "text", required: true, group: "personal", isCustom: false },
  { id: "2", name: "email", label: "Email Address", type: "email", required: true, group: "personal", isCustom: false },
];


export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<RunningEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin, isOrganizer, managedEventIds, isReady } = useAuth();

  const fetchEvents = useCallback(async () => {
    if (!isReady) return;
    setIsLoading(true);
    try {
      let eventsQuery = supabase.from("events").select("*");
      
      if (isAdmin) {
        // Admin sees all events
      } else if (isOrganizer) {
        // Organizer sees only their managed events
        if (managedEventIds.length > 0) {
          eventsQuery = eventsQuery.in("id", managedEventIds);
        } else {
          // If no managed events, return nothing
          setEvents([]);
          setIsLoading(false);
          return;
        }
      } else {
        // Guests see only visible events
        eventsQuery = eventsQuery.eq("visible", true);
      }

      const [eventsRes, ticketsRes, participantsRes] = await Promise.all([
        eventsQuery,
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
              status: p.status,
              bib_name: p.bib_name,
              dob: p.dob,
              gender: p.gender,
              blood_type: p.blood_type,
              phone_number: p.phone_number,
              emergency_contact_name: p.emergency_contact_name,
              emergency_contact_phone: p.emergency_contact_phone,
              emergency_contact_relationship: p.emergency_contact_relationship
            };
          }),
      }));

      setEvents(combinedEvents);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isAdmin, isOrganizer, managedEventIds]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSupabaseError = (error: unknown, title: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast({
      variant: "destructive",
      title,
      description: errorMessage,
    });
  };

  const addEvent = async (data: Omit<RunningEvent, "id" | "categories" | "participants" | "visible">) => {
    try {
      const { error } = await supabase.from("events").insert([{ 
        ...data, 
        visible: false,
        registration_setup: DEFAULT_REGISTRATION_SETUP
      }]);
      if (error) throw error;
      await fetchEvents();
    } catch (error: unknown) {
      handleSupabaseError(error, "Error adding event");
    }
  };

  const updateEvent = async (id: string, data: Partial<Pick<RunningEvent, "name" | "date" | "location" | "description" | "image_url" | "visible" | "registration_setup">>) => {
    try {
      const { error } = await supabase.from("events").update(data).eq("id", id);
      if (error) throw error;
      await fetchEvents();
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      handleSupabaseError(error, "Error updating visibility");
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      await fetchEvents();
    } catch (error: unknown) {
      handleSupabaseError(error, "Error deleting event");
    }
  };

  const addCategory = async (eventId: string, category: Omit<Category, "id" | "eventId" | "sold">) => {
    try {
      const { error } = await supabase.from("ticket_types").insert([{ ...category, event_id: eventId, sold: 0 }]);
      if (error) throw error;
      await fetchEvents();
    } catch (error: unknown) {
      handleSupabaseError(error, "Error adding category");
    }
  };

  const updateCategory = async (eventId: string, categoryId: string, data: Partial<Pick<Category, "name" | "price" | "capacity">>) => {
    try {
      const { error } = await supabase.from("ticket_types").update(data).eq("id", categoryId);
      if (error) throw error;
      await fetchEvents();
    } catch (error: unknown) {
      handleSupabaseError(error, "Error updating category");
    }
  };

  const deleteCategory = async (eventId: string, categoryId: string) => {
    try {
      const { error } = await supabase.from("ticket_types").delete().eq("id", categoryId);
      if (error) throw error;
      await fetchEvents();
    } catch (error: unknown) {
      handleSupabaseError(error, "Error deleting category");
    }
  };

  const addParticipant = async (eventId: string, data: { 
    name: string; 
    email: string; 
    categoryId: string;
    bib_name?: string;
    dob?: string;
    gender?: string;
    blood_type?: string;
    phone_number?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    custom_fields?: Record<string, unknown>;
  }, status: "confirmed" | "pending" | "cancelled" = "confirmed", orderId?: string) => {
    if (!data.name || !data.email) {
      throw new Error("Full Name and Email Address are required for registration.");
    }
    try {
      const { data: existingParticipant, error: checkError } = await supabase
        .from("participants")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("email", data.email)
        .eq("ticket_type_id", data.categoryId)
        .maybeSingle();

      if (checkError) throw checkError;

      const participantPayload = {
        status, 
        order_id: orderId,
        bib_name: data.bib_name,
        dob: data.dob,
        gender: data.gender,
        blood_type: data.blood_type,
        phone_number: data.phone_number,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        emergency_contact_relationship: data.emergency_contact_relationship,
        custom_fields: data.custom_fields
      };

      if (existingParticipant) {
        if (existingParticipant.status !== status || data.custom_fields) {
          const { error: updateError } = await supabase.from("participants").update(participantPayload).eq("id", existingParticipant.id);
          if (updateError) throw updateError;
        }
      } else {
        const { error: participantError } = await supabase.from("participants").insert([{
          ...participantPayload,
          event_id: eventId,
          name: data.name,
          email: data.email,
          ticket_type_id: data.categoryId,
          registration_date: new Date().toISOString(),
        }]);
        if (participantError) throw participantError;

        const event = events.find(e => e.id === eventId);
        const category = event?.categories.find(t => t.id === data.categoryId);
        if (category) {
          const { error: ticketError } = await supabase.from("ticket_types").update({ sold: (category.sold || 0) + 1 }).eq("id", data.categoryId);
          if (ticketError) throw ticketError;
        }
      }
      await fetchEvents();
    } catch (error: unknown) {
      handleSupabaseError(error, "Error during registration");
      throw error;
    }
  };

  const addOrder = async (order: { id: string; customer_email: string; total_amount: number; status: string }) => {
    try {
      const { error } = await supabase.from('orders').insert([order]);
      if (error) throw error;
    } catch (error: unknown) {
      handleSupabaseError(error, "Error adding order");
      throw error;
    }
  };

  const updateOrder = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    } catch (error: unknown) {
      handleSupabaseError(error, "Error updating order");
      throw error;
    }
  };

  const addOrderItems = async (items: Array<{ order_id: string; item_id: string; item_name: string; quantity: number; unit_price: number }>) => {
    try {
      const { error } = await supabase.from('order_items').insert(items);
      if (error) throw error;
    } catch (error: unknown) {
      handleSupabaseError(error, "Error adding order items");
      throw error;
    }
  };

  const executeSnapPayment = async (
    orderId: string,
    totalAmount: number,
    customerDetails: { first_name: string; email: string; phone?: string },
    itemDetails: Array<{ id: string; price: number; quantity: number; name: string }>
  ): Promise<void> => {
    const { data: functionData, error: functionError } = await supabase.functions.invoke('midtrans-snap', {
      body: {
        transaction_details: { order_id: orderId, gross_amount: totalAmount },
        customer_details: customerDetails,
        item_details: itemDetails,
        credit_card: { secure: true },
      },
    });

    if (functionError) throw new Error(functionError.message || "Failed to initialize payment.");

    return new Promise<void>((resolve, reject) => {
      window.snap.pay(functionData.token, {
        onSuccess: (result: any) => {
          console.log('Payment Success:', result);
          if (result.finish_redirect_url) {
            window.location.href = result.finish_redirect_url;
          }
          resolve();
        },
        onPending: (result: any) => {
          console.log('Payment Pending:', result);
          if (result.finish_redirect_url) {
            window.location.href = result.finish_redirect_url;
          }
          resolve();
        },
        onError: (result: any) => {
          console.error('Payment Error:', result);
          if (result.finish_redirect_url) {
            window.location.href = result.finish_redirect_url;
          }
          toast({ variant: "destructive", title: "Payment Failed", description: "Something went wrong during payment. Please try again." });
          reject(new Error("Payment failed."));
        },
        onClose: () => {
          toast({ title: "Registration Cancelled", description: "Payment was not completed. You can try again whenever you're ready." });
          reject(new Error("Payment cancelled by user."));
        }
      });
    });
  };

  const processRegistrationWithPayment = async (eventId: string, categoryId: string, userData: { 
    name: string; 
    email: string; 
    phone?: string;
    bib_name?: string;
    dob?: string;
    gender?: string;
    blood_type?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    custom_fields?: Record<string, unknown>;
  }) => {
    try {
      const event = events.find(e => e.id === eventId);
      const category = event?.categories.find(t => t.id === categoryId);
      if (!event || !category) throw new Error("Event or category not found.");

      const orderId = `REG-${Date.now()}-${userData.email.split('@')[0]}`;

      await addOrder({
        id: orderId,
        customer_email: userData.email,
        total_amount: category.price,
        status: 'unpaid'
      });

      await addOrderItems([{
        order_id: orderId,
        item_id: categoryId,
        item_name: `${event.name} - ${category.name}`,
        quantity: 1,
        unit_price: category.price
      }]);

      await addParticipant(eventId, {
        ...userData,
        phone_number: userData.phone,
        categoryId,
      }, "pending", orderId);

      await executeSnapPayment(
        orderId,
        category.price,
        { first_name: userData.name, email: userData.email, phone: userData.phone },
        [{ id: category.id, price: category.price, quantity: 1, name: `${event.name} - ${category.name}` }]
      );
    } catch (error: unknown) {
      handleSupabaseError(error, "Payment Error");
      throw error;
    }
  };

  const processBulkRegistrationWithPayment = async (cart: CartItem[], participantsData: Array<{
    name: string;
    email: string;
    phone?: string;
    bib_name?: string;
    dob?: string;
    gender?: string;
    blood_type?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    categoryId: string;
    eventId: string;
    custom_fields?: Record<string, unknown>;
  }>) => {
    try {
      if (cart.length === 0) throw new Error("Cart is empty.");

      const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const firstEmail = participantsData[0]?.email || "customer@example.com";
      const orderId = `REG-${Date.now()}-${firstEmail.split('@')[0]}`;

      await addOrder({
        id: orderId,
        customer_email: firstEmail,
        total_amount: totalAmount,
        status: 'unpaid'
      });

      const orderItems = cart.map(item => ({
        order_id: orderId,
        item_id: item.categoryId,
        item_name: `${item.eventName} - ${item.categoryName}`,
        quantity: item.quantity,
        unit_price: item.price
      }));

      await addOrderItems(orderItems);

      for (const p of participantsData) {
        await addParticipant(p.eventId, {
          ...p,
          phone_number: p.phone,
        }, "pending", orderId);
      }

      const item_details = cart.map(item => ({
        id: item.categoryId,
        price: item.price,
        quantity: item.quantity,
        name: `${item.eventName} - ${item.categoryName}`
      }));

      await executeSnapPayment(
        orderId,
        totalAmount,
        { first_name: participantsData[0]?.name || "Customer", email: firstEmail, phone: participantsData[0]?.phone },
        item_details
      );
    } catch (error: unknown) {
      handleSupabaseError(error, "Payment Error");
      throw error;
    }
  };

  return (
    <EventContext.Provider value={{ 
        events, isLoading, addEvent, updateEvent, toggleEventVisibility, deleteEvent, 
        addCategory, updateCategory, deleteCategory, addParticipant, addOrder, updateOrder,
        addOrderItems, processRegistrationWithPayment, processBulkRegistrationWithPayment, refreshEvents: fetchEvents 
    }}>
      {children}
    </EventContext.Provider>
  );
};
