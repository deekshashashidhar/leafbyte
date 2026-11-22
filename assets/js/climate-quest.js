/* Climate Quest: match problems to solutions, learn a sourced fact per match,
   earn seeds, and grow a Hope Garden that is saved in the browser.
   Content lives in data/cards.json and data/heroes.json. */
(function () {
  "use strict";

  var SAVE_KEY = "leafbyte.save.v1";
  var $ = function (id) { return document.getElementById(id); };
  var esc = LB.escape;

  var LEVELS = {
    // energy = how many wrong pairs a player can make before the round ends
    seedling: { name: "Seedling", pairs: 4, maxDifficulty: 1, energy: 6, hints: 2, seconds: 0 },
    sapling: { name: "Sapling", pairs: 6, maxDifficulty: 2, energy: 5, hints: 1, seconds: 0 },
    oldgrowth: { name: "Old Growth", pairs: 8, maxDifficulty: 3, energy: 4, hints: 0, seconds: 120 },
  };

  var PLANTS = [
    { id: "sprout", icon: "🌱", name: "Sprout", cost: 2 },
    { id: "flower", icon: "🌻", name: "Sunflower", cost: 3 },
    { id: "tulip", icon: "🌷", name: "Tulip", cost: 3 },
    { id: "oak", icon: "🌳", name: "Oak tree", cost: 5 },
    { id: "pine", icon: "🌲", name: "Pine tree", cost: 5 },
    { id: "mangrove", icon: "🌴", name: "Mangrove", cost: 6 },
  ];

  var SOLARA = {
    start: [
      "Pick a problem, then the solution that fixes it.",
      "Take your time. Every wrong pair uses a little energy.",
    ],
    right: [
      "Yes! That is exactly right. Read the fact below.",
      "A perfect pair. Your garden thanks you.",
      "Wise choice, seeker. Two more seeds for you.",
      "Correct! Knowledge grows like roots.",
    ],
    wrong: [
      "Not quite. Look again at what causes the problem.",
      "Those two do not belong together. Try another pair.",
      "Hmm, not a match. Your energy dips a little.",
    ],
    lowEnergy: "Careful, your energy is running low.",
    win: "Every pair matched! You have planted real hope today.",
    lose: "The round is over. Rest, then try again. Every attempt teaches something.",
  };

  var defaults = {
    seeds: 0,
    plants: [],
    level: "seedling",
    heroesUnlocked: [],
    factsSeen: [],
    bestScore: 0,
    rounds: 0,
    lastPlayed: null,
    settings: { sound: false, reducedMotion: false, highContrast: false },
  };

  var save = Object.assign({}, defaults, LB.storage.get(SAVE_KEY, {}));
  save.settings = Object.assign({}, defaults.settings, save.settings || {});

  function persist() {
    save.lastPlayed = new Date().toISOString();
    LB.storage.set(SAVE_KEY, save);
  }

  var allCards = [];
  var heroes = [];
  var round = null;
  var timerId = null;

  function seedText(n) {
    return n + (n === 1 ? " seed" : " seeds");
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /* ---------- Sound (generated tones, no audio files) ---------- */
  var audioCtx = null;
  function tone(freq, ms) {
    if (!save.settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + ms / 1000);
    } catch (e) {
      /* sound is optional */
    }
  }

  /* ---------- Tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    var name = tab.id.replace("tab-", "");
    if (name === "garden") renderGarden();
    if (name === "facts") renderFacts();
    if (name === "heroes") renderHeroes();
    if (history.replaceState) history.replaceState(null, "", name === "play" ? location.pathname + location.search : "#" + name);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        selectTab(next, true);
      }
    });
  });

  /* ---------- Settings ---------- */
  function applySettings() {
    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.classList.toggle("reduce-motion", save.settings.reducedMotion || prefersReduced);
    document.body.classList.toggle("high-contrast", save.settings.highContrast);
  }
  var form = $("settings-form");
  ["sound", "reducedMotion", "highContrast"].forEach(function (key) {
    form.elements[key].checked = !!save.settings[key];
    form.elements[key].addEventListener("change", function (e) {
      save.settings[key] = e.target.checked;
      persist();
      applySettings();
      if (key === "sound" && e.target.checked) tone(660, 150);
    });
  });
  $("reset-btn").addEventListener("click", function () {
    if (!window.confirm("Reset your garden, seeds, facts and heroes? This cannot be undone.")) return;
    var settings = save.settings;
    save = Object.assign({}, defaults, { settings: settings, plants: [], heroesUnlocked: [], factsSeen: [] });
    persist();
    $("reset-status").textContent = "Your progress has been reset.";
  });

  /* ---------- Round setup ---------- */
  function topicFilter() {
    var topic = new URLSearchParams(location.search).get("topic");
    return topic ? topic.toLowerCase() : "";
  }

  function chooseCards(levelKey) {
    var level = LEVELS[levelKey];
    var pool = allCards.filter(function (c) { return c.difficulty <= level.maxDifficulty; });
    var topic = topicFilter();
    var chosen = [];
    if (topic) {
      chosen = shuffle(allCards.filter(function (c) { return c.topic === topic; })).slice(0, level.pairs);
    }
    var rest = shuffle(pool.filter(function (c) { return chosen.indexOf(c) === -1; }));
    while (chosen.length < level.pairs && rest.length) chosen.push(rest.shift());
    return chosen;
  }

  function startRound(levelKey) {
    var level = LEVELS[levelKey];
    var cards = chooseCards(levelKey);
    save.level = levelKey;
    persist();
    round = {
      levelKey: levelKey,
      level: level,
      cards: cards,
      matched: [],
      attempts: 0,
      seedsEarned: 0,
      energy: level.energy,
      maxEnergy: level.energy,
      hints: level.hints,
      selected: null,
      secondsLeft: level.seconds,
      over: false,
    };

    $("level-picker").hidden = true;
    $("result").hidden = true;
    $("game").hidden = false;
    $("fact-panel").hidden = true;
    $("hud-level").textContent = level.name;
    $("hud-timer-wrap").hidden = !level.seconds;

    renderColumn("problems", "problem");
    renderColumn("solutions", "solution");
    updateHud();
    say(pick(SOLARA.start));

    clearInterval(timerId);
    if (level.seconds) {
      updateTimer();
      timerId = setInterval(function () {
        round.secondsLeft -= 1;
        updateTimer();
        if (round.secondsLeft <= 0) endRound();
      }, 1000);
    }
    var first = document.querySelector("#problems .choice");
    if (first) first.focus();
  }

  function renderColumn(listId, kind) {
    var list = $(listId);
    list.innerHTML = "";
    shuffle(round.cards).forEach(function (card) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.id = card.id;
      btn.dataset.kind = kind;
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML =
        '<span class="kind">' + (kind === "problem" ? "Problem" : "Solution") + "</span>" +
        "<span>" + esc(kind === "problem" ? card.problem : card.solution) + "</span>";
      btn.addEventListener("click", onChoice);
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function say(text) {
    $("solara").textContent = text;
  }

  function updateHud() {
    $("hud-seeds").textContent = save.seeds;
    $("hud-energy").textContent = round.energy + " / " + round.maxEnergy;
    var energyPct = (round.energy / round.maxEnergy) * 100;
    $("energy-fill").style.width = energyPct + "%";
    $("energy-fill").classList.toggle("low", energyPct <= 25);
    $("energy-meter").setAttribute("aria-valuemax", round.maxEnergy);
    $("energy-meter").setAttribute("aria-valuenow", round.energy);
    $("hud-matches").textContent = round.matched.length + " / " + round.cards.length;
    $("knowledge-fill").style.width = (round.matched.length / round.cards.length) * 100 + "%";
    $("knowledge-meter").setAttribute("aria-valuemax", round.cards.length);
    $("knowledge-meter").setAttribute("aria-valuenow", round.matched.length);
    $("hints-left").textContent = round.hints;
    $("hint-btn").disabled = round.hints <= 0;
  }

  function updateTimer() {
    var s = Math.max(0, round.secondsLeft);
    $("hud-timer").textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  /* ---------- Matching ---------- */
  function onChoice(e) {
    var btn = e.currentTarget;
    if (!round || round.over || btn.classList.contains("matched")) return;
    clearWrong();

    if (!round.selected) {
      select(btn);
      return;
    }
    if (round.selected === btn) {
      unselect();
      return;
    }
    if (round.selected.dataset.kind === btn.dataset.kind) {
      // Same column: switch the selection instead of spending energy.
      unselect();
      select(btn);
      return;
    }

    var a = round.selected;
    round.attempts += 1;
    unselect();

    if (a.dataset.id === btn.dataset.id) {
      onMatch(a, btn);
    } else {
      round.energy -= 1;
      a.classList.add("wrong");
      btn.classList.add("wrong");
      tone(220, 200);
      say(round.energy <= 2 && round.energy > 0 ? SOLARA.lowEnergy : pick(SOLARA.wrong));
      setTimeout(clearWrong, 1200);
    }
    updateHud();
    if (round.matched.length === round.cards.length) endRound();
    else if (round.energy <= 0) endRound();
  }

  function select(btn) {
    round.selected = btn;
    btn.setAttribute("aria-pressed", "true");
  }

  function unselect() {
    if (round.selected) round.selected.setAttribute("aria-pressed", "false");
    round.selected = null;
  }

  function clearWrong() {
    document.querySelectorAll(".choice.wrong").forEach(function (el) { el.classList.remove("wrong"); });
  }

  function onMatch(a, b) {
    var card = round.cards.find(function (c) { return c.id === a.dataset.id; });
    [a, b].forEach(function (el) {
      el.classList.add("matched");
      el.classList.remove("hinted");
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("aria-pressed", "false");
      el.setAttribute("aria-label", (el.dataset.kind === "problem" ? card.problem : card.solution) + ", matched");
    });
    round.matched.push(card.id);
    round.seedsEarned += 2;
    save.seeds += 2;
    if (save.factsSeen.indexOf(card.id) === -1) save.factsSeen.push(card.id);
    persist();
    tone(660, 160);
    say(pick(SOLARA.right));
    showFact(card);
    // Move focus to the next unmatched card so keyboard play flows.
    var next = document.querySelector(".choice:not(.matched)");
    if (next) next.focus();
  }

  function showFact(card) {
    $("fact-panel").hidden = false;
    $("fact-title").textContent = card.problem + " → " + card.solution;
    $("fact-text").textContent = card.fact;
    $("fact-source").innerHTML =
      'Source: <a href="' + esc(card.source.url) + '" target="_blank" rel="noopener">' + esc(card.source.name) +
      "</a> (" + esc(card.source.year) + ")";
  }

  $("hint-btn").addEventListener("click", function () {
    if (!round || round.over || round.hints <= 0) return;
    var remaining = round.cards.filter(function (c) { return round.matched.indexOf(c.id) === -1; });
    if (!remaining.length) return;
    var card = pick(remaining);
    round.hints -= 1;
    document.querySelectorAll('.choice[data-id="' + card.id + '"]').forEach(function (el) { el.classList.add("hinted"); });
    say("Look for the pair I have outlined.");
    updateHud();
  });

  $("quit-btn").addEventListener("click", function () {
    if (round && !round.over) endRound();
  });

  /* ---------- Results ---------- */
  function endRound() {
    if (!round || round.over) return;
    round.over = true;
    clearInterval(timerId);
    var won = round.matched.length === round.cards.length;
    var accuracy = round.attempts ? Math.round((round.matched.length / round.attempts) * 100) : 0;
    var score = round.matched.length * 10 + Math.max(0, round.energy) * 2 + (won ? 20 : 0);
    save.rounds += 1;
    save.bestScore = Math.max(save.bestScore || 0, score);

    var newHero = null;
    if (won && heroes.length) {
      newHero = heroes.find(function (h) { return save.heroesUnlocked.indexOf(h.id) === -1; }) || null;
      if (newHero) save.heroesUnlocked.push(newHero.id);
    }
    persist();

    $("game").hidden = true;
    $("result").hidden = false;
    $("result-title").textContent = won ? "Every pair matched!" : "Round over";
    $("result-summary").textContent =
      (won ? SOLARA.win : SOLARA.lose) + " Score: " + score + " (best " + save.bestScore + ").";
    $("r-matches").textContent = round.matched.length + " / " + round.cards.length;
    $("r-accuracy").textContent = accuracy + "%";
    $("r-seeds").textContent = round.seedsEarned;
    $("r-plants").textContent = save.plants.length;
    renderSnapshot($("r-garden"));

    var topics = [];
    round.cards.forEach(function (c) {
      if (round.matched.indexOf(c.id) !== -1 && topics.indexOf(c.topic) === -1) topics.push(c.topic);
    });
    var learn = topics.slice(0, 3).map(function (t) {
      return '<li><a href="learn.html?topic=' + encodeURIComponent(t) + '#case-studies">Case studies about ' + esc(t.replace("-", " ")) + "</a></li>";
    });
    learn.push('<li><a href="learn.html#papers">Research papers</a></li>');
    $("r-learn").innerHTML = learn.join("");

    $("r-hero").hidden = !newHero;
    if (newHero) {
      $("r-hero").innerHTML = "You met a new climate hero: <strong>" + esc(newHero.name) + "</strong>. " +
        '<a href="heroes.html#' + esc(newHero.id) + '">Read their profile</a>.';
      openHeroDialog(newHero);
    } else {
      $("result").focus();
    }
    round.score = score;
    round.won = won;
  }

  function renderSnapshot(el) {
    if (!save.plants.length) {
      el.innerHTML = '<span class="meta">No plants yet. Spend your seeds in the Hope Garden.</span>';
      return;
    }
    el.innerHTML = save.plants.slice(-24).map(function (p) {
      return '<span class="plant" role="img" aria-label="' + esc(p.name) + '">' + p.icon + "</span>";
    }).join("");
  }

  $("again-btn").addEventListener("click", function () { startRound(round ? round.levelKey : "seedling"); });
  $("plant-btn").addEventListener("click", function () { selectTab($("tab-garden"), true); });

  $("share-btn").addEventListener("click", function () {
    var text = "I matched " + round.matched.length + " of " + round.cards.length +
      " climate problems to their solutions in LeafByte's Climate Quest (" + round.level.name +
      ") and scored " + round.score + ". My Hope Garden has " + save.plants.length + " plants. Can you beat it?";
    var url = location.origin + location.pathname;
    if (navigator.share) {
      navigator.share({ title: "Climate Quest", text: text, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + url).then(
        function () { $("share-status").textContent = "Score copied. Paste it anywhere to share."; },
        function () { $("share-status").textContent = text; }
      );
    } else {
      $("share-status").textContent = text;
    }
  });

  /* ---------- Hero dialog ---------- */
  var lastFocus = null;
  function openHeroDialog(hero) {
    lastFocus = document.activeElement;
    $("hero-dialog-img").src = hero.image.src;
    $("hero-dialog-img").alt = hero.image.alt;
    $("hero-dialog-title").textContent = hero.name;
    $("hero-dialog-text").textContent = hero.knownFor + ".";
    $("hero-dialog-link").href = "heroes.html#" + hero.id;
    $("hero-dialog").hidden = false;
    $("hero-dialog-close").focus();
  }
  function closeHeroDialog() {
    $("hero-dialog").hidden = true;
    $("result").focus();
    lastFocus = null;
  }
  $("hero-dialog-close").addEventListener("click", closeHeroDialog);
  $("hero-dialog").addEventListener("click", function (e) {
    if (e.target === $("hero-dialog")) closeHeroDialog();
  });
  document.addEventListener("keydown", function (e) {
    if ($("hero-dialog").hidden) return;
    if (e.key === "Escape") closeHeroDialog();
    if (e.key === "Tab") {
      // Keep focus inside the dialog.
      var items = [$("hero-dialog-link"), $("hero-dialog-close")];
      var i = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(i + (e.shiftKey ? items.length - 1 : 1)) % items.length].focus();
    }
  });

  /* ---------- Garden ---------- */
  function renderGarden() {
    $("garden-seeds").textContent = save.seeds;
    var garden = $("garden");
    if (!save.plants.length) {
      garden.innerHTML = '<p class="empty-note">Nothing planted yet. Earn seeds by matching cards, then plant below.</p>';
    } else {
      garden.innerHTML = save.plants.map(function (p) {
        return '<span class="plant" role="img" aria-label="' + esc(p.name) + '">' + p.icon + "</span>";
      }).join("");
    }
    $("shop").innerHTML = PLANTS.map(function (p) {
      var disabled = save.seeds < p.cost ? " disabled" : "";
      return '<button type="button" data-plant="' + p.id + '"' + disabled + ">" +
        '<span class="plant" aria-hidden="true">' + p.icon + "</span>" +
        "<span>" + esc(p.name) + "</span><span class=\"meta\">" + p.cost + " seeds</span></button>";
    }).join("");
  }
  $("shop").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-plant]");
    if (!btn || btn.disabled) return;
    var plant = PLANTS.find(function (p) { return p.id === btn.dataset.plant; });
    if (save.seeds < plant.cost) return;
    save.seeds -= plant.cost;
    save.plants.push({ id: plant.id, icon: plant.icon, name: plant.name, planted: new Date().toISOString() });
    persist();
    renderGarden();
    $("shop-status").textContent = "You planted a " + plant.name.toLowerCase() + ". " + seedText(save.seeds) + " left.";
    var again = $("shop").querySelector('[data-plant="' + plant.id + '"]');
    if (again && !again.disabled) again.focus();
  });

  /* ---------- Facts and heroes panels ---------- */
  function renderFacts() {
    var html = allCards.map(function (c) {
      var seen = save.factsSeen.indexOf(c.id) !== -1;
      if (!seen) {
        return '<div class="card fact-card locked"><h3>Locked fact</h3><p>Match "' + esc(c.problem) + '" to unlock it.</p></div>';
      }
      return '<div class="card fact-card"><h3>' + esc(c.problem) + "</h3><p>" + esc(c.fact) + "</p>" + LB.sourceLink(c.source) + "</div>";
    });
    $("facts-list").innerHTML = html.join("") || '<p class="empty">No facts yet.</p>';
  }

  function renderHeroes() {
    var met = heroes.filter(function (h) { return save.heroesUnlocked.indexOf(h.id) !== -1; });
    if (!met.length) {
      $("heroes-list").innerHTML = '<p class="empty">No heroes yet. Finish a round with every pair matched to meet your first.</p>';
      return;
    }
    $("heroes-list").innerHTML = met.map(function (h) {
      return '<article class="card person"><img src="' + esc(h.image.src) + '" alt="' + esc(h.image.alt) + '" loading="lazy" width="330" height="248" />' +
        '<div class="body"><h3>' + esc(h.name) + "</h3><p>" + esc(h.knownFor) + '.</p><p><a href="heroes.html#' + esc(h.id) + '">Read their profile</a></p></div></article>';
    }).join("");
  }

  /* ---------- Boot ---------- */
  document.querySelectorAll(".level").forEach(function (btn) {
    btn.addEventListener("click", function () { startRound(btn.dataset.level); });
  });

  function load() {
    $("loading").hidden = false;
    $("load-error").hidden = true;
    Promise.all([LB.loadJSON("data/cards.json"), LB.loadJSON("data/heroes.json").catch(function () { return { heroes: [] }; })])
      .then(function (results) {
        allCards = results[0].cards || [];
        heroes = results[1].heroes || [];
        if (allCards.length < 4) throw new Error("Not enough cards");
        $("loading").hidden = true;
        var topic = topicFilter();
        if (topic) {
          $("topic-note").hidden = false;
          $("topic-note").textContent = "This round starts with cards about " + topic.replace("-", " ") + ".";
        }
        var hash = location.hash.replace("#", "");
        var tab = hash && $("tab-" + hash);
        if (tab) selectTab(tab);
      })
      .catch(function () {
        $("loading").hidden = true;
        $("load-error").hidden = false;
      });
  }
  $("retry-btn").addEventListener("click", load);

  if (!LB.storage.available) $("storage-notice").hidden = false;
  if (save.rounds > 0) {
    $("solara-intro").textContent = "Welcome back, seeker. Your garden has " + save.plants.length +
      (save.plants.length === 1 ? " plant" : " plants") + " and " + seedText(save.seeds) + " waiting. Ready for another round?";
  }
  applySettings();
  load();
})();
