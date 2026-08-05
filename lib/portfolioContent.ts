export type PortfolioCardItem = {
  id: string;
  title: string;
  date: string;
  subtitle: string;
  description?: string;
  image: string;
  /** When set, the card links here in a new tab instead of the project detail page. */
  externalUrl?: string;
};

export type PortfolioDetail = {
  title: string;
  timeline: string;
  tools: string;
  skills: string;
  overview: string;
  websiteUrl: string;
  imageUrl: string;
};

/** Grewal Guyatt LLP experience card + detail hero. */
export const EXPERIENCE_GREWAL_GUYATT_LOGO_SRC = "/images/experience/grewal-guyatt.png" as const;

/** QuickPOS experience card + detail hero. */
export const EXPERIENCE_QUICKPOS_IMAGE_SRC = "/images/experience/quickpos.png" as const;

/** TSAC experience card + detail hero. */
export const EXPERIENCE_TSAC_LOGO_SRC = "/images/experience/tsac-logo.png" as const;

/** Ataraxia experience card + detail hero (built from `images/brand/favicon.png`, white canvas). */
export const EXPERIENCE_ATARAXIA_IMAGE_SRC = "/images/experience/ataraxia.png" as const;

/** WatsApp project card + detail hero. */
export const PROJECT_WATSAPP_IMAGE_SRC = "/images/projects/watsapp.png" as const;

/** UniCook project card + detail hero (wordmark on white). */
export const PROJECT_UNICOOK_LOGO_SRC = "/images/projects/unicook-logo.png" as const;

/** atrx.ca project card (logo on white). */
export const PROJECT_ATRX_IMAGE_SRC = "/images/projects/atrx.png" as const;

export const EXPERIENCE_GRID_ITEMS: readonly PortfolioCardItem[] = [
  {
    id: "grewal-guyatt",
    title: "Grewal Guyatt LLP",
    date: "Incoming F26",
    subtitle: "Software Developer",
    description:
      "Shipping full-stack products for a growing professional services firm.",
    image: EXPERIENCE_GREWAL_GUYATT_LOGO_SRC,
    externalUrl: "https://www.grewalguyatt.ca/",
  },
  {
    id: "quickpos",
    title: "QuickPOS Technologies Inc.",
    date: "Jan 2026 – Apr 2026",
    subtitle: "Software Engineer Intern",
    description:
      "Built and shipped an AI-powered B2B platform end to end on a small team, from backend and frontend to deployment.",
    image: EXPERIENCE_QUICKPOS_IMAGE_SRC,
    externalUrl: "https://quickpos.ca/",
  },
  {
    id: "ataraxia",
    title: "Ataraxia Apparel Inc.",
    date: "May 2025 – Sep 2025",
    subtitle: "Founder",
    description:
      "Founded a streetwear brand from scratch, reaching 65K+ users and $5K in sales within one month at a 60% gross margin.",
    image: EXPERIENCE_ATARAXIA_IMAGE_SRC,
    externalUrl: "https://atrx.ca",
  },
  {
    id: "trudeau-sac",
    title: "Trudeau Student Activities Council",
    date: "May 2024 – Jun 2025",
    subtitle: "Head of Publicity",
    description:
      "Led a 3-person publicity team to 1M+ views while running weekly events for 1,600+ students and a $37K+ event series.",
    image: EXPERIENCE_TSAC_LOGO_SRC,
    externalUrl: "https://www.tsac.ca/",
  },
];

export const PROJECT_GRID_ITEMS: readonly PortfolioCardItem[] = [
  {
    id: "atrx",
    title: "atrx.ca",
    date: "May 2026",
    subtitle: "E-commerce & Brand",
    description:
      "Custom e-commerce storefront for my streetwear brand, built from scratch on Next.js, Supabase, Prisma, and Stripe after migrating off Shopify.",
    image: PROJECT_ATRX_IMAGE_SRC,
    externalUrl: "https://atrx.ca",
  },
  {
    id: "watsapp",
    title: "WatsApp",
    date: "2025",
    subtitle: "Product & UX",
    description:
      "Real-time messaging app built with React Native and Expo, with Supabase handling auth and live message sync.",
    image: PROJECT_WATSAPP_IMAGE_SRC,
  },
  {
    id: "unicook",
    title: "UniCook",
    date: "Nov 2025",
    subtitle: "Product & UX",
    description:
      "Designed and prototyped a cooking competition platform with match flow logic, interaction states, and an ELO-based ranking system.",
    image: PROJECT_UNICOOK_LOGO_SRC,
  },
];

export const EXPERIENCE_DETAILS: Record<string, PortfolioDetail> = {
  "grewal-guyatt": {
    title: "Grewal Guyatt LLP",
    timeline: "incoming f26",
    tools: "development, version control, cross-functional collaboration",
    skills: "software_development, internal_tools, professional_services",
    overview:
      "Joining Grewal Guyatt LLP as an incoming Software Developer for Fall 2026. Grewal Guyatt is a chartered professional accounting and advisory firm offering assurance, forensics, taxation, and valuation services—where I'll contribute to internal tools and systems that support the team and its clients.",
    websiteUrl: "https://www.grewalguyatt.ca/",
    imageUrl: EXPERIENCE_GREWAL_GUYATT_LOGO_SRC,
  },
  quickpos: {
    title: "QuickPOS Technologies",
    timeline: "jan 2026 - apr 2026",
    tools: "development, version control, cross-functional collaboration",
    skills: "software_engineering, b2b_saas, pos_systems",
    overview:
      "As a Software Engineer Intern at QuickPOS, I contributed to POS-adjacent and RAG-enabled B2B products—implementing features, debugging production issues, and coordinating with teammates so releases stayed dependable and understandable for merchants and internal users.",
    websiteUrl: "#",
    imageUrl: EXPERIENCE_QUICKPOS_IMAGE_SRC,
  },
  ataraxia: {
    title: "Ataraxia Apparel",
    timeline: "may 2025 - sep 2025",
    tools: "figma, illustrator, shopify",
    skills: "founder, ui/ux design, product_design",
    overview:
      "Ataraxia is a streetwear brand I founded to support young adults transitioning into new stages of life. The brand combines bold streetwear aesthetics with subtle reminders to maintain inner calm.",
    websiteUrl: "#",
    imageUrl: EXPERIENCE_ATARAXIA_IMAGE_SRC,
  },
  "trudeau-sac": {
    title: "Trudeau Student Activities Council",
    timeline: "may 2024 - jun 2025",
    tools: "social media, leadership, marketing",
    skills: "publicity, community_engagement, branding",
    overview:
      "As Head of Publicity, I managed the student activities council's public image and social media presence, driving engagement and communication for the entire student body.",
    websiteUrl: "#",
    imageUrl: EXPERIENCE_TSAC_LOGO_SRC,
  },
};

export const PROJECT_DETAILS: Record<string, PortfolioDetail> = {
  watsapp: {
    title: "WatsApp",
    timeline: "2025",
    tools: "figma, prototyping, usability sessions",
    skills: "product_design, ui_ux, mobile_design",
    overview:
      "WatsApp is a mobile-first study hub where Waterloo students join course chats, share attachments, and manage study groups. I led product design—mapping journeys for onboarding and verification, refining chat and group structures, and prototyping screens so flows stayed clear during fast, distracted use between classes. Work centered on interaction states, hierarchy, and feedback patterns rather than implementation.",
    websiteUrl: "#",
    imageUrl: PROJECT_WATSAPP_IMAGE_SRC,
  },
  unicook: {
    title: "UniCook",
    timeline: "nov 2025",
    tools: "figma, prototyping, interaction design",
    skills: "ux, product_design, user_journeys",
    overview:
      "Designed and prototyped a cooking competition platform for university students by defining match flow logic and interaction states and supporting an ELO-based ranking system. Mapped and refined user journeys across cooking, submission, and ranking workflows, improving navigation clarity and reducing cognitive load during multi-step interactions.",
    websiteUrl: "#",
    imageUrl: PROJECT_UNICOOK_LOGO_SRC,
  },
};
