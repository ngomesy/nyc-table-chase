(() => {
const { guinnessSpots: guinnessList, mapsSearchUrl } = window.tripPlannerData;

const guinnessGridEl = document.getElementById("guinness-grid");

guinnessGridEl.innerHTML = guinnessList
  .map(
    (spot) => `
      <article class="venue-card guinness-card">
        <div class="venue-header">
          <div>
            <div class="priority-pill dive">#${spot.rank}</div>
            <h3>${spot.name}</h3>
            <div class="venue-meta">${spot.neighborhood} • ${spot.borough}</div>
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
