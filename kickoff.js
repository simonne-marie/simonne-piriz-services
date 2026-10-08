// Kickoff Brief: a step-by-step client intake that sends a Markdown brief to HubSpot.
(() => {
  const root = document.getElementById("kick-form");
  if (!root) return;

  // HubSpot form "Kickoff Brief". Paste its form ID here once it exists in HubSpot.
  const HUBSPOT_PORTAL_ID = "247415032";
  const HUBSPOT_FORM_GUID = "";
  const HUBSPOT_ENDPOINT = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`;
  const DRAFT_KEY = "sp-kickoff-draft-v1";

  /* ---------- Visual libraries ---------- */
  const STYLES = [
    { id: "minimal", name: "Clean & Minimal", fit: "Consultants, clinics, coaches", note: "Lots of white space, one accent color, quiet confidence.",
      bg: "#ffffff", fg: "#16181c", ac: "#2f5bff", acfg: "#fff", disp: "Manrope", w: 700, r: "4px", ir: "4px", img: "linear-gradient(135deg,#eef1f6,#d9dfea)",
      brand: "north", head: "Clear advice for growing teams.", sub: "Strategy sessions that end with a plan.", cta: "Book a call" },
    { id: "organic", name: "Warm & Organic", fit: "Wellness, food, home, garden", note: "Earthy colors, soft corners, natural textures.",
      bg: "#efe6d8", fg: "#3b3a2a", ac: "#6b7a3a", acfg: "#fff", disp: "Fraunces", w: 500, r: "999px", ir: "48% 48% 12px 12px", img: "linear-gradient(160deg,#c9b38f,#8e9a5b)",
      brand: "fern & co", head: "Slow mornings, made at home.", sub: "Small-batch goods from local growers.", cta: "Shop the market" },
    { id: "bold", name: "Bold & Graphic", fit: "Gyms, events, agencies", note: "Huge type, high contrast, color blocks.",
      bg: "#ffde3b", fg: "#0d0d0d", ac: "#0d0d0d", acfg: "#ffde3b", disp: "Syne", w: 800, r: "0", ir: "0", img: "linear-gradient(0deg,#ff4d2e 50%,#0d0d0d 50%)", extra: "text-transform:uppercase;letter-spacing:-.02em;",
      brand: "PULSE", head: "Train loud. Rest hard.", sub: "Group classes 6 days a week.", cta: "First class free" },
    { id: "luxe", name: "Luxe & Editorial", fit: "Salons, real estate, boutiques", note: "Refined serif type, dark tones, thin lines.",
      bg: "#141210", fg: "#efe8dc", ac: "#c8a96a", acfg: "#141210", disp: "Cormorant Garamond", w: 600, r: "0", ir: "0", img: "linear-gradient(170deg,#3a322a,#1d1915)", extra: "font-size:clamp(16px,2.4vw,24px);",
      brand: "MAISON", head: "Considered spaces for considered living.", sub: "Private viewings by appointment.", cta: "Request a viewing" },
    { id: "friendly", name: "Friendly & Bright", fit: "Kids, pets, community", note: "Rounded shapes, cheerful color, playful details.",
      bg: "#fff4f8", fg: "#2d2350", ac: "#ff6b9a", acfg: "#fff", disp: "Nunito", w: 800, r: "999px", ir: "24px", img: "radial-gradient(circle at 30% 35%,#ffd36b 0 22%,transparent 23%),radial-gradient(circle at 70% 70%,#8fd3ff 0 26%,transparent 27%),#c9b8ff",
      brand: "happy paws", head: "Where every tail wags.", sub: "Daycare, grooming and play.", cta: "Book a visit" },
    { id: "tech", name: "Tech & Precise", fit: "SaaS, IT, engineering", note: "Dark grid, crisp lines, monospace details.",
      bg: "#0c1016", fg: "#e6edf3", ac: "#3ee08f", acfg: "#0c1016", disp: "Sora", w: 700, r: "6px", ir: "6px", img: "linear-gradient(#0c1016 1px,transparent 1px) 0 0/12px 12px,linear-gradient(90deg,#0c1016 1px,#17202b 1px) 0 0/12px 12px",
      brand: "stackline", head: "Uptime you can stop worrying about.", sub: "Managed IT for teams of 10 to 200.", cta: "Get an audit" },
    { id: "classic", name: "Classic & Trusted", fit: "Law, finance, insurance", note: "Navy and white, structured, established.",
      bg: "#f6f7f9", fg: "#14233c", ac: "#14233c", acfg: "#fff", disp: "Libre Baskerville", w: 700, r: "2px", ir: "2px", img: "linear-gradient(135deg,#c9d3e3,#7d8fb0)", extra: "font-size:clamp(13px,1.9vw,19px);",
      brand: "Hale & Ward", head: "Counsel you can count on.", sub: "Estate and business law since 1998.", cta: "Free consultation" },
    { id: "local", name: "Local & Handmade", fit: "Trades, bakeries, makers", note: "Stamped labels, kraft tones, a personal feel.",
      bg: "#e8d9bf", fg: "#2b1d14", ac: "#b5452b", acfg: "#fff", disp: "Bricolage Grotesque", w: 800, r: "6px", ir: "6px", img: "repeating-linear-gradient(45deg,#c7a878 0 6px,#bf9f6e 6px 12px)",
      brand: "Rye Street", head: "Baked before sunrise, gone by noon.", sub: "Sourdough and pastries, Tuesday to Sunday.", cta: "See today’s menu" },
  ];
  const FONTS = [
    { id: "fraunces", name: "Warm editorial", fit: "Food, wellness, makers", h: "Fraunces", hw: 700, b: "Instrument Sans" },
    { id: "cormorant", name: "Quiet luxury", fit: "Salons, interiors, real estate", h: "Cormorant Garamond", hw: 600, b: "Manrope", hs: "font-size:30px;" },
    { id: "dmserif", name: "Polished & approachable", fit: "Clinics, coaches, boutiques", h: "DM Serif Display", hw: 400, b: "DM Sans" },
    { id: "baskerville", name: "Established & trusted", fit: "Law, finance, insurance", h: "Libre Baskerville", hw: 700, b: "Source Sans 3", hs: "font-size:22px;" },
    { id: "bricolage", name: "Modern & friendly", fit: "Services, studios, local brands", h: "Bricolage Grotesque", hw: 800, b: "Instrument Sans" },
    { id: "syne", name: "Loud & graphic", fit: "Fitness, events, creative", h: "Syne", hw: 800, b: "Manrope", hs: "text-transform:uppercase;font-size:22px;" },
    { id: "nunito", name: "Soft & playful", fit: "Kids, pets, community", h: "Nunito", hw: 800, b: "Nunito" },
    { id: "sora", name: "Clean & technical", fit: "Tech, IT, engineering", h: "Sora", hw: 700, b: "Manrope" },
  ];
  const PALETTES = [
    { id: "coastal", name: "Coastal calm", fit: "Cleaning, wellness, travel", c: { bg: "#f3f8f9", ink: "#12343b", accent: "#1f8a9e", alt: "#f2c57c", soft: "#d5e9ec" } },
    { id: "sage", name: "Sage & clay", fit: "Home, garden, food", c: { bg: "#f2efe7", ink: "#2f3527", accent: "#b4643f", alt: "#8a9a6b", soft: "#dfe3d2" } },
    { id: "brass", name: "Midnight & brass", fit: "Luxury, legal, real estate", c: { bg: "#141a26", ink: "#f1ece2", accent: "#c8a96a", alt: "#6d7a94", soft: "#232c3d" } },
    { id: "citrus", name: "Citrus pop", fit: "Fitness, food trucks, events", c: { bg: "#fffbea", ink: "#1d1d1d", accent: "#ff6a2b", alt: "#ffd23f", soft: "#ffe9a8" } },
    { id: "berry", name: "Berry & blush", fit: "Beauty, florals, gifts", c: { bg: "#fff4f3", ink: "#3a1426", accent: "#a3245a", alt: "#f2a7b5", soft: "#f9d9dd" } },
    { id: "signal", name: "Charcoal & signal", fit: "Trades, auto, B2B", c: { bg: "#f5f5f4", ink: "#1f2124", accent: "#e8501e", alt: "#5b6470", soft: "#e3e4e5" } },
    { id: "forest", name: "Forest & cream", fit: "Outdoors, coffee, craft", c: { bg: "#f6f1e4", ink: "#1f3a2d", accent: "#2f6b4a", alt: "#d69a3c", soft: "#e7e2cf" } },
    { id: "sky", name: "Sky & sunshine", fit: "Kids, education, community", c: { bg: "#f2f7ff", ink: "#1a2a4a", accent: "#3a7bfd", alt: "#ffc93c", soft: "#dce8ff" } },
  ];
  const MOODS = [
    { id: "neutral", name: "Earthy neutrals", c: ["#efe6d8", "#cbb79a", "#8a7660", "#3b3a2a"] },
    { id: "ocean", name: "Ocean & sky", c: ["#e6f3f8", "#8ecae6", "#219ebc", "#023047"] },
    { id: "mono", name: "Black, white + one pop", c: ["#ffffff", "#d9d9d9", "#191919", "#ff5a1f"] },
    { id: "jewel", name: "Jewel tones", c: ["#0f5257", "#6a2c70", "#b83b5e", "#f08a5d"] },
    { id: "pastel", name: "Soft pastels", c: ["#fde2e4", "#e2ece9", "#cddafd", "#fff1c1"] },
    { id: "sunset", name: "Sunset warm", c: ["#ffcf7a", "#ff9a5a", "#e25b45", "#7a2e3a"] },
    { id: "forest", name: "Forest & sage", c: ["#e3eadf", "#a3b18a", "#588157", "#344e41"] },
    { id: "navy", name: "Navy & brass", c: ["#f4f1ea", "#c8a96a", "#2b3a55", "#14233c"] },
  ];
  const VOICES = [
    { id: "warm", name: "Warm & personal", line: "Hi, I’m Dana. I’ll take care of your home like it’s my own." },
    { id: "expert", name: "Expert & direct", line: "Licensed, insured, and on your calendar within 48 hours." },
    { id: "playful", name: "Playful", line: "Dust bunnies, meet your match." },
    { id: "premium", name: "Polished & premium", line: "Considered care for exceptional homes." },
  ];
  const SCALES = [
    ["classic", "Classic", "Modern"], ["quiet", "Quiet", "Bold"], ["playful", "Playful", "Serious"],
    ["minimal", "Minimal", "Rich"], ["approach", "Approachable", "Exclusive"], ["personal", "Personal", "Corporate"],
  ];

  /* ---------- State ---------- */
  let a = {};
  let step = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (saved && saved.a) { a = saved.a; step = saved.step || 0; }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ a, step })); } catch (e) {} };

  // Prefill from the Investment calculator, e.g. ?services=Website|Brand Foundation&manage=Quarterly Sprint
  const params = new URLSearchParams(window.location.search);
  const listParam = (k) => (params.get(k) || "").split("|").map((s) => s.trim()).filter(Boolean);
  if (params.get("services") && !(a.path_services || []).length) a.path_services = listParam("services");
  if (params.get("seats") && !(a.path_seats || []).length) a.path_seats = listParam("seats");
  ["tier", "manage", "brand"].forEach((k) => { if (params.get(k) && !a["path_" + k]) a["path_" + k] = params.get(k); });

  /* ---------- Which steps apply ---------- */
  const has = (id, v) => (a[id] || []).includes(v);
  const fullTeam = () => has("path_services", "Full Marketing Team");
  const P = {
    web: () => fullTeam() || has("path_services", "Website"),
    content: () => fullTeam() || has("path_services", "Content & Blog"),
    social: () => fullTeam() || has("path_services", "Social Media") || has("path_services", "New social pages"),
    crm: () => fullTeam() || has("path_seats", "CRM & Automation"),
    seats: () => (a.path_seats || []).some((s) => s !== "CRM & Automation"),
    buildBrand: () => has("path_services", "Brand Foundation") || ["Logo only", "No brand yet"].includes(a.path_brand),
    existingBrand: () => ["Full brand", "Logo only"].includes(a.path_brand),
  };
  const anyPath = () => (a.path_services || []).length > 0;

  /* ---------- Steps and questions ----------
     need: shown as "Helps most" and listed on the last step if blank.
     b: the shorter label used in the brief. */
  const STEPS = [
    { id: "start", title: "About you", intro: "Who I’m working with and how to reach you.", qs: [
      { id: "firstname", t: "text", label: "First name", ac: "given-name", half: 1 },
      { id: "lastname", t: "text", label: "Last name", ac: "family-name", half: 1 },
      { id: "email", t: "email", label: "Email", req: 1, ac: "email" },
      { id: "phone", t: "text", label: "Phone", ac: "tel", optional: 1 },
      { id: "biz_name", t: "text", label: "Business name, exactly as it should appear", b: "Business name", req: 1, ac: "organization" },
      { id: "website", t: "text", label: "Current website", placeholder: "yourbusiness.com, or leave blank", optional: 1, ac: "url" },
    ]},
    { id: "path", title: "What we’re building", intro: "If you used the Investment calculator, these may already be filled in. Change anything that’s not right.", qs: [
      { id: "path_services", t: "chips", multi: 1, need: 1, b: "Services", label: "What are you interested in?", opts: ["Website", "Content & Blog", "Social Media", "Brand Foundation", "New social pages", "Full Marketing Team", "Update Pack", "Not sure yet"] },
      { id: "path_tier", t: "chips", when: P.web, b: "Website build", label: "How custom should your website be?", opts: [{ v: "Standard (up to 5 pages)" }, { v: "Premium (custom animation)", l: "Premium (custom animation and interaction)" }, { v: "Not sure yet" }] },
      { id: "path_manage", t: "chips", b: "Working model", label: "After launch, how would you like to work together?", opts: [
        { v: "Monthly Retainer", l: "You run it for me every month" }, { v: "Quarterly Sprint", l: "A focused session each quarter" },
        { v: "Build & Handoff", l: "Build it, then hand it over to me" }, { v: "Update Pack as needed", l: "Pay as I go for small changes" }, { v: "Not sure yet" }] },
      { id: "path_seats", t: "chips", multi: 1, b: "Team seats", label: "Any team seats you’d like to add?", help: "Optional. These are described on the Services page.", opts: ["CRM & Automation", "Visual Designer", "Competitive Intelligence", "Reporting", "Customer Retention", "Training & Docs"] },
      { id: "path_brand", t: "chips", need: 1, b: "Brand status", label: "Where does your brand stand today?", opts: [
        { v: "Full brand", l: "I have a logo, colors and fonts I use everywhere" }, { v: "Logo only", l: "I have a logo, but not much else" }, { v: "No brand yet", l: "I’m starting from scratch" }] },
    ]},
    { id: "business", title: "Your business", intro: "The plain-language story. Much of your homepage will come from these answers.", qs: [
      { id: "biz_legal", t: "text", b: "Legal entity name", label: "Legal business name, if it’s different", help: "Used in your site footer, privacy and terms pages.", placeholder: "Your Business LLC", optional: 1 },
      { id: "biz_oneliner", t: "area", need: 1, b: "In one sentence", label: "If you had ten seconds to explain what you do to a stranger, what would you say?" },
      { id: "biz_offer", t: "area", need: 1, b: "Offer (most revenue first)", label: "What do you offer? Start with what brings in the most money.", help: "Tell me which ones you want more of." },
      { id: "biz_area", t: "text", b: "Service area", label: "Where are your customers?", placeholder: "A city, a region, or anywhere online" },
      { id: "biz_diff", t: "area", need: 1, b: "Why customers choose them", label: "When someone picks you over the alternatives, what’s the reason?", help: "Years in business, certifications, guarantees and real numbers all help. I only use what you give me." },
      { id: "biz_competitors", t: "area", b: "Competitors", label: "Who else do your customers look at? Is there a competitor whose website you like?" },
      { id: "biz_rules", t: "area", b: "Industry rules", label: "Is anything in your industry regulated?", help: "For example health information, licensing language or required disclaimers.", optional: 1 },
    ]},
    { id: "goals", title: "Goals", intro: "What this needs to do for your business.", qs: [
      { id: "goal_why", t: "area", need: 1, b: "Why now", label: "What made you decide to do this now?" },
      { id: "goal_primary", t: "chips", need: 1, b: "Main job of the marketing", label: "What’s the main thing you want more of?", opts: ["Phone calls", "Bookings", "Quote requests", "Online sales", "Email signups", "Look established", "Hiring"] },
      { id: "goal_action", t: "text", need: 1, b: "Primary homepage action (CTA)", label: "When someone lands on your homepage, what’s the one thing you want them to do?", placeholder: "Book a free consultation" },
      { id: "goal_success", t: "area", b: "Success in 6 months", label: "Six months from now, what would make this worth it?", help: "A number is great if you have one: leads per week, bookings per month, revenue." },
      { id: "goal_deadline", t: "text", b: "Deadline", label: "Is there a date this needs to be live by? Why that date?", optional: 1 },
    ]},
    { id: "audience", title: "Your customers", intro: "Their words usually make better copy than anything I could invent.", qs: [
      { id: "aud_who", t: "area", need: 1, b: "Best customer", label: "Describe your best customer, the one you wish you had ten more of." },
      { id: "aud_problem", t: "area", need: 1, b: "Their situation", label: "What’s going on in their life when they go looking for someone like you?" },
      { id: "aud_objections", t: "area", b: "Hesitations to answer", label: "What makes people hesitate before they buy or book?" },
      { id: "aud_words", t: "area", b: "Customer words (quote as-is)", label: "What do people say about you in reviews or when they refer a friend?", help: "Copy their exact words if you can." },
      { id: "aud_find", t: "chips", multi: 1, b: "How customers find them", label: "How do customers find you today?", opts: ["Google search", "Google Maps", "Referrals", "Instagram", "Facebook", "TikTok", "LinkedIn", "Yelp or Nextdoor", "Events", "Paid ads"] },
    ]},
    { id: "existing", title: "Your current brand", when: P.existingBrand, intro: "So I build on what you have instead of reinventing it.", qs: [
      { id: "ex_logo", t: "chips", need: 1, b: "Logo files", label: "What logo files do you have?", opts: ["Vector (SVG, AI, EPS or PDF)", "High-res PNG", "Low-res image only", "Not sure"] },
      { id: "ex_colors", t: "text", b: "Brand colors", label: "Your brand colors", placeholder: "Hex codes if you know them, or describe them" },
      { id: "ex_fonts", t: "text", b: "Brand fonts", label: "Your brand fonts", placeholder: "Font names, or “not sure”" },
      { id: "ex_guide", t: "text", b: "Brand guide or past designs", label: "Link to a brand guide or past designs", placeholder: "Google Drive, Dropbox or Canva link", optional: 1 },
      { id: "ex_keep", t: "chips", need: 1, b: "How much to keep", label: "How do you feel about your brand?", opts: ["Keep it exactly", "Keep the logo, refresh the rest", "Open to a full refresh"] },
    ]},
    { id: "brandbuild", title: "Find your look", when: P.buildBrand, intro: "No design vocabulary needed. React to what you see, and I’ll turn your answers into fonts and colors that fit.", qs: [
      { id: "brand_words", t: "text", need: 1, b: "Should feel", label: "Three words you want people to feel when they see your brand", placeholder: "Calm, trustworthy, fresh" },
      { id: "brand_never", t: "text", b: "Should never feel", label: "Three words it should never feel like", placeholder: "Corporate, cheap, fussy" },
      { id: "brand_scales", t: "scales", b: "Personality", label: "Where does your brand sit on each scale?", help: "Leave a slider in the middle if you’re not sure." },
      { id: "brand_fonts", t: "fonts", need: 1, b: "Type pairings", label: "Here’s your name in eight different typefaces. Which feel like you?" },
      { id: "brand_palettes", t: "palettes", need: 1, b: "Color systems", label: "Which of these color combinations could you see on your website, signs and business cards?" },
      { id: "brand_colornotes", t: "text", b: "Color notes", label: "Anything about color I should know?", placeholder: "Love teal, no purple, keep close to our van", optional: 1 },
      { id: "brand_admire", t: "area", b: "Brands they admire", label: "Which brands do you admire, in any industry? What do you like about them?" },
      { id: "brand_wordmark", t: "chips", when: () => a.path_brand === "No brand yet", b: "Plan for a missing logo", label: "You don’t have a logo yet. What would you like to do?", help: "Logo design isn’t part of my services. A clean wordmark (your business name set in your brand font) works well for launch.", opts: ["Use a clean wordmark", "I’ll work with a designer", "I’ll find one myself"] },
    ]},
    { id: "voice", title: "How you sound", intro: "How the words should sound on your site, in emails and in posts.", qs: [
      { id: "brand_voice", t: "voice", need: 1, b: "Voice", label: "Here’s the same idea written four ways. Which sounds most like you?" },
      { id: "voice_say", t: "area", b: "Words they always or never use", label: "Are there words you always use, or words you never want to see?", optional: 1 },
    ]},
    { id: "visual", title: "Look and feel", when: () => !anyPath() || P.web() || P.buildBrand() || P.social(), intro: "The “not us” answers help as much as the favorites.", qs: [
      { id: "vis_styles", t: "styles", need: 1, b: "Style directions", label: "Which of these directions feel like you?" },
      { id: "vis_colors", t: "moods", when: () => !P.buildBrand(), b: "Color moods", label: "Which color families are you drawn to?" },
      { id: "vis_refs", t: "refs", need: 1, b: "Reference sites", label: "Share two or three websites you love, from any industry, and one you don’t.", help: "Tell me what specifically: the colors, the photos, how simple it is, how it feels to scroll." },
      { id: "vis_photos", t: "chips", need: 1, b: "Photography", label: "What photos do you have?", opts: ["Professional photos ready", "Some phone photos", "I need a photo shoot", "Use stock photography"] },
      { id: "vis_motion", t: "chips", when: P.web, b: "Motion", label: "How much movement do you want on your site?", opts: ["Calm and still", "Subtle movement", "Lots of animation"], help: "Lots of animation is part of the Premium build." },
    ]},
    { id: "website", title: "Your website", when: P.web, intro: "The pages, the features and who writes the words.", qs: [
      { id: "web_keep", t: "area", b: "Keep from current site", label: "Is anything on your current site working well that should stay?", optional: 1 },
      { id: "web_pages", t: "chips", multi: 1, need: 1, b: "Pages", label: "Which pages do you need?", counter: 1, help: "The Standard build covers up to 5 pages. Extra pages are $250 each. Privacy and terms pages are always included.", opts: ["Home", "About", "Services", "Individual service pages", "Contact", "Booking", "FAQ", "Reviews", "Portfolio or gallery", "Blog", "Shop", "Careers"] },
      { id: "web_features", t: "chips", multi: 1, b: "Features", label: "Which features do you need?", opts: ["Contact form", "Online booking", "Take payments", "Newsletter signup", "Reviews feed", "Map or service area", "Live chat", "Client login", "Multiple languages"] },
      { id: "web_form", t: "area", b: "Contact form fields", label: "When someone fills out your contact form, what do you need to know to follow up?", placeholder: "Name, email, phone, zip code, what they need" },
      { id: "web_copy", t: "chips", need: 1, b: "Copy", label: "Who should write the words on your site?", opts: ["I’ll write it", "Write it for me from this brief", "I’ll send notes for you to polish"] },
      { id: "web_proof", t: "area", b: "Proof available", label: "What reviews, results or certifications can we show?" },
    ]},
    { id: "content", title: "Content and blog", when: P.content, intro: "Enough to plan your first few months of posts.", qs: [
      { id: "ct_topics", t: "area", need: 1, b: "Common customer questions", label: "What questions do customers ask you over and over?", help: "Each one can become a blog post. Aim for ten." },
      { id: "ct_rank", t: "area", b: "Searches to show up for", label: "What would you like to show up for on Google?", placeholder: "house cleaning st pete, move-out cleaning gulfport" },
      { id: "ct_freq", t: "chips", b: "Posting rhythm", label: "How often should we post?", opts: ["2 posts a month", "4 posts a month", "A quarterly batch", "Not sure"] },
      { id: "ct_expert", t: "chips", b: "Post voice", label: "Whose voice should the posts use?", opts: ["Mine, first person", "The business, “we”", "Neutral expert"] },
      { id: "ct_existing", t: "text", b: "Existing content", label: "Links to existing posts, newsletters or videos", optional: 1 },
    ]},
    { id: "social", title: "Social media", when: P.social, intro: "Which platforms, how often, and who shows up on camera.", qs: [
      { id: "so_platforms", t: "chips", multi: 1, need: 1, b: "Platforms", label: "Which platforms should we run?", opts: ["Instagram", "Facebook", "TikTok", "LinkedIn", "Google Business posts", "Pinterest", "YouTube"] },
      { id: "so_handles", t: "area", b: "Current handles", label: "Your current handles, and which ones are active", placeholder: "@yourbusiness on Instagram, active" },
      { id: "so_freq", t: "chips", b: "Posting rhythm", label: "How often should we post?", opts: ["3 posts a week", "5 posts a week", "Daily", "Not sure"] },
      { id: "so_pillars", t: "area", b: "Content pillars", label: "If you could only post about three things, what would they be?", placeholder: "Before and afters, team spotlights, quick tips" },
      { id: "so_face", t: "chips", b: "On camera", label: "Who should appear in posts?", opts: ["Me", "My team", "No faces, just products and places"] },
      { id: "so_media", t: "chips", b: "Photos and video", label: "Where will photos and video come from?", opts: ["I’ll send them weekly", "A shared folder I fill", "Stock and graphics only"] },
    ]},
    { id: "crm", title: "Leads and follow-up", when: P.crm, intro: "What happens after someone fills out your form. This is set up in HubSpot, which can start on free tools.", qs: [
      { id: "crm_now", t: "chips", b: "Where leads go today", label: "Where do new leads go today?", opts: ["Nowhere yet", "My email inbox", "A spreadsheet", "HubSpot", "Another CRM"] },
      { id: "crm_stages", t: "text", need: 1, b: "Lead stages", label: "What steps does a new customer go through with you?", placeholder: "New, Quoted, Booked, Repeat customer, Lost" },
      { id: "crm_followup", t: "area", b: "Automatic follow-up", label: "After someone reaches out, what should happen next, and how fast?", placeholder: "An instant email with pricing, then a call from me within a day" },
      { id: "crm_import", t: "text", b: "Contacts to import", label: "Do you have past customers to bring in?", placeholder: "About 300 in my booking software", optional: 1 },
      { id: "crm_tools", t: "area", b: "Tools to connect", label: "Which tools should it connect to?", placeholder: "Booking, invoicing, email newsletter", optional: 1 },
    ]},
    { id: "seats", title: "Team seats", when: P.seats, intro: "A question or two for each seat you added.", qs: [
      { id: "seat_report", t: "area", when: () => has("path_seats", "Reporting"), b: "Reporting: numbers that matter", label: "Which numbers matter most to you each month?", placeholder: "New leads, booked jobs, reviews, website visits" },
      { id: "seat_intel", t: "area", when: () => has("path_seats", "Competitive Intelligence"), b: "Competitors to watch", label: "Which competitors should we keep an eye on?", placeholder: "Websites or social handles" },
      { id: "seat_retention", t: "area", when: () => has("path_seats", "Customer Retention"), b: "Retention: what “gone quiet” means", label: "When has a customer “gone quiet”? Where does your customer list live?", placeholder: "No booking in 60 days. List is in my booking software." },
      { id: "seat_design", t: "area", when: () => has("path_seats", "Visual Designer"), b: "Design assets per month", label: "What graphics do you need each month?", placeholder: "8 post graphics, 2 blog headers" },
      { id: "seat_docs", t: "area", when: () => has("path_seats", "Training & Docs"), b: "Training needs", label: "Who on your team needs to learn what?", placeholder: "My office manager updates the site and replies to leads" },
    ]},
    { id: "accounts", title: "Accounts and tools", intro: "Everything is built in accounts you own, with me added as a helper. You keep it all. Please don’t enter any passwords here. I’ll send invites instead.", qs: [
      { id: "acc_domain", t: "text", need: 1, b: "Domain and registrar", label: "Your domain name, and where you bought it", placeholder: "yourbusiness.com at GoDaddy, or “I need one”" },
      { id: "acc_email", t: "text", b: "Email provider", label: "Which email do you use for the business?", placeholder: "Google Workspace, Outlook, Gmail" },
      { id: "acc_have", t: "chips", multi: 1, b: "Accounts they already have", label: "Which of these do you already have?", opts: ["Cloudflare", "GitHub", "HubSpot", "Google Business Profile", "Google Analytics", "Slack", "None of these"] },
      { id: "acc_owner", t: "text", need: 1, b: "Account owner and billing", label: "Whose email should own new accounts, and whose card pays for things like your domain?", placeholder: "My business email and business card" },
      { id: "acc_tools", t: "area", b: "Other tools in use", label: "What else do you use for booking, payments, newsletters or scheduling?", optional: 1 },
    ]},
    { id: "review", title: "Reviews and updates", intro: "How you’ll review work before anything goes live, and where you want to hear from me.", qs: [
      { id: "rv_channel", t: "chips", need: 1, b: "Where review requests go", label: "When something is ready for you to look at, where should I send it?", opts: ["Slack", "Email", "Text"] },
      { id: "rv_slack", t: "text", when: () => a.rv_channel === "Slack", b: "Slack workspace", label: "Your Slack workspace, if you have one", placeholder: "yourbusiness.slack.com, or “use yours”" },
      { id: "rv_alerts", t: "chips", multi: 1, b: "Notifications wanted", label: "What would you like to be notified about?", opts: ["New leads from the website", "Previews ready for review", "Posts waiting for approval", "Monthly report", "Website issues", "New Google reviews"] },
      { id: "rv_who", t: "text", need: 1, b: "Reviewer and final approver", label: "Who reviews the work, and who gives the final yes?", placeholder: "I review. My business partner and I approve the final version." },
      { id: "rv_turn", t: "chips", b: "Review turnaround", label: "How quickly can you usually reply to a review request?", opts: ["Same day", "Within 2 days", "Within a week"] },
      { id: "rv_reveal", t: "chips", b: "Final reveal format", label: "How would you like to see the finished work?", opts: ["Live video call", "In person", "A recorded walkthrough"] },
    ]},
    { id: "investment", title: "The Investment", intro: "So I can recommend the right scope for your budget.", qs: [
      { id: "inv_once", t: "chips", need: 1, b: "One-time budget", label: "What one-time investment feels comfortable for setup?", opts: ["Under $3,000", "$3,000 to $6,000", "$6,000 to $10,000", "$10,000+", "Not sure yet"] },
      { id: "inv_monthly", t: "chips", b: "Monthly budget", label: "And for ongoing monthly support?", opts: ["One-time only", "Under $500", "$500 to $1,000", "$1,000 to $2,500", "$2,500+", "Not sure yet"] },
      { id: "inv_pay", t: "chips", b: "Payment preference", label: "How would you prefer to pay for setup?", opts: ["50% to start, 50% at launch", "Pay in full", "Split over 3 months"] },
      { id: "inv_start", t: "text", b: "Start date", label: "When would you like to start?", placeholder: "Right away, or after a date" },
      { id: "inv_source", t: "text", b: "Lead source", label: "How did you hear about me?", optional: 1 },
      { id: "inv_more", t: "area", b: "Anything else", label: "Anything else I should know?", optional: 1 },
    ]},
    { id: "send", title: "Review and send", intro: "", qs: [] },
  ];
  STEPS.forEach((s) => s.qs.forEach((q) => { q.step = s; }));
  const allQs = STEPS.flatMap((s) => s.qs);
  const stepOn = (s) => !s.when || s.when();
  const qOn = (q) => stepOn(q.step) && (!q.when || q.when());
  const visibleSteps = () => STEPS.filter(stepOn);

  const filled = (q) => {
    const v = a[q.id];
    if (v == null) return false;
    if (Array.isArray(v)) return q.t === "refs" ? v.some((r) => (r.url || "").trim()) : v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return String(v).trim() !== "";
  };
  const optVal = (o) => (typeof o === "string" ? o : o.v);
  const optLabel = (o) => (typeof o === "string" ? o : o.l || o.v);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const bizName = () => (a.biz_name || "").trim() || "Your Business";

  /* ---------- Rendering ---------- */
  const verdictButtons = (qid, id, cur) => `<div class="k-verdict" role="group">${[["love", "Love it"], ["open", "Open to it"], ["no", "Not us"]].map(([k, l]) =>
    `<button type="button" data-card="${qid}" data-id="${id}" data-v="${k}" aria-pressed="${cur === k}">${l}</button>`).join("")}</div>`;

  const mock = (s) => `<div class="k-sample k-mock" style="--m-bg:${s.bg};--m-fg:${s.fg};--m-ac:${s.ac};--m-ac-fg:${s.acfg};--m-img:${s.img}" aria-hidden="true">
    <div class="k-m-nav"><span style="font-family:'${s.disp}',serif">${s.brand}</span><i></i><i></i><i></i></div>
    <div class="k-m-hero"><div><div class="k-m-h" style="font-family:'${s.disp}',serif;font-weight:${s.w};${s.extra || ""}">${s.head}</div>
    <div class="k-m-sub">${s.sub}</div><span class="k-m-btn" style="border-radius:${s.r}">${s.cta}</span></div>
    <div class="k-m-img" style="border-radius:${s.ir}"></div></div></div>`;
  const typeset = (f) => `<div class="k-sample k-type" aria-hidden="true">
    <div class="k-type-h" style="font-family:'${f.h}',serif;font-weight:${f.hw};${f.hs || ""}">${esc(bizName())}</div>
    <div class="k-type-b" style="font-family:'${f.b}',sans-serif">This is how your paragraphs would read. Easy on the eyes, even on a phone.</div></div>`;
  const palette = (p) => `<div class="k-sample k-pal" aria-hidden="true">
    <div class="k-pal-face" style="background:${p.c.bg};color:${p.c.ink}"><b>${esc(bizName())}</b><span>Headline, text and a button together.</span><i style="background:${p.c.accent};color:${p.c.bg}">Book now</i></div>
    <div class="k-pal-strip">${["bg", "soft", "alt", "accent", "ink"].map((k) => `<u style="background:${p.c[k]}"></u>`).join("")}</div></div>`;
  const cards = (q, list, face) => {
    const sv = a[q.id] || {};
    return `<div class="k-cards">${list.map((s) => `<div class="k-card${sv[s.id] ? " is-" + sv[s.id] : ""}">
      ${face(s)}<div class="k-card-name"><strong>${s.name}</strong><small>${s.fit}</small></div>
      ${verdictButtons(q.id, s.id, sv[s.id])}</div>`).join("")}</div>`;
  };

  const field = (q) => {
    const v = a[q.id];
    const ph = q.placeholder ? ` placeholder="${esc(q.placeholder)}"` : "";
    const ac = q.ac ? ` autocomplete="${q.ac}"` : "";
    switch (q.t) {
      case "text": return `<input type="text" id="k-${q.id}" data-q="${q.id}" value="${esc(v)}"${ph}${ac}>`;
      case "email": return `<input type="email" id="k-${q.id}" data-q="${q.id}" value="${esc(v)}"${ph}${ac} required>`;
      case "area": return `<textarea id="k-${q.id}" data-q="${q.id}"${ph}>${esc(v)}</textarea>`;
      case "chips": {
        const sel = q.multi ? v || [] : [v];
        return `<div class="k-chips" role="group" aria-labelledby="k-l-${q.id}">${q.opts.map((o) =>
          `<button type="button" class="k-chip" data-chip="${q.id}" data-val="${esc(optVal(o))}" aria-pressed="${sel.includes(optVal(o))}">${esc(optLabel(o))}</button>`).join("")}</div>
          ${q.counter ? `<p class="k-count" id="k-count-${q.id}"></p>` : ""}`;
      }
      case "voice": return `<div class="k-voices">${VOICES.map((o) =>
        `<button type="button" class="k-voice" data-voice="${o.id}" aria-pressed="${v === o.id}"><em>${o.name}</em><span>${o.line}</span></button>`).join("")}</div>`;
      case "scales": {
        const sv = v || {};
        return `<div class="k-scales">${SCALES.map(([k, l, r]) =>
          `<label class="k-scale"><span>${l}</span><input type="range" min="1" max="5" step="1" id="k-scale-${k}" data-scale="${k}" value="${sv[k] || 3}" aria-label="${l} to ${r}"><span>${r}</span></label>`).join("")}</div>`;
      }
      case "styles": return cards(q, STYLES, mock);
      case "fonts": return cards(q, FONTS, typeset);
      case "palettes": return cards(q, PALETTES, palette);
      case "moods": {
        const sel = v || [];
        return `<div class="k-moods">${MOODS.map((m) =>
          `<button type="button" class="k-mood" data-mood="${m.id}" aria-pressed="${sel.includes(m.id)}"><span class="k-sw">${m.c.map((c) => `<i style="background:${c}"></i>`).join("")}</span>${m.name}</button>`).join("")}</div>`;
      }
      case "refs": {
        const list = v && v.length ? v : [{ url: "", note: "", v: "love" }];
        return `<div class="k-refs">${list.map((r, i) => `<div class="k-ref">
          <input type="text" id="k-ref-url-${i}" data-ref="${i}" data-k="url" value="${esc(r.url)}" placeholder="website.com" aria-label="Website">
          <input type="text" class="k-ref-note" id="k-ref-note-${i}" data-ref="${i}" data-k="note" value="${esc(r.note)}" placeholder="What you like or don’t like about it" aria-label="What you like about it">
          <select id="k-ref-v-${i}" data-ref="${i}" aria-label="Love it or not for me"><option value="love"${r.v === "love" ? " selected" : ""}>Love it</option><option value="avoid"${r.v === "avoid" ? " selected" : ""}>Not for me</option></select>
          <button type="button" class="k-x" data-delref="${i}" aria-label="Remove website">×</button></div>`).join("")}</div>
          <button type="button" class="k-add" data-addref>+ Add another website</button>`;
      }
    }
    return "";
  };

  const question = (q) => {
    const tag = q.req ? '<span class="required-tag">*</span>' : q.need ? '<span class="k-need">Helps most</span>' : q.optional ? '<span class="optional-tag">(optional)</span>' : "";
    const forAttr = ["text", "email", "area"].includes(q.t) ? ` for="k-${q.id}"` : "";
    return `<div class="form-field k-q${q.half ? " k-half" : ""}" id="k-wrap-${q.id}">
      <label id="k-l-${q.id}"${forAttr}>${esc(q.label)} ${tag}</label>
      ${q.help ? `<p class="k-help">${esc(q.help)}</p>` : ""}
      ${field(q)}</div>`;
  };

  const reviewStep = () => {
    const missing = allQs.filter((q) => q.need && qOn(q) && !filled(q));
    const steps = visibleSteps().filter((s) => s.id !== "send");
    return `<div class="k-summary">${steps.map((s) => {
      const qs = s.qs.filter(qOn), done = qs.filter(filled).length;
      return `<div class="k-sum-row"><span>${s.title}</span><span class="k-sum-n">${done} of ${qs.length} answered</span><button type="button" class="k-link" data-goto="${s.id}">Edit</button></div>`;
    }).join("")}</div>
    ${missing.length ? `<div class="k-missing"><strong>A few answers would help me most:</strong><ul>${missing.map((q) =>
      `<li><button type="button" class="k-link" data-goto="${q.step.id}">${esc(q.b || q.label)}</button></li>`).join("")}</ul>
      <p>You can still send it now, and we’ll cover these on our kickoff call.</p></div>` : `<div class="k-missing is-clear"><strong>Everything I need is here.</strong></div>`}
    <label class="checkbox-row k-consent"><input type="checkbox" id="k-consent"> I agree that Simonne Piriz Studio can store these answers to plan my project, as described in the <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</label>`;
  };

  const stepEl = document.getElementById("kick-step");
  const backBtn = document.getElementById("kick-back");
  const nextBtn = document.getElementById("kick-next");
  const statusEl = document.getElementById("kick-status");

  function render(focusTop) {
    const steps = visibleSteps();
    if (step >= steps.length) step = steps.length - 1;
    const s = steps[step];
    const qs = s.qs.filter(qOn);
    stepEl.innerHTML = `<div class="k-step-head"><div class="eyebrow">${s.id === "send" ? "Last step" : `Step ${step + 1} of ${steps.length}`}</div>
      <h2 class="heading" tabindex="-1" id="k-step-title">${s.title}</h2>${s.intro ? `<p>${s.intro}</p>` : ""}</div>
      ${s.id === "send" ? reviewStep() : `<div class="k-qs">${qs.map(question).join("")}</div>`}`;
    document.getElementById("kick-fill").style.width = `${((step + 1) / steps.length) * 100}%`;
    document.getElementById("kick-step-label").textContent = `${s.title} · ${step + 1} of ${steps.length}`;
    backBtn.hidden = step === 0;
    nextBtn.textContent = s.id === "send" ? "Send my Kickoff Brief" : steps[step + 1] && steps[step + 1].id === "send" ? "Review answers" : "Next";
    statusEl.className = "form-status";
    statusEl.textContent = "";
    updateCount();
    save();
    if (focusTop) {
      root.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("k-step-title").focus({ preventScroll: true });
    }
  }

  function updateCount() {
    const c = document.getElementById("k-count-web_pages");
    if (!c) return;
    const n = (a.web_pages || []).length, extra = Math.max(0, n - 5);
    c.textContent = n ? `${n} selected${extra ? ` · ${extra} beyond the Standard 5, at $250 each` : " · within the Standard build"}` : "";
  }

  function go(to) { step = to; render(true); }

  /* ---------- Brief for HubSpot ---------- */
  function brief() {
    const L = [];
    const val = (q) => (Array.isArray(a[q.id]) ? a[q.id].join(", ") : a[q.id]);
    const verdicts = (q, list, fmt) => {
      const sv = a[q.id] || {};
      const pick = (v) => list.filter((s) => sv[s.id] === v);
      if (pick("love").length) L.push(`- **${q.b}, loves:** ${pick("love").map(fmt).join("; ")}`);
      if (pick("open").length) L.push(`- **${q.b}, open to:** ${pick("open").map(fmt).join("; ")}`);
      if (pick("no").length) L.push(`- **${q.b}, avoid:** ${pick("no").map((s) => s.name).join(", ")}`);
    };
    L.push(`# Kickoff Brief: ${bizName()}`);
    L.push(`Submitted by the client on ${new Date().toISOString().slice(0, 10)}.`);
    L.push("", "Build from this brief. Use the client’s own words where quoted. Do not invent reviews, numbers, credentials or results; leave a clearly marked placeholder instead. Build in the client’s own accounts. No logo design. Ask before guessing on anything under Open items.");
    if (P.buildBrand()) L.push("Brand: choose the final heading and body fonts and a 5-role color system (background, soft, secondary, accent, ink) from the loved options below, check contrast for accessibility, and show 2 directions before building pages.");
    visibleSteps().filter((s) => s.id !== "send").forEach((s) => {
      const start = L.length;
      L.push("", `## ${s.title}`);
      s.qs.filter((q) => qOn(q) && filled(q)).forEach((q) => {
        const b = q.b || q.label;
        if (q.t === "styles") return verdicts(q, STYLES, (x) => `${x.name} (${x.note.replace(/\.$/, "").toLowerCase()})`);
        if (q.t === "fonts") return verdicts(q, FONTS, (x) => `${x.name}: ${x.h} headings + ${x.b} body`);
        if (q.t === "palettes") return verdicts(q, PALETTES, (x) => `${x.name} (bg ${x.c.bg}, soft ${x.c.soft}, secondary ${x.c.alt}, accent ${x.c.accent}, ink ${x.c.ink})`);
        if (q.t === "moods") return L.push(`- **${b}:** ${a[q.id].map((id) => { const m = MOODS.find((x) => x.id === id); return `${m.name} (${m.c.join(" ")})`; }).join("; ")}`);
        if (q.t === "voice") { const vo = VOICES.find((x) => x.id === a[q.id]); return L.push(`- **Voice:** ${vo.name} (closest sample: "${vo.line}")`); }
        if (q.t === "scales") {
          const sc = a[q.id];
          const t = SCALES.filter(([k]) => sc[k]).map(([k, l, r]) => (sc[k] === 3 ? `balanced ${l.toLowerCase()}/${r.toLowerCase()}` : `${sc[k] < 3 ? l : r}${Math.abs(sc[k] - 3) === 2 ? " (strongly)" : ""}`));
          return L.push(`- **Personality:** ${t.join(", ")}`);
        }
        if (q.t === "refs") return a[q.id].filter((r) => r.url.trim()).forEach((r) => L.push(`- **${r.v === "love" ? "Reference they love" : "Reference to avoid"}:** ${r.url}${r.note ? " - " + r.note : ""}`));
        if (q.id === "web_pages") { const n = a.web_pages.length; return L.push(`- **Pages (${n}):** ${val(q)}${n > 5 ? ` (${n - 5} beyond the Standard 5 at $250 each)` : ""}, plus privacy and terms`); }
        L.push(`- **${b}:** ${val(q)}`);
      });
      if (L.length === start + 2) L.splice(start);
    });
    const gaps = allQs.filter((q) => q.need && qOn(q) && !filled(q));
    L.push("", "## Open items");
    L.push(gaps.length ? gaps.map((q) => `- ${q.b || q.label}`).join("\n") : "- None. Every key answer is filled in.");
    return L.join("\n");
  }

  async function submit() {
    if (document.getElementById("kick-hp").value) return; // bot
    if (!document.getElementById("k-consent").checked) {
      statusEl.className = "form-status is-error";
      statusEl.textContent = "Please check the box to agree before sending.";
      return;
    }
    if (!HUBSPOT_FORM_GUID) {
      statusEl.className = "form-status is-error";
      statusEl.textContent = "This form isn’t connected yet. Please email simonnemv@gmail.com and I’ll send you a link that works.";
      return;
    }
    const hutk = (document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/) || [])[1];
    const fields = [
      ["0-1/email", a.email], ["0-1/firstname", a.firstname], ["0-1/lastname", a.lastname], ["0-1/phone", a.phone],
      ["0-2/name", a.biz_name], ["0-2/website", a.website],
      ["0-1/kickoff_services", (a.path_services || []).join(";")],
      ["0-1/kickoff_brand_status", a.path_brand],
      ["0-1/kickoff_budget", [a.inv_once, a.inv_monthly && "monthly: " + a.inv_monthly].filter(Boolean).join(", ")],
      ["0-1/kickoff_brief", brief()],
    ].filter(([, v]) => v && String(v).trim()).map(([name, value]) => ({ name, value: String(value) }));

    nextBtn.disabled = true;
    nextBtn.textContent = "Sending...";
    try {
      const response = await fetch(HUBSPOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, context: { pageUri: window.location.href, pageName: document.title, ...(hutk ? { hutk } : {}) } }),
      });
      if (!response.ok) throw new Error("Submission failed");
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      root.hidden = true;
      document.querySelector(".kick-progress").hidden = true;
      document.getElementById("kick-done").hidden = false;
      document.getElementById("kick-done").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      statusEl.className = "form-status is-error";
      statusEl.textContent = "Something went wrong sending that. Your answers are still saved here. Try again, or email simonnemv@gmail.com.";
      nextBtn.disabled = false;
      nextBtn.textContent = "Send my Kickoff Brief";
    }
  }

  /* ---------- Events ---------- */
  const set = (id, v) => { a[id] = v; save(); };
  const pathChanged = (id) => id.startsWith("path_") || id === "rv_channel";

  root.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.q) set(t.dataset.q, t.value);
    else if (t.dataset.scale) set("brand_scales", { ...(a.brand_scales || {}), [t.dataset.scale]: +t.value });
    else if (t.dataset.ref && t.tagName === "INPUT") {
      const list = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      list[+t.dataset.ref] = { ...list[+t.dataset.ref], [t.dataset.k]: t.value };
      set("vis_refs", list);
    }
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.tagName === "SELECT" && t.dataset.ref) {
      const list = [...(a.vis_refs || [{ url: "", note: "", v: "love" }])];
      list[+t.dataset.ref] = { ...list[+t.dataset.ref], v: t.value };
      set("vis_refs", list);
    }
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.chip) {
      const q = allQs.find((x) => x.id === b.dataset.chip), v = b.dataset.val;
      if (q.multi) {
        const cur = [...(a[q.id] || [])], i = cur.indexOf(v);
        i >= 0 ? cur.splice(i, 1) : cur.push(v);
        b.setAttribute("aria-pressed", i < 0);
        set(q.id, cur);
      } else {
        const on = a[q.id] !== v;
        b.parentElement.querySelectorAll(".k-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", on);
        set(q.id, on ? v : "");
      }
      if (pathChanged(q.id)) render(false);
      else updateCount();
    } else if (b.dataset.voice) {
      const on = a.brand_voice !== b.dataset.voice;
      b.parentElement.querySelectorAll(".k-voice").forEach((c) => c.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", on);
      set("brand_voice", on ? b.dataset.voice : "");
    } else if (b.dataset.card) {
      const sv = { ...(a[b.dataset.card] || {}) }, id = b.dataset.id, v = b.dataset.v;
      if (sv[id] === v) delete sv[id]; else sv[id] = v;
      const card = b.closest(".k-card");
      card.className = "k-card" + (sv[id] ? " is-" + sv[id] : "");
      card.querySelectorAll(".k-verdict button").forEach((x) => x.setAttribute("aria-pressed", sv[id] === x.dataset.v));
      set(b.dataset.card, sv);
    } else if (b.dataset.mood) {
      const cur = [...(a.vis_colors || [])], i = cur.indexOf(b.dataset.mood);
      i >= 0 ? cur.splice(i, 1) : cur.push(b.dataset.mood);
      b.setAttribute("aria-pressed", i < 0);
      set("vis_colors", cur);
    } else if (b.hasAttribute("data-addref")) {
      set("vis_refs", [...(a.vis_refs || [{ url: "", note: "", v: "love" }]), { url: "", note: "", v: "love" }]);
      render(false);
      document.getElementById(`k-ref-url-${a.vis_refs.length - 1}`).focus();
    } else if (b.dataset.delref != null) {
      const list = [...(a.vis_refs || [])];
      list.splice(+b.dataset.delref, 1);
      set("vis_refs", list);
      render(false);
    } else if (b.dataset.goto) {
      go(visibleSteps().findIndex((s) => s.id === b.dataset.goto));
    }
  });

  backBtn.addEventListener("click", () => go(Math.max(0, step - 1)));
  nextBtn.addEventListener("click", () => {
    const steps = visibleSteps();
    if (steps[step].id === "send") return submit();
    if (steps[step].id === "start") {
      const email = (a.email || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !(a.biz_name || "").trim()) {
        statusEl.className = "form-status is-error";
        statusEl.textContent = "Please add your email and business name so I can match your answers to you.";
        return;
      }
    }
    go(step + 1);
  });

  render(false);
})();
