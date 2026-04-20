import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { EventFormDialog } from "@/components/EventFormDialog";
import { Category, RunningEvent } from "@/data/types";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EventKPICards } from "@/components/EventKPICards";
import { EventParticipants } from "@/components/EventParticipants";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, updateEvent, addCategory, updateCategory, deleteCategory, processRegistrationWithPayment, deleteEvent } = useEvents();
  const { isAdmin, user, profile } = useAuth();
  
  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [registeringCategoryId, setRegisteringCategoryId] = useState<string | null>(null);
  
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleRemoveImage = async () => {
    await handleEventUpdate({ 
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      image_url: "" 
    });
    setShowDeleteImageConfirm(false);
  };

  const isAlreadyRegistered = useMemo(() => {
    if (!event || !user?.email) return false;
    return event.participants.some(p => p.email.toLowerCase() === user.email?.toLowerCase());
  }, [event, user?.email]);

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="link" onClick={() => navigate("/")}>Back to events</Button>
      </div>
    );
  }

  const handleCategorySubmit = (data: { name: string; price: number; capacity: number }) => {
    if (editingCategory) {
      updateCategory(event.id, editingCategory.id, data);
    } else {
      addCategory(event.id, data);
    }
  };

  const handleEventUpdate = async (data: { name: string; date: string; location: string; description: string; image_url?: string }) => {
    await updateEvent(event.id, data);
    setEventDialogOpen(false);
  };

  const handleRegister = async (categoryId: string) => {
    if (!event || !user || isAlreadyRegistered) return;
    
    const name = profile?.full_name || user.email?.split('@')[0] || "Guest";
    const phone = profile?.phone_number || "";
    setRegisteringCategoryId(categoryId);
    try {
      await processRegistrationWithPayment(event.id, categoryId, { name, email: user.email || "", phone });
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setRegisteringCategoryId(null);
    }
  };

  const handleDeleteEvent = async () => {
    await deleteEvent(event.id);
    navigate("/");
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    await deleteCategory(event.id, categoryToDelete.id);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-muted-foreground">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEventDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Event
            </Button>
            <AlertDialog open={showDeleteEventConfirm} onOpenChange={setShowDeleteEventConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the event
                    "{event.name}", including all associated categories and participant records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Event
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {isAlreadyRegistered && !isAdmin && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3 text-primary animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">You are registered for this event. See your details below.</p>
        </div>
      )}

      {/* KPI Cards */}
      {isAdmin && <EventKPICards event={event} />}

      {/* User View: Event Cover Image */}
      {!isAdmin && event.image_url && (
        <div className="w-full aspect-video md:aspect-[2.5/1] max-h-[400px] overflow-hidden rounded-xl border shadow-sm">
          <img 
            src={event.image_url} 
            alt={event.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Description (User Only) */}
      {!isAdmin && event.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About this Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Event Image Section (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md border bg-muted">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt={event.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 h-24 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Event Cover Image</h3>
                  <p className="text-xs text-muted-foreground">
                    {event.image_url ? "This image is currently displayed on the event card." : "No cover image has been set for this event yet."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEventDialogOpen(true)}>
                    <Pencil className="mr-2 h-3 w-3" /> {event.image_url ? "Update Image" : "Add Image"}
                  </Button>
                  {event.image_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => setShowDeleteImageConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" /> Remove Image
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog open={showDeleteImageConfirm} onOpenChange={setShowDeleteImageConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Cover Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the cover image? 
              This will leave the event with no display image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveImage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Categories</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.categories.map((category) => {
                const isProcessing = registeringCategoryId === category.id;
                const isSoldOut = category.sold >= category.capacity;
                
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>IDR {category.price.toLocaleString()}</TableCell>
                    <TableCell>{category.capacity}</TableCell>
                    <TableCell>{category.sold}</TableCell>
                    <TableCell>{category.capacity - category.sold}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCategory(category); setCategoryDialogOpen(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive" 
                            onClick={() => setCategoryToDelete(category)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          disabled={isSoldOut || registeringCategoryId !== null || isAlreadyRegistered}
                          onClick={() => handleRegister(category.id)}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isAlreadyRegistered ? "Already Registered" : (isSoldOut ? "Sold Out" : (isProcessing ? "Processing..." : "Register"))}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {event.categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No categories yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Participants */}
      {isAdmin && <EventParticipants event={event} />}

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{categoryToDelete?.name}" category? 
              This will remove this option from the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryFormDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} onSubmit={handleCategorySubmit} category={editingCategory} />
      <EventFormDialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} onSubmit={handleEventUpdate} event={event} />
    </div>
  );
}
