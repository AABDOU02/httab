/**
 * admin.js - Administrative portal business logic
 */

document.addEventListener("DOMContentLoaded", () => {
    if (!window.DB) {
        console.error("Database module not loaded!");
        return;
    }

    // Tab Switching DOM
    const adminPanels = document.querySelectorAll(".dashboard-panel");
    const adminMenuBtns = document.querySelectorAll(".db-menu-btn");

    // Stats DOM
    const statRevenue = document.getElementById("stat-revenue");
    const statBookingsCount = document.getElementById("stat-bookings-count");
    const statCarsCount = document.getElementById("stat-cars-count");
    const statOccupancy = document.getElementById("stat-occupancy");
    const categoryChartContainer = document.getElementById("stats-category-chart");

    // Vehicles CRUD DOM
    const vehiclesTableBody = document.getElementById("admin-vehicles-table-body");
    const carCrudModal = document.getElementById("car-crud-modal");
    const carCrudForm = document.getElementById("car-crud-form");
    const carModalTitle = document.getElementById("car-modal-title");

    // Bookings DOM
    const bookingsTableBody = document.getElementById("admin-bookings-table-body");

    // Blocked Dates DOM
    const blockedTableBody = document.getElementById("admin-blocked-table-body");
    const blockForm = document.getElementById("admin-block-form");
    const blockCarSelect = document.getElementById("block-car-select");

    // 1. Tab Navigation
    window.switchAdminTab = function(tabName) {
        adminMenuBtns.forEach(btn => btn.classList.remove("active"));
        adminPanels.forEach(panel => panel.classList.remove("active"));

        const activeBtn = Array.from(adminMenuBtns).find(
            btn => btn.getAttribute("onclick").includes(tabName)
        );
        if (activeBtn) activeBtn.classList.add("active");

        // The tab elements might share IDs, we use the panel match
        // There are multiple tab-bookings in HTML, let's find the correct index or map it
        let panelIndex = 0; // Default stats
        if (tabName === 'vehicles') panelIndex = 1;
        if (tabName === 'bookings') panelIndex = 2;
        if (tabName === 'blocked') panelIndex = 3;

        adminPanels[panelIndex].classList.add("active");
        
        // Refresh appropriate view on load
        if (tabName === 'stats') loadStats();
        if (tabName === 'vehicles') loadVehicles();
        if (tabName === 'bookings') loadBookings();
        if (tabName === 'blocked') loadBlockedDates();
    };

    // 2. Load Stats
    function loadStats() {
        const reservations = window.DB.getReservations();
        const vehicles = window.DB.getVehicles();

        // Total revenue
        const confirmedReservations = reservations.filter(r => r.status === "Confirmée" || r.paymentStatus === "Payée");
        const totalRev = confirmedReservations.reduce((acc, curr) => acc + curr.totalPrice, 0);
        statRevenue.textContent = `${totalRev} DT`;

        // Total Bookings count
        statBookingsCount.textContent = reservations.length;

        // Total Fleet size
        statCarsCount.textContent = vehicles.length;

        // Occupancy Rate (For today: 2026-07-13)
        const today = new Date("2026-07-13");
        let activeReservationsToday = 0;
        
        reservations.forEach(r => {
            if (r.status !== "Annulée") {
                const start = new Date(r.pickupDate);
                const end = new Date(r.returnDate);
                if (today >= start && today <= end) {
                    activeReservationsToday++;
                }
            }
        });

        const occupancyPct = vehicles.length > 0 ? Math.round((activeReservationsToday / vehicles.length) * 100) : 0;
        statOccupancy.textContent = `${occupancyPct}%`;

        // Sales Category Progress Bar Chart
        categoryChartContainer.innerHTML = "";
        
        const salesByCategory = {
            Citadine: 0,
            Berline: 0,
            SUV: 0,
            Familiale: 0,
            Luxe: 0
        };

        confirmedReservations.forEach(res => {
            const car = window.DB.getVehicleById(res.vehicleId);
            if (car && salesByCategory[car.category] !== undefined) {
                salesByCategory[car.category] += res.totalPrice;
            }
        });

        const maxSales = Math.max(...Object.values(salesByCategory), 1);

        Object.entries(salesByCategory).forEach(([category, revenue]) => {
            const pct = Math.round((revenue / maxSales) * 100);
            
            const barRow = document.createElement("div");
            barRow.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
                    <span>${category}</span>
                    <strong>${revenue} DT</strong>
                </div>
                <div style="height:10px; background: rgba(255,255,255,0.05); border-radius:5px; overflow:hidden;">
                    <div style="width:${pct}%; height:100%; background:var(--primary); border-radius:5px; transition:width 1s ease;"></div>
                </div>
            `;
            categoryChartContainer.appendChild(barRow);
        });
    }

    // 3. Vehicles CRUD
    function loadVehicles() {
        vehiclesTableBody.innerHTML = "";
        const vehicles = window.DB.getVehicles();

        vehicles.forEach(car => {
            const row = document.createElement("tr");
            
            let badgeClass = "badge-success";
            if (car.status === "Maintenance") badgeClass = "badge-warning";
            if (car.status === "Indisponible") badgeClass = "badge-danger";

            row.innerHTML = `
                <td><img src="${car.image}" alt="${car.brand}" style="width:60px; height:40px; object-fit:cover; border-radius:4px;"></td>
                <td><strong>${car.brand} ${car.model}</strong></td>
                <td>${car.category}</td>
                <td><span style="color:var(--primary); font-weight:600;">${car.plate}</span></td>
                <td>${car.transmission}</td>
                <td><strong>${car.pricePerDay} DT</strong></td>
                <td><span class="badge ${badgeClass}">${car.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" title="Modifier" onclick="editCar('${car.id}')">✏️</button>
                        <button class="btn-icon btn-delete" title="Supprimer" onclick="deleteCar('${car.id}')">🗑️</button>
                    </div>
                </td>
            `;
            vehiclesTableBody.appendChild(row);
        });
    }

    // Add / Edit Car Modal controls
    window.openCarModal = function(carId = "") {
        carCrudForm.reset();
        
        if (carId) {
            carModalTitle.textContent = "Modifier le véhicule";
            const car = window.DB.getVehicleById(carId);
            if (car) {
                document.getElementById("car-crud-id").value = car.id;
                document.getElementById("car-brand").value = car.brand;
                document.getElementById("car-model").value = car.model;
                document.getElementById("car-category").value = car.category;
                document.getElementById("car-plate").value = car.plate;
                document.getElementById("car-trans").value = car.transmission;
                document.getElementById("car-fuel").value = car.fuel;
                document.getElementById("car-seats").value = car.seats;
                document.getElementById("car-price").value = car.pricePerDay;
                document.getElementById("car-status").value = car.status;
                document.getElementById("car-image").value = car.image;
                document.getElementById("car-desc").value = car.description;
            }
        } else {
            carModalTitle.textContent = "Ajouter un véhicule";
            document.getElementById("car-crud-id").value = "";
        }
        
        carCrudModal.classList.add("active");
    };

    window.closeCarModal = function() {
        carCrudModal.classList.remove("active");
    };

    // Save vehicle
    if (carCrudForm) {
        carCrudForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const carId = document.getElementById("car-crud-id").value || `veh_${Date.now()}`;
            
            const carObj = {
                id: carId,
                brand: document.getElementById("car-brand").value.trim(),
                model: document.getElementById("car-model").value.trim(),
                category: document.getElementById("car-category").value,
                plate: document.getElementById("car-plate").value.trim(),
                transmission: document.getElementById("car-trans").value,
                fuel: document.getElementById("car-fuel").value,
                seats: parseInt(document.getElementById("car-seats").value, 10),
                pricePerDay: parseInt(document.getElementById("car-price").value, 10),
                status: document.getElementById("car-status").value,
                image: document.getElementById("car-image").value.trim(),
                description: document.getElementById("car-desc").value.trim()
            };

            window.DB.saveVehicle(carObj);
            closeCarModal();
            loadVehicles();
            populateBlockedVehiclesDropdown(); // refresh blocker dropdown too
            window.showToast("Véhicule enregistré avec succès !", "success");
        });
    }

    // Delete vehicle
    window.deleteCar = function(carId) {
        if (confirm("Voulez-vous vraiment supprimer ce véhicule de la flotte ?")) {
            window.DB.deleteVehicle(carId);
            loadVehicles();
            populateBlockedVehiclesDropdown();
            window.showToast("Véhicule supprimé.", "success");
        }
    };

    // 4. Bookings management
    function loadBookings() {
        bookingsTableBody.innerHTML = "";
        const reservations = window.DB.getReservations();

        // Sort by creation date (newest first)
        reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        reservations.forEach(res => {
            const car = window.DB.getVehicleById(res.vehicleId);
            const carName = car ? `${car.brand} ${car.model}` : "Véhicule Supprimé";
            
            let statusClass = "badge-warning";
            if (res.status === "Confirmée") statusClass = "badge-success";
            if (res.status === "Annulée") statusClass = "badge-danger";

            let payClass = "badge-warning";
            if (res.paymentStatus === "Payée") payClass = "badge-success";
            if (res.paymentStatus === "Non payée") payClass = "badge-danger";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${res.id}</strong></td>
                <td>
                    <div style="font-weight:600;">${res.client.firstName} ${res.client.lastName}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${res.client.email} | ${res.client.phone}</div>
                </td>
                <td>${carName}</td>
                <td>
                    <div style="font-size:12px;">Du: ${formatFrDate(res.pickupDate)}</div>
                    <div style="font-size:12px;">Au: ${formatFrDate(res.returnDate)} (${res.days} j)</div>
                </td>
                <td><strong>${res.totalPrice} DT</strong></td>
                <td><span class="badge ${statusClass}">${res.status}</span></td>
                <td><span class="badge ${payClass}">${res.paymentStatus}</span></td>
                <td>
                    <div class="action-buttons">
                        ${res.status !== 'Confirmée' ? `<button class="btn-icon" title="Confirmer la location" onclick="adminConfirmRes('${res.id}')">✅</button>` : ''}
                        ${res.paymentStatus !== 'Payée' ? `<button class="btn-icon" title="Marquer comme payée" onclick="adminPayRes('${res.id}')">💳</button>` : ''}
                        ${res.status !== 'Annulée' ? `<button class="btn-icon btn-delete" title="Annuler la réservation" onclick="adminCancelRes('${res.id}')">❌</button>` : ''}
                    </div>
                </td>
            `;
            bookingsTableBody.appendChild(row);
        });
    }

    // Confirm booking
    window.adminConfirmRes = function(resId) {
        const res = window.DB.getReservationById(resId);
        if (res) {
            res.status = "Confirmée";
            window.DB.saveReservation(res);
            loadBookings();
            window.showToast("Réservation confirmée avec succès.", "success");
        }
    };

    // Mark as paid
    window.adminPayRes = function(resId) {
        const res = window.DB.getReservationById(resId);
        if (res) {
            res.paymentStatus = "Payée";
            res.status = "Confirmée"; // automatically confirm
            res.paymentRef = `ADM-PAY-${Math.floor(100000 + Math.random()*899999)}`;
            window.DB.saveReservation(res);
            loadBookings();
            window.showToast("Paiement enregistré manuellement.", "success");
        }
    };

    // Cancel booking
    window.adminCancelRes = function(resId) {
        if (confirm("Voulez-vous vraiment annuler cette réservation ?")) {
            const res = window.DB.getReservationById(resId);
            if (res) {
                res.status = "Annulée";
                window.DB.saveReservation(res);
                loadBookings();
                window.showToast("Réservation annulée.", "error");
            }
        }
    };

    // Export Reservations to JSON file
    window.exportReservations = function() {
        const reservations = window.DB.getReservations();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reservations, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "reservations_alhatab_rent_car.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        window.showToast("Fichier exporté avec succès !", "success");
    };

    // 5. Blocked dates management
    function loadBlockedDates() {
        blockedTableBody.innerHTML = "";
        const list = window.DB.getBlockedDates();

        list.forEach(b => {
            const car = window.DB.getVehicleById(b.vehicleId);
            const carName = car ? `${car.brand} ${car.model}` : "Véhicule Inconnu";
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${carName}</strong></td>
                <td>${formatFrDate(b.startDate)}</td>
                <td>${formatFrDate(b.endDate)}</td>
                <td>${b.reason}</td>
                <td>
                    <button class="btn-icon btn-delete" title="Débloquer" onclick="deleteBlock('${b.id}')">🗑️</button>
                </td>
            `;
            blockedTableBody.appendChild(row);
        });
    }

    // Populate vehicles select list inside blocked form
    function populateBlockedVehiclesDropdown() {
        if (blockCarSelect) {
            blockCarSelect.innerHTML = '<option value="" disabled selected>Choisir un véhicule...</option>';
            const vehicles = window.DB.getVehicles();
            vehicles.forEach(car => {
                const opt = document.createElement("option");
                opt.value = car.id;
                opt.textContent = `${car.brand} ${car.model} (${car.plate})`;
                blockCarSelect.appendChild(opt);
            });
        }
    }

    // Handle block date form submit
    if (blockForm) {
        blockForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const blockObj = {
                id: `block_${Date.now()}`,
                vehicleId: document.getElementById("block-car-select").value,
                startDate: document.getElementById("block-start-date").value,
                endDate: document.getElementById("block-end-date").value,
                reason: document.getElementById("block-reason").value.trim()
            };

            window.DB.saveBlockedDate(blockObj);
            blockForm.reset();
            loadBlockedDates();
            window.showToast("Véhicule bloqué pour ces dates.", "success");
        });
    }

    // Delete blocked date
    window.deleteBlock = function(blockId) {
        if (confirm("Voulez-vous vraiment débloquer ce véhicule pour ces dates ?")) {
            window.DB.deleteBlockedDate(blockId);
            loadBlockedDates();
            window.showToast("Dates débloquées.", "success");
        }
    };

    // French date formatter
    function formatFrDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Initialize first tab
    loadStats();
    populateBlockedVehiclesDropdown();
});
