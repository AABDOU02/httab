/**
 * dashboard.js - Client dashboard logic
 */

document.addEventListener("DOMContentLoaded", () => {
    if (!window.DB) {
        console.error("Database module not loaded!");
        return;
    }

    // DOM Elements
    const loginView = document.getElementById("login-view");
    const dashboardView = document.getElementById("dashboard-view");
    const loginForm = document.getElementById("client-login-form");
    const emailInput = document.getElementById("login-email");

    // Profile & Menu indicators
    const clientFullName = document.getElementById("client-fullname");
    const clientEmailDisplay = document.getElementById("client-email-display");
    const clientAvatarLetters = document.getElementById("client-avatar-letters");
    const bookingsTableBody = document.getElementById("bookings-table-body");

    // Profile Tab Inputs
    const profFirstName = document.getElementById("prof-firstname");
    const profLastName = document.getElementById("prof-lastname");
    const profEmail = document.getElementById("prof-email");
    const profPhone = document.getElementById("prof-phone");
    const profAddress = document.getElementById("prof-address");
    const profLicense = document.getElementById("prof-license");
    const profileForm = document.getElementById("profile-edit-form");

    // 1. Session check on load
    const loggedEmail = localStorage.getItem("alhatab_logged_client_email");
    if (loggedEmail) {
        initDashboard(loggedEmail);
    } else {
        loginView.style.display = "block";
        dashboardView.style.display = "none";
    }

    // 2. Handle Login Form Submit
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = emailInput.value.trim().toLowerCase();
            
            // Check if there are reservations for this email or let them in with empty
            const reservations = window.DB.getReservations().filter(
                res => res.client.email.toLowerCase() === email
            );

            localStorage.setItem("alhatab_logged_client_email", email);
            initDashboard(email);
            window.showToast("Connexion réussie !", "success");
        });
    }

    // 3. Initialize Dashboard View
    function initDashboard(email) {
        loginView.style.display = "none";
        dashboardView.style.display = "grid";

        // Fetch client details from their first reservation, or use fallback
        const reservations = window.DB.getReservations().filter(
            res => res.client.email.toLowerCase() === email
        );

        let clientInfo = {
            firstName: "Client",
            lastName: "Alhatab",
            email: email,
            phone: "+216 -- --- ---",
            address: "Tunisie",
            license: "---"
        };

        if (reservations.length > 0) {
            clientInfo = { ...reservations[0].client };
        }

        // Set avatar and name text
        const fLetter = clientInfo.firstName.charAt(0).toUpperCase();
        const lLetter = clientInfo.lastName.charAt(0).toUpperCase();
        clientAvatarLetters.textContent = `${fLetter}${lLetter}`;
        clientFullName.textContent = `${clientInfo.firstName} ${clientInfo.lastName}`;
        clientEmailDisplay.textContent = email;

        // Pre-fill profile form fields
        profFirstName.value = clientInfo.firstName;
        profLastName.value = clientInfo.lastName;
        profEmail.value = email;
        profPhone.value = clientInfo.phone;
        profAddress.value = clientInfo.address;
        profLicense.value = clientInfo.license;

        // Render bookings list
        renderClientBookings(reservations);
    }

    // 4. Render reservations list in table
    function renderClientBookings(reservations) {
        bookingsTableBody.innerHTML = "";
        
        if (reservations.length === 0) {
            bookingsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">
                        Aucune réservation trouvée pour ce compte email.
                    </td>
                </tr>
            `;
            return;
        }

        // Sort reservations by date (newest first)
        reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        reservations.forEach(res => {
            const car = window.DB.getVehicleById(res.vehicleId);
            const carName = car ? `${car.brand} ${car.model}` : "Véhicule supprimé";
            
            // Format statuses
            let statusClass = "badge-warning";
            if (res.status === "Confirmée") statusClass = "badge-success";
            if (res.status === "Annulée") statusClass = "badge-danger";

            let payClass = "badge-warning";
            if (res.paymentStatus === "Payée") payClass = "badge-success";
            if (res.paymentStatus === "Annulé") payClass = "badge-danger";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${res.id}</strong></td>
                <td>${carName}</td>
                <td>
                    <div style="font-size:13px;">${window.DB.getLocationById(res.pickupLocation)?.name || res.pickupLocation}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${formatFrDate(res.pickupDate)} à ${res.pickupTime}</div>
                </td>
                <td>
                    <div style="font-size:13px;">${window.DB.getLocationById(res.returnLocation)?.name || res.returnLocation}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${formatFrDate(res.returnDate)} à ${res.returnTime}</div>
                </td>
                <td><strong>${res.totalPrice} DT</strong></td>
                <td><span class="badge ${statusClass}">${res.status}</span></td>
                <td><span class="badge ${payClass}">${res.paymentStatus}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size:12px;" onclick="viewVoucher('${res.id}')">
                        Reçu / Facture
                    </button>
                </td>
            `;
            bookingsTableBody.appendChild(row);
        });
    }

    // 5. Profile form update logic
    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = profEmail.value;

            // Retrieve all reservations for this client
            const reservations = window.DB.getReservations();
            
            // Update profile data in all reservations belonging to this email
            reservations.forEach(res => {
                if (res.client.email.toLowerCase() === email.toLowerCase()) {
                    res.client.firstName = profFirstName.value.trim();
                    res.client.lastName = profLastName.value.trim();
                    res.client.phone = profPhone.value.trim();
                    res.client.address = profAddress.value.trim();
                    res.client.license = profLicense.value.trim();
                    window.DB.saveReservation(res);
                }
            });

            // Update DOM headers
            const fLetter = profFirstName.value.charAt(0).toUpperCase();
            const lLetter = profLastName.value.charAt(0).toUpperCase();
            clientAvatarLetters.textContent = `${fLetter}${lLetter}`;
            clientFullName.textContent = `${profFirstName.value} ${profLastName.value}`;

            window.showToast("Profil enregistré avec succès !", "success");
        });
    }

    // Tab switching behavior
    window.switchTab = function(tabName) {
        document.querySelectorAll(".db-menu-btn").forEach(btn => btn.classList.remove("active"));
        document.querySelectorAll(".dashboard-panel").forEach(panel => panel.classList.remove("active"));
        
        // Find which tab triggered
        const activeBtn = Array.from(document.querySelectorAll(".db-menu-btn")).find(
            btn => btn.getAttribute("onclick").includes(tabName)
        );
        if (activeBtn) activeBtn.classList.add("active");

        const targetPanel = document.getElementById(`tab-${tabName}`);
        if (targetPanel) targetPanel.classList.add("active");
    };

    // Voucher generation and display
    window.viewVoucher = function(resId) {
        const res = window.DB.getReservationById(resId);
        if (!res) {
            window.showToast("Réservation introuvable.", "error");
            return;
        }

        const car = window.DB.getVehicleById(res.vehicleId);
        const carName = car ? `${car.brand} ${car.model}` : "Véhicule Indisponible";
        const carPlate = car ? car.plate : "TU-MOCK-0000";
        const carImage = car ? car.image : "";
        const carPrice = car ? car.pricePerDay : 0;

        const pickupLoc = window.DB.getLocationById(res.pickupLocation)?.name || res.pickupLocation;
        const returnLoc = window.DB.getLocationById(res.returnLocation)?.name || res.returnLocation;

        const optionsHTML = [];
        if (res.options.assurance) optionsHTML.push(`<div><span>Assurance Tout Risque (Franchise Zéro)</span> <span>${25 * res.days} DT</span></div>`);
        if (res.options.gps) optionsHTML.push(`<div><span>Navigateur GPS</span> <span>${10 * res.days} DT</span></div>`);
        if (res.options.siege) optionsHTML.push(`<div><span>Siège Bébé / Enfant</span> <span>${15 * res.days} DT</span></div>`);
        if (res.options.conducteur) optionsHTML.push(`<div><span>Conducteur Additionnel</span> <span>${15 * res.days} DT</span></div>`);
        
        if (optionsHTML.length === 0) {
            optionsHTML.push(`<div><span>Aucune option</span> <span>0 DT</span></div>`);
        }

        const modalBody = document.getElementById("voucher-modal-body");
        modalBody.innerHTML = `
            <div class="voucher">
                <div class="voucher-header">
                    <div>
                        <h2 style="font-family: var(--font-title); font-size:24px; color:var(--primary);">Alhatab Rent Car</h2>
                        <p style="font-size:12px; color:var(--text-gray);">Location de Voiture Premium en Tunisie</p>
                        <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Avenue de l'Union Maghrébine, La Soukra, Tunis</p>
                    </div>
                    <div class="voucher-badge">
                        ${res.paymentStatus === 'Payée' ? 'Facture Payée' : 'Réservation Confirmée'}
                    </div>
                </div>

                <div class="voucher-details-grid">
                    <div>
                        <h4 class="voucher-section-title">Informations Réservation</h4>
                        <div class="voucher-info-list">
                            <div><span>Référence :</span> <strong>${res.id}</strong></div>
                            <div><span>Date d'émission :</span> <span>${formatFrDate(res.createdAt.split('T')[0])}</span></div>
                            <div><span>Statut Location :</span> <span style="font-weight:600;">${res.status}</span></div>
                            <div><span>Passerelle :</span> <span>Click to Pay Monétique</span></div>
                            <div><span>Réf Transaction :</span> <span>${res.paymentRef || 'N/A'}</span></div>
                        </div>
                    </div>
                    <div>
                        <h4 class="voucher-section-title">Détails Conducteur</h4>
                        <div class="voucher-info-list">
                            <div><span>Nom Complet :</span> <strong>${res.client.firstName} ${res.client.lastName}</strong></div>
                            <div><span>Téléphone :</span> <span>${res.client.phone}</span></div>
                            <div><span>Email :</span> <span>${res.client.email}</span></div>
                            <div><span>N° Permis :</span> <span>${res.client.license}</span></div>
                        </div>
                    </div>
                </div>

                <h4 class="voucher-section-title">Dates et Lieux d'Itinéraire</h4>
                <div class="voucher-car-details" style="display:block; font-size:13px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <div>
                            <strong>Prise en charge :</strong>
                            <p>${pickupLoc}</p>
                            <p>${formatFrDate(res.pickupDate)} à ${res.pickupTime}</p>
                        </div>
                        <div style="text-align:right;">
                            <strong>Restitution :</strong>
                            <p>${returnLoc}</p>
                            <p>${formatFrDate(res.returnDate)} à ${res.returnTime}</p>
                        </div>
                    </div>
                    <div style="border-top: 1px dashed var(--border); padding-top:12px; font-weight:600; text-align:center;">
                        Durée de location facturée : ${res.days} jour(s)
                    </div>
                </div>

                <h4 class="voucher-section-title">Véhicule Assigné</h4>
                <div class="voucher-car-details">
                    <img src="${carImage}" alt="${carName}" class="voucher-car-img">
                    <div>
                        <h3 style="font-size:18px;">${carName}</h3>
                        <p style="color:var(--text-gray); font-size:13px;">Catégorie: ${car ? car.category : 'N/A'}</p>
                        <p style="color:var(--text-gray); font-size:13px;">Immatriculation: <span style="color:var(--primary); font-weight:600;">${carPlate}</span></p>
                        <p style="color:var(--text-gray); font-size:13px;">Transmission: ${car ? car.transmission : 'N/A'}</p>
                    </div>
                </div>

                <h4 class="voucher-section-title">Facturation Détaillée</h4>
                <div class="voucher-info-list" style="margin-bottom: 24px;">
                    <div><span>Location ${carName} (${carPrice} DT x ${res.days} jours) :</span> <span>${carPrice * res.days} DT</span></div>
                    ${optionsHTML.join('')}
                </div>

                <div class="voucher-price-box">
                    <span>Montant total de la facture</span>
                    <h2>${res.totalPrice} DT</h2>
                </div>
            </div>
        `;

        document.getElementById("voucher-modal").classList.add("active");
    };

    window.closeVoucherModal = function() {
        document.getElementById("voucher-modal").classList.remove("active");
    };

    // Client logout action
    window.logoutClient = function() {
        localStorage.removeItem("alhatab_logged_client_email");
        loginView.style.display = "block";
        dashboardView.style.display = "none";
        window.showToast("Déconnexion réussie.", "success");
    };

    // French Date Formatter helper
    function formatFrDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
});
