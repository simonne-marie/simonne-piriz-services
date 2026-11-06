// Every price on the site, in one place. The Investment calculator (scripts.js) and the studio guide (guide.js)
// both read from here, so a price change only has to happen once. The printed labels on services.html still
// need updating by hand when a number changes.
window.SP_PRICING = {
  RATES: {
    website: { setup: { standard: 2900, premium: 5200 }, handoff: { standard: 3800, premium: 6800 }, monthly: 400, quarterly: 750 },
    content: { setup: 450, monthly: 800, quarterly: 1500, handoff: 2800 },
    social: { setup: 350, monthly: 750, quarterly: 1350, handoff: 2600 },
  },
  FULL_TEAM_PRICE: 2500,
  SEATS: {
    crm: { label: "CRM & Automation Specialist", setup: 750, monthly: 350 },
    designer: { label: "Visual Designer", monthly: 300 },
    intel: { label: "Competitive Intelligence Analyst", monthly: 250 },
    reporting: { label: "Reporting Analyst", monthly: 200 },
    retention: { label: "Customer Retention Analyst", monthly: 300 },
    docs: { label: "Training & Docs Builder", setup: 500 },
  },
  EXTRAS: {
    extraPost: 175, // per post, per month
    extraPlatform: 200, // per month
    newsletter: 300, // per month
    rush: 0.2, // share of the one-time cost
    voiceGuide: 300,
    brandFoundation: 2400,
    socialPages: 300, // up to 3 profiles
    extraPage: 250, // beyond the first 5
    updatePack: 225, // 3 small site changes
  },
  // Off the monthly or quarterly price for combining 2 or 3 core services. One-time setup gets 10% off for 2 or more.
  BUNDLE: { two: 0.1, three: 0.15, setup: 0.1 },
};
