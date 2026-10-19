import { z } from 'zod';

const optionalUrl = z.union([z.url({ protocol: /^https?$/ }), z.literal('')]).optional();
const shortText = (max = 120) => z.string().trim().max(max);

export const projectSchema = z.object({
  title: shortText().min(1, 'Title is required'),
  slug: shortText(80).regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers and dashes only').optional(),
  summary: shortText(280).default(''),
  description: z.string().max(20000).default(''),
  tech: z.array(shortText(40).min(1)).max(30).default([]),
  // Accepts absolute URLs or paths returned by the upload endpoint.
  imageUrl: shortText(500).optional(),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  status: z.enum(['planning', 'in_progress', 'completed', 'archived']).default('completed'),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const skillSchema = z.object({
  name: shortText(60).min(1, 'Name is required'),
  category: shortText(60).min(1).default('General'),
  level: z.number().int().min(0).max(100).default(50),
  sortOrder: z.number().int().default(0),
});

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM');

export const experienceSchema = z.object({
  role: shortText().min(1, 'Role is required'),
  company: shortText().min(1, 'Company is required'),
  location: shortText().optional(),
  startDate: yearMonth,
  endDate: z.union([yearMonth, z.literal(''), z.null()]).optional().transform((v) => v || null),
  description: z.string().max(5000).default(''),
  highlights: z.array(shortText(300).min(1)).max(20).default([]),
  sortOrder: z.number().int().default(0),
});

export const profileSchema = z.object({
  name: shortText().min(1),
  title: shortText().min(1),
  tagline: shortText(200).default(''),
  bio: z.string().max(5000).default(''),
  location: shortText().default(''),
  email: z.union([z.email(), z.literal('')]).default(''),
  avatarUrl: shortText(500).default(''),
  resumeUrl: shortText(500).default(''),
  available: z.boolean().default(true),
  stats: z.array(z.object({ label: shortText(40), value: shortText(20) })).max(6).default([]),
  socials: z
    .object({
      github: optionalUrl,
      linkedin: optionalUrl,
      twitter: optionalUrl,
      website: optionalUrl,
    })
    .default({}),
});

export const contactSchema = z.object({
  name: shortText(100).min(2, 'Please enter your name'),
  email: z.email('Please enter a valid email'),
  subject: shortText(150).optional(),
  body: z.string().trim().min(10, 'Message is too short').max(5000),
  // Honeypot: real visitors never fill this hidden field.
  website: z.string().max(0).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Use at least 8 characters'),
});
