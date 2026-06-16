const stateCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Noida"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"]
};

document.addEventListener("DOMContentLoaded", () => {
  wireSignup();
  wireLogin();
  wireLogout();
  wireLocationDropdowns();
  wireBloodDropdown();
  wireGpsButton();
  wireHelpForm();
  renderRequests();
  prefillUser();
});

function setMsg(text, ok = false) {
  const el = document.getElementById("message");
  if (!el) return;
  el.textContent = text;
  el.className = ok ? "message success" : "message";
}

function currentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
}

function wireSignup() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();

    const user = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      password: document.getElementById("password").value
    };

    const confirm = document.getElementById("confirmPassword").value;

    if (user.password !== confirm) {
      return setMsg("Passwords do not match.");
    }

    localStorage.setItem("currentUser", JSON.stringify(user));
    window.location.href = "home.html";
  });
}

function wireLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    const identifier = document.getElementById("identifier").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    if (!user) return setMsg("No user found. Please sign up first.");

    const validId = identifier === user.email || identifier === user.phone;

    if (validId && password === user.password) {
      window.location.href = "home.html";
    } else {
      setMsg("Invalid login details.");
    }
  });
}

function wireLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

function prefillUser() {
  const user = currentUser();
  if (!user) return;

  const name = document.getElementById("requestName");
  const phone = document.getElementById("requestPhone");

  if (name) name.value = user.name || "";
  if (phone) phone.value = user.phone || "";
}

function wireLocationDropdowns() {
  const stateSelect = document.getElementById("state");
  const citySelect = document.getElementById("city");

  if (!stateSelect || !citySelect) return;

  Object.keys(stateCities).forEach(state => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });

  stateSelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select city</option>';

    const cities = stateCities[stateSelect.value] || [];

    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  });
}

function wireBloodDropdown() {
  const emergency = document.getElementById("emergency");
  const bloodGroup = document.getElementById("bloodGroup");

  if (!emergency || !bloodGroup) return;

  emergency.addEventListener("change", () => {
    const isBlood = emergency.value === "Blood Needed";
    bloodGroup.classList.toggle("hidden", !isBlood);
    bloodGroup.required = isBlood;
    if (!isBlood) bloodGroup.value = "";
  });
}

function wireGpsButton() {
  const btn = document.getElementById("gpsBtn");
  const input = document.getElementById("gpsLocation");

  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      return setMsg("GPS is not supported by this browser.");
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        input.value = `Lat ${position.coords.latitude.toFixed(4)}, Lon ${position.coords.longitude.toFixed(4)}`;
        setMsg("GPS location added.", true);
      },
      () => setMsg("Could not get GPS location. Enter address manually.")
    );
  });
}

function wireHelpForm() {
  const form = document.getElementById("helpForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const request = {
      name: document.getElementById("requestName").value.trim(),
      phone: document.getElementById("requestPhone").value.trim(),
      emergency: document.getElementById("emergency").value,
      bloodGroup: document.getElementById("bloodGroup").value,
      gpsLocation: document.getElementById("gpsLocation").value.trim(),
      state: document.getElementById("state").value,
      city: document.getElementById("city").value,
      address: document.getElementById("address").value.trim(),
      pinCode: document.getElementById("pinCode").value.trim(),
      details: document.getElementById("details").value.trim()
    };

    if (!/^\d{6}$/.test(request.pinCode)) {
      return setMsg("Please enter a valid 6 digit pin code.");
    }

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      return setMsg("Could not submit request.");
    }

    setMsg("Help request submitted and stored on the system.", true);
    form.reset();

    const bloodGroup = document.getElementById("bloodGroup");
    bloodGroup.classList.add("hidden");
    bloodGroup.required = false;

    prefillUser();
  });
}

async function renderRequests() {
  const list = document.getElementById("requestList");
  if (!list) return;

  const response = await fetch("/api/requests");
  const requests = await response.json();

  if (!requests.length) {
    list.innerHTML = "<p>No help requests yet.</p>";
    return;
  }

  list.innerHTML = "";

  requests.forEach(request => {
    const card = document.createElement("article");
    card.className = "request-card";

    const blood = request.bloodGroup
      ? `<p><b>Blood group:</b> ${escapeHtml(request.bloodGroup)}</p>`
      : "";

    card.innerHTML = `
      <h3>${escapeHtml(request.emergency)}</h3>
      ${blood}
      <p><b>Name:</b> ${escapeHtml(request.name)}</p>
      <p><b>Phone:</b> <a href="tel:${escapeHtml(request.phone)}">${escapeHtml(request.phone)}</a></p>
      <p><b>Location:</b> ${escapeHtml(request.city)}, ${escapeHtml(request.state)} - ${escapeHtml(request.pinCode)}</p>
      <p><b>Address:</b> ${escapeHtml(request.address)}</p>
      <p><b>GPS:</b> ${escapeHtml(request.gpsLocation || "Not provided")}</p>
      <p>${escapeHtml(request.details || "No extra details.")}</p>
      <p class="meta">${new Date(request.createdAt).toLocaleString()} · ${escapeHtml(request.status)}</p>
    `;

    list.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
