// 1. Saare modular HTML sections ko index.html me load karne ka function
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
      const container = document.getElementById(sec.id);
      if (!container) continue;
      const response = await fetch(sec.file);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading ${sec.file}`);
      }
      const html = await response.text();
      container.innerHTML = html;
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
  const menu = document.getElementById("mobileMenu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
}

// 3. Interactive Map Initialization (Noida & Delhi NCR)
let map;
let marker;
const defaultLat = 28.5823;
const defaultLng = 77.3100;

function initInteractiveMap() {
  const mapEl = document.getElementById("mapPicker");
  if (!mapEl || typeof L === "undefined") return;

  if (map) {
    map.remove();
    map = null;
    marker = null;
  }

  map = L.map("mapPicker").setView([defaultLat, defaultLng], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

  marker.on("dragend", function () {
    const pos = marker.getLatLng();
    updatePinnedLocation(pos.lat, pos.lng, true);
  });

  map.on("click", function (e) {
    marker.setLatLng(e.latlng);
    updatePinnedLocation(e.latlng.lat, e.latlng.lng, true);
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 250);
}

async function updatePinnedLocation(lat, lng, fetchAddress = true) {
  const fixedLat = Number(lat).toFixed(6);
  const fixedLng = Number(lng).toFixed(6);
  const googleMapsUrl = `https://www.google.com/maps?q=${fixedLat},${fixedLng}`;

  const gpsInput = document.getElementById("gpsMapLink");
  if (gpsInput) {
    gpsInput.value = googleMapsUrl;
  }

  const statusEl = document.getElementById("locationStatus");
  if (statusEl) {
    statusEl.classList.remove("hidden");
    statusEl.innerHTML = `<i class="fa-solid fa-map-pin mr-1"></i> Map Pin Saved! Navigation link attached for Dr. Shashi.`;
  }

  if (fetchAddress) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${fixedLat}&lon=${fixedLng}`
      );
      const data = await res.json();
      const locInput = document.getElementById("patientLocation");
      if (data && data.display_name && locInput) {
        locInput.value = data.display_name;
      }
    } catch (err) {
      console.log("Reverse geocode skipped:", err);
    }
  }
}

function focusCityOnMap(city) {
  const locInput = document.getElementById("patientLocation");
  if (locInput && (!locInput.value.trim() || locInput.value === "Noida - " || locInput.value === "Delhi - ")) {
    locInput.value = `${city} - `;
    locInput.focus();
  }

  if (map && marker) {
    if (city === "Noida") {
      map.setView([28.5355, 77.3910], 13);
      marker.setLatLng([28.5355, 77.3910]);
    } else {
      map.setView([28.6139, 77.2090], 12);
      marker.setLatLng([28.6139, 77.2090]);
    }
    setTimeout(() => map.invalidateSize(), 300);
  }
}

function toggleOtherPlanInput() {
  const planSelect = document.getElementById("selectedPlan");
  const otherBox = document.getElementById("otherPlanBox");
  const otherInput = document.getElementById("otherPlanText");
  if (!planSelect || !otherBox || !otherInput) return;

  if (planSelect.value === "Other") {
    otherBox.classList.remove("hidden");
    otherInput.required = true;
    otherInput.focus();
  } else {
    otherBox.classList.add("hidden");
    otherInput.required = false;
    otherInput.value = "";
  }
}

// Plan selection sync (supports <select> dropdown + Other text input)
function selectPlan(planName) {
  const planInput = document.getElementById("selectedPlan");
  if (!planInput) return;

  if (planInput.tagName === "SELECT") {
    const cleanName = planName.toLowerCase();
    const matchedOption = Array.from(planInput.options).find(
      (opt) =>
        opt.value !== "Other" &&
        (opt.value.toLowerCase().includes(cleanName) || opt.text.toLowerCase().includes(cleanName))
    );

    if (matchedOption) {
      planInput.value = matchedOption.value;
      toggleOtherPlanInput();
      return;
    }

    planInput.value = "Other";
    toggleOtherPlanInput();
    const otherInput = document.getElementById("otherPlanText");
    if (otherInput) {
      otherInput.value = planName;
    }
  } else {
    planInput.value = planName;
  }
}

function toggleOtherInput() {
  const check = document.getElementById("otherProblemCheck");
  const box = document.getElementById("otherProblemBox");
  const input = document.getElementById("otherProblemText");
  if (!check || !box || !input) return;

  if (check.checked) {
    box.classList.remove("hidden");
    input.required = true;
    input.focus();
  } else {
    box.classList.add("hidden");
    input.required = false;
    input.value = "";
  }
}

function detectCurrentLocation() {
  const statusEl = document.getElementById("locationStatus");
  const gpsBtn = document.getElementById("gpsBtn");

  if (!navigator.geolocation) {
    if (statusEl) {
      statusEl.classList.remove("hidden");
      statusEl.innerText = "GPS not supported by browser. Please tap on the map to pin your location.";
    }
    return;
  }

  if (gpsBtn) {
    gpsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting...';
  }
  if (statusEl) {
    statusEl.classList.remove("hidden");
    statusEl.innerText = "Fetching your current GPS location...";
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (map && marker) {
        map.setView([lat, lng], 16);
        marker.setLatLng([lat, lng]);
      }

      await updatePinnedLocation(lat, lng, true);

      if (gpsBtn) {
        gpsBtn.innerHTML = '<i class="fa-solid fa-check"></i> Current Location Pinned';
      }
    },
    () => {
      if (gpsBtn) {
        gpsBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Use Current Location';
      }
      if (statusEl) {
        statusEl.classList.remove("hidden");
        statusEl.innerText = "Location permission blocked. Please tap/drag the pin directly on the map above.";
      }
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// 4. Reviews & Visiting Card Share Functions
function toggleReviewBox() {
  const box = document.getElementById("reviewFormBox");
  if (box) {
    box.classList.toggle("hidden");
  }
}

function addPatientReview(e) {
  e.preventDefault();
  const name = document.getElementById("revName").value.trim();
  const condition = document.getElementById("revCondition").value.trim();
  const stars = parseInt(document.getElementById("revStars").value, 10) || 5;
  const text = document.getElementById("revText").value.trim();

  let starIcons = "";
  for (let i = 0; i < stars; i++) {
    starIcons += '<i class="fa-solid fa-star"></i>';
  }

  const card = document.createElement("div");
  card.className = "bg-slate-50 p-7 rounded-2xl border border-teal-200 shadow-sm";
  card.innerHTML = `
    <div class="text-amber-400 text-sm mb-3">${starIcons}</div>
    <p class="text-slate-600 text-sm italic leading-relaxed">"${text}"</p>
    <div class="mt-6 pt-4 border-t border-slate-200">
      <h4 class="font-extrabold text-slate-950 text-sm">${name}</h4>
      <p class="text-xs text-teal-600 font-semibold">${condition}</p>
    </div>
  `;

  const reviewsList = document.getElementById("reviewsList");
  if (reviewsList) {
    reviewsList.prepend(card);
  }

  e.target.reset();
  toggleReviewBox();
}

async function shareVisitingCard() {
  const plainCardText =
    "STEP UP PHYSIO AT HOME — Move Better Live Stronger\n\n" +
    "Dr. SHASHI BHUSHAN KUMAR (PT)\n" +
    "B.P.T, M.P.T (NEURO)\n\n" +
    "Phone: 9508481837\n" +
    "Email: bhushanshashiraj74@gmail.com\n" +
    "Location: Noida, Delhi\n\n" +
    "OUR SERVICES (Home Visit):\n" +
    "• Neck Pain & Back Pain\n" +
    "• Knee Pain & Shoulder Pain\n" +
    "• Frozen Shoulder\n" +
    "• Postoperative Rehab (TKR, THR)\n" +
    "• Orthopaedic Rehabilitation\n" +
    "• Neurological Rehab (Stroke, Parkinsonism)\n" +
    "• Ergonomic Training & Geriatric Care\n\n" +
    "Expert Care | Better Mobility";

  // Agar image file 'images/visiting-card.jpg' maujood ho toh Web Share API se image + details share karega
  if (navigator.share) {
    try {
      const response = await fetch("images/visiting-card.jpg");
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], "Step-Up-Physio-Visiting-Card.jpg", { type: blob.type || "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Step Up Physio At Home — Visiting Card",
            text: plainCardText,
            files: [file]
          });
          return;
        }
      }
    } catch (err) {
      // Fallback to WhatsApp share below
    }
  }

  const encodedText = encodeURIComponent(plainCardText);
  window.open(`https://wa.me/?text=${encodedText}`, "_blank");
}

// 5. Appointment Submit Handler (Google Sheet Webhook + WhatsApp)
async function handleAppointmentSubmit(e) {
  e.preventDefault();

  const selectedProblems = [];
  document.querySelectorAll('input[name="problemOption"]:checked').forEach((cb) => {
    selectedProblems.push(cb.value);
  });

  const otherCheck = document.getElementById("otherProblemCheck");
  const otherTextEl = document.getElementById("otherProblemText");
  const otherText = otherTextEl ? otherTextEl.value.trim() : "";

  if (otherCheck && otherCheck.checked && otherText) {
    selectedProblems.push(`Other: ${otherText}`);
  }

  if (selectedProblems.length === 0) {
    alert("Please select at least one service/condition or specify under 'Other'.");
    return;
  }

  const problemSummary = selectedProblems.join(", ");
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerText : "Book a Home Visit on WhatsApp";

  if (submitBtn) {
    submitBtn.innerText = "Saving & Opening WhatsApp...";
    submitBtn.disabled = true;
  }

  const name = document.getElementById("patientName").value.trim();
  const phone = document.getElementById("patientPhone").value.trim();
  const date = document.getElementById("patientDate").value;
  const slot = document.getElementById("patientSlot").value;
  const location = document.getElementById("patientLocation").value.trim();
  const gpsInput = document.getElementById("gpsMapLink");
  let gpsLink = gpsInput ? gpsInput.value : "";

  if (!gpsLink && location) {
    gpsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }

  const planEl = document.getElementById("selectedPlan");
  const otherPlanEl = document.getElementById("otherPlanText");
  const otherPlanVal = otherPlanEl ? otherPlanEl.value.trim() : "";

  let plan = "Not specified";
  if (planEl && planEl.value) {
    plan = planEl.value === "Other"
      ? (otherPlanVal ? `Other: ${otherPlanVal}` : "Other")
      : planEl.value;
  }

  const fullLocationText = `${location} | Map: ${gpsLink}`;
  const formData = {
    name,
    phone,
    problem: problemSummary,
    date,
    slot,
    location: fullLocationText,
    plan
  };

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

  const whatsappText =
    `Hello Dr. Shashi Bhushan Kumar, I want to book a home physiotherapy visit from Step Up Physio At Home.%0A%0A` +
    `👤 Name: ${encodeURIComponent(name)}%0A` +
    `📞 Phone: ${encodeURIComponent(phone)}%0A` +
    `🩺 Condition(s): ${encodeURIComponent(problemSummary)}%0A` +
    `📅 Date: ${encodeURIComponent(date)}%0A` +
    `⏰ Time Slot: ${encodeURIComponent(slot)}%0A` +
    `📍 Address: ${encodeURIComponent(location)}%0A` +
    `🗺️ Google Maps Navigation Link:%0A${encodeURIComponent(gpsLink)}%0A` +
    `💼 Plan: ${encodeURIComponent(plan)}`;

  window.open(`https://wa.me/919508481837?text=${whatsappText}`, "_blank");

  if (submitBtn) {
    submitBtn.innerText = originalBtnText;
    submitBtn.disabled = false;
  }

  e.target.reset();

  const otherBox = document.getElementById("otherProblemBox");
  const otherPlanBox = document.getElementById("otherPlanBox");
  const statusEl = document.getElementById("locationStatus");
  if (otherBox) otherBox.classList.add("hidden");
  if (otherPlanBox) otherPlanBox.classList.add("hidden");
  if (statusEl) statusEl.classList.add("hidden");
  if (gpsInput) gpsInput.value = "";
}

// 6. Auto-Changing 5-Image Slideshow for Speciality Cards
function initCardSliders() {
  const sliders = document.querySelectorAll(".auto-slider");
  sliders.forEach((slider, sliderIdx) => {
    const imgs = slider.querySelectorAll(".slide-img");
    const dotsBox = slider.querySelector(".slider-dots");
    if (imgs.length <= 1 || !dotsBox) return;

    let current = 0;
    dotsBox.innerHTML = "";

    imgs.forEach((_, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Slide ${idx + 1}`);
      dot.className = `h-2 rounded-full transition-all cursor-pointer ${
        idx === 0 ? "w-4 bg-white" : "w-2 bg-white/50"
      }`;
      dot.addEventListener("click", () => goToSlide(idx));
      dotsBox.appendChild(dot);
    });

    const dots = dotsBox.querySelectorAll("button");

    function goToSlide(index) {
      imgs[current].classList.remove("opacity-100");
      imgs[current].classList.add("opacity-0");
      if (dots[current]) {
        dots[current].className = "w-2 h-2 rounded-full transition-all bg-white/50 cursor-pointer";
      }

      current = index;

      imgs[current].classList.remove("opacity-0");
      imgs[current].classList.add("opacity-100");
      if (dots[current]) {
        dots[current].className = "w-4 h-2 rounded-full transition-all bg-white cursor-pointer";
      }
    }

    setTimeout(() => {
      setInterval(() => {
        const next = (current + 1) % imgs.length;
        goToSlide(next);
      }, 3000);
    }, sliderIdx * 500);
  });
}