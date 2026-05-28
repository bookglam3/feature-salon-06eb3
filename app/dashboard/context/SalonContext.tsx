"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalConfig, type VerticalConfig } from "@/app/lib/verticalConfig";

const LS_KEY = "feature_active_salon_id";

interface SalonBasic {
  id: string;
  name: string;
  slug: string;
  business_type?: string | null;
}

interface SalonCtx {
  salons: SalonBasic[];
  activeSalonId: string | null;
  activeSalon: SalonBasic | null;
  vc: VerticalConfig;
  switchSalon: (id: string) => void;
  ready: boolean;
}

const SalonContext = createContext<SalonCtx>({
  salons: [],
  activeSalonId: null,
  activeSalon: null,
  vc: getVerticalConfig("other"),
  switchSalon: () => {},
  ready: false,
});

export function SalonProvider({ children }: { children: ReactNode }) {
  const [salons, setSalons] = useState<SalonBasic[]>([]);
  const [activeSalonId, setActiveSalonId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("salons")
        .select("id,name,slug,business_type")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      if (!data?.length) { setReady(true); return; }
      setSalons(data);

      const stored = localStorage.getItem(LS_KEY);
      const isValid = stored && data.some(s => s.id === stored);
      const activeId = isValid ? stored! : data[0].id;

      setActiveSalonId(activeId);
      localStorage.setItem(LS_KEY, activeId);
      setReady(true);
    };
    init();
  }, []);

  const switchSalon = (id: string) => {
    localStorage.setItem(LS_KEY, id);
    setActiveSalonId(id);
    window.location.reload();
  };

  const activeSalon = salons.find(s => s.id === activeSalonId) ?? null;
  // Gate on ready: before the async query resolves, use "other" (neutral terms: Team/Clients/Appointments)
  // so non-salon accounts never briefly flash salon terminology (Stylists, Salon Dashboard, etc.)
  const vc = ready
    ? getVerticalConfig(activeSalon?.business_type)
    : getVerticalConfig("other");

  return (
    <SalonContext.Provider value={{ salons, activeSalonId, activeSalon, vc, switchSalon, ready }}>
      {children}
    </SalonContext.Provider>
  );
}

export const useSalon = () => useContext(SalonContext);
