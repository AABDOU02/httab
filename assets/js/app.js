/**
 * app.js - Common JS for Alhatab Rent Car
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sticky Header
    const header = document.querySelector("header");
    if (header) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
        // Run once on load to handle refreshed pages that start scrolled
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        }
    }

    // 2. Mobile Menu / Burger
    const burger = document.querySelector(".burger");
    const navLinks = document.querySelector(".nav-links");
    
    if (burger && navLinks) {
        burger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            
            // Animate burger lines
            const spans = burger.querySelectorAll("span");
            if (navLinks.classList.contains("active")) {
                spans[0].style.transform = "rotate(45deg) translate(6px, 6px)";
                spans[1].style.opacity = "0";
                spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
            } else {
                spans[0].style.transform = "none";
                spans[1].style.opacity = "1";
                spans[2].style.transform = "none";
            }
        });
    }

    // 3. Set Active Page Menu Link
    const currentPath = window.location.pathname.split("/").pop();
    const menuLinks = document.querySelectorAll(".nav-links a");
    menuLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (currentPath === linkPath || (currentPath === "" && linkPath === "index.html")) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // 4. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navLinks && navLinks.classList.contains("active")) {
                    burger.click();
                }
            }
        });
    });
});

// --- GLOBAL UTILITIES ---

// Format price in Tunisian Dinar (DT)
function formatPrice(amount) {
    return `${amount} DT`;
}

// Calculate days between two dates
function calculateDays(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Difference in milliseconds
    const diffTime = Math.abs(end - start);
    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays || 1; // Minimum 1 day
}

// Toast notification helper
function showToast(message, type = "success") {
    // Check if toast container already exists
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        container.style.position = "fixed";
        container.style.bottom = "24px";
        container.style.right = "24px";
        container.style.zIndex = "9999";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast glass`;
    toast.style.padding = "16px 24px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
    toast.style.borderLeft = `4px solid ${type === "success" ? "#10b981" : "#ef4444"}`;
    toast.style.color = "#ffffff";
    toast.style.animation = "slideIn 0.3s ease";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "12px";

    // Add CSS animations to document if not already there
    if (!document.getElementById("toast-animations")) {
        const style = document.createElement("style");
        style.id = "toast-animations";
        style.innerHTML = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }

    // Icon SVGs
    const successIcon = `<svg style="width:18px;height:18px;color:#10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    const errorIcon = `<svg style="width:18px;height:18px;color:#ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    toast.innerHTML = `
        ${type === "success" ? successIcon : errorIcon}
        <div>${message}</div>
    `;

    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 4000);
}

// Export utilities
window.formatPrice = formatPrice;
window.calculateDays = calculateDays;
window.showToast = showToast;
