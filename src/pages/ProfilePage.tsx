import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Heart, ShieldAlert, Pencil, Save, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { profile, user, updateProfile, isProfileComplete, isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDataPopulated, setIsDataPopulated] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    bib_name: "",
    dob: "",
    gender: "",
    blood_type: "",
    phone_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  // Effect to handle initial data population
  useEffect(() => {
    if (profile && !isLoading) {
      setFormData({
        full_name: profile.full_name || "",
        bib_name: profile.bib_name || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        blood_type: profile.blood_type || "",
        phone_number: profile.phone_number || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        emergency_contact_relationship: profile.emergency_contact_relationship || "",
      });
      setIsDataPopulated(true);
    }
  }, [profile, isLoading]);

  const isFormValid = Object.values(formData).every(value => value !== "" && value !== null);

  const handleSave = async () => {
    if (!isFormValid) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value === "" ? null : value])
      );

      await updateProfile(dataToSave as any);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bib_name: profile.bib_name || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        blood_type: profile.blood_type || "",
        phone_number: profile.phone_number || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        emergency_contact_relationship: profile.emergency_contact_relationship || "",
      });
    }
    setIsEditing(false);
  };

  // Only hide the view if data is literally not yet available/populated
  const showSpinner = isLoading || isSaving || (!isDataPopulated && !isAdmin);

  if (showSpinner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse text-sm font-medium">
          {isSaving ? "Saving your profile..." : "Loading profile data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {!isAdmin && profile && !isProfileComplete && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            Please complete your profile by providing all required information below to unlock full access.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground text-lg">Manage your personal information and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Name Details */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2 border-b mb-4">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Name Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Required for registration"
                className={cn(!formData.full_name && isEditing && "border-destructive/50")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bib_name">BIB Name <span className="text-destructive">*</span></Label>
              <Input
                id="bib_name"
                value={formData.bib_name}
                onChange={(e) => setFormData({ ...formData, bib_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Name to appear on your BIB"
                className={cn(!formData.bib_name && isEditing && "border-destructive/50")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2 border-b mb-4">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                disabled={!isEditing}
                className={cn(!formData.dob && isEditing && "border-destructive/50")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                <Select
                  disabled={!isEditing}
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger id="gender" className={cn(!formData.gender && isEditing && "border-destructive/50")}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blood_type">Blood Type <span className="text-destructive">*</span></Label>
                <Select
                  disabled={!isEditing}
                  value={formData.blood_type}
                  onValueChange={(value) => setFormData({ ...formData, blood_type: value })}
                >
                  <SelectTrigger id="blood_type" className={cn(!formData.blood_type && isEditing && "border-destructive/50")}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2 border-b mb-4">
            <Phone className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-[10px] text-muted-foreground">Contact support to change email</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                disabled={!isEditing}
                placeholder="Required for registration"
                className={cn(!formData.phone_number && isEditing && "border-destructive/50")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center space-x-2 pb-2 border-b mb-4">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e_name">Contact Name <span className="text-destructive">*</span></Label>
              <Input
                id="e_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Emergency contact full name"
                className={cn(!formData.emergency_contact_name && isEditing && "border-destructive/50")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="e_phone">Phone Number <span className="text-destructive">*</span></Label>
                <Input
                  id="e_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Contact phone number"
                  className={cn(!formData.emergency_contact_phone && isEditing && "border-destructive/50")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e_rel">Relationship <span className="text-destructive">*</span></Label>
                <Input
                  id="e_rel"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g. Spouse, Parent"
                  className={cn(!formData.emergency_contact_relationship && isEditing && "border-destructive/50")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
