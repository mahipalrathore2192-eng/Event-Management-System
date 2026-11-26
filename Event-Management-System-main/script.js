
/* ==========================================
   EVENTFLOW - EVENT MANAGEMENT SYSTEM
   Pure JavaScript + LocalStorage
========================================== */

const STORAGE_KEY = "eventflow_events_v1";
const REGISTRATION_KEY = "eventflow_registrations_v1";

// DOM helpers
const $ = (id) => document.getElementById(id);

const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);

const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

const makeId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const today = () => {
    const d = new Date();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
};

const addDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
};

const formatDate = (date) =>
    new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

const isUpcoming = (event) => event.date >= today();

const categoryIcons = {
    Technology: "💻",
    Education: "📚",
    Music: "🎵",
    Sports: "⚽",
    Business: "💼",
    Other: "🎉"
};

const categoryColors = {
    Technology: "linear-gradient(135deg,#5145d8,#8d83fa)",
    Education: "linear-gradient(135deg,#168fbe,#58c5e7)",
    Music: "linear-gradient(135deg,#a33caa,#e58bd9)",
    Sports: "linear-gradient(135deg,#159a71,#61d5a6)",
    Business: "linear-gradient(135deg,#d27b28,#f2bd6c)",
    Other: "linear-gradient(135deg,#59647b,#98a2b7)"
};

// Sample data
function createSampleData() {
    const samples = [
        {
            title: "Tech Innovation Summit 2026",
            category: "Technology",
            date: addDays(5),
            time: "10:00",
            venue: "Jaipur Convention Centre",
            price: 499,
            capacity: 200,
            description: "Explore the latest technologies, AI innovations, and future trends with industry experts."
        },
        {
            title: "Web Development Workshop",
            category: "Education",
            date: addDays(10),
            time: "11:30",
            venue: "College Auditorium",
            price: 199,
            capacity: 100,
            description: "A practical workshop covering modern web development using HTML, CSS and JavaScript."
        },
        {
            title: "Annual Music Festival",
            category: "Music",
            date: addDays(15),
            time: "17:00",
            venue: "Open Air Theatre",
            price: 299,
            capacity: 500,
            description: "An exciting evening filled with live music, performances and entertainment."
        },
        {
            title: "Startup Networking Meet",
            category: "Business",
            date: addDays(20),
            time: "09:30",
            venue: "Business Innovation Hub",
            price: 0,
            capacity: 150,
            description: "Connect with entrepreneurs, investors and startup enthusiasts."
        },
        {
            title: "Inter-College Sports Meet",
            category: "Sports",
            date: addDays(-5),
            time: "08:00",
            venue: "University Sports Ground",
            price: 0,
            capacity: 300,
            description: "A competitive sports event featuring students from multiple colleges."
        },
        {
            title: "Career Guidance Seminar",
            category: "Education",
            date: addDays(-12),
            time: "14:00",
            venue: "Seminar Hall",
            price: 99,
            capacity: 120,
            description: "Learn about career opportunities, placements, interviews and professional growth."
        }
    ];

    return samples.map((event, index) => ({
        ...event,
        id: "sample-" + index
    }));
}

// State
let events = [];
let registrations = [];

function loadData() {
    try {
        const savedEvents = localStorage.getItem(STORAGE_KEY);
        const savedRegistrations = localStorage.getItem(REGISTRATION_KEY);

        events = savedEvents === null
            ? createSampleData()
            : JSON.parse(savedEvents);

        registrations = savedRegistrations === null
            ? []
            : JSON.parse(savedRegistrations);

        if (!Array.isArray(events) || !Array.isArray(registrations)) {
            throw new Error("Invalid saved data");
        }
    } catch (error) {
        console.error("Could not load saved data:", error);
        events = createSampleData();
        registrations = [];
        showToast("Saved data was invalid. Sample data restored.");
    }

    saveData();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    localStorage.setItem(REGISTRATION_KEY, JSON.stringify(registrations));
}

// Toast notification
let toastTimer;

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// Navigation
const pageInfo = {
    dashboard: ["Dashboard", "Welcome back! Here's what's happening."],
    events: ["All Events", "Create, manage and organize your events."],
    registrations: ["Registrations", "Manage your event participants."],
    settings: ["Settings", "Configure your application."]
};

function navigate(page) {
    if (!pageInfo[page]) return;

    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("active", section.id === page);
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === page);
    });

    $("pageTitle").textContent = pageInfo[page][0];
    $("pageSubtitle").textContent = pageInfo[page][1];

    $("sidebar").classList.remove("open");

    if (page === "dashboard") renderDashboard();
    if (page === "events") renderEvents();
    if (page === "registrations") renderRegistrations();
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(link.dataset.page);
        history.replaceState(null, "", "#" + link.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.goto));
});

$("menuToggle").addEventListener("click", () => {
    $("sidebar").classList.add("open");
});

$("closeSidebar").addEventListener("click", () => {
    $("sidebar").classList.remove("open");
});

// Modal management
function openModal(id) {
    $(id).classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeModal(id) {
    $(id).classList.remove("show");

    if (!document.querySelector(".modal-overlay.show")) {
        document.body.style.overflow = "";
    }
}

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.close);
    });
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(overlay.id);
    });
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.show").forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Event management
function openEventForm(id = null) {
    $("eventForm").reset();
    $("editEventId").value = "";
    $("eventModalTitle").textContent = "Create New Event";
    $("saveEventBtn").textContent = "Save Event";
    $("eventDate").min = today();
    $("eventPrice").value = 0;
    $("eventCapacity").value = 100;

    if (id) {
        const event = events.find(item => item.id === id);
        if (!event) return;

        $("editEventId").value = event.id;
        $("eventTitle").value = event.title;
        $("eventCategory").value = event.category;
        $("eventDate").value = event.date;
        $("eventTime").value = event.time;
        $("eventVenue").value = event.venue;
        $("eventPrice").value = event.price;
        $("eventCapacity").value = event.capacity;
        $("eventDescription").value = event.description;

        $("eventModalTitle").textContent = "Edit Event";
        $("saveEventBtn").textContent = "Update Event";
        $("eventDate").min = event.date;
    }

    openModal("eventModal");
}

$("headerAddBtn").addEventListener("click", () => openEventForm());
$("addEventBtn").addEventListener("click", () => openEventForm());
$("quickAdd").addEventListener("click", () => openEventForm());

$("eventForm").addEventListener("submit", e => {
    e.preventDefault();

    const id = $("editEventId").value;
    const existing = events.find(item => item.id === id);

    const eventData = {
        id: id || makeId(),
        title: $("eventTitle").value.trim(),
        category: $("eventCategory").value,
        date: $("eventDate").value,
        time: $("eventTime").value,
        venue: $("eventVenue").value.trim(),
        price: Number($("eventPrice").value),
        capacity: Number($("eventCapacity").value),
        description: $("eventDescription").value.trim()
    };

    if (!eventData.title || !eventData.venue || !eventData.description) {
        showToast("Please complete all required fields.");
        return;
    }

    if (eventData.date < today() && !existing) {
        showToast("Please select today or a future date.");
        return;
    }

    if (
        !Number.isFinite(eventData.price) ||
        eventData.price < 0 ||
        !Number.isInteger(eventData.price) ||
        !Number.isInteger(eventData.capacity) ||
        eventData.capacity < 1
    ) {
        showToast("Please enter valid price and capacity.");
        return;
    }

    const booked = registrations
        .filter(r => r.eventId === id)
        .reduce((sum, r) => sum + r.quantity, 0);

    if (eventData.capacity < booked) {
        showToast("Capacity cannot be less than existing registrations.");
        return;
    }

    if (existing) {
        Object.assign(existing, eventData);
        showToast("Event updated successfully!");
    } else {
        events.push(eventData);
        showToast("Event created successfully!");
    }

    saveData();
    closeModal("eventModal");
    renderAll();
});

// Delete event
function deleteEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    const confirmed = confirm(
        `Delete "${event.title}" and all its registrations?`
    );

    if (!confirmed) return;

    events = events.filter(e => e.id !== id);
    registrations = registrations.filter(r => r.eventId !== id);

    saveData();
    renderAll();
    showToast("Event and related registrations deleted.");
}

// Event details
function viewEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    const booked = registrations
        .filter(r => r.eventId === id)
        .reduce((sum, r) => sum + r.quantity, 0);

    $("eventDetails").innerHTML = `
        <div class="details-content">
            <div style="font-size:42px;margin-bottom:10px">
                ${categoryIcons[event.category] || "🎉"}
            </div>
            <h2>${escapeHTML(event.title)}</h2>
            <p>${escapeHTML(event.description)}</p>

            <div class="detail-row"><strong>Category:</strong> ${escapeHTML(event.category)}</div>
            <div class="detail-row"><strong>Date:</strong> ${formatDate(event.date)}</div>
            <div class="detail-row"><strong>Time:</strong> ${escapeHTML(event.time)}</div>
            <div class="detail-row"><strong>Venue:</strong> ${escapeHTML(event.venue)}</div>
            <div class="detail-row"><strong>Ticket Price:</strong> ${money(event.price)}</div>
            <div class="detail-row"><strong>Capacity:</strong> ${booked} / ${event.capacity} booked</div>
            <div class="detail-row"><strong>Status:</strong> ${isUpcoming(event) ? "Upcoming" : "Completed"}</div>
        </div>
    `;

    openModal("detailsModal");
}

// Event filters and rendering
function renderEvents() {
    const search = $("eventSearch").value.toLowerCase().trim();
    const category = $("categoryFilter").value;
    const status = $("statusFilter").value;

    const filtered = events.filter(event => {
        const matchesSearch =
            event.title.toLowerCase().includes(search) ||
            event.venue.toLowerCase().includes(search) ||
            event.description.toLowerCase().includes(search);

        const matchesCategory =
            category === "All" || event.category === category;

        const matchesStatus =
            status === "All" ||
            (status === "Upcoming" && isUpcoming(event)) ||
            (status === "Completed" && !isUpcoming(event));

        return matchesSearch && matchesCategory && matchesStatus;
    });

    $("eventsGrid").innerHTML = filtered.length
        ? filtered.map(event => {
            const booked = registrations
                .filter(r => r.eventId === event.id)
                .reduce((sum, r) => sum + r.quantity, 0);

            const available = Math.max(0, event.capacity - booked);
            const statusLabel = isUpcoming(event) ? "Upcoming" : "Completed";

            return `
                <article class="event-card">
                    <div class="event-cover"
                         style="background:${categoryColors[event.category] || categoryColors.Other}">
                        <span class="event-emoji">${categoryIcons[event.category] || "🎉"}</span>
                        <small>${escapeHTML(event.category)}</small>
                    </div>

                    <div class="event-body">
                        <h3>${escapeHTML(event.title)}</h3>
                        <p class="event-description">${escapeHTML(event.description)}</p>

                        <div class="event-meta">
                            <span>📅 ${formatDate(event.date)} · ${escapeHTML(event.time)}</span>
                            <span>📍 ${escapeHTML(event.venue)}</span>
                            <span>♧ ${booked}/${event.capacity} participants</span>
                            <span>
                                <span class="status-pill ${isUpcoming(event) ? "" : "status-completed"}">
                                    ${statusLabel}
                                </span>
                                ${available === 0 && isUpcoming(event) ? " · Full" : ""}
                            </span>
                        </div>

                        <div class="event-card-footer">
                            <span class="event-price">${money(event.price)}</span>
                            <div class="event-actions">
                                <button class="icon-btn" data-action="view" data-id="${event.id}">View</button>
                                <button class="icon-btn" data-action="edit" data-id="${event.id}">Edit</button>
                                <button class="icon-btn" data-action="delete" data-id="${event.id}">✕</button>
                                ${isUpcoming(event) && available > 0
                                    ? `<button class="register-btn" data-action="register" data-id="${event.id}">Register</button>`
                                    : ""}
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join("")
        : `<div class="empty-state">
            <strong>No events found</strong>
            Try changing your search or filters.
           </div>`;
}

$("eventsGrid").addEventListener("click", e => {
    const button = e.target.closest("[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "view") viewEvent(id);
    if (action === "edit") openEventForm(id);
    if (action === "delete") deleteEvent(id);
    if (action === "register") openRegistration(id);
});

$("eventSearch").addEventListener("input", renderEvents);
$("categoryFilter").addEventListener("change", renderEvents);
$("statusFilter").addEventListener("change", renderEvents);

// Registration management
function openRegistration(id) {
    const event = events.find(e => e.id === id);
    if (!event || !isUpcoming(event)) return;

    const booked = registrations
        .filter(r => r.eventId === id)
        .reduce((sum, r) => sum + r.quantity, 0);

    if (booked >= event.capacity) {
        showToast("This event is fully booked.");
        return;
    }

    $("registrationForm").reset();
    $("registrationEventId").value = id;
    $("ticketQuantity").value = 1;
    $("ticketQuantity").max = Math.min(10, event.capacity - booked);

    updatePriceSummary();
    openModal("registrationModal");
}

function updatePriceSummary() {
    const event = events.find(e => e.id === $("registrationEventId").value);
    if (!event) return;

    const quantity = Number($("ticketQuantity").value);
    $("priceSummary").textContent =
        "Total: " + money(event.price * quantity);
}

$("ticketQuantity").addEventListener("input", updatePriceSummary);

$("registrationForm").addEventListener("submit", e => {
    e.preventDefault();

    const eventId = $("registrationEventId").value;
    const event = events.find(e => e.id === eventId);

    if (!event || !isUpcoming(event)) {
        showToast("This event is no longer available.");
        return;
    }

    const name = $("participantName").value.trim();
    const email = $("participantEmail").value.trim();
    const quantity = Number($("ticketQuantity").value);

    if (!name || !email || !Number.isInteger(quantity) ||
        quantity < 1 || quantity > 10) {
        showToast("Please enter valid registration details.");
        return;
    }

    const booked = registrations
        .filter(r => r.eventId === eventId)
        .reduce((sum, r) => sum + r.quantity, 0);

    if (booked + quantity > event.capacity) {
        showToast("Not enough tickets are available.");
        return;
    }

    registrations.push({
        id: makeId(),
        eventId,
        name,
        email,
        quantity,
        amount: event.price * quantity,
        date: today()
    });

    saveData();
    closeModal("registrationModal");
    renderAll();
    showToast("Registration completed successfully!");
});

// Registration list
function renderRegistrations() {
    const search = $("registrationSearch").value.toLowerCase().trim();
    const selectedEvent = $("registrationEventFilter").value;

    const filter = registrations.filter(r => {
        const event = events.find(e => e.id === r.eventId);

        const matchesSearch =
            r.name.toLowerCase().includes(search) ||
            r.email.toLowerCase().includes(search) ||
            (event && event.title.toLowerCase().includes(search));

        return matchesSearch &&
            (selectedEvent === "All" || r.eventId === selectedEvent);
    });

    $("registrationCount").textContent =
        `${filter.length} registration${filter.length !== 1 ? "s" : ""}`;

    $("registrationEventFilter").innerHTML =
        `<option value="All">All Events</option>` +
        events.map(event =>
            `<option value="${event.id}">${escapeHTML(event.title)}</option>`
        ).join("");

    $("registrationEventFilter").value = selectedEvent;

    $("registrationTable").innerHTML = filter.length
        ? filter.map(r => {
            const event = events.find(e => e.id === r.eventId);

            return `
                <tr>
                    <td><strong>${escapeHTML(r.name)}</strong></td>
                    <td>${escapeHTML(r.email)}</td>
                    <td>${escapeHTML(event?.title || "Deleted event")}</td>
                    <td>${formatDate(r.date)}</td>
                    <td>${r.quantity}</td>
                    <td>${money(r.amount)}</td>
                    <td>
                        <button class="icon-btn"
                                data-delete-registration="${r.id}">Remove</button>
                    </td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="7" style="text-align:center;padding:35px;color:#85899e">
             No registrations found.
           </td></tr>`;
}

$("registrationTable").addEventListener("click", e => {
    const button = e.target.closest("[data-delete-registration]");
    if (!button) return;

    const id = button.dataset.deleteRegistration;
    const registration = registrations.find(r => r.id === id);

    if (!registration) return;

    if (!confirm(`Remove registration for ${registration.name}?`)) return;

    registrations = registrations.filter(r => r.id !== id);
    saveData();
    renderAll();
    showToast("Registration removed.");
});

$("registrationSearch").addEventListener("input", renderRegistrations);
$("registrationEventFilter").addEventListener("change", renderRegistrations);

// Dashboard
function renderDashboard() {
    const upcoming = events.filter(isUpcoming);

    const totalBooked = registrations.reduce(
        (sum, r) => sum + r.quantity, 0
    );

    const revenue = registrations.reduce(
        (sum, r) => sum + r.amount, 0
    );

    $("totalEvents").textContent = events.length;
    $("upcomingEvents").textContent = upcoming.length;
    $("totalRegistrations").textContent = totalBooked;
    $("totalRevenue").textContent = money(revenue);

    // Recent events
    const recent = [...events]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4);

    $("recentEvents").innerHTML = recent.length
        ? recent.map(event => `
            <div class="recent-item">
                <div class="event-mini-icon">
                    ${categoryIcons[event.category] || "🎉"}
                </div>
                <div class="recent-info">
                    <strong>${escapeHTML(event.title)}</strong>
                    <small>${formatDate(event.date)} · ${escapeHTML(event.venue)}</small>
                </div>
                <span class="status-pill ${isUpcoming(event) ? "" : "status-completed"}">
                    ${isUpcoming(event) ? "Upcoming" : "Completed"}
                </span>
            </div>
        `).join("")
        : `<div class="empty-state">No events available.</div>`;

    // Category statistics
    const categories = {};

    events.forEach(event => {
        categories[event.category] = (categories[event.category] || 0) + 1;
    });

    const maxCount = Math.max(1, ...Object.values(categories));

    $("categoryStats").innerHTML = Object.keys(categories).length
        ? Object.entries(categories).map(([name, count]) => `
            <div class="category-row">
                <strong>${categoryIcons[name] || "🎉"} ${escapeHTML(name)}</strong>
                <small>${count} event${count !== 1 ? "s" : ""}</small>
                <div class="progress">
                    <div style="width:${count / maxCount * 100}%"></div>
                </div>
            </div>
        `).join("")
        : `<div class="empty-state">No categories available.</div>`;
}

// Export data
$("exportBtn").addEventListener("click", () => {
    const data = {
        application: "EventFlow",
        exportedAt: new Date().toISOString(),
        events,
        registrations
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "eventflow-data.json";
    link.click();

    URL.revokeObjectURL(url);
    showToast("Data exported successfully!");
});

// Reset data
$("resetBtn").addEventListener("click", () => {
    const confirmed = confirm(
        "Are you sure? This will delete your current events and registrations and restore sample events."
    );

    if (!confirmed) return;

    events = createSampleData();
    registrations = [];

    saveData();
    renderAll();
    showToast("Application data has been reset.");
});

// Render everything
function renderAll() {
    renderDashboard();
    renderEvents();
    renderRegistrations();
}

// Initialize
function initializeApp() {
    loadData();

    $("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    renderAll();

    const initialPage = location.hash.replace("#", "");
    navigate(pageInfo[initialPage] ? initialPage : "dashboard");
}

initializeApp();


/* ==========================================
   DARK / LIGHT THEME SYSTEM
========================================== */

const THEME_KEY = "eventflow_theme";

function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute(
        "data-theme",
        selectedTheme
    );

    $("themeIcon").textContent =
        selectedTheme === "dark" ? "☀" : "☾";

    $("themeToggle").title =
        selectedTheme === "dark"
            ? "Switch to Light Mode"
            : "Switch to Dark Mode";

    localStorage.setItem(THEME_KEY, selectedTheme);
}

$("themeToggle").addEventListener("click", () => {
    const currentTheme =
        document.documentElement.getAttribute("data-theme");

    applyTheme(currentTheme === "dark" ? "light" : "dark");
});

// Restore saved theme
const savedTheme = localStorage.getItem(THEME_KEY);
applyTheme(savedTheme || "light");
