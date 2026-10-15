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
        document.querySelectorAll(".card, .case, .career > li, .articles li, .process li, .quote")
            .forEach(function (el) {
                el.classList.add("reveal");
                revealObserver.observe(el);
            });
    }

    // Email links: mailto does nothing for visitors without a default mail app, so
    // also copy the address and offer Gmail in a toast. The mailto still proceeds.
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
    var toastTimer;

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand("copy"); } catch (err) { /* ignore */ }
            document.body.removeChild(ta);
            if (ok) { resolve(); } else { reject(); }
        });
    }

    document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
        link.addEventListener("click", function () {
            var href = link.getAttribute("href");
            var address = href.slice(7).split("?")[0];
            var subject = (href.match(/[?&]subject=([^&]*)/) || [])[1] || "";
            var gmail = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(address) +
                (subject ? "&su=" + subject : "");
            function show(message) {
                toast.innerHTML = "";
                var text = document.createElement("span");
                text.textContent = message;
                var open = document.createElement("a");
                open.href = gmail;
                open.target = "_blank";
                open.rel = "noopener";
                open.textContent = "Open in Gmail";
                toast.appendChild(text);
                toast.appendChild(open);
                toast.classList.add("is-visible");
                clearTimeout(toastTimer);
                toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 6000);
            }
            copyText(address).then(function () {
                show("Email copied: " + address);
            }, function () {
                show(address);
            });
        });
    });

    // Contact form: sent through FormSubmit's AJAX endpoint so visitors stay on the page.
    // Without JS the form still posts to FormSubmit's regular endpoint.
    var form = document.getElementById("contact-form");
    if (form && window.fetch) {
        var status = form.querySelector(".form-status");
        var submit = form.querySelector('button[type="submit"]');
        var topic = document.getElementById("contact-topic");

        // "Discuss an engagement" pre-selects the matching topic
        document.querySelectorAll("[data-topic]").forEach(function (link) {
            link.addEventListener("click", function () { topic.value = link.dataset.topic; });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var data = {};
            new FormData(form).forEach(function (value, key) { data[key] = value; });
            if (data._honey) return;
            data._subject = "Portfolio: " + data.topic + " (" + data.name + ")";
            data._replyto = data.email;

            submit.disabled = true;
            submit.textContent = "Sending…";
            status.className = "form-status";
            status.textContent = "";

            fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(data)
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (body) {
                    if (!res.ok || String(body.success) !== "true") throw { reason: body.message || "" };
                });
            }).then(function () {
                form.reset();
                status.className = "form-status is-ok";
                status.textContent = "Thanks, your message is on its way. I'll get back to you soon.";
            }).catch(function (err) {
                // FormSubmit explains its own refusals (form not yet activated, page opened
                // as a local file), so show its reason before the fallback.
                var reason = location.protocol === "file:"
                    ? "The form only works on the live site, not when the page is opened as a local file."
                    : (err && err.reason) || "";
                status.className = "form-status is-error";
                status.textContent = (reason ? reason + " " : "Sorry, that didn't go through. ") +
                    "You can also email me directly at alakhsharmacs@gmail.com.";
            }).then(function () {
                submit.disabled = false;
                submit.textContent = "Send message";
            });
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

    // Expertise cards jump to the case studies pre-filtered to their domain
    document.querySelectorAll("[data-filter-link]").forEach(function (link) {
        link.addEventListener("click", function () {
            var btn = document.querySelector('.filter[data-filter="' + link.dataset.filterLink + '"]');
            if (btn) btn.click();
        });
    });
})();
