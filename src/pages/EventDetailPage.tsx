import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { EventFormDialog } from "@/components/EventFormDialog";
import { Category, RunningEvent } from "@/data/types";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, CheckCircle2, Image as ImageIcon, ShoppingCart, Minus, ShoppingBag } from "lucide-react";
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
  const { events, updateEvent, addCategory, updateCategory, deleteCategory, deleteEvent, isLoading: eventsLoading } = useEvents();
  const { isAdmin, isOrganizer } = useAuth();
  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();
  
  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Filter cart to only show items for THIS event
  const eventCartItems = useMemo(() => cart.filter(item => item.eventId === id), [cart, id]);
  const eventCartTotal = useMemo(() => eventCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), [eventCartItems]);

  const handleAddToCart = (category: Category) => {
    if (!event) return;
    addToCart({
      eventId: event.id,
      eventName: event.name,
      categoryId: category.id,
      categoryName: category.name,
      price: category.price,
      quantity: 1,
    });
  };

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

  const isManagementMode = isAdmin || isOrganizer;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isManagementMode ? "/admin/dashboard" : "/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-muted-foreground">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isManagementMode && (
            <Button variant="outline" onClick={() => setEventDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Event
            </Button>
          )}
          {isAdmin && (
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
          )}
        </div>
      </div>

      {isManagementMode ? (
        /* ADMIN/ORGANIZER VIEW: Original stacked layout */
        <div className="space-y-6">
          <EventKPICards event={event} />

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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Categories</CardTitle>
              <Button size="sm" onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
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
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>IDR {category.price.toLocaleString()}</TableCell>
                      <TableCell>{category.capacity}</TableCell>
                      <TableCell>{category.sold}</TableCell>
                      <TableCell>{category.capacity - category.sold}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {event.categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No categories have been added to this event yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <EventParticipants event={event} />
        </div>
      ) : (
        /* USER VIEW: New 2-column layout with Cart */
        <>
          {event.image_url && (
            <div className="w-full aspect-video md:aspect-[2.5/1] max-h-[400px] overflow-hidden rounded-xl border shadow-sm">
              <img 
                src={event.image_url} 
                alt={event.name} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6 w-1/3">Name</TableHead>
                        <TableHead className="w-full">Price</TableHead>
                        <TableHead className="text-left pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {event.categories.map((category) => {
                        const isSoldOut = category.sold >= category.capacity;
                        const isInCart = eventCartItems.some(item => item.categoryId === category.id);
                        
                        return (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium pl-6">{category.name}</TableCell>
                            <TableCell className="w-full">IDR {category.price.toLocaleString()}</TableCell>
                            <TableCell className="text-left pr-6">
                              <Button 
                                size="sm" 
                                disabled={isSoldOut || isInCart}
                                onClick={() => handleAddToCart(category)}
                                variant={isInCart ? "outline" : "default"}
                                className="w-32"
                              >
                                {isSoldOut ? "Sold Out" : isInCart ? (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                    Added
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Add
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {event.categories.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                            No categories available for this event yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1/3) */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
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

              {eventCartItems.length > 0 && (
                <Card className="border-primary/20 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Your Cart</CardTitle>
                    </div>
                    <span className="text-sm font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      {eventCartItems.reduce((acc, item) => acc + item.quantity, 0)} Items
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y max-h-[400px] overflow-auto">
                        {eventCartItems.map((item) => (
                          <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.categoryName}</p>
                              <p className="text-xs text-muted-foreground">IDR {item.price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border rounded-md">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-none"
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateQuantity(item.id, item.quantity - 1);
                                    } else {
                                      removeFromCart(item.id);
                                    }
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-none"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      <div className="p-4 bg-muted/30 space-y-4">
                        <div className="flex justify-between font-bold">
                          <span>Subtotal</span>
                          <span className="text-primary">IDR {eventCartTotal.toLocaleString()}</span>
                        </div>
                        <Button 
                          className="w-full h-11" 
                          onClick={() => navigate(`/events/${event.id}/register`)}
                        >
                          Proceed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Shared Dialogs */}
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

      <AlertDialog open={showDeleteImageConfirm} onOpenChange={setShowDeleteImageConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the cover image for this event?
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

      <CategoryFormDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} onSubmit={handleCategorySubmit} category={editingCategory} />
      <EventFormDialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} onSubmit={handleEventUpdate} event={event} />
    </div>
  );
}
