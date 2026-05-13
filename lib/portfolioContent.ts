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

export const EXPERIENCE_GRID_ITEMS: readonly PortfolioCardItem[] = [
  {
    id: "quickpos",
    title: "Quickpos Technologies Inc.",
    date: "Jan 2026 – Apr 2026",
    subtitle: "Product Designer",
    description:
      "Product design for RAG B2B tools and POS-related workflows—mapping flows, tightening interaction patterns, and partnering with engineering so shipped features read clearly under real merchant pressure.",
    image: "/atrx.png",
  },
  {
    id: "ataraxia",
    title: "Ataraxia Apparel Inc.",
    date: "May 2025 – Sep 2025",
    subtitle: "Founder",
    description:
      "Founded and led a streetwear brand, owning visual identity and product presentation while growing the audience through social and community touchpoints.",
    image: "/ataraxia-brand.png",
  },
  {
    id: "trudeau-sac",
    title: "Trudeau Student Activities Council",
    date: "May 2024 – Jun 2025",
    subtitle: "Head of Publicity",
    description:
      "Directed publicity and digital presence for the student body—campaigns, content rhythm, and channels that kept engagement high across the academic year.",
    image: "/tsac.png",
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
    image: "/watsapp.png",
  },
  {
    id: "unicook",
    title: "UniCook",
    date: "Nov 2025",
    subtitle: "Product & UX",
    description:
      "Cooking competition platform for university students: match flow, ELO rankings, and clearer journeys across cook, submit, and rank.",
    image: "/unicook.png",
  },
];

export const EXPERIENCE_DETAILS: Record<string, PortfolioDetail> = {
  quickpos: {
    title: "Quickpos Technologies",
    timeline: "jan 2026 - apr 2026",
    tools: "figma, prototyping, cross-functional collaboration",
    skills: "product_design, ux, b2b_saas",
    overview:
      "As a Product Designer at Quickpos, I focused on how RAG-enabled B2B tools and POS-adjacent workflows were understood in the field—structuring flows, refining states and feedback, and working closely with engineering so what shipped stayed legible and low-friction for merchants and internal operators.",
    websiteUrl: "#",
    imageUrl: "/atrx.png",
  },
  ataraxia: {
    title: "Ataraxia Apparel",
    timeline: "may 2025 - sep 2025",
    tools: "figma, illustrator, shopify",
    skills: "founder, ui/ux design, product_design",
    overview:
      "Ataraxia is a streetwear brand I founded to support young adults transitioning into new stages of life. The brand combines bold streetwear aesthetics with subtle reminders to maintain inner calm.",
    websiteUrl: "#",
    imageUrl: "/ataraxia-brand.png",
  },
  "trudeau-sac": {
    title: "Trudeau Student Activities Council",
    timeline: "may 2024 - jun 2025",
    tools: "social media, leadership, marketing",
    skills: "publicity, community_engagement, branding",
    overview:
      "As Head of Publicity, I managed the student activities council's public image and social media presence, driving engagement and communication for the entire student body.",
    websiteUrl: "#",
    imageUrl: "/tsac.png",
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
    imageUrl: "/watsapp.png",
  },
  unicook: {
    title: "UniCook",
    timeline: "nov 2025",
    tools: "figma, prototyping, interaction design",
    skills: "ux, product_design, user_journeys",
    overview:
      "Designed and prototyped a cooking competition platform for university students by defining match flow logic and interaction states and supporting an ELO-based ranking system. Mapped and refined user journeys across cooking, submission, and ranking workflows, improving navigation clarity and reducing cognitive load during multi-step interactions.",
    websiteUrl: "#",
    imageUrl: "/unicook.png",
  },
};
