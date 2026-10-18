/* Multi-step level & needs assessment. Results are kept in the browser and
   handed off to the discovery call, booking page and an email to Daniel. */
(function () {
  var cfg = window.SITE_CONFIG;
  var form = document.getElementById("assessment");
  var steps = form.querySelectorAll(".form-step");
  var bars = form.querySelectorAll(".progress span");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var errorEl = document.getElementById("form-error");
  var params = new URLSearchParams(location.search);
  var current = 0;

  var QUIZ = [
    { q: "Could we ___ the meeting to Thursday?", a: ["move", "remove", "displace"], c: 0 },
    { q: "I'd like to ___ on what Maria said earlier.", a: ["build", "built", "building"], c: 0 },
    { q: "Costs have risen, so we're now ___ budget this quarter.", a: ["above of", "over", "beyond of"], c: 1 },
    { q: "Sorry to ___, but could I add one quick point?", a: ["interrupting", "break in you", "interrupt"], c: 2 },
    { q: "The figures are ___ than we forecast.", a: ["significantly lower", "much more low", "very lower"], c: 0 },
    { q: "Which is the most diplomatic way to disagree with a senior colleague?", a: ["That's wrong.", "I see where you're coming from, but I'm not sure it would work for us.", "No, I don't agree with you."], c: 1 },
    { q: "That's a detailed issue, so let's ___ it offline after the call.", a: ["take", "bring", "put"], c: 0 },
    { q: "___ we to accept these terms, our margin would fall below 10%.", a: ["If", "Should", "Were"], c: 2 }
  ];

  // Build quiz markup
  document.getElementById("quiz").innerHTML = QUIZ.map(function (item, i) {
    return '<div class="quiz-q"><p><b>' + String(i + 1).padStart(2, "0") + "</b>" + item.q + '</p><div class="choices" style="grid-template-columns:1fr">' +
      item.a.map(function (opt, j) {
        return '<label class="choice"><input type="radio" name="q' + i + '" value="' + j + '"> ' + opt + "</label>";
      }).join("") + "</div></div>";
  }).join("");

  // Prefill from query string and browser
  var preGoal = { executive: "meetings", presentation: "presentations", interview: "interviews", corporate: "team" }[params.get("programme")];
  if (preGoal) form.querySelector('input[name=goals][value="' + preGoal + '"]').checked = true;
  if (params.get("programme") === "corporate") form.payer.value = "company";
  if (params.get("review")) {
    document.getElementById("assess-title").textContent = "Progress review";
    document.querySelector(".hero .label").textContent = "Step 06 · Progress review";
  }
  try { form.timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
  var saved = window.loadAssessment();
  if (saved) { ["name", "email", "role", "company"].forEach(function (k) { if (saved[k]) form[k].value = saved[k]; }); }

  function show(i, noScroll) {
    steps.forEach(function (s, j) { s.classList.toggle("active", j === i); });
    bars.forEach(function (b, j) { b.classList.toggle("done", j <= i); });
    document.getElementById("progress-label").textContent = "Section " + (i + 1) + " of " + steps.length + " · " + steps[i].getAttribute("data-title");
    prev.hidden = i === 0;
    next.innerHTML = i === steps.length - 1 ? 'See my results <span class="arrow">→</span>' : 'Continue <span class="arrow">→</span>';
    errorEl.textContent = "";
    current = i;
    if (!noScroll) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validate(i) {
    var step = steps[i];
    var bad = Array.prototype.find.call(step.querySelectorAll("input[required]"), function (el) { return !el.checkValidity(); });
    if (bad) { bad.focus(); return "Please complete: " + step.querySelector('label[for="' + bad.id + '"]').textContent.trim() + "."; }
    if (i === 1 && !form.querySelector("input[name=goals]:checked")) return "Please choose at least one goal.";
    if (i === 3) {
      for (var q = 0; q < QUIZ.length; q++) if (!form.querySelector("input[name=q" + q + "]:checked")) return "Please answer question " + (q + 1) + ".";
    }
    return "";
  }

  prev.addEventListener("click", function () { if (current > 0) show(current - 1); });
  next.addEventListener("click", function () {
    var err = validate(current);
    if (err) { errorEl.textContent = err; return; }
    if (current < steps.length - 1) show(current + 1); else finish();
  });

  function level(score) {
    if (score <= 2) return "B1 · Intermediate";
    if (score <= 4) return "B2 · Upper-intermediate";
    if (score <= 6) return "C1 · Advanced";
    return "C2 · Proficient";
  }

  function recommend(d) {
    var g = d.goals;
    if (g.indexOf("team") !== -1) return { id: "corporate", why: "You want to develop a team, so a group programme with company reporting fits best." };
    if (g.indexOf("interviews") !== -1) return { id: "interview", why: "You have a career move ahead, so we'll focus on your story, interview answers and negotiation." };
    if (g.indexOf("presentations") !== -1 && (d.timeframe === "urgent" || g.length <= 2))
      return { id: "presentation", why: "You have a high-stakes presentation to prepare, so a focused sprint gets you ready fastest." };
    return { id: "executive", why: "Your goals cover everyday leadership communication, which ongoing 1:1 coaching builds best." };
  }

  function finish() {
    var d = {
      name: form.name.value.trim(), email: form.email.value.trim(), role: form.role.value.trim(),
      company: form.company.value.trim(), industry: form.industry.value, payer: form.payer.value,
      goals: Array.prototype.map.call(form.querySelectorAll("input[name=goals]:checked"), function (x) { return x.value; }),
      event: form.event.value.trim(), timeframe: form.timeframe.value,
      confidence: { meetings: form.confMeetings.value, presenting: form.confPresent.value, writing: form.confWriting.value, smallTalk: form.confSocial.value },
      frequency: form.frequency.value, timezone: form.timezone.value.trim(),
      availability: form.availability.value.trim(), notes: form.notes.value.trim()
    };
    d.score = QUIZ.reduce(function (s, item, i) {
      return s + (Number(form.querySelector("input[name=q" + i + "]:checked").value) === item.c ? 1 : 0);
    }, 0);
    d.level = level(d.score);
    var rec = recommend(d);
    d.programme = rec.id;
    d.completed = new Date().toISOString();
    window.saveAssessment(d);
    renderResults(d, rec);
  }

  function renderResults(d, rec) {
    var progName = cfg.PROGRAMMES[rec.id];
    document.getElementById("res-hello").textContent = "Thank you, " + d.name.split(" ")[0] + ".";
    document.getElementById("res-programme").textContent = progName;
    document.getElementById("res-why").textContent = rec.why;

    var rows = [
      ["Estimated level", d.level + " (" + d.score + "/8)"],
      ["Role", d.role + (d.company ? ", " + d.company : "")],
      ["Focus areas", d.goals.join(", ")],
      ["Ready by", { urgent: "Within 4 weeks", quarter: "Next 3 months", ongoing: "Ongoing" }[d.timeframe]],
      ["Payment", { self: "Self-funded", company: "Company invoice", unsure: "To be confirmed" }[d.payer]]
    ];
    var dl = document.getElementById("res-summary");
    dl.innerHTML = "";
    rows.forEach(function (r) {
      var dt = document.createElement("dt"); dt.textContent = r[0];
      var dd = document.createElement("dd"); dd.textContent = r[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });

    var body = [
      "Hi Daniel,", "", "Here are my assessment answers ahead of our discovery call.", "",
      "Name: " + d.name, "Email: " + d.email, "Role: " + d.role, "Company: " + (d.company || "-"),
      "Industry: " + d.industry, "Payment: " + rows[4][1], "",
      "Goals: " + d.goals.join(", "), "Upcoming moment: " + (d.event || "-"), "Ready by: " + rows[3][1], "",
      "Confidence (1-5): meetings " + d.confidence.meetings + ", presenting " + d.confidence.presenting +
        ", writing " + d.confidence.writing + ", small talk " + d.confidence.smallTalk,
      "Quick check: " + d.score + "/8 (" + d.level + ")", "Recommended: " + progName, "",
      "Frequency: " + d.frequency, "Time zone: " + (d.timezone || "-"), "Availability: " + (d.availability || "-"),
      "Notes: " + (d.notes || "-")
    ].join("\n");
    document.getElementById("res-email").href = "mailto:" + cfg.email +
      "?subject=" + encodeURIComponent("Assessment: " + d.name + " — " + progName) + "&body=" + encodeURIComponent(body);

    var book = document.getElementById("res-book");
    if (rec.id === "corporate") { book.href = "contact.html?topic=corporate"; book.textContent = "Request a proposal"; }
    else book.href = "book.html?programme=" + rec.id;

    form.hidden = true;
    var res = document.getElementById("results");
    res.hidden = false;
    window.resolveLinks(res);
    res.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("restart").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("results").hidden = true;
    form.hidden = false;
    show(0);
  });

  show(0, true);
})();
