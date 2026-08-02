import { CalendarDays, ChefHat, Target } from "lucide-react";

export const navigationItems = [
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
