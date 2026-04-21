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
import { cn } from "@/lib/utils";
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
  const { events, updateEvent, addCategory, updateCategory, deleteCategory, processRegistrationWithPayment, deleteEvent, isLoading: eventsLoading } = useEvents();
  const { isAdmin, user } = useAuth();
  
  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [registeringCategoryId, setRegisteringCategoryId] = useState<string | null>(null);
  
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleRemoveImage = async () => {
    if (!event) return;
    await handleEventUpdate({ 
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      image_url: "" 
    });
    setShowDeleteImageConfirm(false);
  };

  const handleCategorySubmit = (data: { name: string; price: number; capacity: number }) => {
    if (!event) return;
    if (editingCategory) {
      updateCategory(event.id, editingCategory.id, data);
    } else {
      addCategory(event.id, data);
    }
  };

  const handleEventUpdate = async (data: { name: string; date: string; location: string; description: string; image_url?: string }) => {
    if (!event) return;
    await updateEvent(event.id, data);
    setEventDialogOpen(false);
  };

  const handleRegister = (categoryId: string) => {
    if (!event) return;
    navigate(`/events/${event.id}/register/${categoryId}`);
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    await deleteEvent(event.id);
    navigate("/");
  };

  const handleDeleteCategory = async () => {
    if (!event || !categoryToDelete) return;
    await deleteCategory(event.id, categoryToDelete.id);
    setCategoryToDelete(null);
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-muted-foreground">Event not found.</p>
        <Button onClick={() => navigate("/")}>Back to Events</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            {isAdmin && (
              <p className="text-muted-foreground">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
            )}
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

      <div className="space-y-6">
        {/* About this Event (User Only) */}
        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About this Event</CardTitle>
            </CardHeader>
            <CardContent>
              {event.description ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              ) : (
                <p className="text-muted-foreground italic text-sm">No description available for this event.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Event Details (User Only) */}
        {!isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{event.location}</span>
                </div>
                <div className="flex flex-col pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</span>
                  <span className="text-sm font-medium">{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  {isAdmin && <TableHead>Capacity</TableHead>}
                  {isAdmin && <TableHead>Sold</TableHead>}
                  {isAdmin && <TableHead>Available</TableHead>}
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.categories.map((category) => {
                  const isSoldOut = category.sold >= category.capacity;
                  
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>IDR {category.price.toLocaleString()}</TableCell>
                      {isAdmin && <TableCell>{category.capacity}</TableCell>}
                      {isAdmin && <TableCell>{category.sold}</TableCell>}
                      {isAdmin && <TableCell>{category.capacity - category.sold}</TableCell>}
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
                            disabled={isSoldOut}
                            onClick={() => handleRegister(category.id)}
                          >
                            {isSoldOut ? "Sold Out" : "Register"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {event.categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 3} className="text-center text-muted-foreground py-6">No categories yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Participants (Admin Only) */}
        {isAdmin && <EventParticipants event={event} />}
      </div>

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
