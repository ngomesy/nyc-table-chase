(() => {
const {
  hotel: hotelData,
  tripDates,
  neighborhoodCenters,
  restaurants,
  bars,
  guinnessSpots,
  mapsSearchUrl,
} = window.tripPlannerData;

const restaurantGridEl = document.getElementById("restaurant-grid");
const barGridEl = document.getElementById("bar-grid");
const cocktailGridEl = document.getElementById("cocktail-grid");
const guinnessGridEl = document.getElementById("guinness-grid");
const restaurantCuisineEl = document.getElementById("restaurant-cuisine-filter");
const restaurantCountEl = document.getElementById("restaurant-count");
const barCountEl = document.getElementById("bar-count");
const cocktailCountEl = document.getElementById("cocktail-count");
const guinnessCountEl = document.getElementById("guinness-count");
const mapCountEl = document.getElementById("map-count");
const mapDetailEl = document.getElementById("map-detail");
const arrivalCountdownEl = document.getElementById("arrival-countdown");
const alarmListEl = document.getElementById("alarm-list");
const trackerFormEl = document.getElementById("reservation-tracker-form");
const trackerVenueEl = document.getElementById("tracker-venue");
const trackerDateEl = document.getElementById("tracker-date");
const trackerTimeEl = document.getElementById("tracker-time");
const trackerPartySizeEl = document.getElementById("tracker-party-size");
const trackerNotesEl = document.getElementById("tracker-notes");
const trackerVenueResultsEl = document.getElementById("tracker-venue-results");
const trackerCountEl = document.getElementById("tracker-count");
const trackerCopyLinkEl = document.getElementById("tracker-copy-link");
const trackerClearAllEl = document.getElementById("tracker-clear-all");
const trackerSyncStatusEl = document.getElementById("tracker-sync-status");
const trackerSummaryTitleEl = document.getElementById("tracker-summary-title");
const trackerSummaryCopyEl = document.getElementById("tracker-summary-copy");
const trackerConflictsEl = document.getElementById("tracker-conflicts");
const trackerDayBoardEl = document.getElementById("tracker-day-board");
const restaurantPanelEl = document.getElementById("restaurant-panel");
const barPanelEl = document.getElementById("bar-panel");
const cocktailPanelEl = document.getElementById("cocktail-panel");
const guinnessPanelEl = document.getElementById("guinness-panel");

const boardViewButtons = [...document.querySelectorAll("[data-board-view]")];
const restaurantFilterButtons = [...document.querySelectorAll("[data-restaurant-filter]")];
const barFilterButtons = [...document.querySelectorAll("[data-bar-filter]")];
const cocktailFilterButtons = [...document.querySelectorAll("[data-cocktail-filter]")];
const mapFilterButtons = [...document.querySelectorAll("[data-map-filter]")];
const quickViewLinks = [...document.querySelectorAll("[data-open-view]")];

const restaurantState = {
  filter: "all",
  cuisine: "all",
};

const barState = {
  filter: "all",
};

const cocktailState = {
  filter: "all",
};

const mapState = {
  filter: "all",
  selectedId: null,
};

const boardState = {
  view: "restaurants",
};

const alarmWaveLimit = 16;
const trackerStorageKey = "nyc-table-chase-bookings-v1";
const trackerUrlParam = "bookings";
const trackerConflictWindowMs = 2 * 60 * 60 * 1000;
const initialTrackedReservations = loadTrackedReservations();

const trackerState = {
  entries: initialTrackedReservations.entries,
  source: initialTrackedReservations.source,
};

const trackableVenues = [...restaurants, ...bars];
const cocktailSpots = bars.filter((item) => ["cocktail", "rooftop", "listening"].includes(item.style));

const priorityMeta = {
  anchor: { label: "Anchor pick", className: "anchor" },
  "worth-booking": { label: "Worth booking", className: "worth-booking" },
  "local-play": { label: "Local play", className: "local-play" },
  book: { label: "Reservation bar", className: "book" },
  local: { label: "Local bar", className: "local" },
  dive: { label: "Dive bar", className: "dive" },
};

let map;
let tileLayer;
let venueLayer;
let hotelMarker;
let lastMapFilter = null;

function loadTrackedReservations() {
  const urlEntries = loadTrackedReservationsFromUrl();
  if (urlEntries.length) {
    return { entries: urlEntries, source: "link" };
  }

  try {
    const stored = window.localStorage.getItem(trackerStorageKey);
    return { entries: stored ? JSON.parse(stored) : [], source: "device" };
  } catch {
    return { entries: [], source: "device" };
  }
}

function saveTrackedReservations() {
  try {
    window.localStorage.setItem(trackerStorageKey, JSON.stringify(trackerState.entries));
  } catch {}

  syncTrackedReservationsToUrl();
}

function loadTrackedReservationsFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(trackerUrlParam);
    if (!encoded) {
      return [];
    }

    const json = decodeURIComponent(window.atob(encoded));
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildTrackedReservationsUrl() {
  const url = new URL(window.location.href);

  if (!trackerState.entries.length) {
    url.searchParams.delete(trackerUrlParam);
    return url.toString();
  }

  const encoded = window.btoa(encodeURIComponent(JSON.stringify(trackerState.entries)));
  url.searchParams.set(trackerUrlParam, encoded);
  return url.toString();
}

function syncTrackedReservationsToUrl() {
  const nextUrl = buildTrackedReservationsUrl();
  window.history.replaceState({}, "", nextUrl);
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    ...options,
  }).format(date);
}

function formatDateTime(date) {
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

function formatTrackerTime(entry) {
  return formatTime(new Date(`${entry.date}T${entry.time}:00-04:00`));
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
  return isoDateFromDate(date);
}

function subtractCalendarMonths(isoDate, months) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCMonth(date.getUTCMonth() - months);
  return isoDateFromDate(date);
}

function isoDateFromDate(date) {
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

  return new Date(`${releaseDate}T${booking.time || "00:00"}:00${booking.timeZoneOffset || "-04:00"}`);
}

function buildSchedule(item) {
  if (!item.booking || (item.booking.kind !== "rolling-days" && item.booking.kind !== "calendar-month")) {
    return [];
  }

  return tripDates.map((tripDate) => ({
    tripLabel: tripDate.label,
    tripIso: tripDate.iso,
    releaseAt: buildReleaseDate(tripDate.iso, item.booking),
  }));
}

function getBookingState(item, now) {
  if (!item.booking) {
    return {
      mode: "unknown",
      label: "Check live portal",
      note: "Use the venue page or Maps link for the latest availability.",
      schedule: [],
      nextRelease: null,
      openCount: 0,
      statusClass: "",
    };
  }

  if (item.booking.kind === "portal") {
    return {
      mode: "portal",
      label: "Portal only",
      note: item.booking.note,
      schedule: [],
      nextRelease: null,
      openCount: 0,
      statusClass: "is-portal",
    };
  }

  if (item.booking.kind === "walk-in") {
    return {
      mode: "walk-in",
      label: "Walk-in only",
      note: item.booking.note,
      schedule: [],
      nextRelease: null,
      openCount: 0,
      statusClass: "is-walk-in",
    };
  }

  const schedule = buildSchedule(item);
  const openCount = schedule.filter((entry) => now >= entry.releaseAt).length;
  const nextRelease = schedule.find((entry) => now < entry.releaseAt) || null;
  const hasExactTime = item.booking.timeKnown !== false;

  if (!nextRelease) {
    return {
      mode: hasExactTime ? "live" : "live-date-only",
      label: hasExactTime ? (item.booking.estimated ? "Live / estimated" : "Open now") : "Date window open",
      note: hasExactTime
        ? "All April 15-19 slots are now inside the published booking window."
        : "The booking date window is open, but the venue does not publish an exact release time.",
      schedule,
      nextRelease: null,
      openCount,
      statusClass: item.booking.estimated || !hasExactTime ? "is-estimated" : "is-live",
    };
  }

  if (!hasExactTime) {
    return {
      mode: "date-countdown",
      label: "Next booking date",
      note: `${nextRelease.tripLabel} date unlocks ${formatDate(nextRelease.releaseAt, {
        month: "short",
        day: "numeric",
      })}; exact time not published.`,
      schedule,
      nextRelease,
      openCount,
      statusClass: "is-estimated",
    };
  }

  return {
    mode: "countdown",
    label: item.booking.estimated ? "Estimated next drop" : "Next drop",
    note: `${nextRelease.tripLabel} opens ${formatDateTime(nextRelease.releaseAt)}`,
    schedule,
    nextRelease,
    openCount,
    statusClass: item.booking.estimated ? "is-estimated" : "",
  };
}

function getPrimaryLink(item) {
  if (item.bookingUrl) {
    if (item.booking.kind === "walk-in") {
      return { href: item.bookingUrl, label: "Venue page" };
    }

    return { href: item.bookingUrl, label: getBookingLabel(item.bookingUrl) };
  }

  if (item.websiteUrl) {
    return { href: item.websiteUrl, label: "Venue page" };
  }

  return { href: mapsSearchUrl(`${item.name} ${item.address}`), label: "Open on Maps" };
}

function getBookingLabel(url) {
  const host = new URL(url).hostname;

  if (host.includes("resy")) {
    return "Book via Resy";
  }
  if (host.includes("opentable")) {
    return "Book via OpenTable";
  }
  if (host.includes("google")) {
    return "Find booking link";
  }
  return "Open reservation page";
}

function buildCuisineOptions() {
  const cuisines = [...new Set(restaurants.map((item) => item.cuisine))].sort();

  restaurantCuisineEl.innerHTML = `
    <option value="all">All cuisines</option>
    ${cuisines.map((cuisine) => `<option value="${cuisine}">${cuisine}</option>`).join("")}
  `;
}

function matchesRestaurantFilters(item) {
  const filterMatch =
    restaurantState.filter === "all" ||
    item.priority === restaurantState.filter ||
    item.region === restaurantState.filter;
  const cuisineMatch =
    restaurantState.cuisine === "all" || item.cuisine === restaurantState.cuisine;

  return filterMatch && cuisineMatch;
}

function matchesBarFilters(item) {
  if (barState.filter === "all") {
    return true;
  }
  if (barState.filter === "brooklyn" || barState.filter === "manhattan") {
    return item.region === barState.filter;
  }
  if (barState.filter === "walk-in") {
    return item.booking.kind === "walk-in";
  }
  return item.style === barState.filter || item.priority === barState.filter;
}

function matchesCocktailFilters(item) {
  if (cocktailState.filter === "all") {
    return true;
  }
  if (cocktailState.filter === "brooklyn" || cocktailState.filter === "manhattan") {
    return item.region === cocktailState.filter;
  }
  if (cocktailState.filter === "walk-in") {
    return item.booking.kind === "walk-in";
  }
  return item.priority === cocktailState.filter;
}

function buildMapItems() {
  const allItems = [...restaurants.map((item) => ({ ...item, type: "restaurant" })), ...bars.map((item) => ({ ...item, type: "bar" }))];

  if (mapState.filter === "all") {
    return allItems;
  }
  if (mapState.filter === "restaurants") {
    return allItems.filter((item) => item.type === "restaurant");
  }
  if (mapState.filter === "bars") {
    return allItems.filter((item) => item.type === "bar");
  }
  if (mapState.filter === "dives") {
    return allItems.filter((item) => item.type === "bar" && item.style === "dive");
  }

  return allItems;
}

function hashId(id) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceInMiles(fromLat, fromLng, toLat, toLng) {
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDelta / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCoords(item) {
  const center = neighborhoodCenters[item.neighborhoodKey] || neighborhoodCenters.soho;
  const hash = hashId(item.id);
  const angle = ((hash * 37) % 360) * (Math.PI / 180);
  const radius = 0.0011 + ((hash % 6) * 0.00022);
  return [center.lat + Math.sin(angle) * radius, center.lng + Math.cos(angle) * radius];
}

function getDistanceFromHotel(item) {
  const [lat, lng] = getCoords(item);
  return distanceInMiles(hotelData.lat, hotelData.lng, lat, lng);
}

function formatDistance(distance) {
  return `Approx. ${distance.toFixed(1)} mi from hotel`;
}

function getNeighborhoodDistance(neighborhoodKey) {
  const center = neighborhoodCenters[neighborhoodKey] || neighborhoodCenters.soho;
  return distanceInMiles(hotelData.lat, hotelData.lng, center.lat, center.lng);
}

function setTrackerDefaults() {
  trackerDateEl.value = trackerDateEl.value || tripDates[0].iso;
  trackerTimeEl.value = trackerTimeEl.value || "19:00";
  trackerPartySizeEl.value = trackerPartySizeEl.value || "2";
}

function findTrackableVenueByName(name) {
  const target = name.trim().toLowerCase();
  return trackableVenues.find((item) => item.name.toLowerCase() === target) || null;
}

function getTrackableVenueById(id) {
  return trackableVenues.find((item) => item.id === id) || null;
}

function getVenueSearchMatches(query) {
  const target = query.trim().toLowerCase();
  if (!target) {
    return [];
  }

  const startsWith = [];
  const contains = [];

  trackableVenues.forEach((item) => {
    const haystack = `${item.name} ${item.neighborhood} ${item.cuisine || item.style || ""}`.toLowerCase();
    if (!haystack.includes(target)) {
      return;
    }

    if (item.name.toLowerCase().startsWith(target)) {
      startsWith.push(item);
      return;
    }

    contains.push(item);
  });

  return [...startsWith, ...contains].slice(0, 8);
}

function setTrackerVenueSelection(item) {
  trackerVenueEl.value = item.name;
  trackerVenueEl.dataset.selectedVenueId = item.id;
  trackerVenueEl.setCustomValidity("");
  hideTrackerVenueResults();
}

function hideTrackerVenueResults() {
  trackerVenueResultsEl.hidden = true;
  trackerVenueEl.setAttribute("aria-expanded", "false");
}

function renderTrackerVenueResults(query) {
  const matches = getVenueSearchMatches(query);

  if (!query.trim()) {
    hideTrackerVenueResults();
    return matches;
  }

  trackerVenueResultsEl.hidden = false;
  trackerVenueEl.setAttribute("aria-expanded", "true");
  trackerVenueResultsEl.innerHTML = matches.length
    ? matches
        .map(
          (item) => `
            <button class="tracker-venue-option" type="button" data-venue-id="${item.id}">
              <strong>${item.name}</strong>
              <span>${item.neighborhood} • ${item.type || (item.cuisine ? "Restaurant" : "Bar")}</span>
            </button>
          `,
        )
        .join("")
    : `<div class="tracker-venue-empty">No board venue matches that search yet. Use one of the names from the planner cards.</div>`;

  return matches;
}

function sortTrackedReservations(entries) {
  return entries
    .slice()
    .sort((a, b) => new Date(`${a.date}T${a.time}:00-04:00`) - new Date(`${b.date}T${b.time}:00-04:00`));
}

function getTrackedReservationConflicts(entries) {
  const conflictsById = new Map(entries.map((entry) => [entry.id, []]));
  const pairs = [];

  for (let index = 0; index < entries.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < entries.length; compareIndex += 1) {
      const first = entries[index];
      const second = entries[compareIndex];

      if (first.date !== second.date) {
        continue;
      }

      const firstDate = new Date(`${first.date}T${first.time}:00-04:00`);
      const secondDate = new Date(`${second.date}T${second.time}:00-04:00`);
      const difference = Math.abs(firstDate.getTime() - secondDate.getTime());

      if (difference >= trackerConflictWindowMs) {
        continue;
      }

      const kind = difference === 0 ? "exact" : "tight";
      const payload = { otherId: second.id, kind };
      const reversePayload = { otherId: first.id, kind };

      conflictsById.get(first.id).push(payload);
      conflictsById.get(second.id).push(reversePayload);
      pairs.push({ first, second, kind });
    }
  }

  return { conflictsById, pairs };
}

function renderTracker() {
  const entries = sortTrackedReservations(trackerState.entries);
  const { conflictsById, pairs } = getTrackedReservationConflicts(entries);
  const conflictEntryCount = entries.filter((entry) => conflictsById.get(entry.id).length > 0).length;

  trackerCountEl.textContent = `${entries.length} booking${entries.length === 1 ? "" : "s"} logged`;
  trackerSyncStatusEl.textContent =
    trackerState.source === "link"
      ? "Loaded from sync link"
      : entries.length
        ? "Device + link updated"
        : "Link ready";

  if (!entries.length) {
    trackerSummaryTitleEl.textContent = "Nothing booked yet";
    trackerSummaryCopyEl.textContent =
      "Add confirmed reservations here. The board will flag exact duplicates and same-day bookings that sit too close together.";
  } else if (!pairs.length) {
    trackerSummaryTitleEl.textContent = "Schedule looks clean";
    trackerSummaryCopyEl.textContent =
      "No same-day conflicts inside the two-hour watch window. Keep logging bookings here as they come in.";
  } else {
    trackerSummaryTitleEl.textContent = `${conflictEntryCount} booking${conflictEntryCount === 1 ? "" : "s"} need a look`;
    trackerSummaryCopyEl.textContent =
      "Conflict watch is flagging bookings on the same day that overlap exactly or land within two hours of each other.";
  }

  trackerConflictsEl.innerHTML = pairs.length
    ? pairs
        .map(
          ({ first, second, kind }) => `
            <div class="tracker-conflict">
              <strong>${kind === "exact" ? "Exact double-booking risk" : "Tight same-night overlap"}</strong>
              <span>${first.venue} at ${formatTrackerTime(first)} and ${second.venue} at ${formatTrackerTime(second)} on ${formatDate(
                new Date(`${first.date}T12:00:00-04:00`),
                { weekday: "short", month: "short", day: "numeric" },
              )}</span>
            </div>
          `,
        )
        .join("")
    : `<div class="tracker-empty">No conflicts flagged.</div>`;

  trackerDayBoardEl.innerHTML = tripDates
    .map((tripDate) => {
      const dayEntries = entries.filter((entry) => entry.date === tripDate.iso);
      const listMarkup = dayEntries.length
        ? `
          <div class="tracker-day-list">
            ${dayEntries
              .map((entry) => {
                const venueMatch = entry.venueId
                  ? getTrackableVenueById(entry.venueId)
                  : findTrackableVenueByName(entry.venue);
                const hasConflict = conflictsById.get(entry.id).length > 0;

                return `
                  <article class="tracker-booking ${hasConflict ? "is-conflict" : ""}">
                    <div class="tracker-booking-head">
                      <div>
                        <strong>${entry.venue}</strong>
                        <div class="tracker-booking-meta">${formatTrackerTime(entry)} • Party of ${entry.partySize}</div>
                      </div>
                      <span class="tracker-badge ${hasConflict ? "is-conflict" : ""}">
                        ${hasConflict ? "Conflict watch" : "Booked"}
                      </span>
                    </div>
                    ${
                      entry.notes
                        ? `<div class="tracker-booking-note">${entry.notes}</div>`
                        : ""
                    }
                    ${
                      venueMatch
                        ? `<div class="tracker-booking-note">Matches board card: <a href="#venue-${venueMatch.id}">${venueMatch.name}</a></div>`
                        : ""
                    }
                    <button class="tracker-remove" type="button" data-remove-booking="${entry.id}">Remove</button>
                  </article>
                `;
              })
              .join("")}
          </div>
        `
        : `<div class="tracker-empty">No bookings logged for this day.</div>`;

      return `
        <section class="tracker-day">
          <div class="tracker-day-header">
            <div>
              <p class="eyebrow">Trip day</p>
              <div class="tracker-day-label">${tripDate.label}</div>
            </div>
            <div class="tracker-day-count">${dayEntries.length} booking${dayEntries.length === 1 ? "" : "s"}</div>
          </div>
          ${listMarkup}
        </section>
      `;
    })
    .join("");
}

function createMapIcon(item, selected) {
  return L.divIcon({
    className: "map-marker-shell",
    html: `<span class="map-pin ${item.type} ${item.style || ""} ${selected ? "is-selected" : ""}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function renderAlarmBoard() {
  const now = new Date();
  const releaseGroups = [...restaurants, ...bars]
    .map((item) => {
      const state = getBookingState(item, now);
      if (state.mode !== "countdown" || !state.nextRelease) {
        return null;
      }
      return { item, nextRelease: state.nextRelease };
    })
    .filter(Boolean)
    .reduce((groups, entry) => {
      const key = entry.nextRelease.releaseAt.getTime();
      if (!groups.has(key)) {
        groups.set(key, { nextRelease: entry.nextRelease, items: [] });
      }
      groups.get(key).items.push(entry.item);
      return groups;
    }, new Map());

  const upcomingWaves = [...releaseGroups.values()]
    .sort((a, b) => a.nextRelease.releaseAt.getTime() - b.nextRelease.releaseAt.getTime())
    .slice(0, alarmWaveLimit);

  alarmListEl.innerHTML = upcomingWaves
    .map(
      ({ items, nextRelease }) => `
        <div class="alarm-item">
          <strong>${nextRelease.tripLabel} • ${formatDateTime(nextRelease.releaseAt)}</strong>
          <span>${items.length} venue${items.length === 1 ? "" : "s"} in this drop</span>
          <div class="alarm-venues">${items
            .map((item) => `<span class="alarm-venue">${item.name}</span>`)
            .join("")}</div>
        </div>
      `,
    )
    .join("");
}

function createCountdownMarkup(item, state, now) {
  if (state.mode === "countdown" || state.mode === "date-countdown") {
    return `
      <div class="booking-box">
        <div class="booking-label ${state.statusClass}">${state.label}</div>
        <div class="booking-value" data-countdown-to="${state.nextRelease.releaseAt.toISOString()}">
          ${breakdown(state.nextRelease.releaseAt.getTime() - now.getTime())}
        </div>
        <div class="booking-note">${state.note}</div>
      </div>
    `;
  }

  return `
    <div class="booking-box">
      <div class="booking-label ${state.statusClass}">${state.label}</div>
      <div class="booking-note">${state.note}</div>
    </div>
  `;
}

function getBarTypeLabel(item) {
  if (item.style === "dive") {
    return "Dive";
  }
  if (item.style === "cocktail") {
    return "Cocktail";
  }
  if (item.style === "rooftop") {
    return "Rooftop";
  }
  if (item.style === "listening") {
    return "Listening";
  }
  return item.style;
}

function renderBarCardMarkup(item, now) {
  const state = getBookingState(item, now);
  const primaryLink = getPrimaryLink(item);

  return `
    <article class="venue-card bar-card" id="venue-${item.id}">
      <div class="venue-header">
        <div>
          <div class="priority-pill ${priorityMeta[item.priority].className}">${priorityMeta[item.priority].label}</div>
          <h3>${item.name}</h3>
          <div class="venue-meta">${item.neighborhood} • ${getBarTypeLabel(item)} • ${item.spend}</div>
          <div class="distance-line">${formatDistance(getDistanceFromHotel(item))}</div>
        </div>
      </div>

      <p class="venue-summary">${item.summary}</p>
      <p class="venue-tip"><strong>Play:</strong> ${item.tip}</p>

      ${createCountdownMarkup(item, state, now)}

      <div class="venue-actions">
        <a class="action-link primary" href="${primaryLink.href}" target="_blank" rel="noreferrer">${primaryLink.label}</a>
        <a class="action-link secondary" href="${buildDirectionsUrl(item.address)}" target="_blank" rel="noreferrer">Directions from hotel</a>
        ${
          item.sourceUrl
            ? `<a class="action-link ghost" href="${item.sourceUrl}" target="_blank" rel="noreferrer">Timing source</a>`
            : item.websiteUrl
              ? `<a class="action-link ghost" href="${item.websiteUrl}" target="_blank" rel="noreferrer">Venue page</a>`
              : ""
        }
      </div>
    </article>
  `;
}

function renderRestaurants() {
  const visibleRestaurants = restaurants.filter(matchesRestaurantFilters);
  const now = new Date();

  restaurantCountEl.textContent = `${visibleRestaurants.length} restaurants`;

  restaurantGridEl.innerHTML = visibleRestaurants
    .map((item) => {
      const state = getBookingState(item, now);
      const primaryLink = getPrimaryLink(item);
      const schedule = buildSchedule(item);
      const scheduleMarkup =
        schedule.length > 0
          ? `
            <div class="schedule-row">
              ${schedule
                .map(
                  (entry) => `
                    <div class="schedule-chip ${now >= entry.releaseAt ? "is-live" : ""}">
                      ${entry.tripLabel}
                      <span>${
                        item.booking.timeKnown === false
                          ? `${formatDate(entry.releaseAt, { month: "short", day: "numeric" })} time TBA`
                          : `${formatDateTime(entry.releaseAt)}${item.booking.estimated ? " est." : ""}`
                      }</span>
                    </div>
                  `,
                )
                .join("")}
            </div>
          `
          : "";

      return `
        <article class="venue-card restaurant-card" id="venue-${item.id}">
          <div class="venue-header">
            <div>
              <div class="priority-pill ${priorityMeta[item.priority].className}">${priorityMeta[item.priority].label}</div>
              <h3>${item.name}</h3>
              <div class="venue-meta">${item.neighborhood} • ${item.cuisine} • ${item.spend}</div>
              <div class="distance-line">${formatDistance(getDistanceFromHotel(item))}</div>
            </div>
            <div class="spend-badge">
              <span>Est. for 2</span>
              <strong>${item.spendFor2}</strong>
            </div>
          </div>

          <p class="venue-summary">${item.summary}</p>
          <p class="venue-tip"><strong>Play:</strong> ${item.tip}</p>

          ${createCountdownMarkup(item, state, now)}
          ${scheduleMarkup}

          <div class="venue-actions">
            <a class="action-link primary" href="${primaryLink.href}" target="_blank" rel="noreferrer">${primaryLink.label}</a>
            <a class="action-link secondary" href="${buildDirectionsUrl(item.address)}" target="_blank" rel="noreferrer">Directions from hotel</a>
            ${
              item.sourceUrl
                ? `<a class="action-link ghost" href="${item.sourceUrl}" target="_blank" rel="noreferrer">Timing source</a>`
                : item.websiteUrl
                  ? `<a class="action-link ghost" href="${item.websiteUrl}" target="_blank" rel="noreferrer">Venue page</a>`
                  : ""
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderBars() {
  const visibleBars = bars.filter(matchesBarFilters);
  const now = new Date();

  barCountEl.textContent = `${visibleBars.length} bars`;

  barGridEl.innerHTML = visibleBars.map((item) => renderBarCardMarkup(item, now)).join("");
}

function renderCocktails() {
  const visibleCocktails = cocktailSpots.filter(matchesCocktailFilters);
  const now = new Date();

  cocktailCountEl.textContent = `${visibleCocktails.length} cocktail bars`;
  cocktailGridEl.innerHTML = visibleCocktails
    .map((item) => renderBarCardMarkup(item, now))
    .join("");
}

function renderGuinness() {
  guinnessCountEl.textContent = `${guinnessSpots.length} Guinness spots`;

  guinnessGridEl.innerHTML = guinnessSpots
    .map(
      (spot) => `
        <article class="venue-card guinness-card">
          <div class="venue-header">
            <div>
              <div class="priority-pill dive">#${spot.rank}</div>
              <h3>${spot.name}</h3>
              <div class="venue-meta">${spot.neighborhood} • ${spot.borough}</div>
              <div class="distance-line">${formatDistance(getNeighborhoodDistance(spot.neighborhoodKey))}</div>
            </div>
          </div>

          <p class="venue-summary">${spot.note}</p>

          <div class="booking-box">
            <div class="booking-label is-portal">Location</div>
            <div class="booking-note">${spot.location}</div>
          </div>

          <div class="venue-actions">
            <a
              class="action-link primary"
              href="${mapsSearchUrl(`${spot.name} ${spot.location} ${spot.borough} NYC`)}"
              target="_blank"
              rel="noreferrer"
            >
              Open on Maps
            </a>
          </div>
        </article>
      `,
    )
    .join("");
}

function buildDirectionsUrl(destination) {
  const params = new URLSearchParams({
    api: "1",
    origin: hotelData.address,
    destination,
    travelmode: "transit",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function ensureMapSelection(items) {
  if (!items.length) {
    mapState.selectedId = null;
    return;
  }

  const selected = items.find((item) => item.id === mapState.selectedId);
  if (!selected) {
    mapState.selectedId = items[0].id;
  }
}

function renderMapDetail(items) {
  const selected = items.find((item) => item.id === mapState.selectedId);

  if (!selected) {
    mapDetailEl.innerHTML = `<p class="empty-state">No venues match the current map filter.</p>`;
    return;
  }

  const state = getBookingState(selected, new Date());
  const primaryLink = getPrimaryLink(selected);
  const distance = formatDistance(getDistanceFromHotel(selected));
  const secondaryMeta =
    selected.type === "restaurant"
      ? `${selected.neighborhood} • ${selected.cuisine} • ${selected.spend} • Est. for 2 ${selected.spendFor2}`
      : `${selected.neighborhood} • ${selected.style.charAt(0).toUpperCase()}${selected.style.slice(1)} • ${selected.spend}`;

  mapDetailEl.innerHTML = `
    <div class="detail-kicker">${selected.type === "restaurant" ? "Restaurant" : "Bar"} • ${
      priorityMeta[selected.priority].label
    }</div>
    <h3>${selected.name}</h3>
    <div class="detail-meta">${secondaryMeta}</div>
    <div class="distance-line">${distance}</div>
    <p class="detail-copy">${selected.summary}</p>
    <p class="detail-copy"><strong>Move:</strong> ${selected.tip}</p>
    <div class="detail-status ${state.statusClass}">${state.label}</div>
    <p class="detail-note">${state.note}</p>
    <div class="venue-actions">
      <a class="action-link primary" href="${primaryLink.href}" target="_blank" rel="noreferrer">${primaryLink.label}</a>
      <a class="action-link secondary" href="${buildDirectionsUrl(selected.address)}" target="_blank" rel="noreferrer">Directions from hotel</a>
      <a class="action-link ghost" href="#venue-${selected.id}">Jump to card</a>
    </div>
  `;
}

function renderMap() {
  const items = buildMapItems();
  ensureMapSelection(items);

  mapCountEl.textContent = `${items.length} venues on map`;

  if (!map) {
    map = L.map("venue-map", {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([hotelData.lat, hotelData.lng], 13);

    tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    hotelMarker = L.marker([hotelData.lat, hotelData.lng], {
      icon: L.divIcon({
        className: "map-marker-shell",
        html: '<span class="map-pin hotel"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(map);
    hotelMarker.bindTooltip("The Broome Hotel", {
      permanent: false,
      direction: "top",
    });
  }

  if (venueLayer) {
    venueLayer.clearLayers();
  } else {
    venueLayer = L.layerGroup().addTo(map);
  }

  const bounds = [[hotelData.lat, hotelData.lng]];

  items.forEach((item) => {
    const [lat, lng] = getCoords(item);
    bounds.push([lat, lng]);

    const marker = L.marker([lat, lng], {
      icon: createMapIcon(item, item.id === mapState.selectedId),
    });

    marker.on("click", () => {
      mapState.selectedId = item.id;
      renderMap();
    });

    marker.bindTooltip(item.name, {
      direction: "top",
      offset: [0, -8],
    });

    marker.addTo(venueLayer);
  });

  if (bounds.length > 1 && lastMapFilter !== mapState.filter) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }

  lastMapFilter = mapState.filter;
  renderMapDetail(items);
}

function renderHeroStats() {
  const now = new Date();
  const arrival = new Date("2026-04-15T15:00:00-04:00");
  arrivalCountdownEl.textContent = `${daysUntil(now, arrival)} days until check-in`;
}

function tickCountdowns() {
  const now = new Date();
  let needsRerender = false;

  document.querySelectorAll("[data-countdown-to]").forEach((element) => {
    const target = new Date(element.getAttribute("data-countdown-to"));
    if (target.getTime() <= now.getTime()) {
      needsRerender = true;
    }
    element.textContent = breakdown(target.getTime() - now.getTime());
  });

  arrivalCountdownEl.textContent = `${daysUntil(
    now,
    new Date("2026-04-15T15:00:00-04:00"),
  )} days until check-in`;

  if (needsRerender) {
    renderAlarmBoard();
    renderRestaurants();
    renderBars();
    renderCocktails();
    renderMap();
  }
}

function setBoardView(nextView) {
  boardState.view = nextView;
  restaurantPanelEl.hidden = nextView !== "restaurants";
  barPanelEl.hidden = nextView !== "bars";
  cocktailPanelEl.hidden = nextView !== "cocktails";
  guinnessPanelEl.hidden = nextView !== "guinness";
  boardViewButtons.forEach((button) =>
    button.classList.toggle("is-active", button.dataset.boardView === nextView),
  );
}

boardViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setBoardView(button.dataset.boardView);
  });
});

quickViewLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setBoardView(link.dataset.openView);
  });
});

trackerVenueEl.addEventListener("input", () => {
  trackerVenueEl.setCustomValidity("");
  const exactMatch = findTrackableVenueByName(trackerVenueEl.value);
  if (exactMatch) {
    trackerVenueEl.dataset.selectedVenueId = exactMatch.id;
  } else {
    delete trackerVenueEl.dataset.selectedVenueId;
  }

  renderTrackerVenueResults(trackerVenueEl.value);
});

trackerVenueEl.addEventListener("focus", () => {
  if (trackerVenueEl.value.trim()) {
    renderTrackerVenueResults(trackerVenueEl.value);
  }
});

[trackerDateEl, trackerTimeEl, trackerPartySizeEl, trackerNotesEl].forEach((element) => {
  element.addEventListener("focus", () => {
    hideTrackerVenueResults();
  });
});

trackerVenueEl.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideTrackerVenueResults();
    return;
  }

  if (event.key === "Enter" && !trackerVenueResultsEl.hidden) {
    const firstMatch = getVenueSearchMatches(trackerVenueEl.value)[0];
    if (firstMatch && !findTrackableVenueByName(trackerVenueEl.value)) {
      event.preventDefault();
      setTrackerVenueSelection(firstMatch);
    }
  }
});

trackerVenueResultsEl.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-venue-id]");
  if (!trigger) {
    return;
  }

  const match = getTrackableVenueById(trigger.dataset.venueId);
  if (match) {
    setTrackerVenueSelection(match);
    trackerDateEl.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".tracker-field-venue")) {
    hideTrackerVenueResults();
  }
});

trackerFormEl.addEventListener("submit", (event) => {
  event.preventDefault();

  const venueName = trackerVenueEl.value.trim();
  let matchedVenue = trackerVenueEl.dataset.selectedVenueId
    ? getTrackableVenueById(trackerVenueEl.dataset.selectedVenueId)
    : findTrackableVenueByName(venueName);

  if (!matchedVenue) {
    const matches = getVenueSearchMatches(venueName);
    if (matches.length === 1) {
      matchedVenue = matches[0];
      setTrackerVenueSelection(matchedVenue);
    }
  }

  if (!matchedVenue) {
    trackerVenueEl.setCustomValidity("Choose a venue from the existing planner list.");
    trackerVenueEl.reportValidity();
    return;
  }

  trackerState.entries.push({
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    venue: matchedVenue.name,
    venueId: matchedVenue.id,
    date: trackerDateEl.value,
    time: trackerTimeEl.value,
    partySize: Number(trackerPartySizeEl.value),
    notes: trackerNotesEl.value.trim(),
  });

  trackerState.source = "device";
  saveTrackedReservations();
  renderTracker();
  trackerFormEl.reset();
  delete trackerVenueEl.dataset.selectedVenueId;
  setTrackerDefaults();
  hideTrackerVenueResults();
  trackerVenueEl.focus();
});

trackerDayBoardEl.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-remove-booking]");
  if (!trigger) {
    return;
  }

  trackerState.entries = trackerState.entries.filter((entry) => entry.id !== trigger.dataset.removeBooking);
  trackerState.source = "device";
  saveTrackedReservations();
  renderTracker();
});

trackerCopyLinkEl.addEventListener("click", async () => {
  const link = buildTrackedReservationsUrl();

  try {
    await navigator.clipboard.writeText(link);
    trackerSyncStatusEl.textContent = "Sync link copied";
  } catch {
    trackerSyncStatusEl.textContent = "Copy failed";
  }
});

trackerClearAllEl.addEventListener("click", () => {
  trackerState.entries = [];
  trackerState.source = "device";
  saveTrackedReservations();
  renderTracker();
});

restaurantFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    restaurantState.filter = button.dataset.restaurantFilter;
    restaurantFilterButtons.forEach((item) =>
      item.classList.toggle("is-active", item === button),
    );
    renderRestaurants();
  });
});

restaurantCuisineEl.addEventListener("change", (event) => {
  restaurantState.cuisine = event.target.value;
  renderRestaurants();
});

barFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    barState.filter = button.dataset.barFilter;
    barFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderBars();
  });
});

cocktailFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    cocktailState.filter = button.dataset.cocktailFilter;
    cocktailFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderCocktails();
  });
});

mapFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    mapState.filter = button.dataset.mapFilter;
    mapFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderMap();
  });
});

buildCuisineOptions();
setTrackerDefaults();
renderTracker();
if (trackerState.entries.length && trackerState.source === "device") {
  syncTrackedReservationsToUrl();
}
setBoardView(boardState.view);
renderHeroStats();
renderAlarmBoard();
renderRestaurants();
renderBars();
renderCocktails();
renderGuinness();
renderMap();
tickCountdowns();
setInterval(tickCountdowns, 1000);
})();
