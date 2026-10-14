import type { Project, Service, SkillGroup, Studio } from "@/types/content";

/** One place to edit copy, links, skills, studio history and portfolio entries. */
export const site = {
  brand: "archeon",
  nickname: "Pilgrim",
  name: "Shontan Daniel",
  role: "Gameplay Programmer & Product Designer",
  email: "shontandaniel@gmail.com",
  emailForProjects: "shontandaniel@gmail.com",
  whatsapp: "+234 811 220 0157",
  whatsappUrl: "https://api.whatsapp.com/send?phone=2348112200157&text=Hi%20Pilgrim!%20Let's%20Talk!",
  discord: "Pilgrim Archeon",
  discordUrl: "https://discord.com/users/Pilgrim#1112",
  resume: "/docs/shontan-daniel-resume.pdf",
  socials: {
    github: "https://github.com/PilgrimArcheon",
    linkedin: "https://www.linkedin.com/in/daniel-shontan-3b6b2b227/",
    instagram: "https://www.instagram.com/pilgrim.archeon/",
    x: "https://x.com/PilgrimArcheon",
    messenger: "https://m.me/daniel.shontan.5",
  },
  about:
    "I'm a gameplay programmer and product designer. I build interactive systems and thoughtful digital experiences, combining game development, technical problem-solving and user-focused design across PC, mobile, web, multiplayer and AR/VR projects.",
  stats: [
    { value: "7+", label: "Years of experience" },
    { value: "20+", label: "Completed projects" },
    { value: "2D / 3D", label: "Creative range" },
  ],
} as const;

export const skillGroups: SkillGroup[] = [
  {
    title: "Gameplay programming",
    skills: [
      { name: "Unity", level: "Advanced" },
      { name: "C#", level: "Advanced" },
      { name: "Object-oriented programming", level: "Intermediate" },
      { name: "PlayCanvas", level: "Intermediate" },
      { name: "JavaScript", level: "Intermediate" },
      { name: "Data structures & algorithms", level: "Intermediate" },
    ],
  },
  {
    title: "Visual design",
    skills: [
      { name: "Illustrator", level: "Advanced" },
      { name: "Photoshop", level: "Intermediate" },
      { name: "Blender 3D", level: "Intermediate" },
      { name: "UI design", level: "Intermediate" },
      { name: "Wireframing", level: "Basic" },
      { name: "Rigging & animation", level: "Basic" },
    ],
  },
];

export const services: Service[] = [
  {
    title: "Unity game development",
    summary: "From prototype to playable experience, built with thoughtful systems.",
    icon: "game",
    details: [
      "Plan and implement game functionality",
      "Set up an effective team and project workspace",
      "Focus on quality and the finished experience",
      "Work with meshes, animations, materials and game objects",
    ],
  },
  {
    title: "C# & gameplay systems",
    summary: "Game mechanics, input, architecture and performance-minded code.",
    icon: "code",
    details: [
      "Design and implement code using game development principles",
      "Build in-game systems and mechanics for the project scope",
      "Implement input systems and managers",
      "Prioritize optimization and performance",
      "Build prototypes, mock-ups and milestone-ready mechanics",
    ],
  },
  {
    title: "Visual design",
    summary: "Interfaces, effects and assets that give ideas a distinct identity.",
    icon: "design",
    details: [
      "Concepts and mock-up artwork",
      "Simple, approachable user interfaces",
      "VFX, shaders and particle effects",
      "Wireframes of gameplay loops and UI flows",
      "2D and simple 3D assets for games and other projects",
    ],
  },
];

/** Converted from the original 2D/3D project cards. Dates and credits were not in the source. */
export const projects: Project[] = [
  {
    slug: "midnight-dreams",
    title: "Dreams",
    category: "2d",
    image: "/images/midnightDreams.png",
    description: "An atmospheric 2D game featured in my gameplay portfolio.",
    url: "https://drive.google.com/file/d/1BovKqG9VOh4s4I50Ll-MmIAold0tYgo8/view?usp=drivesdk",
    action: "Watch demo",
    featured: true,
  },
  {
    slug: "redshield",
    title: "Redshield",
    category: "2d",
    image: "/images/redshield.jpg",
    description: "A 2D game project from my selected works.",
    url: "https://drive.google.com/file/d/1p-boS0EwTCS1ewTWD2MLvOwXwzzC8QM-/view?usp=share_link",
    action: "Watch demo",
  },
  {
    slug: "games4africa",
    title: "Games4Africa",
    category: "2d",
    image: "/images/g4a-graphics.png",
    description: "A game available to explore on Google Play.",
    url: "https://play.google.com/store/apps/details?id=com.decloud23tech.games4africa&hl=en",
    action: "Explore game",
  },
  {
    slug: "play-rumble",
    title: "Play Rumble",
    category: "2d",
    image: "/images/play-rumble.png",
    description: "A colorful game world with a playable destination online.",
    url: "https://playrumble.xyz/",
    action: "Explore game",
    featured: true,
  },
  {
    slug: "endless-ranger-awakening",
    title: "Endless Ranger Awakening",
    category: "3d",
    image: "/images/endlessRanger.jpg",
    description: "A 3D game showcased through a gameplay video.",
    url: "https://www.youtube.com/watch?v=MJHYaaFVExI",
    action: "Watch video",
    featured: true,
  },
  {
    slug: "elswhere",
    title: "ElsWhere",
    category: "3d",
    image: "/images/elsWhere.jpg",
    description: "A moody 3D game project with a video demonstration.",
    url: "https://drive.google.com/file/d/1W3nfrzik7zmwNCX92kQWeAJfveskMhoK/view?usp=share_link",
    action: "Watch demo",
    featured: true,
  },
  {
    slug: "day-zero",
    title: "Day Zero",
    category: "3d",
    image: "/images/dayZero.png",
    description: "A 3D game project showcased in the original portfolio.",
    url: "https://drive.google.com/file/d/1EIP3bS3031J-GH8tuFy4EJyGVPwyFIRx/view?usp=drivesdk",
    action: "Watch demo",
  },
  {
    slug: "takeshi-maze",
    title: "Takeshi Maze",
    category: "3d",
    image: "/images/takeshiMaze.jpg",
    description: "A 3D game project with additional files to explore.",
    url: "https://drive.google.com/drive/folders/1Mw7v6kmcxY0a6AXM9ppnQsIA6X-AKdFv?usp=share_link",
    action: "See files",
  },
  {
    slug: "2d-games-ui",
    title: "2D Games UI",
    category: "2d",
    image: "/images/2dGameUI.jpg",
    description: "A collection of interface designs for 2D games.",
    url: "https://drive.google.com/drive/folders/17isNaobgxz0Mo1V4p9xPWT8B6FOKNhU3?usp=share_link",
    action: "See files",
  },
  {
    slug: "multiplayer-sync",
    title: "Multiplayer Sync",
    category: "3d",
    image: "/images/multiplayer.jpg",
    description: "A multiplayer synchronization demonstration.",
    url: "https://drive.google.com/file/d/1QuSoUJkKF7okDl7x5qGUJJnQ9sVahnCz/view?usp=share_link",
    action: "Watch demo",
  },
  {
    slug: "mages-dungeon",
    title: "Mage's Dungeon",
    category: "2d",
    image: "/images/magesDungeon.jpg",
    description: "A fantasy-themed 2D game project.",
    url: "https://drive.google.com/file/d/1smOHBBZ-RTWOIF8mf6-Prkv6yIvxsqtQ/view?usp=share_link",
    action: "Watch demo",
  },
  {
    slug: "driving-simulator",
    title: "Driving Simulator",
    category: "3d",
    image: "/images/drivingSim.jpg",
    description: "A 3D driving simulation project.",
    url: "https://drive.google.com/file/d/1NApcNBl2bQM1vK-4pAHIRdkTrXR7lKGp/view?usp=share_link",
    action: "Watch demo",
  },
  {
    slug: "fnf-rts",
    title: "FNF RTS",
    category: "2d",
    image: "/images/fnf_rts.jpg",
    description: "A 2D game project from my selected work.",
    url: "https://drive.google.com/file/d/1Yo-qE5-2iyZWpyeqZJsO0tRDQEjSw6Bu/view?usp=share_link",
    action: "Watch demo",
  },
  {
    slug: "dent-snl",
    title: "Dent.snl",
    category: "3d",
    image: "/images/dent_snl.jpg",
    description: "A 3D project featured in my portfolio.",
    url: "https://drive.google.com/file/d/1NmFRILbzfXeQgNxU_3zuPKrvmzJA28L3/view?usp=share_link",
    action: "Watch demo",
  },
];

export const allProjectsUrl =
  "https://drive.google.com/drive/folders/1GHtSBiAHxs09xfSR1Y-aMKrTQcdSjewP?usp=share_link";

export const studios: Studio[] = [
  {
    name: "Redshield Games",
    logo: "/images/jobs1.png",
    description: "Game studio experience",
    url: "https://www.linkedin.com/company/redshield-games/about/",
  },
  {
    name: "Pinheads Interactive",
    logo: "/images/jobs4.png",
    description: "Bringing virtual and real worlds together",
    url: "https://pinheadsinteractive.com/",
  },
  {
    name: "BRN Metaverse",
    logo: "/images/jobs5.png",
    description: "Digital worlds, AI, GameFi & Web3",
    url: "https://www.brnmetaverse.net/",
  },
  {
    name: "Bloom Learn",
    logo: "/images/jobs7.png",
    description: "Playful learning experiences",
    url: "https://www.bloomlearn.com/",
  },
  {
    name: "Cloud 23 Technologies",
    logo: "/images/jobs6.png",
    description: "Digital services and technology",
    url: "https://decloud23tech.com/",
  },
  {
    name: "Inuv8 Studios",
    logo: "/images/jobs3.png",
    description: "Game development, art and animation",
  },
  {
    name: "MicrolabACE",
    logo: "/images/jobs2.png",
    description: "Hardware and software ideas",
  },
];

export const featuredProjects = projects.filter((project) => project.featured);

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
