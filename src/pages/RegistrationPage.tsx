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

const participantSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  bibName: z.string().min(2, "Bib name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  bloodType: z.string().min(1, "Blood type is required"),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string().min(2, "Relationship is required"),
  categoryId: z.string(),
  categoryName: z.string(),
});

const bulkRegistrationSchema = z.object({
  participants: z.array(participantSchema),
});

type BulkRegistrationFormValues = z.infer<typeof bulkRegistrationSchema>;

export default function RegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, processBulkRegistrationWithPayment } = useEvents();
  const { cart, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("0");

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);
  
  // Filter cart to only show items for THIS event
  const eventCartItems = useMemo(() => cart.filter(item => item.eventId === id), [cart, id]);
  
  // Create a flattened list of participants needed based on quantity
  const neededParticipants = useMemo(() => {
    const list: any[] = [];
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
      participants: neededParticipants.map(p => ({
        fullName: "",
        email: "",
        phone: "",
        bibName: "",
        dob: "",
        gender: "",
        bloodType: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        categoryId: p.categoryId,
        categoryName: p.categoryName,
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  // Re-sync form if cart changes (e.g. user goes back and adds more)
  useEffect(() => {
    if (neededParticipants.length > 0 && fields.length === 0) {
      form.reset({
        participants: neededParticipants.map(p => ({
          fullName: "",
          email: "",
          phone: "",
          bibName: "",
          dob: "",
          gender: "",
          bloodType: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          emergencyContactRelationship: "",
          categoryId: p.categoryId,
          categoryName: p.categoryName,
        })),
      });
    }
  }, [neededParticipants, fields.length, form]);

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
      const participantsData = values.participants.map(p => ({
        ...p,
        name: p.fullName,
        eventId: id!,
      }));
      
      await processBulkRegistrationWithPayment(eventCartItems, participantsData);
      
      // Remove only this event's items from cart
      clearCart(); 
      navigate(`/confirm-payment`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message || "Failed to initiate registration.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField
                        control={form.control}
                        name={`participants.${index}.fullName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`participants.${index}.bibName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bib Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Name on race bib" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Personal Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField
                          control={form.control}
                          name={`participants.${index}.email`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="name@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`participants.${index}.phone`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+62..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`participants.${index}.dob`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`participants.${index}.gender`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`participants.${index}.bloodType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Blood Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select blood type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="A">A</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                  <SelectItem value="AB">AB</SelectItem>
                                  <SelectItem value="O">O</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Emergency Contact
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField
                          control={form.control}
                          name={`participants.${index}.emergencyContactName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Emergency contact name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`participants.${index}.emergencyContactPhone`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Emergency contact phone" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`participants.${index}.emergencyContactRelationship`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Spouse, Parent, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
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
