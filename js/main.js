/* Shared behaviour: header, menu, footer and link resolution for every page. */
(function () {
  var cfg = window.SITE_CONFIG || { LINKS: {}, PRICES: {}, PROGRAMMES: {} };
  var page = document.body.getAttribute("data-page") || "";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) document.documentElement.classList.add("js");

  var NAV = [
    { href: "index.html", label: "Home", id: "home" },
    { href: "programmes.html", label: "Programmes", id: "programmes" },
    { href: "training.html", label: "Team training", id: "training" },
    { href: "process.html", label: "How it works", id: "process" },
    { href: "assessment.html", label: "Free English Roadmap", id: "assessment" },
    { href: "about.html", label: "About Daniel", id: "about" },
    { href: "contact.html", label: "Contact", id: "contact" }
  ];

  // Stored assessment results, used to prefill booking links and the booking page.
  window.loadAssessment = function () {
    try { return JSON.parse(localStorage.getItem("dl-assessment") || "null"); } catch (e) { return null; }
  };
  window.saveAssessment = function (data) {
    try { localStorage.setItem("dl-assessment", JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  };

  function renderHeader() {
    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML =
      '<div class="container nav">' +
        '<a class="logo" href="index.html" aria-label="Daniel Lambert — home">lambert<small>Executive English</small></a>' +
        '<div class="nav-actions">' +
          '<a class="btn btn--sm" data-link="discovery">Book a Call</a>' +
          '<button class="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu"><span></span></button>' +
        "</div>" +
      "</div>";

    var menu = document.createElement("nav");
    menu.className = "menu";
    menu.id = "site-menu";
    menu.setAttribute("aria-label", "Main");
    menu.innerHTML =
      '<div class="container"><ol>' +
      NAV.map(function (n) {
        return '<li><a href="' + n.href + '"' + (n.id === page ? ' aria-current="page"' : "") + ">" + n.label + "</a></li>";
      }).join("") +
      '</ol><div class="menu-foot"><a class="text-link" data-link="discovery">Book a free discovery call</a>' +
      '<a class="text-link" data-link="linkedin">LinkedIn</a>' +
      '<a class="text-link" href="mailto:' + cfg.email + '">' + cfg.email + "</a></div></div>";

    document.body.prepend(menu);
    document.body.prepend(header);

    var btn = header.querySelector(".menu-btn");
    btn.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) btn.click();
    });
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    }, { passive: true });
  }

  function renderFooter() {
    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML =
      '<div class="container">' +
        '<div class="footer-top">' +
          '<div><a class="logo" href="index.html">lambert</a>' +
            '<p style="margin-top:16px;max-width:36ch">Executive English and business communication coaching for leaders who work in English every day.</p>' +
            '<a class="btn btn--sm" data-link="discovery">Book a Call <span class="arrow">→</span></a></div>' +
          '<div><h4>The process</h4><ul>' +
            '<li><a data-link="discovery">01 Discovery call</a></li>' +
            '<li><a href="assessment.html">02 Roadmap &amp; Test 1</a></li>' +
            '<li><a href="process.html#plan">03 Your plan</a></li>' +
            '<li><a href="book.html">04 Book &amp; set up</a></li>' +
            '<li><a href="process.html#coaching">05 Training sprints</a></li>' +
            '<li><a href="process.html#midpoint">06 Test 2 · Mid-point</a></li>' +
            '<li><a href="process.html#apply">07 Application</a></li>' +
            '<li><a href="process.html#review">08 Test 3 · Final report</a></li>' +
          "</ul></div>" +
          '<div><h4>Site</h4><ul>' +
            NAV.map(function (n) { return '<li><a href="' + n.href + '">' + n.label + "</a></li>"; }).join("") +
            '<li><a data-link="linkedin">LinkedIn</a></li>' +
          "</ul></div>" +
        "</div>" +
        '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + " " + cfg.brand + "</span>" +
          '<a href="mailto:' + cfg.email + '">' + cfg.email + "</a></div>" +
      "</div>";
    document.body.appendChild(footer);
  }

  // Booking tools such as Calendly accept name/email query params to prefill their forms.
  function withPrefill(url, key) {
    var a = window.loadAssessment();
    if (!a || !/^(discovery|book-)/.test(key) || !/^https?:/.test(url)) return url;
    var params = [];
    if (a.name) params.push("name=" + encodeURIComponent(a.name));
    if (a.email) params.push("email=" + encodeURIComponent(a.email));
    if (!params.length) return url;
    return url + (url.indexOf("?") === -1 ? "?" : "&") + params.join("&");
  }

  window.resolveLinks = function (root) {
    (root || document).querySelectorAll("[data-link]").forEach(function (el) {
      var key = el.getAttribute("data-link");
      var url = cfg.LINKS[key];
      if (url) {
        el.href = withPrefill(url, key);
        if (/^https?:/.test(url)) { el.target = "_blank"; el.rel = "noopener"; }
      } else {
        el.href = el.getAttribute("data-fallback") || "contact.html?topic=" + encodeURIComponent(key);
      }
    });
    (root || document).querySelectorAll("[data-price]").forEach(function (el) {
      el.textContent = cfg.PRICES[el.getAttribute("data-price")] || "";
    });
  };

  // Show the LinkedIn follower count only when one is configured.
  document.querySelectorAll("[data-followers]").forEach(function (el) {
    if (cfg.linkedinFollowers) el.textContent = "Join " + cfg.linkedinFollowers + " followers";
    else el.hidden = true;
  });

  // Fade sections in as they scroll into view.
  function reveal() {
    if (!document.documentElement.classList.contains("js")) return;
    var selectors = ".hero h1, .hero .lead, .hero .btn-row, .hero-meta, .section-head, .split > *, .rule-grid, .rule-cell, " +
      ".offer, .steps li, .strip a, .timeline, .measure-grid > div, .faq details, .ticks li, .cta-band h2";
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(selectors).forEach(function (el) {
      var siblings = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.classList.add("reveal");
      el.style.setProperty("--d", (siblings % 4) * 90 + "ms");
      io.observe(el);
    });
    // Rule grids and the timeline animate their own parts rather than fading in as a block.
    document.querySelectorAll(".rule-grid.reveal, .timeline.reveal").forEach(function (el) { el.classList.remove("reveal"); });
  }

  renderHeader();
  renderFooter();
  window.resolveLinks();
  reveal();
})();
