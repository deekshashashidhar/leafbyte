/* Green Code Movement signup: validates the form and stores it in Supabase.
   Set supabaseUrl and supabaseAnonKey in assets/js/config.js to connect it. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.LEAFBYTE_CONFIG || {};
  var connected = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  var form = $("join-form");
  var LAST_KEY = "leafbyte.join.last";
  var GAMES = {
    "power-shift": "Power Shift",
    "chip-cycle": "Chip Cycle",
    "data-trail": "Data Trail",
    ecohackers: "EcoHackers",
    "carbon-coder": "Carbon Coder",
  };

  /* Prefill from links such as join.html?interest=games&game=power-shift */
  var params = new URLSearchParams(location.search);
  ["role", "interest"].forEach(function (key) {
    var value = params.get(key);
    if (value && form.elements[key].querySelector('option[value="' + CSS.escape(value) + '"]')) form.elements[key].value = value;
  });
  var game = GAMES[params.get("game")];
  if (game) {
    $("game-note").hidden = false;
    $("game-note").textContent = "We will email you when " + game + " is ready to play, and count your vote for it to be built next.";
    form.elements.contribution.value = "Notify me about " + game + ".";
  }

  if (!connected) $("not-connected").hidden = false;

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(name, message) {
    var input = form.elements[name];
    var el = $(name + "-error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    el.hidden = !message;
    el.textContent = message || "";
  }

  function validate() {
    var v = form.elements;
    var errors = {
      name: v.name.value.trim().length < 2 ? "Please enter your name." : "",
      email: !EMAIL.test(v.email.value.trim()) ? "Please enter a valid email address, like name@example.com." : "",
      role: !v.role.value ? "Please choose what describes you best." : "",
      interest: !v.interest.value ? "Please choose what you are interested in." : "",
      consent: !v.consent.checked ? "Please tick the box so we can store your details and email you." : "",
    };
    var first = null;
    Object.keys(errors).forEach(function (k) {
      setError(k, errors[k]);
      if (errors[k] && !first) first = k;
    });
    if (first) form.elements[first].focus();
    return !first;
  }

  ["name", "email", "role", "interest", "consent"].forEach(function (name) {
    form.elements[name].addEventListener("change", function () {
      if (form.elements[name].getAttribute("aria-invalid") === "true") validate();
    });
  });

  function showFormError(message) {
    $("form-error").hidden = !message;
    $("form-error").textContent = message || "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    showFormError("");
    if (!validate()) return;

    // Bots fill the hidden field; humans never see it.
    if (form.elements.website.value) {
      location.href = "thank-you.html";
      return;
    }

    if (!connected) {
      showFormError("Sign-ups are not open yet, so we could not save your details. Please try again soon.");
      return;
    }

    var last = LB.storage.get(LAST_KEY, 0);
    if (Date.now() - last < 60 * 1000) {
      showFormError("You just signed up. Please wait a minute before sending another form.");
      return;
    }

    var v = form.elements;
    var body = {
      name: v.name.value.trim(),
      email: v.email.value.trim().toLowerCase(),
      role: v.role.value,
      country: v.country.value.trim() || null,
      interest: v.interest.value,
      volunteer_role: v.volunteer_role.value || null,
      contribution: v.contribution.value.trim() || null,
      consent: true,
      source_page: params.get("game") ? "notify:" + params.get("game") : "join",
    };

    var button = $("submit-btn");
    button.disabled = true;
    button.textContent = "Joining…";

    fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/members", {
      method: "POST",
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: "Bearer " + cfg.supabaseAnonKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (res.ok) {
          LB.storage.set(LAST_KEY, Date.now());
          location.href = "thank-you.html";
          return;
        }
        if (res.status === 409) throw new Error("This email address has already joined. Thank you!");
        throw new Error("Something went wrong on our side, so your details were not saved. Please try again in a few minutes.");
      })
      .catch(function (err) {
        var offline = err instanceof TypeError;
        showFormError(offline ? "We could not reach the server. Check your connection and try again." : err.message);
        button.disabled = false;
        button.textContent = "Join the movement";
      });
  });
})();
