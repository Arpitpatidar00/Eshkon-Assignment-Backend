// Core domain types for Page Studio Platform

export type SectionType = "hero" | "featureGrid" | "testimonial" | "cta";

export interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface FeatureGridProps {
  heading: string;
  features: {
    icon: string;
    title: string;
    description: string;
  }[];
}

export interface TestimonialProps {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatarUrl?: string;
  rating?: number;
}

export interface CTAProps {
  label: string;
  url: string;
  description?: string;
  variant?: "primary" | "secondary" | "outline";
}

export type SectionProps = HeroProps | FeatureGridProps | TestimonialProps | CTAProps;

export interface Section {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
}

export interface Page {
  pageId: string;
  slug: string;
  title: string;
  sections: Section[];
}

// Publishing types
export interface DiffResult {
  addedSections: { id: string; type: SectionType }[];
  removedSections: { id: string; type: SectionType }[];
  modifiedProps: {
    sectionId: string;
    sectionType: SectionType;
    changes: { key: string; oldValue: unknown; newValue: unknown }[];
  }[];
}

export type VersionBump = "major" | "minor" | "patch" | "none";

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export interface ReleaseSnapshot {
  version: string;
  publishedAt: string;
  publishedBy: string;
  hash: string;
  changelog: string;
  page: Page;
}

// Auth types
export type Role = "viewer" | "editor" | "publisher";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type Permission = "preview" | "edit" | "publish";
