/* =========================================================================
 *  Flash Check — configuration
 *  Edit this file to change requirements, links, stickers and captions.
 * ========================================================================= */
window.CONFIG = {
  /* ---- Minimum requirements ------------------------------------------------
   * PLACEHOLDER VALUES — replace with the official PUBG MOBILE FLASH specs.
   * A device passes when it meets every rule for its OS.
   * Any device can also force a result with `ok: true | false` in devices.js.
   */
  requirements: {
    android: { label: "Android", minVersion: 9, minRam: 3 },
    ios: { label: "iOS", minVersion: 15, minRam: 3 },
  },

  /* Shown on the check screen and on "can play" results (not checked). */
  storageNote: "ဖုန်း Storage အလွတ် 3 GB ခန့်ရှိဖို့လိုပါတယ်။",

  /* ---- Performance badge on the sticker (first matching row wins) ---- */
  performance: [
    { minRam: 8, label: "90 FPS / Ultra" },
    { minRam: 4, label: "60 FPS / Smooth" },
    { minRam: 0, label: "30 FPS / Balanced" },
  ],

  /* ---- Download links (chosen by the visitor's OS) ---- */
  downloadUrl: {
    android: "https://play.google.com/store/apps/details?id=com.tencent.ig",
    ios: "https://apps.apple.com/app/id1330123889",
    default: "https://www.pubgmobile.com/",
  },

  /* ---- Link shared together with the result image ---- */
  shareUrl: "", // empty = current page URL
  shareTitle: "PUBG MOBILE FLASH ဆော့လို့ရလား?",
  hashtag: "#PUBGMOBILEFLASH",

  /* ---- Stickers: one is picked at random for each result ----
   * Drop your own PNG/JPG/GIF/WebP files into assets/stickers/ and list them here.
   * Keep them on the same site (not another domain) so "Save image" works.
   */
  stickers: {
    pass: [
      "assets/stickers/pass-1.svg",
      "assets/stickers/pass-2.svg",
      "assets/stickers/pass-3.svg",
    ],
    fail: [
      "assets/stickers/fail-1.svg",
      "assets/stickers/fail-2.svg",
      "assets/stickers/fail-3.svg",
    ],
  },

  /* ---- Captions shown on top of the sticker (random) ---- */
  captions: {
    pass: [
      "လူကြီးမင်းရဲ့ဖုန်းက\nလုံးဝဆော့လို့အဆင်ပြေပါတယ်ဗျ\nFlash ထဲလာခဲ့ဖို့ Ready ပဲလား?",
      "မိတ်ဆွေရဲ့ဖုန်းနဲ့ဆို\nအေးအေးဆေးဆေး\nဆော့နိုင်ပါတယ်ခင်ဗျာ :)",
      "Winner Winner\nChicken Dinner\nအတွက် အသင့်ပါပဲ!",
    ],
    fail: [
      "မိတ်ဆွေရဲ့ဖုန်းက\nဆော့လို့မရတာကြောင့်\nစိတ်မကောင်းပါဘူးခင်ဗျာ",
      "ဖုန်းလေးကို\nအနားပေးပြီး\nဖုန်းအသစ်လဲကြမလား?",
      "ဒီတစ်ခါတော့\nကံမကောင်းသေးဘူး\nခင်ဗျာ...",
    ],
  },

  /* ---- Result texts ---- */
  text: {
    failBadge: "Not Supported",
    sharePass: "ငါ့ဖုန်းနဲ့ PUBG MOBILE FLASH ဆော့လို့ရတယ်! မင်းဖုန်းရော စစ်ကြည့်ပြီးပြီလား?",
    shareFail: "ငါ့ဖုန်းနဲ့ PUBG MOBILE FLASH မဆော့နိုင်သေးဘူး 😭 မင်းဖုန်းရော စစ်ကြည့်ပါဦး!",
  },
};
