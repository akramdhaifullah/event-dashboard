import { useState } from "react";
import { RegistrationField, RunningEvent } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, Settings2, User, PhoneCall, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface RegistrationSetupProps {
  event: RunningEvent;
  onUpdate: (setup: RegistrationField[]) => Promise<void>;
}

const PREDEFINED_FIELDS: Omit<RegistrationField, "id">[] = [
  { name: "name", label: "Full Name", type: "text", required: true, group: "personal", isCustom: false },
  { name: "email", label: "Email Address", type: "email", required: true, group: "personal", isCustom: false },
  { name: "phone_number", label: "Phone Number", type: "text", required: true, group: "personal", isCustom: false },
  { name: "dob", label: "Date of Birth", type: "date", required: true, group: "personal", isCustom: false },
  { name: "gender", label: "Gender", type: "select", required: true, group: "personal", isCustom: false, options: ["male", "female"] },
  { name: "blood_type", label: "Blood Type", type: "select", required: false, group: "personal", isCustom: false, options: ["A", "B", "AB", "O"] },
  { name: "bib_name", label: "Bib Name", type: "text", required: true, group: "personal", isCustom: false },
  { name: "emergency_contact_name", label: "Emergency Contact Name", type: "text", required: true, group: "emergency", isCustom: false },
  { name: "emergency_contact_phone", label: "Emergency Contact Phone", type: "text", required: true, group: "emergency", isCustom: false },
  { name: "emergency_contact_relationship", label: "Relationship", type: "text", required: true, group: "emergency", isCustom: false },
];

export function RegistrationSetup({ event, onUpdate }: RegistrationSetupProps) {
  const { toast } = useToast();
  const [fields, setFields] = useState<RegistrationField[]>(event.registration_setup || []);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [newField, setNewField] = useState<Partial<RegistrationField>>({
    label: "",
    type: "text",
    required: true,
    group: "personal",
    isCustom: false
  });

  const handleAddField = (predefined?: Omit<RegistrationField, "id">) => {
    const fieldToAdd = predefined || {
      ...newField,
      id: crypto.randomUUID(),
      name: `custom_${Date.now()}`,
      isCustom: true,
      group: "custom"
    } as RegistrationField;

    const updatedFields = [...fields, { ...fieldToAdd, id: crypto.randomUUID() }];
    setFields(updatedFields);
    setIsAddingField(false);
    setNewField({ label: "", type: "text", required: true, group: "personal", isCustom: false });
  };

  const handleRemoveField = (id: string) => {
    const field = fields.find(f => f.id === id);
    if (field && (field.name === "name" || field.name === "email")) {
      toast({ 
        variant: "destructive", 
        title: "Cannot remove field", 
        description: `${field.label} is required for registration and cannot be removed.` 
      });
      return;
    }
    const updatedFields = fields.filter(f => f.id !== id);
    setFields(updatedFields);
  };

  const handleToggleRequired = (id: string) => {
    const field = fields.find(f => f.id === id);
    if (field && (field.name === "name" || field.name === "email")) {
      return; // Cannot toggle required status for essential fields
    }
    const updatedFields = fields.map(f => f.id === id ? { ...f, required: !f.required } : f);
    setFields(updatedFields);
  };

  const handleSave = async () => {
    try {
      // Force name and email to be required just in case
      const fixedFields = fields.map(f => 
        (f.name === "name" || f.name === "email") ? { ...f, required: true } : f
      );
      await onUpdate(fixedFields);
      setFields(fixedFields);
      toast({ title: "Setup Saved", description: "Registration configuration has been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save registration setup." });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">Registration Setup</CardTitle>
            <CardDescription>Configure the data fields you want to collect from participants.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Registration Field</DialogTitle>
                  <DialogDescription>Choose a predefined field or create a custom one.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" /> Personal Details
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PREDEFINED_FIELDS.filter(f => f.group === "personal").map(field => (
                        <Button 
                          key={field.name} 
                          variant="outline" 
                          size="sm" 
                          className="justify-start"
                          onClick={() => handleAddField(field)}
                          disabled={fields.some(f => f.name === field.name)}
                        >
                          <Plus className="mr-2 h-3 w-3" /> {field.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <PhoneCall className="h-4 w-4" /> Emergency Contact
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PREDEFINED_FIELDS.filter(f => f.group === "emergency").map(field => (
                        <Button 
                          key={field.name} 
                          variant="outline" 
                          size="sm" 
                          className="justify-start"
                          onClick={() => handleAddField(field)}
                          disabled={fields.some(f => f.name === field.name)}
                        >
                          <Plus className="mr-2 h-3 w-3" /> {field.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Custom Field</h4>
                      <Switch checked={isCustom} onCheckedChange={setIsCustom} />
                    </div>
                    
                    {isCustom && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <Label>Field Label</Label>
                          <Input 
                            placeholder="e.g. T-Shirt Size" 
                            value={newField.label}
                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data Type</Label>
                          <Select 
                            value={newField.type} 
                            onValueChange={(v: RegistrationField["type"]) => setNewField({ ...newField, type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Short Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newField.type === "select" && (
                          <div className="sm:col-span-2 space-y-2">
                            <Label>Options (comma separated)</Label>
                            <Input 
                              placeholder="XS, S, M, L, XL" 
                              onChange={(e) => setNewField({ ...newField, options: e.target.value.split(",").map(s => s.trim()) })}
                            />
                          </div>
                        )}
                        <Button 
                          className="sm:col-span-2" 
                          disabled={!newField.label}
                          onClick={() => handleAddField()}
                        >
                          Add Custom Field
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fields.map((field) => {
              const isEssential = field.name === "name" || field.name === "email";
              return (
                <div 
                  key={field.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                    <div>
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {field.type} · {field.group} {field.isCustom && "· Custom"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Required</Label>
                      <Switch 
                        checked={field.required || isEssential} 
                        disabled={isEssential}
                        onCheckedChange={() => handleToggleRequired(field.id)} 
                      />
                    </div>
                    {!isEssential && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {fields.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Settings2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No fields configured yet. Click "Add Field" to start.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
