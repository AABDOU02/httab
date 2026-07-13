/**
 * cars.js - Catalog filtering and sorting logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // Check if database exists
    if (!window.DB) {
        console.error("Database module (db.js) not loaded!");
        return;
    }

    // DOM Elements
    const grid = document.getElementById("catalog-cars-grid");
    const noResults = document.getElementById("no-results");
    
    // Filter controls
    const searchInput = document.getElementById("search-input");
    const priceSlider = document.getElementById("filter-price");
    const priceVal = document.getElementById("price-val");
    const categoryCheckboxes = document.querySelectorAll("#filter-categories input");
    const transmissionCheckboxes = document.querySelectorAll("#filter-transmission input");
    const seatsCheckboxes = document.querySelectorAll("#filter-seats input");
    const sortSelect = document.getElementById("sort-select");
    const resetBtn = document.getElementById("reset-filters");

    // Get initial car list from database
    const allCars = window.DB.getVehicles();

    // 1. Initialize Filters from URL params
    function initFiltersFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Category parameter (e.g. ?cat=Citadine)
        const catParam = urlParams.get("cat");
        if (catParam) {
            categoryCheckboxes.forEach(cb => {
                if (cb.value.toLowerCase() === catParam.toLowerCase()) {
                    cb.checked = true;
                }
            });
        }
    }

    // 2. Render car cards into the grid
    function renderCars(cars) {
        grid.innerHTML = "";
        
        if (cars.length === 0) {
            grid.style.display = "none";
            noResults.style.display = "block";
            return;
        }

        grid.style.display = "grid";
        noResults.style.display = "none";

        cars.forEach(car => {
            const card = document.createElement("div");
            card.className = "car-card glass";
            card.innerHTML = `
                <div class="car-img-wrapper">
                    <img src="${car.image}" alt="${car.brand} ${car.model}">
                    <span class="car-category">${car.category}</span>
                    <span class="car-badge ${car.status === 'Disponible' ? 'available' : 'unavailable'}">${car.status}</span>
                </div>
                <div class="car-info">
                    <h3 class="car-title">${car.brand} <span>${car.model}</span></h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        ${car.description}
                    </p>
                    <div class="car-specs">
                        <div class="spec-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                            <span>${car.transmission}</span>
                        </div>
                        <div class="spec-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            <span>${car.fuel}</span>
                        </div>
                        <div class="spec-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            <span>${car.seats} places</span>
                        </div>
                    </div>
                    <div class="car-price-action">
                        <div class="car-price"><strong>${car.pricePerDay} DT</strong> / jour</div>
                        <button class="btn btn-primary car-action-btn" onclick="selectCar('${car.id}')" ${car.status !== 'Disponible' ? 'disabled' : ''}>
                            ${car.status === 'Disponible' ? 'Réserver' : 'Indisponible'}
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // 3. Apply Filters and Sorting
    function applyFilters() {
        let filtered = [...allCars];

        // A. Filter by text search
        const query = searchInput.value.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(car => 
                car.brand.toLowerCase().includes(query) || 
                car.model.toLowerCase().includes(query) ||
                car.category.toLowerCase().includes(query)
            );
        }

        // B. Filter by Category
        const selectedCats = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
            
        if (selectedCats.length > 0) {
            filtered = filtered.filter(car => selectedCats.includes(car.category));
        }

        // C. Filter by Price
        const maxPrice = parseInt(priceSlider.value, 10);
        priceVal.textContent = `${maxPrice} DT`;
        filtered = filtered.filter(car => car.pricePerDay <= maxPrice);

        // D. Filter by Transmission
        const selectedTrans = Array.from(transmissionCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
            
        if (selectedTrans.length > 0) {
            filtered = filtered.filter(car => selectedTrans.includes(car.transmission));
        }

        // E. Filter by Seats
        const selectedSeats = Array.from(seatsCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value, 10));
            
        if (selectedSeats.length > 0) {
            filtered = filtered.filter(car => selectedSeats.includes(car.seats));
        }

        // F. Sort results
        const sortBy = sortSelect.value;
        if (sortBy === "price-asc") {
            filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
        } else if (sortBy === "price-desc") {
            filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
        } else if (sortBy === "name-asc") {
            filtered.sort((a, b) => (a.brand + " " + a.model).localeCompare(b.brand + " " + b.model));
        }

        renderCars(filtered);
    }

    // 4. Reset all filters
    function resetFilters() {
        searchInput.value = "";
        priceSlider.value = 600;
        priceVal.textContent = "600 DT";
        categoryCheckboxes.forEach(cb => cb.checked = false);
        transmissionCheckboxes.forEach(cb => cb.checked = false);
        seatsCheckboxes.forEach(cb => cb.checked = false);
        sortSelect.value = "default";
        applyFilters();
    }

    // Event listeners
    searchInput.addEventListener("input", applyFilters);
    priceSlider.addEventListener("input", applyFilters);
    categoryCheckboxes.forEach(cb => cb.addEventListener("change", applyFilters));
    transmissionCheckboxes.forEach(cb => cb.addEventListener("change", applyFilters));
    seatsCheckboxes.forEach(cb => cb.addEventListener("change", applyFilters));
    sortSelect.addEventListener("change", applyFilters);
    resetBtn.addEventListener("click", resetFilters);

    // Initial load
    initFiltersFromUrl();
    applyFilters();
});

// Select vehicle and jump to reserve flow
function selectCar(vehicleId) {
    sessionStorage.setItem("alhatab_quick_reserve_car", vehicleId);
    window.location.href = "reserve.html";
}

// Bind selectCar to window for html onclick trigger
window.selectCar = selectCar;
