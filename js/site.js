(function () {
    "use strict";

    document.documentElement.classList.add("js");

    // Footer year
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    // Header border on scroll
    var header = document.querySelector(".site-header");
    function onScroll() {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile nav
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    function setNav(open) {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", function () {
        setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
        if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setNav(false);
    });

    // Active nav link while scrolling
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

    if ("IntersectionObserver" in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (a) { a.classList.remove("is-active"); });
                var link = byId[entry.target.id];
                if (link) link.classList.add("is-active");
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        Object.keys(byId).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) sectionObserver.observe(el);
        });

        // Reveal on scroll
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px" });
        document.querySelectorAll(".card, .case, .timeline > li, .skills-grid > div, .articles li, .process li, .quote")
            .forEach(function (el) {
                el.classList.add("reveal");
                revealObserver.observe(el);
            });
    }

    // Modal helper: close button, backdrop click, scroll lock, focus return
    var hasDialog = typeof HTMLDialogElement === "function";
    function setupModal(modal) {
        var lastTrigger = null;
        modal.querySelector(".resume-modal-close").addEventListener("click", function () {
            modal.close();
        });
        modal.addEventListener("click", function (e) {
            if (e.target === modal) modal.close();
        });
        modal.addEventListener("close", function () {
            document.body.style.overflow = "";
            if (lastTrigger) lastTrigger.focus();
        });
        return function open(trigger) {
            lastTrigger = trigger;
            modal.showModal();
            document.body.style.overflow = "hidden";
        };
    }

    // Resume viewer. Falls back to the plain link where <dialog> is missing, and on
    // touch devices, whose browsers render PDFs in an iframe poorly (often page 1 only).
    var resumeModal = document.getElementById("resume-modal");
    var canEmbedPdf = hasDialog && !window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (resumeModal && canEmbedPdf) {
        var frame = resumeModal.querySelector("iframe");
        var openResume = setupModal(resumeModal);
        document.querySelectorAll(".js-resume").forEach(function (link) {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                if (!frame.src) frame.src = frame.dataset.src;
                openResume(link);
            });
        });
    }

    // Case studies: compact tiles that open the full write-up in a pop-up.
    // Without <dialog> support the full cards stay inline.
    var caseModal = document.getElementById("case-modal");
    var caseGrid = document.querySelector(".case-grid");
    if (caseModal && caseGrid && hasDialog) {
        var caseBody = caseModal.querySelector(".case-modal-body");
        var openCase = setupModal(caseModal);
        caseGrid.classList.add("is-tiled");
        caseGrid.querySelectorAll(".case").forEach(function (tile) {
            tile.setAttribute("tabindex", "0");
            tile.setAttribute("role", "button");
            tile.setAttribute("aria-haspopup", "dialog");
            tile.setAttribute("aria-label", tile.querySelector("h3").textContent + ": read case study");
            function show(e) {
                e.preventDefault();
                caseBody.innerHTML = tile.innerHTML;
                caseBody.querySelector("h3").id = "case-modal-title";
                caseBody.querySelectorAll("details").forEach(function (d) { d.open = true; });
                caseModal.scrollTop = 0;
                openCase(tile);
            }
            tile.addEventListener("click", show);
            tile.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") show(e);
            });
        });
    }

    // Case-study filters
    var filters = document.querySelectorAll(".filter");
    var items = document.querySelectorAll(".case");
    filters.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var cat = btn.dataset.filter;
            filters.forEach(function (b) {
                var on = b === btn;
                b.classList.toggle("is-active", on);
                b.setAttribute("aria-pressed", String(on));
            });
            items.forEach(function (item) {
                var cats = (item.dataset.cat || "").split(" ");
                item.hidden = cat !== "all" && cats.indexOf(cat) === -1;
            });
        });
    });
})();
