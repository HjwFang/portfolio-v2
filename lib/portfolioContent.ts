export type PortfolioCardItem = {
  id: string;
  title: string;
  date: string;
  subtitle: string;
  description: string;
  image: string;
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

export const EXPERIENCE_GRID_ITEMS: readonly PortfolioCardItem[] = [
  {
    id: "quickpos",
    title: "QuickPOS Technologies Inc.",
    date: "Jan 2026 – Apr 2026",
    subtitle: "Software Engineer Intern",
    description:
      "Software engineering for POS-adjacent systems and RAG-enabled B2B tools—building and shipping features alongside the team, with attention to reliability and clarity for merchants and internal operators.",
    image: EXPERIENCE_QUICKPOS_IMAGE_SRC,
  },
  {
    id: "ataraxia",
    title: "Ataraxia Apparel Inc.",
    date: "May 2025 – Sep 2025",
    subtitle: "Founder",
    description:
      "Founded and led a streetwear brand, owning visual identity and product presentation while growing the audience through social and community touchpoints.",
    image: EXPERIENCE_ATARAXIA_IMAGE_SRC,
  },
  {
    id: "trudeau-sac",
    title: "Trudeau Student Activities Council",
    date: "May 2024 – Jun 2025",
    subtitle: "Head of Publicity",
    description:
      "Directed publicity and digital presence for the student body—campaigns, content rhythm, and channels that kept engagement high across the academic year.",
    image: EXPERIENCE_TSAC_LOGO_SRC,
  },
];

export const PROJECT_GRID_ITEMS: readonly PortfolioCardItem[] = [
  {
    id: "watsapp",
    title: "WatsApp",
    date: "2025",
    subtitle: "Product & UX",
    description:
      "Product design for a Waterloo course-community app: onboarding, course chats, study groups, and attachment flows—mobile-first layouts tuned for clarity between classes.",
    image: PROJECT_WATSAPP_IMAGE_SRC,
  },
  {
    id: "unicook",
    title: "UniCook",
    date: "Nov 2025",
    subtitle: "Product & UX",
    description:
      "Cooking competition platform for university students: match flow, ELO rankings, and clearer journeys across cook, submit, and rank.",
    image: PROJECT_UNICOOK_LOGO_SRC,
  },
];

export const EXPERIENCE_DETAILS: Record<string, PortfolioDetail> = {
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
