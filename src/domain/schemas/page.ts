import { z } from "zod";

// Section prop schemas
export const HeroPropsSchema = z.object({
  title: z.string().min(1, "Hero title is required"),
  subtitle: z.string().optional(),
  backgroundImage: z.string().url().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
});

export const FeatureItemSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const FeatureGridPropsSchema = z.object({
  heading: z.string().min(1, "Feature grid heading is required"),
  features: z.array(FeatureItemSchema).min(1, "At least one feature is required"),
});

export const TestimonialPropsSchema = z.object({
  quote: z.string().min(1, "Testimonial quote is required"),
  author: z.string().min(1, "Author name is required"),
  role: z.string().optional(),
  company: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const CTAPropsSchema = z.object({
  label: z.string().min(1, "CTA label is required"),
  url: z.string().min(1, "CTA URL is required"),
  description: z.string().optional(),
  variant: z.enum(["primary", "secondary", "outline"]).optional(),
});

// Section type enum
export const SectionTypeSchema = z.enum([
  "hero",
  "featureGrid",
  "testimonial",
  "cta",
]);

// Mapping of section types to their prop schemas for validation
const sectionPropsSchemas: Record<string, z.ZodType> = {
  hero: HeroPropsSchema,
  featureGrid: FeatureGridPropsSchema,
  testimonial: TestimonialPropsSchema,
  cta: CTAPropsSchema,
};

// Section schema with dynamic prop validation
export const SectionSchema = z
  .object({
    id: z.string().min(1, "Section ID is required"),
    type: SectionTypeSchema,
    props: z.record(z.string(), z.unknown()),
  })
  .superRefine((section, ctx) => {
    const propsSchema = sectionPropsSchemas[section.type];
    if (propsSchema) {
      const result = propsSchema.safeParse(section.props);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ["props", ...issue.path],
          });
        });
      }
    }
  });

// Page schema
export const PageSchema = z.object({
  pageId: z.string().min(1, "Page ID is required"),
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  sections: z.array(SectionSchema),
});

// Type exports inferred from schemas
export type PageSchemaType = z.infer<typeof PageSchema>;
export type SectionSchemaType = z.infer<typeof SectionSchema>;

// Safe parse utilities
export function safeParseSection(data: unknown) {
  return SectionSchema.safeParse(data);
}

export function safeParsePage(data: unknown) {
  return PageSchema.safeParse(data);
}

// Validate with detailed errors
export function validatePage(data: unknown): {
  success: boolean;
  data?: PageSchemaType;
  errors?: string[];
} {
  const result = PageSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    ),
  };
}
