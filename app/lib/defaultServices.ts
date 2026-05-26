export type DefaultService = {
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
  category: string;
};

const SALON: DefaultService[] = [
  { name: "Haircut",     price: 25, duration_minutes: 45, description: "Precision cut styled to your preference",    category: "Hair"   },
  { name: "Hair Colour", price: 60, duration_minutes: 90, description: "Full colour treatment with premium products", category: "Hair"   },
  { name: "Blow Dry",    price: 20, duration_minutes: 30, description: "Professional blow dry and finish",            category: "Hair"   },
  { name: "Beard Trim",  price: 15, duration_minutes: 20, description: "Shape and trim with hot towel finish",        category: "Barber" },
  { name: "Manicure",    price: 30, duration_minutes: 45, description: "Nail shaping, cuticle care, and polish",     category: "Nails"  },
  { name: "Facial",      price: 40, duration_minutes: 60, description: "Cleanse, exfoliate, and hydrate",            category: "Beauty" },
];

const PHYSIO: DefaultService[] = [
  { name: "Initial Assessment",    price: 60, duration_minutes: 60, description: "First appointment to assess your condition",  category: "Assessment" },
  { name: "Physiotherapy Session", price: 50, duration_minutes: 45, description: "Hands-on treatment and rehabilitation",       category: "Treatment"  },
  { name: "Follow-up Session",     price: 40, duration_minutes: 30, description: "Progress review and continued treatment",     category: "Treatment"  },
  { name: "Sports Massage",        price: 45, duration_minutes: 45, description: "Deep tissue massage for sports recovery",     category: "Massage"    },
];

const DENTAL: DefaultService[] = [
  { name: "Dental Consultation", price: 50,  duration_minutes: 30, description: "Initial examination and treatment planning",  category: "Consultation" },
  { name: "Hygienist Clean",     price: 65,  duration_minutes: 45, description: "Professional scale and polish",               category: "Preventive"   },
  { name: "Teeth Whitening",     price: 120, duration_minutes: 60, description: "Professional whitening for a brighter smile", category: "Cosmetic"     },
  { name: "Composite Bonding",   price: 180, duration_minutes: 90, description: "Tooth-coloured composite restoration",        category: "Cosmetic"     },
];

const GYM: DefaultService[] = [
  { name: "Personal Training Session", price: 50, duration_minutes: 60, description: "One-to-one session tailored to your goals", category: "Training"     },
  { name: "Group Class",               price: 15, duration_minutes: 60, description: "High-energy class for all fitness levels",  category: "Classes"      },
  { name: "Fitness Assessment",        price: 40, duration_minutes: 60, description: "Full fitness evaluation and goal setting",  category: "Assessment"   },
  { name: "Nutrition Consultation",    price: 45, duration_minutes: 45, description: "Personalised nutrition plan and advice",    category: "Consultation" },
];

const SPA: DefaultService[] = [
  { name: "Full Body Massage",   price: 60, duration_minutes: 60, description: "Relaxing head-to-toe massage",                    category: "Massage" },
  { name: "Deep Tissue Massage", price: 65, duration_minutes: 60, description: "Targeted deep muscle tension relief",              category: "Massage" },
  { name: "Aromatherapy",        price: 55, duration_minutes: 60, description: "Essential oil massage for mind and body balance",  category: "Massage" },
  { name: "Facial",              price: 50, duration_minutes: 60, description: "Cleanse, exfoliate, and hydrate",                 category: "Beauty"  },
];

const DEFAULT_SERVICES: Record<string, DefaultService[]> = {
  hair:    SALON,
  barber:  SALON,
  beauty:  SALON,
  nail:    SALON,
  physio:  PHYSIO,
  dental:  DENTAL,
  gym:     GYM,
  yoga:    GYM,
  pt:      GYM,
  spa:     SPA,
  massage: SPA,
  other:   [],
};

export function getDefaultServices(businessType: string): DefaultService[] {
  return DEFAULT_SERVICES[businessType] ?? [];
}
