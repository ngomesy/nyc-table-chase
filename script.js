const hotel = {
  name: "The Broome Hotel",
  address: "431 Broome St, New York, NY 10013",
  mapX: 30,
  mapY: 35,
};

const tripDates = [
  { iso: "2026-04-15", label: "Wed 15" },
  { iso: "2026-04-16", label: "Thu 16" },
  { iso: "2026-04-17", label: "Fri 17" },
  { iso: "2026-04-18", label: "Sat 18" },
  { iso: "2026-04-19", label: "Sun 19" },
];

const tierMeta = {
  must: {
    label: "Must book",
    note: "Highest upside and highest regret if you miss them.",
  },
  strong: {
    label: "Strong secondary",
    note: "Excellent targets once the headline alarms are set.",
  },
  flex: {
    label: "Flexible backup",
    note: "Still very good, just less painful if you pivot on trip week.",
  },
};

const venues = [
  {
    id: "semma",
    rank: 1,
    tier: "must",
    name: "Semma",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "West Village",
    cuisine: "South Indian",
    spend: "$$$",
    hook: "One trophy dinner downtown.",
    summary:
      "The best mix of hype, flavor, and actual fun on the board. It feels special without drifting into tasting-menu theater.",
    tip: "If this is your top meal, pre-order the Dungeness crab once you land the reservation.",
    address: "60 Greenwich Ave, New York, NY 10011",
    portalUrl: "https://www.semma.nyc/",
    sourceUrl: "https://www.semma.nyc/",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 15,
      time: "09:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 29,
    mapY: 29,
  },
  {
    id: "lartusi",
    rank: 2,
    tier: "must",
    name: "L'Artusi",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "West Village",
    cuisine: "Italian",
    spend: "$$$",
    hook: "Safest elite date-night hit.",
    summary:
      "A polished West Village classic that still feels like New York, not a tourist checkbox. Pasta, wine, and a room with real energy.",
    tip: "If dinner misses, the bar and counter walk-in strategy is still very real.",
    address: "228 W 10th St, New York, NY 10014",
    portalUrl: "https://www.lartusi.com/",
    sourceUrl: "https://www.lartusi.com/",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 14,
      time: "09:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 27,
    mapY: 31,
  },
  {
    id: "lilia",
    rank: 3,
    tier: "must",
    name: "Lilia",
    type: "restaurant",
    region: "brooklyn",
    neighborhood: "Williamsburg",
    cuisine: "Italian",
    spend: "$$$",
    hook: "The Williamsburg headline dinner.",
    summary:
      "Still one of the borough's most in-demand reservations and still worth the effort if you want a full Brooklyn destination night.",
    tip: "If the drop beats you, use Notify and show up early for walk-in bar options.",
    address: "567 Union Ave, Brooklyn, NY 11211",
    portalUrl: "https://resy.com/cities/new-york-ny/venues/lilia?venueId=418",
    sourceUrl: "https://blog.resy.com/the-one-who-keeps-the-book/toughest-restaurant-reservations-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 28,
      time: "10:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 69,
    mapY: 29,
  },
  {
    id: "don-angie",
    rank: 4,
    tier: "must",
    name: "Don Angie",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "West Village",
    cuisine: "Italian-American",
    spend: "$$$",
    hook: "Compact room, huge demand.",
    summary:
      "If you want one hard-to-book West Village Italian that still feels worth the chase, this is it. Intimate room, sharper food than most imitators.",
    tip: "If you hit the booking window, stay flexible on lunch or earlier dinner to improve odds.",
    address: "103 Greenwich Ave, New York, NY 10014",
    portalUrl: "https://www.opentable.com/r/don-angie-new-york",
    sourceUrl: "https://www.opentable.com/blog/toughest-restaurant-reservations/",
    sourceLabel: "OpenTable",
    booking: {
      kind: "rolling-days",
      daysBefore: 7,
      time: "09:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 28,
    mapY: 33,
  },
  {
    id: "via-carota",
    rank: 5,
    tier: "must",
    name: "Via Carota",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "West Village",
    cuisine: "Italian",
    spend: "$$",
    hook: "Classic downtown power move.",
    summary:
      "Still one of the few places that feels equally loved by restaurant people, fashion people, and visitors trying to get it right.",
    tip: "The walk-in line is part of the culture here, but the reservation drop is still worth the alarm.",
    address: "51 Grove St, New York, NY 10014",
    portalUrl: "https://www.viacarota.com/",
    sourceUrl: "https://www.autores.io/restaurant/viacarota",
    sourceLabel: "AutoRes estimate",
    booking: {
      kind: "rolling-days",
      daysBefore: 30,
      time: "10:00",
      timeZoneOffset: "-04:00",
      estimated: true,
    },
    mapX: 26,
    mapY: 34,
  },
  {
    id: "four-horsemen",
    rank: 6,
    tier: "must",
    name: "The Four Horsemen",
    type: "restaurant",
    region: "brooklyn",
    neighborhood: "Williamsburg",
    cuisine: "New American + Wine",
    spend: "$$$",
    hook: "Best wine-and-crowd quality in Brooklyn.",
    summary:
      "One of the strongest Williamsburg reservations if you care about wine, room energy, and leaving feeling like you picked the local-coded option.",
    tip: "Walk-ins can work if you treat the bar like the target, not the consolation prize.",
    address: "295 Grand St, Brooklyn, NY 11211",
    portalUrl: "https://resy.com/cities/new-york-ny/venues/the-four-horsemen?venueId=2492",
    sourceUrl: "https://blog.resy.com/the-one-who-keeps-the-book/toughest-restaurant-reservations-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 30,
      time: "07:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 71,
    mapY: 30,
  },
  {
    id: "double-chicken-please",
    rank: 7,
    tier: "must",
    name: "Double Chicken Please",
    type: "bar",
    region: "manhattan",
    neighborhood: "Lower East Side",
    cuisine: "Cocktail Bar",
    spend: "$$",
    hook: "Highest-upside cocktail swing downtown.",
    summary:
      "Still the obvious hard-ticket bar on the board. If you want one place everybody talks about, this is still the move.",
    tip: "Most of The Coop is still first come, first served, so the line is a valid Plan B.",
    address: "115 Allen St, New York, NY 10002",
    portalUrl: "https://doublechickenplease.com/pages/visitus",
    sourceUrl: "https://doublechickenplease.com/pages/visitus",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 6,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 40,
    mapY: 41,
  },
  {
    id: "rubirosa",
    rank: 8,
    tier: "must",
    name: "Rubirosa",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "Nolita",
    cuisine: "Italian-American + Pizza",
    spend: "$$",
    hook: "Best close-to-hotel reservation.",
    summary:
      "Tie-dye pizza, vodka sauce, and exactly the right amount of downtown noise. The easiest serious dinner play from Broome Street.",
    tip: "Resy notes a second wave of leftover slots can re-drop at 11 a.m. the next day.",
    address: "235 Mulberry St, New York, NY 10012",
    portalUrl: "https://resy.com/cities/new-york-ny/venues/rubirosa?venueId=466",
    sourceUrl: "https://blog.resy.com/the-one-who-keeps-the-book/toughest-restaurant-reservations-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 7,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 33,
    mapY: 35,
  },
  {
    id: "laser-wolf",
    rank: 9,
    tier: "strong",
    name: "Laser Wolf Brooklyn",
    type: "restaurant",
    region: "brooklyn",
    neighborhood: "Williamsburg",
    cuisine: "Israeli Rooftop",
    spend: "$$",
    hook: "Saturday fun with skyline built in.",
    summary:
      "Big-room energy, real views, and enough food value to feel like a party dinner instead of a scenic trap.",
    tip: "If the reservation misses, target the bar right at opening for the cleanest walk-in shot.",
    address: "97 Wythe Ave, Brooklyn, NY 11249",
    portalUrl: "https://www.laserwolfbrooklyn.com/reservations",
    sourceUrl: "https://www.laserwolfbrooklyn.com/reservations",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 21,
      time: "10:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 76,
    mapY: 26,
  },
  {
    id: "raouls",
    rank: 10,
    tier: "strong",
    name: "Raoul's",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "SoHo",
    cuisine: "French",
    spend: "$$$",
    hook: "Old-school SoHo glamour.",
    summary:
      "A real New York room. If you want one French downtown dinner that feels like it has history without losing the cool crowd, this is it.",
    tip: "Very strong option for a night when you want to stay close to the hotel but still look like you planned well.",
    address: "180 Prince St, New York, NY 10012",
    portalUrl: "https://raouls.com/",
    sourceUrl: "https://raouls.com/",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 30,
      time: "08:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 30,
    mapY: 34,
  },
  {
    id: "the-nines",
    rank: 11,
    tier: "strong",
    name: "The Nines",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "NoHo",
    cuisine: "Supper Club",
    spend: "$$$",
    hook: "Piano-room glamour near the hotel.",
    summary:
      "If you want somewhere that feels dressed, candlelit, and slightly theatrical without becoming corny, this is one of the best downtown picks.",
    tip: "The front lounge is the walk-in fallback, especially right at opening or after dinner hours.",
    address: "9 Great Jones St, New York, NY 10012",
    portalUrl: "https://www.ninesnyc.com/",
    sourceUrl: "https://blog.resy.com/2022/04/how-to-get-into-the-nines/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 14,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 35,
    mapY: 31,
  },
  {
    id: "tigre",
    rank: 12,
    tier: "strong",
    name: "Tigre",
    type: "bar",
    region: "manhattan",
    neighborhood: "Lower East Side",
    cuisine: "Cocktail Lounge",
    spend: "$$",
    hook: "Sleek martinis and better crowd control.",
    summary:
      "Sexy, polished, and much easier to pair into a whole night than some of the louder headline bars. Great if you want movement after dinner.",
    tip: "The bar is walk-in only, and late-night is your best shot if you miss a table.",
    address: "105 Rivington St, New York, NY 10002",
    portalUrl: "https://tigrenyc.com/",
    sourceUrl: "https://blog.resy.com/2024/03/how-to-get-into-tigre/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 30,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 44,
    mapY: 40,
  },
  {
    id: "golden-diner",
    rank: 13,
    tier: "strong",
    name: "Golden Diner",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "Chinatown / LES",
    cuisine: "Diner, Asian-American",
    spend: "$$",
    hook: "Best value-for-dollar play on the page.",
    summary:
      "This is the downtown Toronto brain pick. Smart comfort food, zero filler, and still hard enough to justify setting an alarm.",
    tip: "Weekend brunch is the blood sport; dinner is easier, but still worth locking in.",
    address: "123 Madison St, New York, NY 10002",
    portalUrl: "https://www.goldendinerny.com/dine",
    sourceUrl: "https://www.goldendinerny.com/dine",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 30,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 45,
    mapY: 44,
  },
  {
    id: "bangkok-supper-club",
    rank: 14,
    tier: "strong",
    name: "Bangkok Supper Club",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "Meatpacking",
    cuisine: "Thai",
    spend: "$$$",
    hook: "Most dressed-up Thai dinner in your zone.",
    summary:
      "Dark room, strong cocktails, and a more polished energy than the average hot Thai spot. Very good for a bigger Friday or Saturday night.",
    tip: "If you see a tasting-menu counter slot, take it only if you want the full production.",
    address: "641 Hudson St, New York, NY 10014",
    portalUrl: "https://www.bangkoksupperclubnyc.com/",
    sourceUrl: "https://blog.resy.com/2023/10/how-to-get-into-bangkok-supper-club-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 30,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 24,
    mapY: 24,
  },
  {
    id: "penny",
    rank: 15,
    tier: "strong",
    name: "Penny",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "East Village",
    cuisine: "Seafood Counter",
    spend: "$$$",
    hook: "If you want raw bar and downtown style.",
    summary:
      "A seafood counter with real demand and enough walk-in energy to feel alive. Great for a sharper, more food-nerd downtown night.",
    tip: "Most seats are still walk-in held, so this one stays alive even after you miss the drop.",
    address: "90 E 10th St, New York, NY 10003",
    portalUrl: "https://www.penny-nyc.com/location/penny/",
    sourceUrl: "https://www.penny-nyc.com/location/penny/",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 14,
      time: "09:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 43,
    mapY: 31,
  },
  {
    id: "theodora",
    rank: 16,
    tier: "strong",
    name: "Theodora",
    type: "restaurant",
    region: "brooklyn",
    neighborhood: "Fort Greene",
    cuisine: "Mediterranean",
    spend: "$$$",
    hook: "Best Fort Greene dinner if you cross the river.",
    summary:
      "Beautiful room, serious cooking, and one of the stronger newer Brooklyn reservations if you want to branch past Williamsburg.",
    tip: "The full-service bar is the move if you want to salvage the night without the reservation.",
    address: "7 Greene Ave, Brooklyn, NY 11238",
    portalUrl: "https://www.theodoranyc.com/",
    sourceUrl: "https://blog.resy.com/the-one-who-keeps-the-book/toughest-restaurant-reservations-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 30,
      time: "09:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 66,
    mapY: 52,
  },
  {
    id: "i-cavallini",
    rank: 17,
    tier: "strong",
    name: "I Cavallini",
    type: "restaurant",
    region: "brooklyn",
    neighborhood: "Williamsburg",
    cuisine: "Italian",
    spend: "$$",
    hook: "Four Horsemen energy, easier bill.",
    summary:
      "From the Four Horsemen team, but a little more forgiving on price and format. Ideal if you want the neighborhood cred without forcing the absolute hardest table.",
    tip: "About 40% of the room is held for walk-ins, so show up early if you miss.",
    address: "284 Grand St, Brooklyn, NY 11211",
    portalUrl: "https://resy.com/cities/new-york-ny/venues/i-cavallini",
    sourceUrl: "https://blog.resy.com/the-one-who-keeps-the-book/toughest-restaurant-reservations-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 14,
      time: "08:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 70,
    mapY: 28,
  },
  {
    id: "thai-diner",
    rank: 18,
    tier: "strong",
    name: "Thai Diner",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "Nolita",
    cuisine: "Thai Diner",
    spend: "$$",
    hook: "Closest all-day cult classic to the hotel.",
    summary:
      "A very strong value play if you want something close, fun, and actually delicious enough to justify the booking chase.",
    tip: "Great safety valve for brunch, late lunch, or a lower-pressure dinner near shopping.",
    address: "186 Mott St, New York, NY 10012",
    portalUrl: "https://www.thaidiner.com/",
    sourceUrl: "https://reservation-booker.com/cities/new-york-ny/venues/thai-diner",
    sourceLabel: "Reservation Booker estimate",
    booking: {
      kind: "rolling-days",
      daysBefore: 29,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: true,
    },
    mapX: 34,
    mapY: 34,
  },
  {
    id: "bar-blondeau",
    rank: 19,
    tier: "flex",
    name: "Bar Blondeau",
    type: "bar",
    region: "brooklyn",
    neighborhood: "Williamsburg",
    cuisine: "Rooftop Bar",
    spend: "$$",
    hook: "Skyline cocktail finish.",
    summary:
      "The sleek rooftop option for a dressed-up Williamsburg night. Better if you want views without the full tourist-deck feel.",
    tip: "Use it as the cleaner pre-dinner or post-dinner drink if Laser Wolf is the real anchor.",
    address: "80 Wythe Ave 6th Floor, Brooklyn, NY 11249",
    portalUrl: "https://www.barblondeau.com/",
    sourceUrl: "https://www.barblondeau.com/",
    sourceLabel: "Official site",
    booking: {
      kind: "rolling-days",
      daysBefore: 28,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: true,
    },
    mapX: 77,
    mapY: 24,
  },
  {
    id: "red-room-bar",
    rank: 20,
    tier: "flex",
    name: "Red Room Bar",
    type: "bar",
    region: "manhattan",
    neighborhood: "Financial District",
    cuisine: "Cocktail Bar",
    spend: "$$",
    hook: "Most fashion-adjacent bar on the board.",
    summary:
      "A sharp fit for the shopping-and-style side of the trip. The room is elegant, the cocktails are good, and the location works after a Lower Manhattan day.",
    tip: "Works best as a polished drink stop rather than your only bar of the night.",
    address: "One Wall St, New York, NY 10005",
    portalUrl: "https://www.theredroombar.com/",
    sourceUrl: "https://blog.resy.com/2025/03/maison-passerelle-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 28,
      time: "10:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 43,
    mapY: 61,
  },
  {
    id: "maison-premiere",
    rank: 21,
    tier: "flex",
    name: "Maison Premiere",
    type: "bar",
    region: "brooklyn",
    neighborhood: "Williamsburg",
    cuisine: "Oyster + Cocktail Bar",
    spend: "$$$",
    hook: "Classic Williamsburg absinthe-and-oysters move.",
    summary:
      "An old Williamsburg icon that still works if you want a slightly more romantic, slower cocktail lane than the louder rooftop options.",
    tip: "April is great here because the garden usually comes back into play.",
    address: "298 Bedford Ave, Brooklyn, NY 11249",
    portalUrl: "https://maisonpremiere.com/menus/",
    sourceUrl: "https://maisonpremiere.com/menus/",
    sourceLabel: "Official site",
    booking: {
      kind: "calendar-month",
      monthsBefore: 1,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: true,
    },
    mapX: 75,
    mapY: 30,
  },
  {
    id: "eavesdrop",
    rank: 22,
    tier: "flex",
    name: "Eavesdrop",
    type: "bar",
    region: "brooklyn",
    neighborhood: "Greenpoint",
    cuisine: "Listening Bar",
    spend: "$$",
    hook: "Music-first late-night move.",
    summary:
      "A real listening bar with a genuine point of view. Best when you want cocktails plus atmosphere after a Williamsburg dinner.",
    tip: "After midnight it becomes walk-in only, which makes it useful even if reservations disappear.",
    address: "674 Manhattan Ave, Brooklyn, NY 11222",
    portalUrl: "https://www.eavesdrop.nyc/",
    sourceUrl: "https://blog.resy.com/2022/07/how-to-get-into-eavesdrop-new-york/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 14,
      time: "12:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 79,
    mapY: 19,
  },
  {
    id: "kisa",
    rank: 23,
    tier: "flex",
    name: "Kisa",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "Lower East Side",
    cuisine: "Korean",
    spend: "$$",
    hook: "Tighter menu, very current room.",
    summary:
      "A good move when you want something harder to get than it looks, but not in a way that forces the whole night to revolve around it.",
    tip: "Two-thirds of the seats are still saved for walk-ins, so this is a strong backup if LES is already the zone.",
    address: "Kisa, Lower East Side, New York, NY",
    portalUrl: "https://resy.com/cities/new-york-ny/venues/kisa",
    sourceUrl: "https://blog.resy.com/the-one-who-keeps-the-book/toughest-restaurant-reservations-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 15,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 42,
    mapY: 43,
  },
  {
    id: "overstory",
    rank: 24,
    tier: "flex",
    name: "Overstory",
    type: "bar",
    region: "manhattan",
    neighborhood: "Financial District",
    cuisine: "Skyline Cocktail Bar",
    spend: "$$$",
    hook: "Big-view FiDi flex.",
    summary:
      "If you want one panoramic cocktail move downtown, this is the one. Better as a pre-booked statement drink than a spontaneous bar hop.",
    tip: "The venue accepts walk-ins, but reservations are the cleaner route if sunset matters.",
    address: "70 Pine St, New York, NY 10005",
    portalUrl: "https://www.overstory-nyc.com/",
    sourceUrl: "https://www.autores.io/restaurant/overstory",
    sourceLabel: "AutoRes estimate",
    booking: {
      kind: "rolling-days",
      daysBefore: 14,
      time: "10:00",
      timeZoneOffset: "-04:00",
      estimated: true,
    },
    mapX: 45,
    mapY: 59,
  },
  {
    id: "bistrot-ha",
    rank: 25,
    tier: "flex",
    name: "Bistrot Ha",
    type: "restaurant",
    region: "manhattan",
    neighborhood: "Lower East Side",
    cuisine: "French-Vietnamese",
    spend: "$$$",
    hook: "New-school LES buzz pick.",
    summary:
      "One of the more current downtown reservations on the page. Worth it if you want something newer and less obvious than the usual Italian targets.",
    tip: "Because the room is still small, this one rewards being aggressive on both the drop and the early walk-in.",
    address: "137 Eldridge St, New York, NY 10002",
    portalUrl: "https://resy.com/cities/new-york-ny/venues/bistrot-ha",
    sourceUrl: "https://blog.resy.com/the-one-who-keeps-the-book/toughest-restaurant-reservations-nyc/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 6,
      time: "00:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 41,
    mapY: 39,
  },
  {
    id: "sailor",
    rank: 26,
    tier: "flex",
    name: "Sailor",
    type: "restaurant",
    region: "brooklyn",
    neighborhood: "Fort Greene",
    cuisine: "Bistro",
    spend: "$$",
    hook: "Fort Greene detour if you want something softer.",
    summary:
      "Less showy than Williamsburg's big-ticket places, but very good if you want a calmer Brooklyn night with strong food and wine.",
    tip: "The recently expanded bar improves your odds if you miss the main dinner reservations.",
    address: "228 Dekalb Ave, Brooklyn, NY 11205",
    portalUrl: "https://www.sailor.nyc/",
    sourceUrl: "https://blog.resy.com/2023/10/how-to-get-into-sailor-in-fort-greene/",
    sourceLabel: "Resy",
    booking: {
      kind: "rolling-days",
      daysBefore: 14,
      time: "11:00",
      timeZoneOffset: "-04:00",
      estimated: false,
    },
    mapX: 64,
    mapY: 50,
  },
];

const arrivalCountdownEl = document.getElementById("arrival-countdown");
const firstDropDayEl = document.getElementById("first-drop-day");
const firstDropSummaryEl = document.getElementById("first-drop-summary");
const firstDropListEl = document.getElementById("first-drop-list");
const tierStripEl = document.getElementById("tier-strip");
const venueGridEl = document.getElementById("venue-grid");
const mapMarkersEl = document.getElementById("map-markers");
const mapSelectionEl = document.getElementById("map-selection");
const nearbyListEl = document.getElementById("nearby-list");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let activeFilter = "all";
let selectedVenueId = venues[0].id;

function formatDate(date, opts) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    ...opts,
  }).format(date);
}

function formatLongDate(date) {
  return formatDate(date, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatShortDateTime(date) {
  return formatDate(date, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(date) {
  return formatDate(date, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMonthDay(date) {
  return formatDate(date, {
    month: "short",
    day: "numeric",
  });
}

function daysUntil(from, to) {
  return Math.ceil((to.getTime() - from.getTime()) / 86400000);
}

function breakdown(ms) {
  if (ms <= 0) {
    return "00d 00h 00m 00s";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(
    minutes,
  ).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function addUtcDays(isoDate, delta) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return toIsoDate(date);
}

function subtractCalendarMonths(isoDate, months) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCMonth(date.getUTCMonth() - months);
  return toIsoDate(date);
}

function toIsoDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildReleaseDate(visitIso, booking) {
  let releaseDate = visitIso;

  if (booking.kind === "rolling-days") {
    releaseDate = addUtcDays(visitIso, booking.daysBefore * -1);
  } else if (booking.kind === "calendar-month") {
    releaseDate = subtractCalendarMonths(visitIso, booking.monthsBefore);
  }

  return new Date(`${releaseDate}T${booking.time}:00${booking.timeZoneOffset}`);
}

function buildSchedule(venue) {
  return tripDates.map((tripDate) => {
    const releaseAt = buildReleaseDate(tripDate.iso, venue.booking);
    return {
      tripLabel: tripDate.label,
      tripIso: tripDate.iso,
      releaseAt,
    };
  });
}

function getVenueState(venue, now) {
  const schedule = buildSchedule(venue);
  const openDates = schedule.filter((item) => now >= item.releaseAt);
  const nextRelease = schedule.find((item) => now < item.releaseAt) || null;

  let status = "Not open";
  let badgeClass = "";

  if (!nextRelease) {
    status = "Open now";
    badgeClass = "is-open";
  } else if (openDates.length > 0) {
    status = `${openDates.length}/5 dates live`;
    badgeClass = "is-open";
  }

  if (venue.booking.estimated) {
    badgeClass = "is-estimated";
    if (!nextRelease) {
      status = "Live / estimated";
    } else if (openDates.length > 0) {
      status = `${openDates.length}/5 live est.`;
    } else {
      status = "Estimated drop";
    }
  }

  return {
    schedule,
    openDates,
    nextRelease,
    status,
    badgeClass,
  };
}

function buildDirectionsUrl(destination) {
  const params = new URLSearchParams({
    api: "1",
    origin: hotel.address,
    destination,
    travelmode: "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getPortalLabel(url) {
  const host = new URL(url).hostname;

  if (host.includes("resy")) {
    return "Book via Resy";
  }
  if (host.includes("opentable")) {
    return "Book via OpenTable";
  }
  return "Open reservation page";
}

function isVisible(venue) {
  if (activeFilter === "all") {
    return true;
  }

  if (activeFilter === "restaurant" || activeFilter === "bar") {
    return venue.type === activeFilter;
  }

  if (activeFilter === "manhattan" || activeFilter === "brooklyn") {
    return venue.region === activeFilter;
  }

  return venue.tier === activeFilter;
}

function renderTierStrip() {
  tierStripEl.innerHTML = ["must", "strong", "flex"]
    .map((tier) => {
      const tierVenues = venues.filter((venue) => venue.tier === tier);
      const topNames = tierVenues.slice(0, 5).map((venue) => venue.name);
      return `
        <article class="tier-card ${tier}">
          <span class="tier-kicker">${tierMeta[tier].label}</span>
          <span class="tier-count">${tierVenues.length} spots</span>
          <p>${tierMeta[tier].note}</p>
          <div class="tier-names">
            ${topNames.map((name) => `<span class="name-chip">${name}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTopline() {
  const now = new Date();
  const arrival = new Date("2026-04-15T15:00:00-04:00");
  arrivalCountdownEl.textContent = `${daysUntil(now, arrival)} days until check-in`;

  const nextDrops = venues
    .map((venue) => {
      const state = getVenueState(venue, now);
      if (!state.nextRelease) {
        return null;
      }

      return {
        venue,
        releaseAt: state.nextRelease.releaseAt,
        tripLabel: state.nextRelease.tripLabel,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.releaseAt.getTime() - right.releaseAt.getTime());

  if (!nextDrops.length) {
    firstDropDayEl.textContent = "Everything is live";
    firstDropSummaryEl.textContent = "All reservation windows on the board are already open.";
    firstDropListEl.innerHTML = "";
    return;
  }

  firstDropDayEl.textContent = formatLongDate(nextDrops[0].releaseAt);
  firstDropSummaryEl.textContent = `${formatTime(
    nextDrops[0].releaseAt,
  )} ET is the first real alarm. These are the earliest drops still ahead of you.`;

  firstDropListEl.innerHTML = nextDrops
    .slice(0, 4)
    .map((item) => {
      return `
        <div class="first-drop-item">
          <strong>#${item.venue.rank} ${item.venue.name}</strong>
          <small>${item.venue.neighborhood} • ${item.tripLabel} opens ${formatShortDateTime(
            item.releaseAt,
          )}</small>
        </div>
      `;
    })
    .join("");
}

function buildScheduleChips(schedule, now, estimated) {
  return schedule
    .map((entry) => {
      const live = now >= entry.releaseAt;
      return `
        <div class="schedule-chip ${live ? "is-live" : ""}">
          ${entry.tripLabel}
          <span>${formatMonthDay(entry.releaseAt)} • ${formatTime(entry.releaseAt)}${
            estimated ? " est." : ""
          }</span>
        </div>
      `;
    })
    .join("");
}

function renderVenues() {
  const now = new Date();
  const visibleVenues = venues.filter(isVisible);

  venueGridEl.innerHTML = visibleVenues
    .map((venue) => {
      const state = getVenueState(venue, now);
      const countdownMarkup = state.nextRelease
        ? `
          <div class="booking-panel">
            <div class="countdown-label">${venue.booking.estimated ? "Estimated next drop" : "Next drop"}</div>
            <span class="countdown-value" data-countdown-to="${state.nextRelease.releaseAt.toISOString()}">
              ${breakdown(state.nextRelease.releaseAt.getTime() - now.getTime())}
            </span>
            <div class="countdown-subline">
              ${state.nextRelease.tripLabel} opens ${formatShortDateTime(state.nextRelease.releaseAt)}
            </div>
          </div>
        `
        : `
          <div class="booking-panel">
            <div class="countdown-label">Trip status</div>
            <span class="countdown-value">April 15-19 is live</span>
            <div class="countdown-subline">You can start hunting actual times now.</div>
          </div>
        `;

      return `
        <article class="venue-card" id="venue-${venue.id}">
          <div class="venue-topline">
            <div>
              <div class="rank-block">
                <span class="rank-number">#${venue.rank}</span>
                <span class="tier-pill ${venue.tier}">${tierMeta[venue.tier].label}</span>
              </div>
              <h3 class="venue-name">${venue.name}</h3>
              <div class="venue-meta">${venue.neighborhood} • ${venue.cuisine} • ${venue.spend}</div>
            </div>
            <span class="status-badge ${state.badgeClass}">${state.status}</span>
          </div>

          <div class="tag-row">
            <span class="tag">${venue.type === "restaurant" ? "Restaurant" : "Bar"}</span>
            <span class="tag">${venue.hook}</span>
          </div>

          <p class="venue-summary">${venue.summary}</p>

          ${countdownMarkup}

          <div class="schedule-panel">
            <div class="schedule-caption">Release schedule for your trip dates</div>
            <div class="schedule-grid">${buildScheduleChips(state.schedule, now, venue.booking.estimated)}</div>
          </div>

          <div class="source-line"><strong>Tip:</strong> ${venue.tip}</div>
          <div class="source-line">
            <strong>Timing source:</strong> ${venue.sourceLabel}${
              venue.booking.estimated ? " • estimated" : ""
            }
          </div>

          <div class="venue-actions">
            <a class="action-link primary" href="${venue.portalUrl}" target="_blank" rel="noreferrer">
              ${getPortalLabel(venue.portalUrl)}
            </a>
            <a
              class="action-link secondary"
              href="${buildDirectionsUrl(venue.address)}"
              target="_blank"
              rel="noreferrer"
            >
              Directions from hotel
            </a>
            <a class="action-link ghost" href="${venue.sourceUrl}" target="_blank" rel="noreferrer">
              View timing source
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMapMarkers() {
  mapMarkersEl.innerHTML = venues
    .map((venue) => {
      const hidden = !isVisible(venue);
      return `
        <button
          class="map-marker ${venue.type} ${venue.tier} ${selectedVenueId === venue.id ? "is-selected" : ""} ${
            hidden ? "is-dim" : ""
          }"
          style="left:${venue.mapX}%; top:${venue.mapY}%;"
          type="button"
          data-marker="${venue.id}"
          aria-label="View ${venue.name}"
        >
          ${venue.rank}
        </button>
      `;
    })
    .join("");

  mapMarkersEl.insertAdjacentHTML(
    "beforeend",
    `
      <button
        class="map-marker hotel"
        style="left:${hotel.mapX}%; top:${hotel.mapY}%;"
        type="button"
        aria-label="${hotel.name}"
      ></button>
    `,
  );

  mapMarkersEl.querySelectorAll("[data-marker]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedVenueId = button.dataset.marker;
      renderMapMarkers();
      renderMapSelection();
    });
  });
}

function renderMapSelection() {
  const venue = venues.find((item) => item.id === selectedVenueId) || venues[0];
  const state = getVenueState(venue, new Date());
  const statusLine = state.nextRelease
    ? `${venue.booking.estimated ? "Estimated drop" : "Next drop"} ${formatShortDateTime(
        state.nextRelease.releaseAt,
      )}`
    : "All trip dates are already bookable";

  mapSelectionEl.innerHTML = `
    <div class="selection-rank">
      <span class="rank-chip">#${venue.rank}</span>
      <span>${tierMeta[venue.tier].label}</span>
    </div>
    <h3>${venue.name}</h3>
    <div class="selection-meta">${venue.neighborhood} • ${venue.cuisine} • ${venue.spend}</div>
    <p class="selection-copy">${venue.summary}</p>
    <p class="detail-sub"><strong>Why it made the board:</strong> ${venue.hook}</p>
    <p class="detail-sub"><strong>Booking:</strong> ${statusLine}</p>
    <div class="selection-actions">
      <a class="action-link primary" href="${venue.portalUrl}" target="_blank" rel="noreferrer">
        ${getPortalLabel(venue.portalUrl)}
      </a>
      <a class="action-link secondary" href="${buildDirectionsUrl(venue.address)}" target="_blank" rel="noreferrer">
        Route from hotel
      </a>
      <a class="action-link ghost" href="#venue-${venue.id}">
        Jump to card
      </a>
    </div>
  `;
}

function renderNearby() {
  const nearby = [...venues]
    .filter((venue) => venue.region === "manhattan")
    .sort((left, right) => {
      const leftDistance = Math.hypot(left.mapX - hotel.mapX, left.mapY - hotel.mapY);
      const rightDistance = Math.hypot(right.mapX - hotel.mapX, right.mapY - hotel.mapY);
      return leftDistance - rightDistance;
    })
    .slice(0, 6);

  nearbyListEl.innerHTML = nearby
    .map((venue) => {
      return `
        <a class="nearby-item" href="#venue-${venue.id}">
          <span class="dot ${venue.type}"></span>
          #${venue.rank} ${venue.name}
        </a>
      `;
    })
    .join("");
}

function setFilter(nextFilter) {
  activeFilter = nextFilter;
  const firstVisibleVenue = venues.find(isVisible);
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);
  if (firstVisibleVenue && (!selectedVenue || !isVisible(selectedVenue))) {
    selectedVenueId = firstVisibleVenue.id;
  }
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === nextFilter);
  });
  renderVenues();
  renderMapMarkers();
  renderMapSelection();
}

function tickCountdowns() {
  const now = new Date();
  let shouldRerender = false;

  document.querySelectorAll("[data-countdown-to]").forEach((element) => {
    const target = new Date(element.getAttribute("data-countdown-to"));
    if (target.getTime() <= now.getTime()) {
      shouldRerender = true;
    }
    element.textContent = breakdown(target.getTime() - now.getTime());
  });

  arrivalCountdownEl.textContent = `${daysUntil(
    now,
    new Date("2026-04-15T15:00:00-04:00"),
  )} days until check-in`;

  if (shouldRerender) {
    renderTopline();
    renderVenues();
    renderMapMarkers();
    renderMapSelection();
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter);
  });
});

renderTierStrip();
renderTopline();
renderVenues();
renderMapMarkers();
renderMapSelection();
renderNearby();
tickCountdowns();
setInterval(tickCountdowns, 1000);
