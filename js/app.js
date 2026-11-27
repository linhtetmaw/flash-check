(() => {
  "use strict";
  const C = window.CONFIG;
  const D = window.DEVICES;
  const $ = (s) => document.querySelector(s);

  const brandSel = $("#brand");
  const modelSel = $("#model");
  const ramGroup = $("#ram-group");
  const ramOptions = $("#ram-options");
  const checkBtn = $("#check-btn");
  const result = $("#screen-result");

  let ramChoice = null; // selected RAM in GB
  let current = null; // last result
  let cardPromise = null; // pre-rendered share image (Promise<Blob|null>)
  const lastPick = {};

  /* ---------------- helpers ---------------- */
  const pick = (key, list) => {
    if (list.length < 2) return list[0];
    let i;
    do i = Math.floor(Math.random() * list.length); while (i === lastPick[key]);
    lastPick[key] = i;
    return list[i];
  };
  const fmt = (n) => String(Math.round(n * 10) / 10);
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = () => /Android/i.test(navigator.userAgent);

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    document.body.dataset.screen = id.replace("screen-", "");
    window.scrollTo(0, 0);
  }

  /* ---------------- static bits ---------------- */
  const dl = isIOS() ? C.downloadUrl.ios : isAndroid() ? C.downloadUrl.android : C.downloadUrl.default;
  document.querySelectorAll(".download-link").forEach((a) => (a.href = dl));
  $("#storage-note").textContent = C.storageNote;

  /* ---------------- brand → model → RAM ---------------- */
  Object.keys(D).forEach((b) => brandSel.add(new Option(b, b)));

  const currentDevice = () => (brandSel.value && modelSel.selectedIndex > 0 ? D[brandSel.value][Number(modelSel.value)] : null);

  brandSel.addEventListener("change", () => {
    modelSel.length = 1;
    D[brandSel.value].forEach((d, i) => modelSel.add(new Option(d.model, String(i))));
    modelSel.disabled = false;
    modelSel.selectedIndex = 0;
    renderRams();
  });
  modelSel.addEventListener("change", renderRams);

  function renderRams() {
    const device = currentDevice();
    ramChoice = null;
    ramOptions.innerHTML = "";
    ramGroup.hidden = !device;
    if (device) {
      device.rams.forEach((gb) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ram-btn";
        b.setAttribute("aria-pressed", "false");
        b.dataset.gb = gb;
        b.innerHTML = `${fmt(gb)}<small>GB</small>`;
        b.addEventListener("click", () => chooseRam(gb));
        ramOptions.appendChild(b);
      });
      if (device.rams.length === 1) chooseRam(device.rams[0]);
    }
    updateBtn();
  }
  function chooseRam(gb) {
    ramChoice = gb;
    ramOptions.querySelectorAll(".ram-btn").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.gb) === gb)));
    updateBtn();
  }
  function updateBtn() {
    checkBtn.disabled = !(currentDevice() && ramChoice);
  }

  /* ---------------- evaluation ---------------- */
  function evaluate(device, ram) {
    if (typeof device.ok === "boolean") return { ok: device.ok, reasons: [] };
    const req = C.requirements[device.os];
    const reasons = [];
    if (device.ver < req.minVersion) reasons.push(`${req.label} ${fmt(device.ver)} — ${req.label} ${fmt(req.minVersion)} နှင့်အထက် လိုအပ်ပါတယ်`);
    if (ram < req.minRam) reasons.push(`RAM ${fmt(ram)}GB — RAM ${fmt(req.minRam)}GB နှင့်အထက် လိုအပ်ပါတယ်`);
    return { ok: reasons.length === 0, reasons };
  }

  $("#check-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (checkBtn.disabled) return;
    const brand = brandSel.value;
    const device = currentDevice();
    const ram = ramChoice;
    const { ok, reasons } = evaluate(device, ram);
    const k = ok ? "pass" : "fail";
    const lead = brand.split(" ")[0].toLowerCase();
    current = {
      name: device.model.toLowerCase().startsWith(lead) ? device.model : `${brand} ${device.model}`,
      ram, ok, reasons,
      notes: ok ? [C.storageNote] : [],
      perf: ok ? C.performance.find((p) => ram >= p.minRam).label : C.text.failBadge,
      sticker: pick("s" + k, C.stickers[k]),
      caption: pick("c" + k, C.captions[k]),
    };

    const loading = $("#loading");
    loading.hidden = false;
    const preload = new Promise((res) => {
      const im = new Image();
      im.onload = im.onerror = res;
      im.src = current.sticker;
    });
    Promise.all([preload, new Promise((r) => setTimeout(r, 900))]).then(() => {
      loading.hidden = true;
      renderResult();
    });
  });

  function renderResult() {
    const { name, ram, ok, reasons, notes, perf, sticker, caption } = current;
    result.classList.toggle("pass", ok);
    result.classList.toggle("fail", !ok);
    document.body.dataset.result = ok ? "pass" : "fail";

    $("#sticker-img").src = sticker;
    $("#sticker-caption").textContent = caption;
    $("#perf-line1").textContent = perf;
    $("#perf-line2").textContent = ok ? "OK" : "✕";
    const card = $(".sticker-card");
    card.classList.remove("pop");
    void card.offsetWidth;
    card.classList.add("pop");

    const dline = $("#device-line");
    dline.innerHTML = "";
    const b = document.createElement("b");
    b.textContent = name;
    dline.append(b, ` · RAM ${fmt(ram)}GB`);

    const ul = $("#reasons");
    ul.innerHTML = "";
    reasons.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
    notes.forEach((t) => {
      const li = document.createElement("li");
      li.className = "info";
      li.textContent = t;
      ul.appendChild(li);
    });

    showScreen("screen-result");
    // Pre-render the share image so Share/Save respond instantly
    // (mobile browsers require navigator.share to run right after the tap).
    cardPromise = buildCard().catch((err) => {
      console.error(err);
      return null;
    });
  }

  $("#retry-btn").addEventListener("click", () => {
    brandSel.selectedIndex = 0;
    modelSel.length = 1;
    modelSel.disabled = true;
    renderRams();
    showScreen("screen-check");
  });

  /* ---------------- share image (canvas) ---------------- */
  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
  }

  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("my", { granularity: "word" }) : null;
  const segments = (text) => (segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : text.split(/(\s+)/));
  // Wraps Burmese/English text to fit maxW. Respects explicit \n.
  function wrap(ctx, text, maxW) {
    const lines = [];
    text.split("\n").forEach((para) => {
      let line = "";
      for (const seg of segments(para)) {
        const test = line + seg;
        if (ctx.measureText(test).width > maxW && line.trim()) {
          lines.push(line.trim());
          line = seg.trimStart();
        } else line = test;
      }
      lines.push(line.trim());
    });
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  async function buildCard() {
    const { name, ok, perf, sticker, caption, reasons } = current;
    const MY = '"Noto Sans Myanmar", "Myanmar Text", "Pyidaungsu", sans-serif';
    const EN = '"Roboto Condensed", "Arial Narrow", sans-serif';
    try {
      await Promise.all([document.fonts.load(`900 40px "Noto Sans Myanmar"`), document.fonts.load(`800 40px "Roboto Condensed"`)]);
    } catch (_) {}

    const W = 1080, H = 1350;
    const accent = ok ? "#1aa3ff" : "#ff4d4d";
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#4b525d");
    bg.addColorStop(1, "#2f353e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.7, 50, W / 2, H * 0.7, W * 0.8);
    glow.addColorStop(0, "rgba(255,255,255,.08)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // title with brackets
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `800 64px ${EN}`;
    const title = "COMPATIBILITY CHECK";
    const tw = ctx.measureText(title).width;
    const tg = ctx.createLinearGradient(0, 50, 0, 120);
    tg.addColorStop(0, "#ffffff");
    tg.addColorStop(1, "#c9d0d9");
    ctx.fillStyle = tg;
    ctx.fillText(title, W / 2, 118);
    ctx.strokeStyle = "#1aa3ff";
    ctx.lineWidth = 6;
    const bx1 = W / 2 - tw / 2 - 30, bx2 = W / 2 + tw / 2 + 30, by1 = 56, by2 = 132;
    ctx.beginPath();
    ctx.moveTo(bx1 + 18, by1); ctx.lineTo(bx1, by1); ctx.lineTo(bx1, by2); ctx.lineTo(bx1 + 18, by2);
    ctx.moveTo(bx2 - 18, by1); ctx.lineTo(bx2, by1); ctx.lineTo(bx2, by2); ctx.lineTo(bx2 - 18, by2);
    ctx.stroke();

    // sticker with glowing frame
    const sx = 90, sy = 180, ss = 900;
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 50;
    ctx.fillStyle = accent;
    roundRect(ctx, sx - 6, sy - 6, ss + 12, ss + 12, 14);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, sx, sy, ss, ss, 8);
    ctx.clip();
    try {
      const im = await loadImage(sticker);
      const iw = im.naturalWidth || 800, ih = im.naturalHeight || 800;
      const s = Math.max(ss / iw, ss / ih);
      ctx.drawImage(im, sx + (ss - iw * s) / 2, sy + (ss - ih * s) / 2, iw * s, ih * s);
    } catch (_) {
      ctx.fillStyle = "#222";
      ctx.fillRect(sx, sy, ss, ss);
    }
    ctx.restore();

    // performance badge
    ctx.font = `700 34px ${EN}`;
    const pw = Math.max(ctx.measureText(perf).width, 80) + 44;
    const px = sx + ss - pw - 26, py = sy + ss * 0.42;
    const pg = ctx.createLinearGradient(0, py, 0, py + 120);
    pg.addColorStop(0, ok ? "#2bb0ff" : "#ff6464");
    pg.addColorStop(1, ok ? "#0f86e6" : "#d92c2c");
    ctx.fillStyle = pg;
    roundRect(ctx, px, py, pw, 116, 22);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + pw / 2 - 16, py + 114);
    ctx.lineTo(px + pw / 2, py + 134);
    ctx.lineTo(px + pw / 2 + 16, py + 114);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 4;
    roundRect(ctx, px, py, pw, 116, 22);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText(perf, px + pw / 2, py + 46);
    ctx.font = `800 54px ${EN}`;
    ctx.fillText(ok ? "OK" : "✕", px + pw / 2, py + 102);

    // caption
    ctx.font = `900 50px ${MY}`;
    const capLines = wrap(ctx, caption, ss - 60);
    const lh = 92;
    let cy = sy + ss - 50 - (capLines.length - 1) * lh;
    ctx.lineJoin = "round";
    capLines.forEach((l) => {
      ctx.lineWidth = 16;
      ctx.strokeStyle = "#000";
      ctx.strokeText(l, W / 2, cy);
      ctx.fillStyle = "#fff";
      ctx.fillText(l, W / 2, cy);
      cy += lh;
    });

    // device + first reason
    ctx.fillStyle = "#fff";
    ctx.font = `700 42px ${EN}, ${MY}`;
    ctx.fillText(name, W / 2, sy + ss + 92);
    if (!ok && reasons[0]) {
      ctx.fillStyle = "#ffc2c2";
      ctx.font = `400 30px ${MY}`;
      ctx.fillText(wrap(ctx, reasons[0], W - 160)[0], W / 2, sy + ss + 148);
    }

    // footer
    ctx.fillStyle = "#29a3ff";
    ctx.font = `800 36px ${EN}`;
    ctx.fillText(C.hashtag, W / 2, H - 44);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = `500 24px ${EN}`;
    ctx.fillText("Fan-made", 24, H - 20);

    return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
  }

  const fileName = () => `flash-check-${current.ok ? "pass" : "fail"}.png`;

  /* ---------------- save ---------------- */
  $("#save-btn").addEventListener("click", async () => {
    if (!current) return;
    const blob = await cardPromise;
    if (!blob) return toast("ပုံ ဖန်တီးလို့ မရပါ။ ထပ်စမ်းကြည့်ပါ။");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("ပုံကို သိမ်းဆည်းပြီးပါပြီ ✓");
  });

  /* ---------------- share ---------------- */
  $("#share-btn").addEventListener("click", async () => {
    if (!current) return;
    const text = `${current.ok ? C.text.sharePass : C.text.shareFail} ${C.hashtag}`;
    const url = C.shareUrl || location.href.split("#")[0];
    const blob = await cardPromise;
    const copyFallback = async () => {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast("မျှဝေရန် စာသားနဲ့ လင့်ခ်ကို ကူးယူပြီးပါပြီ ✓");
      } catch (_) {
        toast("မျှဝေလို့ မရပါ။ ပုံသိမ်းပြီး မျှဝေကြည့်ပါ။");
      }
    };
    try {
      if (blob && navigator.canShare) {
        const file = new File([blob], fileName(), { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: C.shareTitle, text: `${text}\n${url}` });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: C.shareTitle, text, url });
        return;
      }
      await copyFallback();
    } catch (err) {
      if (err && err.name === "AbortError") return;
      await copyFallback();
    }
  });
})();
