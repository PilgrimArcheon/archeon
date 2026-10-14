export type ProjectCategory = "2d" | "3d";

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  image: string;
  description: string;
  url: string;
  action: string;
  featured?: boolean;
};

export type Service = {
  title: string;
  summary: string;
  details: string[];
  icon: "game" | "code" | "design";
};

export type Studio = {
  name: string;
  logo: string;
  description: string;
  url?: string;
};

export type SkillGroup = {
  title: string;
  skills: { name: string; level: "Advanced" | "Intermediate" | "Basic" }[];
};
