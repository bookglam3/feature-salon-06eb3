export type BusinessType =
  | "hair" | "barber" | "beauty" | "nail"
  | "spa" | "massage"
  | "gym" | "yoga" | "pt"
  | "physio" | "dental"
  | "other";

export interface BusinessLabels {
  business:    string;   // "Salon" | "Studio" | "Clinic"
  staff:       string;   // "Staff" | "Practitioners" | "Trainers"
  staffSingle: string;   // "Stylist" | "Practitioner" | "Trainer"
  booking:     string;   // "Booking" | "Session" | "Class" | "Appointment"
  bookings:    string;   // plural
  client:      string;   // "Client" | "Patient" | "Member"
  clients:     string;   // plural
  service:     string;   // "Service" | "Treatment" | "Class"
  services:    string;   // plural
}

const MAP: Record<BusinessType, BusinessLabels> = {
  hair:   { business:"Salon",  staff:"Staff",         staffSingle:"Stylist",      booking:"Booking",     bookings:"Bookings",     client:"Client",  clients:"Clients",  service:"Service",   services:"Services"   },
  barber: { business:"Barbershop", staff:"Staff",     staffSingle:"Barber",       booking:"Booking",     bookings:"Bookings",     client:"Client",  clients:"Clients",  service:"Service",   services:"Services"   },
  beauty: { business:"Salon",  staff:"Staff",         staffSingle:"Therapist",    booking:"Booking",     bookings:"Bookings",     client:"Client",  clients:"Clients",  service:"Treatment", services:"Treatments" },
  nail:   { business:"Studio", staff:"Staff",         staffSingle:"Technician",   booking:"Booking",     bookings:"Bookings",     client:"Client",  clients:"Clients",  service:"Service",   services:"Services"   },
  spa:    { business:"Spa",    staff:"Therapists",    staffSingle:"Therapist",    booking:"Booking",     bookings:"Bookings",     client:"Guest",   clients:"Guests",   service:"Treatment", services:"Treatments" },
  massage:{ business:"Studio", staff:"Therapists",   staffSingle:"Therapist",    booking:"Session",     bookings:"Sessions",     client:"Client",  clients:"Clients",  service:"Treatment", services:"Treatments" },
  gym:    { business:"Studio", staff:"Trainers",      staffSingle:"Trainer",      booking:"Session",     bookings:"Sessions",     client:"Member",  clients:"Members",  service:"Class",     services:"Classes"    },
  yoga:   { business:"Studio", staff:"Instructors",   staffSingle:"Instructor",   booking:"Class",       bookings:"Classes",      client:"Member",  clients:"Members",  service:"Class",     services:"Classes"    },
  pt:     { business:"Studio", staff:"Trainers",      staffSingle:"Trainer",      booking:"Session",     bookings:"Sessions",     client:"Client",  clients:"Clients",  service:"Session",   services:"Sessions"   },
  physio: { business:"Clinic", staff:"Practitioners", staffSingle:"Practitioner", booking:"Appointment", bookings:"Appointments", client:"Patient", clients:"Patients", service:"Treatment", services:"Treatments" },
  dental: { business:"Clinic", staff:"Practitioners", staffSingle:"Practitioner", booking:"Appointment", bookings:"Appointments", client:"Patient", clients:"Patients", service:"Treatment", services:"Treatments" },
  other:  { business:"Business", staff:"Staff",       staffSingle:"Staff Member", booking:"Booking",     bookings:"Bookings",     client:"Client",  clients:"Clients",  service:"Service",   services:"Services"   },
};

export function getBusinessLabels(type?: string | null): BusinessLabels {
  return MAP[(type as BusinessType) ?? "hair"] ?? MAP.hair;
}
