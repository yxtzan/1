/* ============================================================
   蒸汽智械 · 交互与动效
   纯原生 JS：齿轮生成 / 蒸汽粒子 / 仪表盘 / 滚动动画
   ============================================================ */

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- 1. 齿轮工厂：程序化生成 SVG 齿轮 ---------- */
  function gearSVG(opts) {
    var teeth   = opts.teeth || 12;
    var r       = opts.r || 60;
    var toothH  = opts.toothH || Math.max(8, r * 0.18);
    var fill    = opts.fill || '#E8B84B';
    var stroke  = opts.stroke || '#8A6420';

    var size = (r + toothH) * 2 + 6;
    var c    = size / 2;
    var pitch = (Math.PI * 2) / teeth;
    var d = '';

    function pt(ang, radius) {
      return (c + Math.cos(ang) * radius).toFixed(2) + ' ' + (c + Math.sin(ang) * radius).toFixed(2);
    }

    for (var i = 0; i < teeth; i++) {
      var a = i * pitch;
      d += (i === 0 ? 'M ' : 'L ') + pt(a, r) + ' ';
      d += 'L ' + pt(a + pitch * 0.16, r + toothH) + ' ';
      d += 'L ' + pt(a + pitch * 0.38, r + toothH) + ' ';
      d += 'L ' + pt(a + pitch * 0.54, r) + ' ';
    }
    d += 'Z ';

    // 中心孔（evenodd 挖空）
    var ri = r * 0.52;
    d += 'M ' + (c + ri) + ' ' + c + ' ';
    d += 'A ' + ri + ' ' + ri + ' 0 1 0 ' + (c - ri) + ' ' + c + ' ';
    d += 'A ' + ri + ' ' + ri + ' 0 1 0 ' + (c + ri) + ' ' + c + ' Z ';

    // 轮辐孔
    var holes = 5;
    var hr = r * 0.16;
    var hd = r * 0.72;
    for (var j = 0; j < holes; j++) {
      var ha = (j / holes) * Math.PI * 2 + 0.35;
      var hx = c + Math.cos(ha) * hd;
      var hy = c + Math.sin(ha) * hd;
      d += 'M ' + (hx + hr) + ' ' + hy + ' ';
      d += 'A ' + hr + ' ' + hr + ' 0 1 0 ' + (hx - hr) + ' ' + hy + ' ';
      d += 'A ' + hr + ' ' + hr + ' 0 1 0 ' + (hx + hr) + ' ' + hy + ' Z ';
    }

    return '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="' + SVG_NS + '">'
         + '<path d="' + d + '" fill="' + fill + '" fill-rule="evenodd" stroke="' + stroke
         + '" stroke-width="1.6"/></svg>';
  }

  /* ---------- 2. Hero 背景齿轮组 + 滚动视差 ---------- */
  var heroGears = document.getElementById('heroGears');
  var gearPlanes = [];

  if (heroGears) {
    var layout = [
      { x: '78%',  y: '18%', s: 320, teeth: 16, speed: 1,  rev: false, op: .5  },
      { x: '92%',  y: '52%', s: 220, teeth: 12, speed: 1.5, rev: true,  op: .38 },
      { x: '66%',  y: '72%', s: 150, teeth: 10, speed: 2,  rev: false, op: .3  },
      { x: '12%',  y: '76%', s: 190, teeth: 12, speed: 1.7, rev: true,  op: .22 },
      { x: '4%',   y: '12%', s: 120, teeth: 9,  speed: 2.4, rev: false, op: .2  }
    ];

    layout.forEach(function (g) {
      var wrap = document.createElement('div');
      wrap.className = 'gear-wrap';
      wrap.style.left = g.x;
      wrap.style.top = g.y;
      wrap.style.width = g.s + 'px';
      wrap.style.height = g.s + 'px';
      wrap.style.opacity = g.op;
      wrap.style.transform = 'translate(-50%, -50%)';

      var inner = document.createElement('div');
      inner.className = 'gear-inner' + (g.rev ? ' rev' : '');
      inner.style.animationDuration = (26 / g.speed).toFixed(1) + 's';
      inner.innerHTML = gearSVG({ teeth: g.teeth, r: 100, fill: 'rgba(232,184,75,0.55)', stroke: 'rgba(247,220,140,0.65)' });
      wrap.appendChild(inner);
      heroGears.appendChild(wrap);
      gearPlanes.push({ el: wrap, base: g });
    });
  }

  /* ---------- 3. 蒸汽粒子 Canvas ---------- */
  var canvas = document.getElementById('steam');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var puffs = [], sparks = [];

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnPuff() {
      puffs.push({
        x: Math.random() * W,
        y: H + 40 + Math.random() * 60,
        r: 26 + Math.random() * 58,
        vy: 0.25 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.35,
        wobble: Math.random() * Math.PI * 2,
        alpha: 0.05 + Math.random() * 0.1
      });
    }

    function spawnSpark() {
      sparks.push({
        x: Math.random() * W,
        y: H * 0.5 + Math.random() * H * 0.5,
        r: 0.8 + Math.random() * 1.8,
        vy: 0.5 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 0.6,
        alpha: 0.35 + Math.random() * 0.55
      });
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      // 蒸汽
      for (var i = puffs.length - 1; i >= 0; i--) {
        var p = puffs[i];
        p.y -= p.vy;
        p.wobble += 0.012;
        p.x += p.drift + Math.sin(p.wobble) * 0.4;
        p.r += 0.16;
        p.alpha -= 0.00075;
        if (p.y < -80 || p.alpha <= 0.005) { puffs.splice(i, 1); continue; }

        var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grd.addColorStop(0, 'rgba(243, 230, 200, ' + p.alpha.toFixed(3) + ')');
        grd.addColorStop(0.55, 'rgba(232, 184, 75, ' + (p.alpha * 0.42).toFixed(3) + ')');
        grd.addColorStop(1, 'rgba(232, 184, 75, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 火星
      for (var j = sparks.length - 1; j >= 0; j--) {
        var s = sparks[j];
        s.y -= s.vy;
        s.x += s.drift + Math.sin(s.y * 0.02) * 0.35;
        if (s.y < -20) { sparks.splice(j, 1); continue; }
        ctx.fillStyle = 'rgba(247, 220, 140, ' + (s.alpha * (s.y / H)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    setInterval(spawnPuff, 260);
    setInterval(spawnSpark, 140);
    for (var k = 0; k < 14; k++) spawnPuff();
    tick();
  }

  /* ---------- 4. 打字机 ---------- */
  var typedEl = document.getElementById('typed');
  if (typedEl) {
    var phrases = [
      '把大模型锻造成真实的生产力',
      '在数据与人性之间架桥',
      '打造有温度的 AI 产品',
      '让蒸汽与智能一起轰鸣'
    ];
    var pi = 0, ci = 0, deleting = false;

    (function typeLoop() {
      var text = phrases[pi];
      if (!deleting) {
        ci++;
        typedEl.textContent = text.slice(0, ci);
        if (ci === text.length) { deleting = true; return setTimeout(typeLoop, 1900); }
      } else {
        ci--;
        typedEl.textContent = text.slice(0, ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      }
      setTimeout(typeLoop, deleting ? 42 : 96);
    })();
  }

  /* ---------- 5. 压力表盘构建 ---------- */
  var START = -120, SWEEP = 240;

  function polar(cx, cy, r, deg) {
    var a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function arcPath(cx, cy, r, a0, a1) {
    var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1);
    var large = a1 - a0 > 180 ? 1 : 0;
    return 'M ' + p0.x.toFixed(2) + ' ' + p0.y.toFixed(2) +
           ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p1.x.toFixed(2) + ' ' + p1.y.toFixed(2);
  }

  function buildGauge(gauge) {
    var svg = gauge.querySelector('svg');
    if (!svg) return;

    // 刻度
    var ticks = gauge.querySelector('.g-ticks');
    for (var i = 0; i <= 40; i++) {
      var t = i / 40;
      var ang = START + t * SWEEP;
      var major = i % 5 === 0;
      var rad = ((ang - 90) * Math.PI) / 180;
      var r1 = 84, r2 = major ? 68 : 76;
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', (110 + r1 * Math.cos(rad)).toFixed(2));
      line.setAttribute('y1', (110 + r1 * Math.sin(rad)).toFixed(2));
      line.setAttribute('x2', (110 + r2 * Math.cos(rad)).toFixed(2));
      line.setAttribute('y2', (110 + r2 * Math.sin(rad)).toFixed(2));
      line.setAttribute('stroke-width', major ? 3.2 : 1.6);
      if (!major) line.setAttribute('class', 'minor');
      ticks.appendChild(line);
    }

    // 弧线
    var arcBg = gauge.querySelector('.g-arc-bg');
    var arcVal = gauge.querySelector('.g-arc-val');
    var d = arcPath(110, 110, 72, START, START + SWEEP);
    arcBg.setAttribute('d', d);
    arcVal.setAttribute('d', arcPath(110, 110, 72, START, START + 12));

    // 指针初始位置
    var needle = gauge.querySelector('.g-needle');
    needle.style.transform = 'rotate(' + START + 'deg)';
  }

  function animateGauge(gauge) {
    if (gauge.dataset.done) return;
    gauge.dataset.done = '1';

    var value = parseFloat(gauge.dataset.value) || 0;
    var angle = START + (value / 100) * SWEEP;
    var needle = gauge.querySelector('.g-needle');
    var arcVal = gauge.querySelector('.g-arc-val');
    var readout = gauge.querySelector('.g-readout b');

    requestAnimationFrame(function () {
      needle.style.transform = 'rotate(' + angle + 'deg)';
    });

    // 弧线描边生长
    if (arcVal) {
      var len = arcVal.getTotalLength();
      arcVal.style.strokeDasharray = len;
      arcVal.style.strokeDashoffset = len;
      arcVal.style.transition = 'stroke-dashoffset 1.7s cubic-bezier(.2,.8,.3,1)';
      requestAnimationFrame(function () {
        arcVal.style.strokeDashoffset = len * (1 - value / 100);
      });
    }

    // 数字滚动
    var start = performance.now();
    (function count(now) {
      var p = Math.min((now - start) / 1700, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      readout.textContent = Math.round(eased * value);
      if (p < 1) requestAnimationFrame(count);
    })(start);
  }

  var gauges = document.querySelectorAll('.gauge');
  Array.prototype.forEach.call(gauges, buildGauge);

  /* ---------- 6. 滚动入场观察器 ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.classList.contains('gauge')) animateGauge(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18 });

    var revealEls = document.querySelectorAll('.reveal');
    Array.prototype.forEach.call(revealEls, function (el, idx) {
      el.style.transitionDelay = (idx % 4) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) {
      el.classList.add('in');
      if (el.classList.contains('gauge')) animateGauge(el);
    });
  }

  /* ---------- 7. 导航：进度条 / 高亮 / 移动菜单 ---------- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('navProgress');
  var navLinks = document.querySelectorAll('.nav-links a');
  var sections = document.querySelectorAll('section[id]');

  function onScroll() {
    var st = window.pageYOffset || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', st > 40);

    // 当前区块高亮
    var current = '';
    Array.prototype.forEach.call(sections, function (sec) {
      if (st >= sec.offsetTop - 160) current = sec.id;
    });
    Array.prototype.forEach.call(navLinks, function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });

    // 齿轮视差
    gearPlanes.forEach(function (g) {
      var rotate = st * 0.03 * g.base.speed * (g.base.rev ? -1 : 1);
      g.el.style.transform = 'translate(-50%, -50%) rotate(' + rotate.toFixed(2) + 'deg)';
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById('navToggle');
  var linksBox = document.getElementById('navLinks');
  if (toggle && linksBox) {
    toggle.addEventListener('click', function () {
      linksBox.classList.toggle('open');
    });
    linksBox.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') linksBox.classList.remove('open');
    });
  }

  /* ---------- 8. 电报按键：点击发电 ---------- */
  var note = document.getElementById('telegraphNote');
  Array.prototype.forEach.call(document.querySelectorAll('.key[data-copy]'), function (key) {
    key.addEventListener('click', function () {
      var info = key.getAttribute('data-copy');
      var flash = function (msg) {
        if (!note) return;
        note.textContent = msg;
        note.style.color = '#F7DC8C';
        setTimeout(function () {
          note.textContent = 'STATUS: STANDBY · 等待信号输入…';
          note.style.color = '';
        }, 2600);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(info).then(function () {
          flash('SIGNAL RECEIVED · 已复制：' + info);
        }).catch(function () {
          flash('SIGNAL RECEIVED · ' + info);
        });
      } else {
        flash('SIGNAL RECEIVED · ' + info);
      }
    });
  });

  /* ---------- 9. 页脚年份 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 10. 装饰齿轮：品牌 Logo / 小分隔 / 卡片角 ---------- */
  var brandGear = document.getElementById('brandGear');
  if (brandGear) brandGear.innerHTML = gearSVG({ teeth: 10, r: 100, fill: '#E8B84B', stroke: '#8A6420' });

  Array.prototype.forEach.call(document.querySelectorAll('.mini-gear'), function (el) {
    el.innerHTML = gearSVG({ teeth: 8, r: 100, fill: '#E8B84B', stroke: '#8A6420' });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.work-gear'), function (el) {
    el.innerHTML = gearSVG({ teeth: 12, r: 100, fill: '#E8B84B', stroke: '#8A6420' });
  });

  var chatGear = document.getElementById('chatGear');
  if (chatGear) chatGear.innerHTML = gearSVG({ teeth: 10, r: 100, fill: '#33240B', stroke: '#2A1D08' });
})();
