/**
 * reserve.js - 6-step reservation funnel logic & payment simulator
 */

document.addEventListener("DOMContentLoaded", () => {
    if (!window.DB) {
        console.error("Database module not loaded!");
        return;
    }

    // Reservation state
    const state = {
        currentStep: 1,
        pickupLocation: "",
        returnLocation: "",
        pickupDate: "",
        pickupTime: "10:00",
        returnDate: "",
        returnTime: "10:00",
        days: 0,
        selectedVehicleId: "",
        options: {
            assurance: false,
            gps: false,
            siege: false,
            conducteur: false
        },
        client: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            license: ""
        },
        totalPrice: 0,
        tempResId: "" // Stores ID during payment phase
    };

    // DOM Elements
    const pickupLocSelect = document.getElementById("res-pickup-loc");
    const returnLocSelect = document.getElementById("res-return-loc");
    const pickupDateInput = document.getElementById("res-pickup-date");
    const pickupTimeInput = document.getElementById("res-pickup-time");
    const returnDateInput = document.getElementById("res-return-date");
    const returnTimeInput = document.getElementById("res-return-time");
    
    const carsListContainer = document.getElementById("reservation-cars-list");
    const carsCountText = document.getElementById("available-cars-count");
    
    // Sidebar elements
    const summarySidebar = document.getElementById("summary-sidebar");
    const sideCarPreview = document.getElementById("side-car-preview");
    const sideDuration = document.getElementById("side-duration");
    const sideCarPrice = document.getElementById("side-car-price");
    const sideOptionsRow = document.getElementById("side-options-row");
    const sideOptionsPrice = document.getElementById("side-options-price");
    const sideTotalPrice = document.getElementById("side-total-price");

    // 1. Initialize locations dropdowns
    const locations = window.DB.getLocations();
    [pickupLocSelect, returnLocSelect].forEach(select => {
        if (select) {
            locations.forEach(loc => {
                const opt = document.createElement("option");
                opt.value = loc.id;
                opt.textContent = `${loc.name} (${loc.city})`;
                select.appendChild(opt);
            });
        }
    });

    // Set date validations
    const todayStr = new Date().toISOString().split('T')[0];
    pickupDateInput.min = todayStr;
    pickupDateInput.addEventListener("change", () => {
        returnDateInput.min = pickupDateInput.value;
        if (returnDateInput.value && returnDateInput.value < pickupDateInput.value) {
            returnDateInput.value = pickupDateInput.value;
        }
    });

    // 2. Pre-populate from session storage if redirected
    function checkSessionRedirects() {
        const quickSearchLoc = sessionStorage.getItem("alhatab_search_pickup");
        const quickSearchPickupDate = sessionStorage.getItem("alhatab_search_pickup_date");
        const quickSearchReturnDate = sessionStorage.getItem("alhatab_search_return_date");
        
        if (quickSearchLoc && quickSearchPickupDate && quickSearchReturnDate) {
            pickupLocSelect.value = quickSearchLoc;
            returnLocSelect.value = quickSearchLoc; // default to same
            pickupDateInput.value = quickSearchPickupDate;
            returnDateInput.min = quickSearchPickupDate;
            returnDateInput.value = quickSearchReturnDate;
            
            // Clear session to prevent sticky behavior
            sessionStorage.removeItem("alhatab_search_pickup");
            sessionStorage.removeItem("alhatab_search_pickup_date");
            sessionStorage.removeItem("alhatab_search_return_date");
            
            // Auto submit step 1 to proceed to car selection
            setTimeout(() => {
                document.getElementById("form-step-1").dispatchEvent(new Event('submit'));
            }, 100);
            return;
        }

        // If direct car reservation chosen
        const directCarId = sessionStorage.getItem("alhatab_quick_reserve_car");
        if (directCarId) {
            state.selectedVehicleId = directCarId;
            // Leave session storage item so we can auto-choose it in Step 2 after date selection!
        }
    }
    
    checkSessionRedirects();

    // 3. Step transition controls
    function showStep(stepNumber) {
        document.querySelectorAll(".booking-step").forEach(step => {
            step.classList.remove("active");
        });
        
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if (targetStep) targetStep.classList.add("active");

        // Update progress bar
        document.querySelectorAll(".step-indicator").forEach(indicator => {
            const step = parseInt(indicator.getAttribute("data-step"), 10);
            indicator.classList.remove("active", "completed");
            if (step === stepNumber) {
                indicator.classList.add("active");
            } else if (step < stepNumber) {
                indicator.classList.add("completed");
            }
        });

        // Fill progress line
        const progressLine = document.getElementById("progress-line-fill");
        if (progressLine) {
            const pct = ((stepNumber - 1) / 5) * 100;
            progressLine.style.width = `${pct}%`;
        }

        state.currentStep = stepNumber;
        window.scrollTo({ top: 180, behavior: "smooth" });
    }

    window.prevStep = function() {
        if (state.currentStep > 1) {
            showStep(state.currentStep - 1);
            updateSidebar();
        }
    };

    // 4. Form Submissions
    // Step 1: Dates & Locations
    const formStep1 = document.getElementById("form-step-1");
    if (formStep1) {
        formStep1.addEventListener("submit", (e) => {
            e.preventDefault();
            
            state.pickupLocation = pickupLocSelect.value;
            state.returnLocation = returnLocSelect.value;
            state.pickupDate = pickupDateInput.value;
            state.pickupTime = pickupTimeInput.value;
            state.returnDate = returnDateInput.value;
            state.returnTime = returnTimeInput.value;

            // Calculate duration in days
            state.days = window.calculateDays(state.pickupDate, state.returnDate);
            
            // Retrieve available cars
            loadAvailableCars();
            
            // Switch step
            showStep(2);
            updateSidebar();
        });
    }

    // Load available cars for Step 2
    function loadAvailableCars() {
        carsListContainer.innerHTML = "";
        const allVehicles = window.DB.getVehicles();
        
        // Filter by date overlap
        const available = allVehicles.filter(car => 
            window.DB.isVehicleAvailable(car.id, state.pickupDate, state.returnDate)
        );

        carsCountText.textContent = `${available.length} véhicule(s) disponible(s) du ${formatFrDate(state.pickupDate)} au ${formatFrDate(state.returnDate)}`;

        if (available.length === 0) {
            carsListContainer.innerHTML = `
                <div class="glass" style="padding:40px; text-align:center; border-color:var(--error);">
                    <h4 style="color:var(--error); margin-bottom:8px;">Aucun véhicule disponible</h4>
                    <p>Tous nos véhicules sont réservés ou bloqués pour ces dates. Veuillez modifier vos dates de recherche.</p>
                </div>
            `;
            return;
        }

        // Render available cars
        available.forEach(car => {
            const totalPriceForCar = car.pricePerDay * state.days;
            const carRow = document.createElement("div");
            carRow.className = "reservation-car-row glass";
            
            // Check if this car was pre-selected from catalog
            const isPreselected = state.selectedVehicleId === car.id;
            const buttonText = isPreselected ? "Sélectionné" : "Choisir";
            const buttonClass = isPreselected ? "btn-primary" : "btn-secondary";

            carRow.innerHTML = `
                <img src="${car.image}" alt="${car.brand} ${car.model}" class="res-car-img">
                <div class="res-car-info">
                    <div>
                        <span class="car-category" style="position:static; display:inline-block; margin-bottom:10px;">${car.category}</span>
                        <h3 style="margin-bottom:8px;">${car.brand} ${car.model}</h3>
                        <p>${car.description}</p>
                    </div>
                    <div style="display:flex; gap:16px; font-size: 13px; color:var(--text-gray); margin-top:12px;">
                        <span>⚙️ ${car.transmission}</span>
                        <span>⛽ ${car.fuel}</span>
                        <span>👥 ${car.seats} places</span>
                    </div>
                </div>
                <div class="res-car-actions">
                    <div class="res-car-price">
                        <strong>${car.pricePerDay} DT</strong> / jour
                        <span style="display:block; font-size:11px; color:var(--text-muted); margin-top:4px;">Total (${state.days} j) : ${totalPriceForCar} DT</span>
                    </div>
                    <button class="btn ${buttonClass} btn-block" onclick="selectFunnelCar('${car.id}')" id="btn-select-${car.id}">${buttonText}</button>
                </div>
            `;
            carsListContainer.appendChild(carRow);
        });

        // Auto select if quick reserve chosen
        if (state.selectedVehicleId && available.some(c => c.id === state.selectedVehicleId)) {
            // Remove storage so it doesn't persist across future bookings
            sessionStorage.removeItem("alhatab_quick_reserve_car");
            setTimeout(() => {
                selectFunnelCar(state.selectedVehicleId);
            }, 300);
        }
    }

    // Step 2 Selection
    window.selectFunnelCar = function(vehicleId) {
        state.selectedVehicleId = vehicleId;
        
        // Visual indicator update on Step 2 lists
        document.querySelectorAll(".res-car-actions button").forEach(btn => {
            btn.className = "btn btn-secondary btn-block";
            btn.textContent = "Choisir";
        });
        const selectedBtn = document.getElementById(`btn-select-${vehicleId}`);
        if (selectedBtn) {
            selectedBtn.className = "btn btn-primary btn-block";
            selectedBtn.textContent = "Sélectionné";
        }

        // Progress automatically to options
        setTimeout(() => {
            showStep(3);
            updateSidebar();
        }, 300);
    };

    // Step 3 Options submission
    window.submitOptions = function() {
        state.options.assurance = document.getElementById("opt-assurance").checked;
        state.options.gps = document.getElementById("opt-gps").checked;
        state.options.siege = document.getElementById("opt-siege").checked;
        state.options.conducteur = document.getElementById("opt-conducteur").checked;

        showStep(4);
        updateSidebar();
    };

    // Recalculate options pricing on click
    document.querySelectorAll(".option-item input").forEach(input => {
        input.addEventListener("change", () => {
            // Just update side bar preview instantly
            updateSidebar();
        });
    });

    // Step 4 Form Details
    const formStep4 = document.getElementById("form-step-4");
    if (formStep4) {
        formStep4.addEventListener("submit", (e) => {
            e.preventDefault();
            
            state.client.firstName = document.getElementById("cust-firstname").value;
            state.client.lastName = document.getElementById("cust-lastname").value;
            state.client.email = document.getElementById("cust-email").value;
            state.client.phone = document.getElementById("cust-phone").value;
            state.client.address = document.getElementById("cust-address").value;
            state.client.license = document.getElementById("cust-license").value;

            // Generate Step 5 Summary HTML
            renderSummary();
            
            showStep(5);
            updateSidebar();
        });
    }

    // Step 5: Summary rendering
    function renderSummary() {
        document.getElementById("summary-client-name").innerHTML = `<strong>${state.client.firstName} ${state.client.lastName}</strong>`;
        document.getElementById("summary-client-details").textContent = `Tél: ${state.client.phone} | Email: ${state.client.email} | Permis N°: ${state.client.license}`;
        
        const pickupLocName = window.DB.getLocationById(state.pickupLocation)?.name || state.pickupLocation;
        const returnLocName = window.DB.getLocationById(state.returnLocation)?.name || state.returnLocation;
        
        document.getElementById("summary-loc-pickup").textContent = pickupLocName;
        document.getElementById("summary-date-pickup").textContent = `${formatFrDate(state.pickupDate)} à ${state.pickupTime}`;
        document.getElementById("summary-loc-return").textContent = returnLocName;
        document.getElementById("summary-date-return").textContent = `${formatFrDate(state.returnDate)} à ${state.returnTime}`;

        // Options details list
        const optsList = document.getElementById("summary-options-list");
        optsList.innerHTML = "";
        
        let hasOptions = false;
        if (state.options.assurance) {
            optsList.innerHTML += `<li>🛡️ Assurance Franchise Zéro (+25 DT/jour)</li>`;
            hasOptions = true;
        }
        if (state.options.gps) {
            optsList.innerHTML += `<li>🗺️ Navigateur GPS (+10 DT/jour)</li>`;
            hasOptions = true;
        }
        if (state.options.siege) {
            optsList.innerHTML += `<li>👶 Siège Enfant/Bébé (+15 DT/jour)</li>`;
            hasOptions = true;
        }
        if (state.options.conducteur) {
            optsList.innerHTML += `<li>👥 Conducteur Additionnel (+15 DT/jour)</li>`;
            hasOptions = true;
        }

        if (!hasOptions) {
            optsList.innerHTML = `<li>Aucune option sélectionnée</li>`;
        }
    }

    // Step 5 Submit: Proceed to Payment gateway simulation
    window.proceedToPayment = function() {
        const accept = document.getElementById("accept-conditions").checked;
        if (!accept) {
            window.showToast("Vous devez accepter les conditions générales de location.", "error");
            return;
        }

        // Fill Click to Pay parameters
        document.getElementById("ctp-duration").textContent = `${state.days} jour(s)`;
        document.getElementById("ctp-amount").textContent = `${state.totalPrice}.000 DT`;
        
        // Hide sidebar widget during gateway to focus on credit card entry
        summarySidebar.style.display = "none";
        
        showStep(6);
    };

    // 5. Click to Pay Form Simulator
    const ctpForm = document.getElementById("ctp-payment-form");
    if (ctpForm) {
        // Automatic Card Format Masking
        const cardNumInput = document.getElementById("ctp-card-num");
        cardNumInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = v.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];

            for (let i=0, len=match.length; i<len; i+=4) {
                parts.push(match.substring(i, i+4));
            }

            if (parts.length > 0) {
                e.target.value = parts.join(' ');
            } else {
                e.target.value = v;
            }

            // Highlight card logos based on prefix
            const prefix = v.charAt(0);
            document.querySelectorAll(".ctp-card-logo, #logo-cbn").forEach(logo => logo.classList.remove("active"));
            
            if (prefix === '4') {
                document.getElementById("logo-visa").classList.add("active");
            } else if (prefix === '5') {
                document.getElementById("logo-mastercard").classList.add("active");
            } else if (v.length > 0) {
                document.getElementById("logo-cbn").classList.add("active");
            }
        });

        // Expiry Date Masking
        const expiryInput = document.getElementById("ctp-card-expiry");
        expiryInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            if (v.length >= 2) {
                e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
            } else {
                e.target.value = v;
            }
        });

        // Submit Simulator (Success flow)
        ctpForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Start mock loaders
            const submitBtn = ctpForm.querySelector("button[type='submit']");
            const oldText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = "Traitement bancaire 3D Secure en cours...";
            
            setTimeout(() => {
                // Payment Success Processing
                const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
                const transactionRef = `CP-TX-${Math.floor(100000 + Math.random() * 899999)}`;
                
                // Write reservation record
                const newRes = {
                    id: reservationId,
                    vehicleId: state.selectedVehicleId,
                    pickupLocation: state.pickupLocation,
                    returnLocation: state.returnLocation,
                    pickupDate: state.pickupDate,
                    pickupTime: state.pickupTime,
                    returnDate: state.returnDate,
                    returnTime: state.returnTime,
                    days: state.days,
                    totalPrice: state.totalPrice,
                    status: "Confirmée",
                    paymentStatus: "Payée",
                    paymentRef: transactionRef,
                    options: state.options,
                    client: state.client,
                    createdAt: new Date().toISOString()
                };

                const newPay = {
                    id: `pay_${Math.floor(1000 + Math.random() * 9000)}`,
                    reservationId: reservationId,
                    amount: state.totalPrice,
                    method: "Click to Pay",
                    reference: transactionRef,
                    date: new Date().toISOString(),
                    status: "Réussi"
                };

                // Save to mock database
                window.DB.saveReservation(newRes);
                window.DB.savePayment(newPay);

                // Set success view details
                document.getElementById("success-res-id").textContent = reservationId;
                document.getElementById("success-tx-ref").textContent = transactionRef;
                document.getElementById("success-amount").textContent = `${state.totalPrice} DT`;

                showStep("success");
                window.showToast("Paiement autorisé avec succès !", "success");
            }, 1800);
        });
    }

    // Submit Simulator (Failure flow)
    window.simulatePaymentFailure = function() {
        const submitBtn = ctpForm.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.textContent = "Traitement de la transaction...";
        
        setTimeout(() => {
            // Write pending reservation (client didn't complete payment)
            const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
            state.tempResId = reservationId; // store for retry

            const newRes = {
                id: reservationId,
                vehicleId: state.selectedVehicleId,
                pickupLocation: state.pickupLocation,
                returnLocation: state.returnLocation,
                pickupDate: state.pickupDate,
                pickupTime: state.pickupTime,
                returnDate: state.returnDate,
                returnTime: state.returnTime,
                days: state.days,
                totalPrice: state.totalPrice,
                status: "En attente de paiement",
                paymentStatus: "Non payée",
                paymentRef: "",
                options: state.options,
                client: state.client,
                createdAt: new Date().toISOString()
            };

            window.DB.saveReservation(newRes);

            showStep("failure");
            window.showToast("Paiement refusé par la banque.", "error");
            submitBtn.disabled = false;
            submitBtn.textContent = "Confirmer le paiement sécurisé";
        }, 1500);
    };

    window.retryPayment = function() {
        // Return back to CTP portal step
        showStep(6);
    };

    // 6. Sidebar Devis Widget calculator
    function updateSidebar() {
        if (state.currentStep < 2 || state.currentStep > 5) {
            summarySidebar.style.display = "none";
            return;
        }

        const car = window.DB.getVehicleById(state.selectedVehicleId);
        if (!car) {
            summarySidebar.style.display = "none";
            return;
        }

        summarySidebar.style.display = "block";
        
        // Render car in sidebar
        sideCarPreview.innerHTML = `
            <img src="${car.image}" alt="${car.brand}" class="summary-car-img">
            <div class="summary-car-info">
                <h4>${car.brand} ${car.model}</h4>
                <p>${car.category} | ${car.transmission}</p>
            </div>
        `;

        // Calculate pricing
        const rentCost = car.pricePerDay * state.days;
        
        // Options cost
        let optPricePerDay = 0;
        if (state.currentStep >= 3) {
            if (document.getElementById("opt-assurance").checked) optPricePerDay += 25;
            if (document.getElementById("opt-gps").checked) optPricePerDay += 10;
            if (document.getElementById("opt-siege").checked) optPricePerDay += 15;
            if (document.getElementById("opt-conducteur").checked) optPricePerDay += 15;
        }
        const optCost = optPricePerDay * state.days;

        state.totalPrice = rentCost + optCost;

        // Render text
        sideDuration.textContent = `${state.days} jour(s)`;
        sideCarPrice.textContent = `${rentCost} DT`;
        
        if (optCost > 0) {
            sideOptionsRow.style.display = "flex";
            sideOptionsPrice.textContent = `${optCost} DT`;
        } else {
            sideOptionsRow.style.display = "none";
        }
        
        sideTotalPrice.textContent = `${state.totalPrice} DT`;
    }

    // French Date Formatter utility
    function formatFrDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
});
