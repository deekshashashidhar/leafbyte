/* Learn hub: renders case studies and papers from data/resources.json,
   with search, topic filters and tabs that follow the URL. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var esc = LB.escape;
  var TOPIC_LABELS = {
    "data-centres": "Data centres",
    energy: "Energy",
    ai: "AI",
    hardware: "Hardware",
    nature: "Nature",
    oceans: "Oceans",
    climate: "Climate",
    policy: "Policy",
  };

  var params = new URLSearchParams(location.search);
  var state = { q: params.get("q") || "", topic: params.get("topic") || "", tab: "case-studies" };
  var resources = [];

  /* Tabs */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(name, focus) {
    var tab = $("tab-" + name) || tabs[0];
    state.tab = tab.id.replace("tab-", "");
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
    $("filters").hidden = state.tab === "basics";
    $("result-count").hidden = state.tab === "basics";
    if (focus) tab.focus();
    syncUrl();
    render();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab.id.replace("tab-", "")); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) {
        e.preventDefault();
        selectTab(next.id.replace("tab-", ""), true);
      }
    });
  });

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.topic) p.set("topic", state.topic);
    var qs = p.toString();
    if (history.replaceState) history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + "#" + state.tab);
  }

  /* Filters */
  function renderChips() {
    var html = ['<button class="chip" type="button" data-topic="" aria-pressed="' + (!state.topic) + '">All topics</button>'];
    Object.keys(TOPIC_LABELS).forEach(function (t) {
      html.push('<button class="chip" type="button" data-topic="' + t + '" aria-pressed="' + (state.topic === t) + '">' + TOPIC_LABELS[t] + "</button>");
    });
    $("topic-chips").innerHTML = html.join("");
  }
  $("topic-chips").addEventListener("click", function (e) {
    var chip = e.target.closest("[data-topic]");
    if (!chip) return;
    state.topic = chip.dataset.topic;
    renderChips();
    syncUrl();
    render();
  });
  $("search").value = state.q;
  $("search").addEventListener("input", function (e) {
    state.q = e.target.value.trim();
    syncUrl();
    render();
  });

  function matches(r) {
    if (state.topic && r.topics.indexOf(state.topic) === -1) return false;
    if (!state.q) return true;
    var hay = [r.title, r.region, r.what, r.how, r.impact, r.summary, r.why, r.authors].join(" ").toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (word) { return hay.indexOf(word) !== -1; });
  }

  function tags(r) {
    return '<div class="tags">' + r.topics.map(function (t) {
      return '<span class="tag">' + esc(TOPIC_LABELS[t] || t) + "</span>";
    }).join("") + "</div>";
  }

  function sourceLine(r) {
    return '<a href="' + esc(r.source.url) + '" target="_blank" rel="noopener">Read the source: ' + esc(r.source.name) + "</a>";
  }

  function caseCard(r) {
    return (
      '<article class="card resource" id="' + esc(r.id) + '">' + tags(r) +
      '<h3 style="margin-top:8px">' + esc(r.title) + "</h3>" +
      "<p>" + esc(r.what) + ".</p>" +
      "<dl><div><dt>Region</dt><dd>" + esc(r.region) + "</dd></div>" +
      "<div><dt>How it works</dt><dd>" + esc(r.how) + "</dd></div>" +
      "<div><dt>Impact</dt><dd>" + esc(r.impact) + "</dd></div></dl>" +
      '<p class="limitation"><strong>Limitation:</strong> ' + esc(r.limitation) + "</p>" +
      (r.correction ? '<p class="meta" style="margin-top:8px"><strong>Correction:</strong> ' + esc(r.correction) + "</p>" : "") +
      "<footer><span>" + sourceLine(r) + '</span><span class="meta">' + esc(r.date) + " · checked " + esc(r.lastChecked) + "</span></footer>" +
      '<p style="margin-top:12px"><a class="btn btn-ghost" href="climate-quest.html?topic=' + esc(r.topics[0]) + '">Try it in Climate Quest</a></p>' +
      "</article>"
    );
  }

  function paperCard(r) {
    return (
      '<article class="card resource" id="' + esc(r.id) + '">' +
      '<div class="tags"><span class="tag ' + (r.level === "Advanced" ? "tag-accent" : "") + '">' + esc(r.level) + "</span>" +
      '<span class="tag tag-muted">' + esc(r.readingTime) + "</span></div>" +
      '<h3 style="margin-top:8px">' + esc(r.title) + "</h3>" +
      '<p class="meta">' + esc(r.authors) + " · " + esc(r.date) + "</p>" +
      '<p style="margin-top:8px">' + esc(r.summary) + "</p>" +
      '<p class="limitation"><strong>Why it matters:</strong> ' + esc(r.why) + "</p>" +
      '<footer><a class="btn btn-primary" href="' + esc(r.source.url) + '" target="_blank" rel="noopener">Read the paper</a>' +
      '<span class="meta">' + esc(r.source.name) + " · checked " + esc(r.lastChecked) + "</span></footer>" +
      "</article>"
    );
  }

  function render() {
    if (!resources.length || state.tab === "basics") return;
    var type = state.tab === "papers" ? "paper" : "case-study";
    var list = resources.filter(function (r) { return r.type === type && matches(r); });
    var target = type === "paper" ? $("paper-list") : $("case-list");
    target.innerHTML = list.length
      ? list.map(type === "paper" ? paperCard : caseCard).join("")
      : '<p class="empty">Nothing matches that search. <button class="chip" type="button" id="clear-filters">Clear filters</button></p>';
    $("result-count").textContent = list.length + (list.length === 1 ? " result" : " results");
    var clear = $("clear-filters");
    if (clear) {
      clear.addEventListener("click", function () {
        state.q = "";
        state.topic = "";
        $("search").value = "";
        renderChips();
        syncUrl();
        render();
      });
    }
  }

  renderChips();
  var initial = location.hash.replace("#", "");
  selectTab(["case-studies", "papers", "basics"].indexOf(initial) !== -1 ? initial : "case-studies");

  LB.loadJSON("data/resources.json")
    .then(function (data) {
      resources = data.resources || [];
      $("reviewed").textContent = "Last reviewed " + data.lastReviewed + ". Spotted an error? Tell us through the Join page.";
      render();
    })
    .catch(function () {
      var msg = '<div class="notice notice-error">We could not load the lessons. Check your connection and refresh the page.</div>';
      $("case-list").innerHTML = msg;
      $("paper-list").innerHTML = msg;
    });
})();
