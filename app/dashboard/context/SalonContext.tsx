"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";

const LS_KEY = "feature_active_salon_id";

interface SalonBasic {
  id: string;
  name: string;
  slug: string;
}

interface SalonCtx {
  salons: SalonBasic[];
  activeSalonId: string | null;
  activeSalon: SalonBasic | null;
  switchSalon: (id: string) => void;
  ready: boolean;
}

const SalonContext = createContext<SalonCtx>({
  salons: [],
  activeSalonId: null,
  activeSalon: null,
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

      // Fetch ALL salons for this owner (no .single() — multi-branch aware)
      const { data } = await supabase
        .from("salons")
        .select("id,name,slug")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      if (!data?.length) { setReady(true); return; }
      setSalons(data);

      // Restore previously selected branch or default to first
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
    // Reload so all page queries use the new salon_id
    window.location.reload();
  };

  const activeSalon = salons.find(s => s.id === activeSalonId) ?? null;

  return (
    <SalonContext.Provider value={{ salons, activeSalonId, activeSalon, switchSalon, ready }}>
      {children}
    </SalonContext.Provider>
  );
}

export const useSalon = () => useContext(SalonContext);
