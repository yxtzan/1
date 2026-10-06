(function () {
  var root = document.documentElement;
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  var themeBtn = document.getElementById("themeToggle");
  var themeLabel = themeBtn.querySelector(".theme-label");
  var today = document.getElementById("today");
  var clock = document.getElementById("clock");
  var year = document.getElementById("year");
  var mail = document.getElementById("mail");
  var mailHint = document.getElementById("mailHint");

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function tick() {
    var now = new Date();
    today.textContent = now.getFullYear() + "." + pad(now.getMonth() + 1) + "." + pad(now.getDate());
    clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
    year.textContent = String(now.getFullYear());
  }
  tick();
  setInterval(tick, 15000);

  function applyTheme(theme) {
    var dark = theme === "dark";
    if (dark) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
    themeLabel.textContent = dark ? "日间" : "夜间";
  }

  var saved = localStorage.getItem("site-theme");
  if (saved) applyTheme(saved);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) applyTheme("dark");

  themeBtn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("site-theme", next);
  });

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 8);
    var current = "";
    Array.prototype.forEach.call(document.querySelectorAll("main section[id]"), function (sec) {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    Array.prototype.forEach.call(links.querySelectorAll("a"), function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.getElementById("workList").addEventListener("click", function (e) {
    var btn = e.target.closest(".work-toggle");
    if (!btn) return;
    var item = btn.parentElement;
    var open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  mail.addEventListener("click", function () {
    var address = mail.getAttribute("data-mail");
    var done = function () {
      mail.classList.add("copied");
      mailHint.textContent = "已复制";
      setTimeout(function () {
        mail.classList.remove("copied");
        mailHint.textContent = "点击复制";
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(done).catch(done);
    } else {
      done();
    }
  });
})();
