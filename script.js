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
const guinnessGridEl = document.getElementById("guinness-grid");
const restaurantCuisineEl = document.getElementById("restaurant-cuisine-filter");
const restaurantCountEl = document.getElementById("restaurant-count");
const barCountEl = document.getElementById("bar-count");
const guinnessCountEl = document.getElementById("guinness-count");
const mapCountEl = document.getElementById("map-count");
const mapDetailEl = document.getElementById("map-detail");
const arrivalCountdownEl = document.getElementById("arrival-countdown");
const alarmListEl = document.getElementById("alarm-list");
const restaurantPanelEl = document.getElementById("restaurant-panel");
const barPanelEl = document.getElementById("bar-panel");
const guinnessPanelEl = document.getElementById("guinness-panel");

const boardViewButtons = [...document.querySelectorAll("[data-board-view]")];
const restaurantFilterButtons = [...document.querySelectorAll("[data-restaurant-filter]")];
const barFilterButtons = [...document.querySelectorAll("[data-bar-filter]")];
const mapFilterButtons = [...document.querySelectorAll("[data-map-filter]")];
const quickViewLinks = [...document.querySelectorAll("[data-open-view]")];

const restaurantState = {
  filter: "all",
  cuisine: "all",
};

const barState = {
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

  barGridEl.innerHTML = visibleBars
    .map((item) => {
      const state = getBookingState(item, now);
      const primaryLink = getPrimaryLink(item);
      const typeLabel =
        item.style === "dive"
          ? "Dive"
          : item.style === "cocktail"
            ? "Cocktail"
            : item.style === "rooftop"
              ? "Rooftop"
              : item.style === "listening"
                ? "Listening"
                : item.style;

      return `
        <article class="venue-card bar-card" id="venue-${item.id}">
          <div class="venue-header">
            <div>
              <div class="priority-pill ${priorityMeta[item.priority].className}">${priorityMeta[item.priority].label}</div>
              <h3>${item.name}</h3>
              <div class="venue-meta">${item.neighborhood} • ${typeLabel} • ${item.spend}</div>
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
    })
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
    renderMap();
  }
}

function setBoardView(nextView) {
  boardState.view = nextView;
  restaurantPanelEl.hidden = nextView !== "restaurants";
  barPanelEl.hidden = nextView !== "bars";
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

mapFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    mapState.filter = button.dataset.mapFilter;
    mapFilterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderMap();
  });
});

buildCuisineOptions();
setBoardView(boardState.view);
renderHeroStats();
renderAlarmBoard();
renderRestaurants();
renderBars();
renderGuinness();
renderMap();
tickCountdowns();
setInterval(tickCountdowns, 1000);
})();
