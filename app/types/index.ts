export interface Salon {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_id: string;
  plan: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  salon_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  service_id: string | null;
  staff_id: string | null;
  date_time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
  services?: { name: string; price: number } | null;
  staff?: { name: string } | null;
}

export interface StaffMember {
  id: string;
  salon_id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  services: string[];
  working_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  created_at?: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  price: number;
  duration?: number;
  description?: string;
}

export interface Offer {
  id: string;
  salon_id: string;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled';
