import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, UserPlus, Users } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrationField } from "@/data/types";

// Default setup if none exists
const DEFAULT_REGISTRATION_SETUP: RegistrationField[] = [
  { id: "1", name: "name", label: "Full Name", type: "text", required: true, group: "personal", isCustom: false },
  { id: "2", name: "email", label: "Email Address", type: "email", required: true, group: "personal", isCustom: false },
  { id: "3", name: "phone_number", label: "Phone Number", type: "text", required: true, group: "personal", isCustom: false },
  { id: "4", name: "bib_name", label: "Bib Name", type: "text", required: true, group: "personal", isCustom: false },
  { id: "5", name: "dob", label: "Date of Birth", type: "date", required: true, group: "personal", isCustom: false },
  { id: "6", name: "gender", label: "Gender", type: "select", required: true, group: "personal", isCustom: false, options: ["male", "female"] },
  { id: "7", name: "blood_type", label: "Blood Type", type: "select", required: true, group: "personal", isCustom: false, options: ["A", "B", "AB", "O"] },
  { id: "8", name: "emergency_contact_name", label: "Contact Name", type: "text", required: true, group: "emergency", isCustom: false },
  { id: "9", name: "emergency_contact_phone", label: "Contact Phone", type: "text", required: true, group: "emergency", isCustom: false },
  { id: "10", name: "emergency_contact_relationship", label: "Relationship", type: "text", required: true, group: "emergency", isCustom: false },
];

function generateSchema(setup: RegistrationField[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  setup.forEach((field) => {
    let fieldSchema: z.ZodTypeAny = z.string();
    if (field.required) {
      fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
    } else {
      fieldSchema = fieldSchema.optional().or(z.literal(""));
    }

    if (field.type === "email") {
      fieldSchema = z.string().email("Invalid email address");
      if (!field.required) {
        fieldSchema = fieldSchema.optional().or(z.literal(""));
      }
    }

    schemaShape[field.name] = fieldSchema;
  });

  return z.object({
    ...schemaShape,
    categoryId: z.string(),
    categoryName: z.string(),
  });
}

export default function RegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, processBulkRegistrationWithPayment } = useEvents();
  const { cart, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("0");

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);
  const setup = useMemo(() => (event?.registration_setup?.length ? event.registration_setup : DEFAULT_REGISTRATION_SETUP), [event]);
  
  const bulkRegistrationSchema = useMemo(() => z.object({
    participants: z.array(generateSchema(setup)),
  }), [setup]);

  type BulkRegistrationFormValues = z.infer<typeof bulkRegistrationSchema>;

  // Filter cart to only show items for THIS event
  const eventCartItems = useMemo(() => cart.filter(item => item.eventId === id), [cart, id]);
  
  // Create a flattened list of participants needed based on quantity
  const neededParticipants = useMemo(() => {
    const list: Array<{ categoryId: string; categoryName: string }> = [];
    eventCartItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        list.push({
          categoryId: item.categoryId,
          categoryName: item.categoryName,
        });
      }
    });
    return list;
  }, [eventCartItems]);

  const form = useForm<BulkRegistrationFormValues>({
    resolver: zodResolver(bulkRegistrationSchema),
    defaultValues: {
      participants: neededParticipants.map(p => {
        const defaults: Record<string, string> = {
          categoryId: p.categoryId,
          categoryName: p.categoryName,
        };
        setup.forEach(f => {
          defaults[f.name] = "";
        });
        return defaults;
      }),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  // Re-sync form if cart changes
  useEffect(() => {
    if (neededParticipants.length > 0 && fields.length === 0) {
      form.reset({
        participants: neededParticipants.map(p => {
          const defaults: Record<string, string> = {
            categoryId: p.categoryId,
            categoryName: p.categoryName,
          };
          setup.forEach(f => {
            defaults[f.name] = "";
          });
          return defaults;
        }),
      });
    }
  }, [neededParticipants, fields.length, form, setup]);

  const groupedFields = useMemo(() => {
    const groups: Record<string, RegistrationField[]> = {
      personal: [],
      emergency: [],
      custom: []
    };
    setup.forEach(f => {
      if (groups[f.group]) {
        groups[f.group].push(f);
      } else {
        groups.custom.push(f);
      }
    });
    return groups;
  }, [setup]);

  if (!event || neededParticipants.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-4">
        <Users className="h-12 w-12 text-muted-foreground/20" />
        <p className="text-muted-foreground">No registration items found in your cart.</p>
        <Button onClick={() => navigate(`/events/${id}`)}>Back to event details</Button>
      </div>
    );
  }

  const onSubmit = async (values: BulkRegistrationFormValues) => {
    setIsSubmitting(true);
    try {
      const participantsData = values.participants.map(p => {
        const participantObj = p as Record<string, unknown>;
        const standardFields: Record<string, unknown> = {
          categoryId: participantObj.categoryId as string,
          eventId: id!,
          name: (participantObj.name as string) || (participantObj.fullName as string) || "Unknown",
          email: participantObj.email as string,
        };
        
        const customFields: Record<string, unknown> = {};
        
        setup.forEach(f => {
          if (f.isCustom) {
            customFields[f.name] = participantObj[f.name];
          } else {
            const mappedName = f.name === "phone_number" ? "phone" : f.name;
            standardFields[mappedName] = participantObj[f.name];
          }
        });

        return {
          ...standardFields,
          custom_fields: customFields,
        } as unknown; 
      });
      
      await processBulkRegistrationWithPayment(eventCartItems, participantsData as Parameters<typeof processBulkRegistrationWithPayment>[1]);
      clearCart(); 
      navigate(`/confirm-payment`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate registration.";
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (index: number, field: RegistrationField) => {
    const fieldName = `participants.${index}.${field.name}` as any; // This 'any' is hard to avoid with react-hook-form dynamic paths without complex mapping

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === "select" ? (
                <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  type={field.type} 
                  placeholder={field.label} 
                  {...formField} 
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/events/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight">Event Registration</h1>
          <p className="text-muted-foreground text-sm">{event.name}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto p-1 bg-muted/50 overflow-auto">
                {fields.map((_, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={index.toString()}
                    className="py-2 text-xs"
                  >
                    Participant {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {fields.map((field, index) => (
              <TabsContent key={field.id} value={index.toString()} className="mt-0 animate-in fade-in slide-in-from-left-2 duration-300">
                <Card className="border-primary/10 shadow-sm">
                  <CardHeader className="bg-primary/5 pb-4">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Details for Participant {index + 1}</CardTitle>
                        <CardDescription>Category: {neededParticipants[index]?.categoryName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-8">
                    {groupedFields.personal.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                          Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {groupedFields.personal.map(f => renderField(index, f))}
                        </div>
                      </div>
                    )}

                    {groupedFields.emergency.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                          Emergency Contact
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {groupedFields.emergency.map(f => renderField(index, f))}
                        </div>
                      </div>
                    )}

                    {groupedFields.custom.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
                          Additional Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {groupedFields.custom.map(f => renderField(index, f))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-8 flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Please ensure all data for participant {index + 1} is accurate before proceeding.
                      </p>
                      {index < fields.length - 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveTab((index + 1).toString())}
                        >
                          Next Participant
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex flex-col gap-4">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Total Participants</span>
                <span className="font-bold">{fields.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold text-primary">IDR {eventCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Complete Registration & Pay`
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
