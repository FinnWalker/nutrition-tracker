import { CalendarDays, ChefHat, House, Target } from "lucide-react";

export const navigationItems = [
  {
    href: "",
    label: "Overview",
    icon: House,
  },
  {
    href: "/diary",
    label: "Diary",
    icon: CalendarDays,
  },
  {
    href: "/food-library",
    label: "Saved Foods",
    icon: ChefHat,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: Target,
  },
] as const;
