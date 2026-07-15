export const THERAPIST_SPECIALTIES = [
  'Speech & Language Pathologist',
  'Neurologist',
  'Occupational Therapist',
  'Rehabilitation Specialist',
  'Physical Therapist',
  'Cognitive Behavioral Therapist',
] as const;

export type TherapistSpecialty = (typeof THERAPIST_SPECIALTIES)[number];

export const SPECIALTY_OTHER = 'Other';
