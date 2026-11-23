// 1. Saare HTML sections ko index.html me load aur link karne ka function
async function loadSections() {
  const sections = [
    { id: "sec-navbar", file: "sections/navbar.html" },
    { id: "sec-hero", file: "sections/hero.html" },
    { id: "sec-about", file: "sections/about.html" },
    { id: "sec-specialities", file: "sections/specialities.html" },
    { id: "sec-process", file: "sections/process.html" },
    { id: "sec-pricing", file: "sections/pricing.html" },
    { id: "sec-reviews", file: "sections/reviews.html" },
    { id: "sec-faq", file: "sections/faq.html" },
    { id: "sec-appointment", file: "sections/appointment.html" },
    { id: "sec-footer", file: "sections/footer.html" }
  ];

  for (const sec of sections) {
    try {
      const response = await fetch(sec.file);
      const html = await response.text();
      document.getElementById(sec.id).innerHTML = html;
    } catch (err) {
      console.error(`Error loading ${sec.file}:`, err);
    }
  }

  // Sections load hone ke baad Map aur 5-Image Sliders initialize karein
  initInteractiveMap();
  initCardSliders();
}

// Page load hote hi sections link karein
window.addEventListener("DOMContentLoaded", loadSections);

// 2. Mobile Menu Toggle
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('hidden');
}

// 3. Interactive Map Initialization
let map, marker;
const defaultLat = 28.5823;
const defaultLng = 77.3100;

function initInteractiveMap() {
  const mapEl = document.getElementById('mapPicker');
  if (!mapEl) return;

  map = L.map('mapPicker').setView([defaultLat, defaultLng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

  marker.on('dragend', function () {
    const pos = marker.getLatLng();
    updatePinnedLocation(pos.lat, pos.lng, true);
  });

  map.on('click', function (e) {
    marker.setLatLng(e.latlng);
    updatePinnedLocation(e.latlng.lat, e.latlng.lng, true);
  });
}

async function updatePinnedLocation(lat, lng, fetchAddress = true) {
  const fixedLat = Number(lat).toFixed(6);
  const fixedLng = Number(lng).toFixed(6);
  const googleMapsUrl = `https://www.google.com/maps?q=${fixedLat},${fixedLng}`;

  document.getElementById('gpsMapLink').value = googleMapsUrl;
  const statusEl = document.getElementById('locationStatus');
  statusEl.classList.remove('hidden');
  statusEl.innerHTML = `<i class="fa-solid fa-map-pin mr-1"></i> Map Pin Saved! Navigation link attached for Dr. Shashi.`;

  if (fetchAddress) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${fixedLat}&lon=${fixedLng}`);
      const data = await res.json();
      if (data && data.display_name) {
        document.getElementById('patientLocation').value = data.display_name;
      }
    } catch (err) {
      console.log("Reverse geocode skipped");
    }
  }
}

function focusCityOnMap(city) {
  const locInput = document.getElementById('patientLocation');
  if (locInput) locInput.value = city + " - ";
  if (map && marker) {
    if (city === 'Noida') {
      map.setView([28.5355, 77.3910], 13);
      marker.setLatLng([28.5355, 77.3910]);
    } else {
      map.setView([28.6139, 77.2090], 12);
      marker.setLatLng([28.6139, 77.2090]);
    }
    setTimeout(() => map.invalidateSize(), 300);
  }
}

function selectPlan(planName) {
  const planInput = document.getElementById('selectedPlan');
  if (!planInput) return;

  if (planInput.tagName === 'SELECT') {
    const cleanName = planName.toLowerCase();
    const matchedOption = Array.from(planInput.options).find((opt) =>
      opt.value.toLowerCase().includes(cleanName) || opt.text.toLowerCase().includes(cleanName)
    );

    if (matchedOption) {
      planInput.value = matchedOption.value;
      return;
    }

    let customOpt = Array.from(planInput.options).find((opt) => opt.value === planName);
    if (!customOpt) {
      customOpt = document.createElement('option');
      customOpt.value = planName;
      customOpt.text = planName;
      planInput.appendChild(customOpt);
    }
    planInput.value = planName;
  } else {
    planInput.value = planName;
  }
}

function toggleOtherInput() {
  const check = document.getElementById('otherProblemCheck');
  const box = document.getElementById('otherProblemBox');
  const input = document.getElementById('otherProblemText');
  if (check.checked) {
    box.classList.remove('hidden');
    input.required = true;
    input.focus();
  } else {
    box.classList.add('hidden');
    input.required = false;
    input.value = '';
  }
}

function detectCurrentLocation() {
  const statusEl = document.getElementById('locationStatus');
  const gpsBtn = document.getElementById('gpsBtn');

  if (!navigator.geolocation) {
    statusEl.classList.remove('hidden');
    statusEl.innerText = "GPS not supported by browser. Please tap on the map to pin your location.";
    return;
  }

  gpsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting...';
  statusEl.classList.remove('hidden');
  statusEl.innerText = "Fetching your current GPS location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (map && marker) {
        map.setView([lat, lng], 16);
        marker.setLatLng([lat, lng]);
      }

      await updatePinnedLocation(lat, lng, true);
      gpsBtn.innerHTML = '<i class="fa-solid fa-check"></i> Current Location Pinned';
    },
    () => {
      gpsBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Use Current Location';
      statusEl.innerText = "Location permission blocked. Please tap/drag the pin directly on the map above.";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// 4. Reviews Functions
function toggleReviewBox() {
  document.getElementById('reviewFormBox').classList.toggle('hidden');
}

function addPatientReview(e) {
  e.preventDefault();
  const name = document.getElementById('revName').value;
  const condition = document.getElementById('revCondition').value;
  const stars = parseInt(document.getElementById('revStars').value);
  const text = document.getElementById('revText').value;

  let starIcons = '';
  for (let i = 0; i < stars; i++) {
    starIcons += '<i class="fa-solid fa-star"></i>';
  }

  const card = document.createElement('div');
  card.className = 'bg-slate-50 p-7 rounded-2xl border border-teal-200 shadow-sm';
  card.innerHTML = `
    <div class="text-amber-400 text-sm mb-3">${starIcons}</div>
    <p class="text-slate-600 text-sm italic leading-relaxed">"${text}"</p>
    <div class="mt-6 pt-4 border-t border-slate-200">
      <h4 class="font-extrabold text-slate-950 text-sm">${name}</h4>
      <p class="text-xs text-teal-600 font-semibold">${condition}</p>
    </div>
  `;

  document.getElementById('reviewsList').prepend(card);
  e.target.reset();
  toggleReviewBox();
}

function shareVisitingCard() {
  const cardText = `*STEP UP PHYSIO AT HOME*%0A_Move Better Live Stronger_%0A%0A*Dr. Shashi Bhushan Kumar (PT)*%0AB.P.T, M.P.T (NEURO)%0A%0A*Our Services:*%0A• Neck Pain & Back Pain%0A• Knee Pain & Shoulder Pain%0A• Frozen Shoulder%0A• Postoperative Rehabilitation (TKR, THR)%0A• Orthopaedic & Neurological Rehab (Stroke, Parkinsonism)%0A• Ergonomic Training & Geriatric Physiotherapy%0A%0A📞 Call/WhatsApp: 9508481837%0A📍 Location: Noida, Delhi`;
  window.open(`https://wa.me/?text=${cardText}`, '_blank');
}

// 5. Appointment Submit Handler
async function handleAppointmentSubmit(e) {
  e.preventDefault();

  const selectedProblems = [];
  document.querySelectorAll('input[name="problemOption"]:checked').forEach((cb) => {
    selectedProblems.push(cb.value);
  });

  const otherCheck = document.getElementById('otherProblemCheck');
  const otherText = document.getElementById('otherProblemText').value.trim();
  if (otherCheck.checked && otherText) {
    selectedProblems.push(`Other: ${otherText}`);
  }

  if (selectedProblems.length === 0) {
    alert("Please select at least one service/condition or specify under 'Other'.");
    return;
  }

  const problemSummary = selectedProblems.join(", ");
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerText;
  submitBtn.innerText = "Saving & Opening WhatsApp...";
  submitBtn.disabled = true;

  const name = document.getElementById('patientName').value;
  const phone = document.getElementById('patientPhone').value;
  const date = document.getElementById('patientDate').value;
  const slot = document.getElementById('patientSlot').value;
  const location = document.getElementById('patientLocation').value;
  let gpsLink = document.getElementById('gpsMapLink').value;

  if (!gpsLink && location) {
    gpsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }

  const plan = document.getElementById('selectedPlan').value || "Not specified";
  const fullLocationText = `${location} | Map: ${gpsLink}`;
  const formData = { name, phone, problem: problemSummary, date, slot, location: fullLocationText, plan };

  const GOOGLE_SCRIPT_URL = "";

  if (GOOGLE_SCRIPT_URL) {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
    } catch (err) {
      console.log("Sheet save skipped:", err);
    }
  }

  const whatsappText = `Hello Dr. Shashi Bhushan Kumar, I want to book a home physiotherapy visit from Step Up Physio At Home.%0A%0A👤 Name: ${encodeURIComponent(name)}%0A📞 Phone: ${encodeURIComponent(phone)}%0A🩺 Condition(s): ${encodeURIComponent(problemSummary)}%0A📅 Date: ${encodeURIComponent(date)}%0A⏰ Time Slot: ${encodeURIComponent(slot)}%0A📍 Address: ${encodeURIComponent(location)}%0A🗺️ Google Maps Navigation Link:%0A${encodeURIComponent(gpsLink)}%0A💼 Plan: ${encodeURIComponent(plan)}`;
  
  window.open(`https://wa.me/919508481837?text=${whatsappText}`, '_blank');

  submitBtn.innerText = originalBtnText;
  submitBtn.disabled = false;
  e.target.reset();
  document.getElementById('otherProblemBox').classList.add('hidden');
  document.getElementById('locationStatus').classList.add('hidden');
  document.getElementById('gpsMapLink').value = '';
}

// 6. Auto-Changing 5-Image Slideshow for Speciality Cards
function initCardSliders() {
  const sliders = document.querySelectorAll('.auto-slider');
  sliders.forEach((slider, sliderIdx) => {
    const imgs = slider.querySelectorAll('.slide-img');
    const dotsBox = slider.querySelector('.slider-dots');
    if (imgs.length <= 1) return;

    let current = 0;

    // 5 clickable dots banayein
    imgs.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `w-2 h-2 rounded-full transition-all ${idx === 0 ? 'bg-white w-4' : 'bg-white/50'}`;
      dot.addEventListener('click', () => goToSlide(idx));
      dotsBox.appendChild(dot);
    });

    const dots = dotsBox.querySelectorAll('button');

    function goToSlide(index) {
      imgs[current].classList.remove('opacity-100');
      imgs[current].classList.add('opacity-0');
      dots[current].className = 'w-2 h-2 rounded-full transition-all bg-white/50';

      current = index;

      imgs[current].classList.remove('opacity-0');
      imgs[current].classList.add('opacity-100');
      dots[current].className = 'w-4 h-2 rounded-full transition-all bg-white';
    }

    // Har 3 second me auto-change
    setTimeout(() => {
      setInterval(() => {
        const next = (current + 1) % imgs.length;
        goToSlide(next);
      }, 3000);
    }, sliderIdx * 500);
  });
}