export interface RegistrationField {
  id: string;
  name: string; // The property key in the form
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'email';
  required: boolean;
  group: 'personal' | 'emergency' | 'custom';
  options?: string[]; // Only for 'select' type
  isCustom: boolean;
}

export interface RunningEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  image_url?: string | null;
  visible: boolean;
  categories: Category[];
  participants: Participant[];
  registration_setup?: RegistrationField[];
}

export interface Category {
  id: string;
  eventId: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  categoryId: string;
  categoryName: string;
  registrationDate: string;
  status: "confirmed" | "pending" | "cancelled";
  bib_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  phone_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  custom_fields?: Record<string, unknown> | null;
}

export interface CartItem {
  id: string;
  eventId: string;
  eventName: string;
  categoryId: string;
  categoryName: string;
  price: number;
  quantity: number;
}
