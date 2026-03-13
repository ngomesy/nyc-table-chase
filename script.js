const {
  hotel,
  tripDates,
  neighborhoodCenters,
  restaurants,
  bars,
  searchUrl,
  mapsSearchUrl,
} = window.tripPlannerData;

const restaurantGridEl = document.getElementById("restaurant-grid");
const barGridEl = document.getElementById("bar-grid");
const restaurantCuisineEl = document.getElementById("restaurant-cuisine-filter");
const restaurantCountEl = document.getElementById("restaurant-count");
const barCountEl = document.getElementById("bar-count");
const mapCountEl = document.getElementById("map-count");
const mapDetailEl = document.getElementById("map-detail");
const arrivalCountdownEl = document.getElementById("arrival-countdown");
const alarmListEl = document.getElementById("alarm-list");

const restaurantFilterButtons = [...document.querySelectorAll("[data-restaurant-filter]")];
const barFilterButtons = [...document.querySelectorAll("[data-bar-filter]")];
const mapFilterButtons = [...document.querySelectorAll("[data-map-filter]")];

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

  return new Date(`${releaseDate}T${booking.time}:00${booking.timeZoneOffset}`);
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

  if (!nextRelease) {
    return {
      mode: "live",
      label: item.booking.estimated ? "Live / estimated" : "Open now",
      note: "All April 15-19 slots are now inside the published booking window.",
      schedule,
      nextRelease: null,
      openCount,
      statusClass: item.booking.estimated ? "is-estimated" : "is-live",
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

function getCoords(item) {
  const center = neighborhoodCenters[item.neighborhoodKey] || neighborhoodCenters.soho;
  const hash = hashId(item.id);
  const angle = ((hash * 37) % 360) * (Math.PI / 180);
  const radius = 0.0011 + ((hash % 6) * 0.00022);
  return [center.lat + Math.sin(angle) * radius, center.lng + Math.cos(angle) * radius];
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
  const exactItems = [...restaurants, ...bars]
    .map((item) => {
      const state = getBookingState(item, now);
      if (!state.nextRelease) {
        return null;
      }
      return { item, nextRelease: state.nextRelease };
    })
    .filter(Boolean)
    .sort((a, b) => a.nextRelease.releaseAt.getTime() - b.nextRelease.releaseAt.getTime())
    .slice(0, 5);

  alarmListEl.innerHTML = exactItems
    .map(
      ({ item, nextRelease }) => `
        <div class="alarm-item">
          <strong>${item.name}</strong>
          <span>${nextRelease.tripLabel} • ${formatDateTime(nextRelease.releaseAt)}</span>
        </div>
      `,
    )
    .join("");
}

function createCountdownMarkup(item, state, now) {
  if (state.mode === "countdown") {
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
                      <span>${formatDateTime(entry.releaseAt)}${item.booking.estimated ? " est." : ""}</span>
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

function buildDirectionsUrl(destination) {
  const params = new URLSearchParams({
    api: "1",
    origin: hotel.address,
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
    }).setView([hotel.lat, hotel.lng], 13);

    tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    hotelMarker = L.marker([hotel.lat, hotel.lng], {
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

  const bounds = [[hotel.lat, hotel.lng]];

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
renderHeroStats();
renderAlarmBoard();
renderRestaurants();
renderBars();
renderMap();
tickCountdowns();
setInterval(tickCountdowns, 1000);
