(() => {
const {
  guinnessSpots: guinnessList,
  hotel: hotelData,
  neighborhoodCenters,
  mapsSearchUrl,
} = window.tripPlannerData;

const guinnessGridEl = document.getElementById("guinness-grid");

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

function getDistanceFromHotel(spot) {
  const center = neighborhoodCenters[spot.neighborhoodKey] || neighborhoodCenters.soho;
  return distanceInMiles(hotelData.lat, hotelData.lng, center.lat, center.lng);
}

function formatDistance(distance) {
  return `Approx. ${distance.toFixed(1)} mi from hotel`;
}

guinnessGridEl.innerHTML = guinnessList
  .map(
    (spot) => `
      <article class="venue-card guinness-card">
        <div class="venue-header">
          <div>
            <div class="priority-pill dive">#${spot.rank}</div>
            <h3>${spot.name}</h3>
            <div class="venue-meta">${spot.neighborhood} • ${spot.borough}</div>
            <div class="distance-line">${formatDistance(getDistanceFromHotel(spot))}</div>
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
})();
