/*
 * RH Business Solutions — website content
 * ------------------------------------------------------------
 * Every piece of text on the website comes from this one object.
 * The admin panel (built separately) will read and write this same
 * structure, so keep the keys stable when editing by hand.
 */
window.SITE = {
  company: {
    name: "RH Business Solutions & Marketing Management",
    short: "RH Business Solutions",
    sub: "& Marketing Management",
    tagline: "Recruitment, business setup, IT and marketing solutions in the UAE.",
    intro: "We supply skilled and unskilled workers to companies — one by one or in bulk, from inside the UAE and from overseas — and support you with visas, travel, company setup and digital growth.",
    phone: "+971 555843001",
    email: "info@rhmanagements.com",
    address: "Al Nahda 1, Dubai – Mai Tower, 5th Floor, 510 Royal Business Center, Office no. 8",
    city: "Dubai, United Arab Emirates",
    footer: "Your partner in business excellence. Transforming ideas into success.",
    copyright: "© 2026 RH Business Solutions & Marketing Management. All rights reserved.",
    logo: "" // optional image URL; when empty the RH monogram is shown
  },

  nav: [
    { label: "Home", href: "index.html", page: "home" },
    { label: "About Us", href: "about.html", page: "about" },
    { label: "Services", href: "services.html", page: "services", dropdown: true },
    { label: "Portfolio", href: "portfolio.html", page: "portfolio" },
    { label: "Contact Us", href: "contact.html", page: "contact" }
  ],

  hero: {
    eyebrow: "Recruitment & HR Solutions · Dubai, UAE",
    lead: "We Provide",
    words: [
      { icon: "users", text: "Recruitment", color: "#3d6bff" },
      { icon: "globe", text: "Bulk Hiring", color: "#1fb2e6" },
      { icon: "briefcase", text: "HR Solutions", color: "#8b5cf6" },
      { icon: "building", text: "Business Setup", color: "#dcaa48" },
      { icon: "code", text: "Development", color: "#22c08a" },
      { icon: "trending", text: "Marketing", color: "#ff8a3d" },
      { icon: "plane", text: "Travel & Tour", color: "#14b8a6" }
    ],
    points: ["Inside & outside the UAE", "Skilled & unskilled workers", "Visa & joining support"]
  },

  stats: [
    { value: "40", label: "Sourcing countries across Africa & Asia" },
    { value: "7", label: "Emirates covered for local hiring" },
    { value: "10", label: "Business services under one roof" },
    { value: "A–Z", label: "Selection, visa, travel & joining" }
  ],

  recruitmentItems: [
    { icon: "pin", title: "Inside Recruitment", text: "Ready candidates from **inside the UAE**." },
    { icon: "globe", title: "Outside Recruitment", text: "Hiring **from overseas** for your company." },
    { icon: "users", title: "Bulk Manpower Supply", text: "**Large teams** supplied to companies." },
    { icon: "idcard", title: "Skilled Workers", text: "**Trained staff** for technical roles." },
    { icon: "hardhat", title: "Unskilled Workers", text: "Labour and support staff **on demand**." },
    { icon: "clipboard", title: "Screening & Interviews", text: "We shortlist **the best candidates**." },
    { icon: "passport", title: "Visa Processing", text: "**Work visa** and permit handling." },
    { icon: "plane", title: "Travel & Joining", text: "Tickets, arrival and **joining support**." },
    { icon: "file", title: "Documentation", text: "**Contracts** and staff paperwork." },
    { icon: "wallet", title: "Payroll & Records", text: "**Salary processing** and staff files." },
    { icon: "cap", title: "Training & Onboarding", text: "Get new staff **ready for the job**." },
    { icon: "shield", title: "HR Policy & Compliance", text: "Keep your team **within the rules**." }
  ],

  process: [
    { title: "Planning & Research", text: "We study the market to find opportunities and understand the rules of your industry." },
    { title: "Legal Formalities", text: "We register your business, get the licences and permits, and choose a suitable legal structure." },
    { title: "Financial Setup", text: "We help you open a business bank account, arrange funding and set up accounting." },
    { title: "Operational Setup", text: "We set up your office, your systems and the marketing that brings in customers." }
  ],

  hiringSteps: [
    { title: "Share your requirement", text: "Tell us the roles, numbers, skills and joining date." },
    { title: "Sourcing & screening", text: "We source inside the UAE or overseas and shortlist candidates." },
    { title: "Interviews & selection", text: "You interview the shortlist; we handle trade and skill checks." },
    { title: "Visa, travel & joining", text: "Work visa, tickets, arrival and onboarding — all managed." }
  ],

  services: [
    {
      id: "recruitment", group: "recruitment", icon: "users",
      name: "Recruitment Services", short: "Recruitment",
      summary: "Skilled and unskilled workers for companies — **inside the UAE and from overseas**, one by one or in bulk.",
      text: "Our main service. We supply skilled and unskilled workers to companies, from inside the UAE and from outside, one by one or in bulk.",
      points: ["Inside recruitment from candidates in the UAE", "Outside recruitment for bulk hiring from overseas", "Skilled and unskilled workers for companies", "Screening, interviews and shortlisting", "Visa, travel and joining support"],
      visual: "network"
    },
    {
      id: "inside-recruitment", group: "recruitment", icon: "pin",
      name: "Inside Recruitment", short: "Inside Recruitment",
      summary: "Candidates already living in the UAE, **screened and ready** to join your company quickly.",
      text: "Candidates already living in the UAE, screened and ready to start. Fast placement for companies that need staff now.",
      points: ["Ready-to-join candidates already in the UAE", "Skilled and unskilled workers", "Fast shortlisting and interviews", "Visa status and document checks", "Quick placement for your company"],
      tags: ["Skilled", "Unskilled", "Quick placement"],
      visual: "uae"
    },
    {
      id: "outside-recruitment", group: "recruitment", icon: "globe",
      name: "Outside Recruitment", short: "Outside Recruitment",
      summary: "**Bulk hiring from overseas.** We handle selection, visas and travel for your new workforce.",
      text: "Bulk hiring from overseas. We find, screen and send workers from African and Asian countries to the UAE for your company.",
      points: ["Bulk hiring for companies from overseas", "Candidates from African and Asian countries", "Selection, interviews and skill checks", "Work visa and entry permit processing", "Travel, arrival and joining support"],
      tags: ["Bulk hiring", "Overseas", "Visa support"],
      visual: "world"
    },
    {
      id: "hr-solution", group: "recruitment", icon: "briefcase",
      name: "HR Solutions", short: "HR Solutions",
      summary: "**Payroll, staff records**, policies and team management for your company.",
      text: "We help companies hire the right people, skilled and unskilled, and manage their teams with less effort.",
      points: ["Recruitment of skilled and unskilled workers", "Candidate screening and shortlisting", "Visa and onboarding support", "Payroll and staff records", "HR policy and team management"],
      tags: ["Payroll", "Policies", "Onboarding"],
      visual: "hr"
    },
    {
      id: "travel-tour", group: "business", icon: "plane",
      name: "Travel & Tour", short: "Travel & Tour",
      summary: "Visit visas for **Saudi Arabia, Europe, the USA and Asia** — plus flights and hotels.",
      text: "We arrange visit visas for Saudi Arabia, European countries, the USA and Asian countries, and book your flight tickets.",
      points: ["Visit visa for Saudi Arabia", "Visit visa for European countries", "Visit visa for the USA", "Visit visa for Asian countries", "Flight ticket booking", "Hotel booking", "Travel documents and guidance"],
      visual: "travel"
    },
    {
      id: "business-setup", group: "business", icon: "building",
      name: "Business Setup & Company Formation", short: "Business Setup",
      summary: "Trade licence, visas, legal structure and bank setup — **handled start to finish**.",
      text: "Start your company in the UAE with a partner who handles the paperwork. We guide you from trade licence to visa so you can focus on the business.",
      points: ["Company registration and trade licence", "Visa processing for owners and staff", "Choosing the right legal structure", "Full compliance with local regulations", "Bank account and accounting setup support"],
      visual: "setup"
    },
    {
      id: "web-development", group: "business", icon: "code",
      name: "Web Development", short: "Development",
      summary: "**Fast, modern websites** built around your brand — from business sites to custom platforms.",
      text: "We design and build fast, modern websites made around your brand, from simple business sites to custom web platforms.",
      points: ["Custom website design", "Responsive mobile-first development", "Landing pages and business portals", "Speed, security and clean code", "Ongoing updates and support"],
      visual: "web"
    },
    {
      id: "seo-digital-marketing", group: "business", icon: "trending",
      name: "SEO & Digital Marketing", short: "Marketing",
      summary: "Get found online and **turn visitors into customers** with steady, measurable growth.",
      text: "Get found online and turn visitors into customers. Our marketing plans increase your visibility and bring steady growth.",
      points: ["Search engine optimisation", "Social media marketing", "Paid ads on Google and social platforms", "Content and brand campaigns", "Monthly performance reports"],
      visual: "chart"
    },
    {
      id: "management", group: "business", icon: "dashboard",
      name: "Website & Social Management", short: "Management",
      summary: "Daily care of your websites and social accounts — **updated, secure** and working well.",
      text: "We look after your websites and social accounts every day, so everything stays updated, secure and working well.",
      points: ["Website maintenance and troubleshooting", "Social media account management", "Regular content updates", "Security checks and backups", "Quick response when something breaks"],
      visual: "manage"
    },
    {
      id: "e-commerce", group: "business", icon: "cart",
      name: "E-Commerce", short: "E-Commerce",
      summary: "Online stores with **products, payments and orders** managed in one place.",
      text: "Sell online with a store that is simple for customers and easy for you to run, with payments, products and orders in one place.",
      points: ["Online store design and setup", "Product and inventory management", "Secure payment gateway integration", "Order and delivery workflow", "Marketing tools to grow sales"],
      visual: "shop"
    }
  ],

  projects: [
    { icon: "code", title: "Corporate Website", category: "Web Development", text: "A clean company site with fast pages and clear services." },
    { icon: "cart", title: "Online Store", category: "E-Commerce", text: "Products, payments and orders managed in one place." },
    { icon: "trending", title: "Search Growth Campaign", category: "SEO & Marketing", text: "Better rankings and steady enquiries from search." },
    { icon: "building", title: "Company Formation Package", category: "Business Setup", text: "Licence, visa and compliance handled start to finish." },
    { icon: "dashboard", title: "Social Account Care", category: "Management", text: "Daily management of social accounts and updates." },
    { icon: "users", title: "Recruitment Drive", category: "HR Solutions", text: "Skilled and unskilled hiring for growing teams." }
  ],

  // [flag code, name, longitude, latitude] — used for the hero map and the sourcing lists
  sourcing: {
    africa: [["eg", "Egypt", 31.2, 30.0], ["sd", "Sudan", 32.5, 15.6], ["er", "Eritrea", 38.9, 15.3], ["et", "Ethiopia", 38.7, 9.0], ["so", "Somalia", 45.3, 2.0], ["ke", "Kenya", 36.8, -1.3], ["ug", "Uganda", 32.6, 0.3], ["rw", "Rwanda", 30.1, -1.9], ["tz", "Tanzania", 39.3, -6.8], ["mw", "Malawi", 33.8, -14.0], ["zm", "Zambia", 28.3, -15.4], ["zw", "Zimbabwe", 31.0, -17.8], ["za", "South Africa", 28.0, -26.2], ["mg", "Madagascar", 47.5, -18.9], ["cm", "Cameroon", 11.5, 3.8], ["ng", "Nigeria", 7.5, 9.1], ["gh", "Ghana", -0.2, 5.6], ["tg", "Togo", 1.2, 6.1], ["bj", "Benin", 2.4, 6.4], ["ci", "Ivory Coast", -4.0, 5.3], ["lr", "Liberia", -10.8, 6.3], ["sl", "Sierra Leone", -13.2, 8.5], ["gn", "Guinea", -13.7, 9.6], ["gm", "Gambia", -16.6, 13.4], ["sn", "Senegal", -17.4, 14.7], ["ml", "Mali", -8.0, 12.6], ["bf", "Burkina Faso", -1.5, 12.4], ["ne", "Niger", 2.1, 13.5], ["ma", "Morocco", -6.8, 34.0], ["tn", "Tunisia", 10.2, 36.8]],
    asia: [["pk", "Pakistan", 73.0, 33.7], ["in", "India", 77.2, 28.6], ["np", "Nepal", 85.3, 27.7], ["bd", "Bangladesh", 90.4, 23.8], ["lk", "Sri Lanka", 79.9, 6.9], ["mm", "Myanmar", 96.1, 19.7], ["vn", "Vietnam", 105.8, 21.0], ["ph", "Philippines", 121.0, 14.6], ["id", "Indonesia", 106.8, -6.2], ["uz", "Uzbekistan", 69.2, 41.3]]
  },


  emirates: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],

  destinations: {
    asia: [["cn", "China"], ["az", "Azerbaijan"], ["kz", "Kazakhstan"], ["id", "Indonesia"], ["th", "Thailand"], ["my", "Malaysia"], ["sg", "Singapore"], ["tr", "Turkey"], ["mv", "Maldives"], ["ge", "Georgia"], ["uz", "Uzbekistan"], ["lk", "Sri Lanka"], ["vn", "Vietnam"], ["jp", "Japan"]],
    world: [["sa", "Saudi Arabia"], ["fr", "France"], ["it", "Italy"], ["es", "Spain"], ["de", "Germany"], ["gr", "Greece"], ["nl", "Netherlands"], ["at", "Austria"], ["ch", "Switzerland"], ["us", "USA"], ["ca", "Canada"], ["eg", "Egypt"], ["ma", "Morocco"]]
  }
};
