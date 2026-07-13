/**
 * db.js - Mock Database for Alhatab Rent Car (LocalStorage based)
 */

// Initial data to populate when the database is first loaded
const DEFAULT_LOCATIONS = [
    { id: "tunis_aeroport", name: "Aéroport Tunis-Carthage (TUN)", city: "Tunis" },
    { id: "tunis_centre", name: "Tunis Centre-Ville (Avenue Bourguiba)", city: "Tunis" },
    { id: "enfidha_aeroport", name: "Aéroport Enfidha-Hammamet (NBE)", city: "Hammamet/Enfidha" },
    { id: "hammamet_centre", name: "Hammamet Centre-Ville", city: "Hammamet" },
    { id: "sousse_kantaoui", name: "Sousse - Port El Kantaoui", city: "Sousse" },
    { id: "monastir_aeroport", name: "Aéroport Monastir Habib-Bourguiba (MIR)", city: "Monastir" },
    { id: "sfax_centre", name: "Sfax Ville", city: "Sfax" },
    { id: "djerba_aeroport", name: "Aéroport Djerba-Zarzis (DJE)", city: "Djerba" }
];

const DEFAULT_VEHICLES = [
    {
        id: "veh_1",
        brand: "Kia",
        model: "Rio",
        category: "Citadine",
        transmission: "Manuelle",
        fuel: "Essence",
        seats: 5,
        pricePerDay: 110,
        image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "220 TU 4321",
        description: "Une citadine élégante, confortable et très économique pour vos déplacements urbains en Tunisie."
    },
    {
        id: "veh_2",
        brand: "Hyundai",
        model: "i10",
        category: "Citadine",
        transmission: "Manuelle",
        fuel: "Essence",
        seats: 4,
        pricePerDay: 90,
        image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "215 TU 8765",
        description: "Petite et ultra-maniable, parfaite pour se garer facilement au centre-ville de Tunis ou de Sousse."
    },
    {
        id: "veh_3",
        brand: "Volkswagen",
        model: "Golf 8",
        category: "Berline",
        transmission: "Automatique",
        fuel: "Essence",
        seats: 5,
        pricePerDay: 190,
        image: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "232 TU 1590",
        description: "La référence des berlines compactes. Allie sportivité, technologie moderne et confort de conduite exceptionnel."
    },
    {
        id: "veh_4",
        brand: "Toyota",
        model: "Land Cruiser Prado",
        category: "SUV",
        transmission: "Automatique",
        fuel: "Diesel",
        seats: 7,
        pricePerDay: 380,
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "218 TU 9988",
        description: "Le baroudeur de luxe idéal pour explorer le sud tunisien ou voyager en toute sécurité avec 7 personnes à bord."
    },
    {
        id: "veh_5",
        brand: "Chery",
        model: "Tiggo 7 Pro",
        category: "SUV",
        transmission: "Automatique",
        fuel: "Essence",
        seats: 5,
        pricePerDay: 195,
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "228 TU 7531",
        description: "SUV moderne avec intérieur spacieux en cuir, toit panoramique et équipements de sécurité à la pointe."
    },
    {
        id: "veh_6",
        brand: "Mercedes-Benz",
        model: "Classe C",
        category: "Luxe",
        transmission: "Automatique",
        fuel: "Diesel",
        seats: 5,
        pricePerDay: 480,
        image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "240 TU 1002",
        description: "Faites sensation lors de vos déplacements professionnels ou événements en Tunisie avec cette berline de grand luxe."
    },
    {
        id: "veh_7",
        brand: "Dacia",
        model: "Lodgy",
        category: "Familiale",
        transmission: "Manuelle",
        fuel: "Diesel",
        seats: 7,
        pricePerDay: 140,
        image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "208 TU 6543",
        description: "Un monospace familial fiable et très économique, parfait pour les séjours de longue durée en famille."
    },
    {
        id: "veh_8",
        brand: "Range Rover",
        model: "Evoque",
        category: "Luxe",
        transmission: "Automatique",
        fuel: "Diesel",
        seats: 5,
        pricePerDay: 520,
        image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=600&q=80",
        status: "Disponible",
        plate: "235 TU 4004",
        description: "Un SUV compact de luxe alliant raffinement britannique, élégance urbaine et performances routières supérieures."
    }
];

const DEFAULT_RESERVATIONS = [
    {
        id: "RES-8924",
        vehicleId: "veh_3",
        pickupLocation: "tunis_aeroport",
        returnLocation: "tunis_aeroport",
        pickupDate: "2026-07-15",
        pickupTime: "10:00",
        returnDate: "2026-07-20",
        returnTime: "10:00",
        days: 5,
        totalPrice: 950,
        status: "Confirmée",
        paymentStatus: "Payée",
        paymentRef: "CP-TX-987123",
        options: {
            assurance: true,
            gps: false,
            siege: true,
            conducteur: false
        },
        client: {
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean.dupont@gmail.com",
            phone: "+33 6 12 34 56 78",
            address: "15 Rue de Rivoli, Paris, France",
            license: "98/FF/12345"
        },
        createdAt: "2026-07-10T14:35:00Z"
    },
    {
        id: "RES-1045",
        vehicleId: "veh_1",
        pickupLocation: "tunis_aeroport",
        returnLocation: "hammamet_centre",
        pickupDate: "2026-07-18",
        pickupTime: "14:00",
        returnDate: "2026-07-25",
        returnTime: "12:00",
        days: 7,
        totalPrice: 870,
        status: "En attente de paiement",
        paymentStatus: "Non payée",
        paymentRef: "",
        options: {
            assurance: false,
            gps: true,
            siege: false,
            conducteur: true
        },
        client: {
            firstName: "Mohamed",
            lastName: "Ben Ali",
            email: "m.benali@outlook.fr",
            phone: "+216 98 765 432",
            address: "El Menzah 5, Tunis, Tunisie",
            license: "02/19485"
        },
        createdAt: "2026-07-12T09:12:00Z"
    }
];

const DEFAULT_BLOCKED_DATES = [
    { id: "block_1", vehicleId: "veh_6", startDate: "2026-07-22", endDate: "2026-07-26", reason: "Maintenance programmée" }
];

const DEFAULT_PAYMENTS = [
    {
        id: "pay_1",
        reservationId: "RES-8924",
        amount: 950,
        method: "Click to Pay",
        reference: "CP-TX-987123",
        date: "2026-07-10T14:40:00Z",
        status: "Réussi"
    }
];

const DB = {
    init() {
        if (!localStorage.getItem("alhatab_locations")) {
            localStorage.setItem("alhatab_locations", JSON.stringify(DEFAULT_LOCATIONS));
        }
        if (!localStorage.getItem("alhatab_vehicles")) {
            localStorage.setItem("alhatab_vehicles", JSON.stringify(DEFAULT_VEHICLES));
        }
        if (!localStorage.getItem("alhatab_reservations")) {
            localStorage.setItem("alhatab_reservations", JSON.stringify(DEFAULT_RESERVATIONS));
        }
        if (!localStorage.getItem("alhatab_blocked_dates")) {
            localStorage.setItem("alhatab_blocked_dates", JSON.stringify(DEFAULT_BLOCKED_DATES));
        }
        if (!localStorage.getItem("alhatab_payments")) {
            localStorage.setItem("alhatab_payments", JSON.stringify(DEFAULT_PAYMENTS));
        }
    },

    // --- LOCATIONS ---
    getLocations() {
        return JSON.parse(localStorage.getItem("alhatab_locations")) || [];
    },

    getLocationById(id) {
        return this.getLocations().find(loc => loc.id === id);
    },

    // --- VEHICLES ---
    getVehicles() {
        return JSON.parse(localStorage.getItem("alhatab_vehicles")) || [];
    },

    getVehicleById(id) {
        return this.getVehicles().find(veh => veh.id === id);
    },

    saveVehicle(vehicle) {
        const vehicles = this.getVehicles();
        const index = vehicles.findIndex(v => v.id === vehicle.id);
        if (index !== -1) {
            vehicles[index] = vehicle;
        } else {
            vehicles.push(vehicle);
        }
        localStorage.setItem("alhatab_vehicles", JSON.stringify(vehicles));
        return vehicle;
    },

    deleteVehicle(id) {
        const vehicles = this.getVehicles();
        const filtered = vehicles.filter(v => v.id !== id);
        localStorage.setItem("alhatab_vehicles", JSON.stringify(filtered));
        return true;
    },

    // --- RESERVATIONS ---
    getReservations() {
        return JSON.parse(localStorage.getItem("alhatab_reservations")) || [];
    },

    getReservationById(id) {
        return this.getReservations().find(res => res.id === id);
    },

    saveReservation(reservation) {
        const reservations = this.getReservations();
        const index = reservations.findIndex(r => r.id === reservation.id);
        if (index !== -1) {
            reservations[index] = reservation;
        } else {
            reservations.push(reservation);
        }
        localStorage.setItem("alhatab_reservations", JSON.stringify(reservations));
        return reservation;
    },

    deleteReservation(id) {
        const reservations = this.getReservations();
        const filtered = reservations.filter(r => r.id !== id);
        localStorage.setItem("alhatab_reservations", JSON.stringify(filtered));
        return true;
    },

    // --- BLOCKED DATES ---
    getBlockedDates() {
        return JSON.parse(localStorage.getItem("alhatab_blocked_dates")) || [];
    },

    getBlockedDatesForVehicle(vehicleId) {
        return this.getBlockedDates().filter(b => b.vehicleId === vehicleId);
    },

    saveBlockedDate(blockedDate) {
        const list = this.getBlockedDates();
        list.push(blockedDate);
        localStorage.setItem("alhatab_blocked_dates", JSON.stringify(list));
        return blockedDate;
    },

    deleteBlockedDate(id) {
        const list = this.getBlockedDates();
        const filtered = list.filter(b => b.id !== id);
        localStorage.setItem("alhatab_blocked_dates", JSON.stringify(filtered));
        return true;
    },

    // --- PAYMENTS ---
    getPayments() {
        return JSON.parse(localStorage.getItem("alhatab_payments")) || [];
    },

    savePayment(payment) {
        const payments = this.getPayments();
        payments.push(payment);
        localStorage.setItem("alhatab_payments", JSON.stringify(payments));
        return payment;
    },

    // --- AVAILABILITY LOGIC ---
    isVehicleAvailable(vehicleId, startDateStr, endDateStr) {
        const vehicles = this.getVehicles();
        const veh = vehicles.find(v => v.id === vehicleId);
        if (!veh || veh.status !== "Disponible") return false;

        const start = new Date(startDateStr);
        const end = new Date(endDateStr);

        // 1. Check administrative blocked dates
        const blocked = this.getBlockedDatesForVehicle(vehicleId);
        for (const b of blocked) {
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            if (start <= bEnd && end >= bStart) {
                return false;
            }
        }

        // 2. Check existing active reservations
        const reservations = this.getReservations().filter(
            r => r.vehicleId === vehicleId && r.status !== "Annulée"
        );
        for (const r of reservations) {
            const rStart = new Date(r.pickupDate);
            const rEnd = new Date(r.returnDate);
            if (start <= rEnd && end >= rStart) {
                return false;
            }
        }

        return true;
    }
};

// Initialize DB immediately
DB.init();

// Export to window so it is accessible in all pages
window.DB = DB;
