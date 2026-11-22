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

  var LOGO =
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<path d="M6 26C6 13 14 6 27 5c0 13-6 21-19 21z" fill="#1F6B45"/>' +
    '<path d="M8 24c5-6 10-10 16-15" stroke="#F3F9F4" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<rect x="2" y="27" width="4" height="4" fill="#F2B134"/>' +
    '<rect x="7" y="27" width="4" height="4" fill="#2E9E5B"/>' +
    '<rect x="2" y="22" width="4" height="4" fill="#2E9E5B"/>' +
    "</svg>";

  var NAV = [
    { href: "learn.html", label: "Learn" },
    { href: "playbyte.html", label: "Play" },
    { href: "heroes.html", label: "Heroes" },
    { href: "about.html", label: "About" },
    { href: "join.html", label: "Join" },
  ];

  function currentPage() {
    var path = location.pathname.split("/").pop() || "index.html";
    if (path.indexOf(".") === -1) path += ".html";
    // The game belongs to the Play section.
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
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">' +
      '<span></span><span class="visually-hidden">Menu</span></button>' +
      '<nav class="nav" id="site-nav" aria-label="Main">' +
      "<ul>" + items +
      '<li><a class="btn btn-accent" href="climate-quest.html">Play Climate Quest</a></li>' +
      "</ul></nav></div></header>";

    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("site-nav");
    function setOpen(open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
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
      '<a class="logo" href="index.html">' + LOGO + "LeafByte</a>" +
      '<p style="margin-top:12px;max-width:40ch">Learn it, play it, build it: the fun way into green computing. Built for students, by students.</p>' +
      "</div>" +
      '<div><h2>Learn</h2><ul>' +
      '<li><a href="learn.html#case-studies">Case studies</a></li>' +
      '<li><a href="learn.html#papers">Research papers</a></li>' +
      '<li><a href="learn.html#basics">Green tech basics</a></li>' +
      '<li><a href="heroes.html">Meet our heroes</a></li>' +
      "</ul></div>" +
      '<div><h2>Play</h2><ul>' +
      '<li><a href="playbyte.html">PlayByte games</a></li>' +
      '<li><a href="climate-quest.html">Climate Quest</a></li>' +
      '<li><a href="join.html">Join the movement</a></li>' +
      "</ul></div>" +
      '<div><h2>About</h2><ul>' +
      '<li><a href="about.html">Mission and team</a></li>' +
      '<li><a href="sources.html">Sources and methods</a></li>' +
      contact +
      "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom">' +
      "<p>&copy; " + new Date().getFullYear() + " LeafByte</p>" +
      '<p><a href="privacy.html">Privacy policy</a> &middot; <a href="terms.html">Terms</a></p>' +
      "</div></div></footer>";
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
