/* Shared site shell: header, footer, menu and small helpers.
   Edit the header or footer once here and every page updates. */
(function () {
  "use strict";

  var CONFIG = (window.LEAFBYTE_CONFIG = Object.assign(
    {
      // Optional: an address for the footer's Contact link. Leave empty to hide it.
      contactEmail: "",
    },
    window.LEAFBYTE_CONFIG || {}
  ));

  // Icons, as on the original site.
  (function loadIcons() {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    link.crossOrigin = "anonymous";
    link.referrerPolicy = "no-referrer";
    document.head.appendChild(link);
  })();

  var LOGO = '<i class="fas fa-leaf" aria-hidden="true"></i>';

  var NAV = [
    { href: "index.html", label: "Home" },
    { href: "index.html#features", label: "Solutions" },
    { href: "playbyte.html", label: "PlayByte" },
    { href: "learn.html", label: "Resources" },
    { href: "heroes.html", label: "Heroes" },
    { href: "index.html#join", label: "Join Us" },
  ];

  function currentPage() {
    var path = location.pathname.split("/").pop() || "index.html";
    if (path.indexOf(".") === -1) path += ".html";
    // The game belongs to the PlayByte section.
    if (path === "climate-quest.html") return "playbyte.html";
    return path;
  }

  function renderHeader() {
    var slot = document.getElementById("site-header");
    if (!slot) return;
    var here = currentPage();
    var items = NAV.map(function (item) {
      var current = item.href === here ? ' aria-current="page"' : "";
      return '<li><a href="' + item.href + '"' + current + ">" + item.label + "</a></li>";
    }).join("");
    slot.outerHTML =
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<header class="site-header" id="header">' +
      '<div class="container">' +
      '<a class="logo" href="index.html">' + LOGO + "LeafByte</a>" +
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">' +
      '<i class="fas fa-bars" aria-hidden="true"></i></button>' +
      '<nav class="nav" id="site-nav" aria-label="Main">' +
      "<ul>" + items + "</ul></nav></div></header>";

    var header = document.getElementById("header");
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("site-nav");

    // Transparent over the photo or gradient at the top, white once scrolled.
    var ticking = false;
    function onScroll() {
      header.classList.toggle("scrolled", window.scrollY > 60);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });
    onScroll();

    function setOpen(open) {
      nav.classList.toggle("open", open);
      header.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      toggle.querySelector("i").className = open ? "fas fa-times" : "fas fa-bars";
    }
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    // Links to a section on this same page (for example index.html#join):
    // scroll there directly, so closing the menu cannot interrupt the jump.
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href*="#"]');
      if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var url = new URL(link.href, location.href);
      if (url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      setOpen(false);
      if (history.pushState) history.pushState(null, "", url.hash);
      target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  }

  function renderFooter() {
    var slot = document.getElementById("site-footer");
    if (!slot) return;
    var contact = CONFIG.contactEmail
      ? '<li><a href="mailto:' + CONFIG.contactEmail + '">Contact</a></li>'
      : '<li><a href="join.html?interest=contact">Contact</a></li>';
    slot.outerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      "<div>" +
      "<h2>LeafByte</h2>" +
      "<p>Bridging the gap between AI and technological innovation with environmental responsibility for a sustainable digital future.</p>" +
      "</div>" +
      "<div><h2>Resources</h2><ul>" +
      '<li><a href="learn.html#papers">Research Papers</a></li>' +
      '<li><a href="learn.html#case-studies">Case Studies</a></li>' +
      '<li><a href="heroes.html">Meet Our Heroes</a></li>' +
      '<li><a href="learn.html#basics">More About Sustainable Tech</a></li>' +
      "</ul></div>" +
      "<div><h2>PlayByte</h2><ul>" +
      '<li><a href="playbyte.html">All games</a></li>' +
      '<li><a href="climate-quest.html">Climate Quest</a></li>' +
      '<li><a href="index.html#join">Join the Movement</a></li>' +
      "</ul></div>" +
      "<div><h2>About Us</h2><ul>" +
      '<li><a href="about.html">Our Team</a></li>' +
      '<li><a href="sources.html">Sources &amp; Methods</a></li>' +
      contact +
      "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom"><p>' +
      "&copy; " + new Date().getFullYear() + " LeafByte. All rights reserved. | " +
      '<a href="privacy.html">Privacy Policy</a> | <a href="terms.html">Terms of Service</a>' +
      "</p></div></div></footer>";
  }

  /* Helpers shared by page scripts */
  var LB = (window.LB = window.LB || {});

  LB.escape = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  LB.loadJSON = function (url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("Could not load " + url + " (" + res.status + ")");
      return res.json();
    });
  };

  /* Storage that survives being blocked (private mode, strict settings). */
  LB.storage = (function () {
    var ok = false;
    try {
      var k = "__lb_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      ok = true;
    } catch (e) {
      ok = false;
    }
    var memory = {};
    return {
      available: ok,
      get: function (key, fallback) {
        try {
          var raw = ok ? window.localStorage.getItem(key) : memory[key];
          return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
          return fallback;
        }
      },
      set: function (key, value) {
        var raw = JSON.stringify(value);
        try {
          if (ok) window.localStorage.setItem(key, raw);
          else memory[key] = raw;
        } catch (e) {
          memory[key] = raw;
        }
      },
    };
  })();

  LB.sourceLink = function (source) {
    if (!source || !source.url) return "";
    return (
      '<p class="source">Source: <a href="' + LB.escape(source.url) + '" target="_blank" rel="noopener">' +
      LB.escape(source.name) + "</a>" + (source.year ? " (" + LB.escape(source.year) + ")" : "") + "</p>"
    );
  };

  renderHeader();
  renderFooter();
})();
