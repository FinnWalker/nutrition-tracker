import { CalendarDays, ChefHat, House } from "lucide-react";

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
] as const;
