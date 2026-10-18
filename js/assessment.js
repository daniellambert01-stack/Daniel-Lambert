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
    document.querySelector(".hero .label").textContent = "Step 06 · Progress review · Refresh your Roadmap";
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

  // 30/60/90-day actions per goal: build the language, use it for real, perform under pressure.
  var PLAN = {
    meetings: ["Build a phrase toolkit for opening, interrupting and summarising", "Chair or co-lead one meeting a week in English and review it", "Lead high-stakes meetings without scripted notes"],
    presentations: ["Rewrite your next deck's storyline and key lines in clear executive English", "Rehearse it out loud, recorded, with feedback on pace and emphasis", "Deliver it and handle off-script Q&A with confidence"],
    negotiation: ["Learn the language of proposals, concessions and conditions", "Role-play your next real negotiation, including the hard moments", "Negotiate in English while holding your position and the relationship"],
    writing: ["Set up templates for your five most frequent email types", "Cut email writing time with shorter, clearer drafts reviewed weekly", "Write reports and updates that senior readers act on first time"],
    networking: ["Prepare a natural self-introduction and three go-to small-talk topics", "Use them at one event or informal call each week", "Build rapport easily with native speakers in any setting"],
    interviews: ["Shape your career story and 8–10 core answers in English", "Run mock interviews with detailed feedback", "Walk into the real interview and the offer negotiation fully prepared"],
    team: ["Survey the team and interview key stakeholders to set priorities", "Run workshops on the team's real meetings, decks and emails", "Embed new habits with follow-up coaching and a progress report"],
    pronunciation: ["Identify the 3–5 sounds and stress patterns that affect clarity most", "Practise them daily on your own presentation and meeting material", "Speak at a natural pace and be understood first time on every call"]
  };

  function buildPlan(d) {
    var focus = d.goals.slice(0, 2);
    var base = { "B1": "Daily 15-minute listening and shadowing to build fluency", "B2": "Upgrade everyday phrases to more precise, senior-sounding alternatives", "C1": "Polish nuance, tone and diplomacy for senior audiences", "C2": "Fine-tune impact, storytelling and presence" }[d.level.slice(0, 2)];
    return [0, 1, 2].map(function (i) {
      var items = focus.map(function (g) { return PLAN[g][i]; });
      if (i === 0) items.push(base);
      if (i === 2) items.push("Progress review: refresh your Roadmap and compare with today's results");
      return items;
    });
  }

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
    d.plan = buildPlan(d);
    d.completed = new Date().toISOString();
    window.saveAssessment(d);
    renderResults(d, rec);
    sendToCoach(d);
  }

  // Optionally deliver the answers straight to Daniel's inbox (see formEndpoint in config.js).
  function sendToCoach(d) {
    if (!cfg.formEndpoint) return;
    var status = document.getElementById("res-email-status");
    var payload = {
      _subject: "English Roadmap: " + d.name + " — " + cfg.PROGRAMMES[d.programme],
      name: d.name, email: d.email, role: d.role, company: d.company || "-", industry: d.industry,
      payment: d.payer, goals: d.goals.join(", "), upcoming: d.event || "-", ready_by: d.timeframe,
      confidence: "meetings " + d.confidence.meetings + ", presenting " + d.confidence.presenting +
        ", writing " + d.confidence.writing + ", small talk " + d.confidence.smallTalk,
      quick_check: d.score + "/8 (" + d.level + ")", recommended: cfg.PROGRAMMES[d.programme],
      frequency: d.frequency, timezone: d.timezone || "-", availability: d.availability || "-", notes: d.notes || "-",
      plan_30: d.plan[0].join("; "), plan_60: d.plan[1].join("; "), plan_90: d.plan[2].join("; ")
    };
    fetch(cfg.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      status.innerHTML = "<strong>Your answers have been sent to Daniel.</strong>";
    }).catch(function () { /* the email button remains as the fallback */ });
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

    var planEl = document.getElementById("res-plan");
    planEl.innerHTML = "";
    ["First 30 days", "Days 31–60", "Days 61–90"].forEach(function (title, i) {
      var cell = document.createElement("div");
      cell.className = "rule-cell";
      var h = document.createElement("span"); h.className = "label"; h.textContent = title;
      var ul = document.createElement("ul"); ul.style.cssText = "margin:0;padding-left:1.1em;font-size:1rem";
      d.plan[i].forEach(function (t) { var li = document.createElement("li"); li.textContent = t; li.style.marginBottom = "8px"; ul.appendChild(li); });
      cell.appendChild(h); cell.appendChild(ul); planEl.appendChild(cell);
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
      "Notes: " + (d.notes || "-"), "",
      "My 30/60/90-day plan:",
      "30 days: " + d.plan[0].join("; "), "60 days: " + d.plan[1].join("; "), "90 days: " + d.plan[2].join("; ")
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
