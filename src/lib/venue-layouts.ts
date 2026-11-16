/**
 * The layouts for the optional 3D ticket view, and the areas a ticket type
 * can be placed on. Keys match the API (common/events/venue-layouts.ts).
 * Areas, not seats: a ticket says roughly where you'll be.
 */
export type TVenueLayout = "concert" | "club" | "festival" | "theatre" | "conference";

export const VENUE_LAYOUTS: {
  value: TVenueLayout;
  label: string;
  description: string;
  zones: { value: string; label: string }[];
}[] = [
  {
    value: "concert",
    label: "Concert",
    description: "A stage, a standing floor, booths and a balcony.",
    zones: [
      { value: "front_pit", label: "Front pit" },
      { value: "main_floor", label: "Main floor" },
      { value: "side_booths", label: "Side booths" },
      { value: "balcony", label: "Balcony" },
    ],
  },
  {
    value: "club",
    label: "Club / lounge",
    description: "A DJ booth, dance floor, bar, VIP booths and a mezzanine.",
    zones: [
      { value: "dance_floor", label: "Dance floor" },
      { value: "bar", label: "Bar area" },
      { value: "vip_booths", label: "VIP booths" },
      { value: "mezzanine", label: "Mezzanine" },
    ],
  },
  {
    value: "festival",
    label: "Outdoor festival",
    description: "A big stage, an open field, a VIP deck and a back lawn.",
    zones: [
      { value: "front_stage", label: "Front of stage" },
      { value: "general_field", label: "General field" },
      { value: "vip_deck", label: "VIP deck" },
      { value: "back_lawn", label: "Back lawn" },
    ],
  },
  {
    value: "theatre",
    label: "Theatre / hall",
    description: "Seated stalls, an upper circle and side boxes.",
    zones: [
      { value: "front_stalls", label: "Front stalls" },
      { value: "back_stalls", label: "Back stalls" },
      { value: "circle", label: "Upper circle" },
      { value: "boxes", label: "Side boxes" },
    ],
  },
  {
    value: "conference",
    label: "Conference",
    description: "A stage with screens, rows of seats and an expo area.",
    zones: [
      { value: "front_rows", label: "Front rows" },
      { value: "main_seating", label: "Main seating" },
      { value: "back_rows", label: "Back rows" },
      { value: "expo_area", label: "Expo area" },
    ],
  },
];

export const layoutOf = (value?: string | null) =>
  VENUE_LAYOUTS.find((layout) => layout.value === value) ?? null;

export const zoneLabel = (layout?: string | null, zone?: string | null) =>
  layoutOf(layout)?.zones.find((item) => item.value === zone)?.label ?? null;

/** One colour per area, in order, readable in light and dark. */
export const ZONE_COLOURS = ["#00b2ff", "#7c8cf8", "#f59e0b", "#10b981"] as const;
