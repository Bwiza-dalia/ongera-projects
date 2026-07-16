export interface ApiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  location?: string;
  date_of_birth?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiLoginRequest {
  email: string;
  password: string;
}

export interface ApiLoginResponse {
  token: string;
  user: ApiUser;
  patient_id?: string;
  patient_profile?: ApiPatientProfile;
}

export interface ApiRegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'therapist' | 'patient';
  location?: string;
  date_of_birth?: string;
  therapist_id?: string;
  caregiver?: ApiCaregiver;
  affiliation?: string;
  specialty?: string;
}

export interface ApiErrorBody {
  error?: string;
}

export type TherapistStatus = 'UNASSIGNED' | 'PENDING' | 'ASSIGNED';

export interface ApiCaregiver {
  fullname?: string;
  email?: string;
  relationship?: string;
  phone_number?: string;
}

/** Legacy caregiver shape still returned by some endpoints */
export interface ApiCaregiverInfo {
  fullname?: string;
  name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  relationship?: string;
}

export interface ApiTherapistEmbedded {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  affiliation?: string;
  specialty?: string;
  is_verified?: boolean;
}

export interface ApiPatientProfile {
  id: string;
  user_id: string;
  patient_first_name?: string;
  patient_last_name?: string;
  // The live API is inconsistent about where the patient name lives; accept common variants.
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  email?: string;
  location?: string;
  date_of_birth?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    location?: string;
    date_of_birth?: string;
  } | null;
  therapist_id?: string;
  graduation_status?: string;
  graduated_at?: string;
  therapist_status?: TherapistStatus;
  therapist?: ApiTherapistEmbedded | null;
  caregiver?: ApiCaregiver;
  caregiver_info?: ApiCaregiverInfo;
  created_at?: string;
  updated_at?: string;
}

/** Shape returned by GET /api/v1/patients list */
export type ApiPatientSummary = ApiPatientProfile;

export interface ApiPatientProgress {
  id: string;
  patient_id: string;
  exercise_id: string;
  current_level?: string;
  average_score?: number;
  consecutive_high_scores?: number;
  last_session_at?: string;
  total_sessions_completed?: number;
  total_questions_attempted?: number;
  total_correct?: number;
  created_at?: string;
  updated_at?: string;
}

/** Completed therapy session — `total_cues_used` is hints used in the patient app. */
export interface ApiSession {
  id: string;
  patient_id: string;
  exercise_id: string;
  difficulty_level?: number;
  status?: string;
  total_questions?: number;
  questions_correct?: number;
  questions_wrong?: number;
  score?: number;
  total_cues_used?: number;
  duration_seconds?: number;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface ApiModule {
  id: string;
  name: string;
  type?: string;
  module_type?: string;
  description?: string;
  icon_svg?: string;
  icon_color?: string;
  icon_bg_color?: string;
  created_at?: string;
}

export interface ApiExercise {
  id: string;
  module_id: string;
  name: string;
  description?: string;
  distractor_count?: number;
  distractor_field?: string;
  created_at?: string;
}

export interface ApiModuleWithExercises extends ApiModule {
  exercises?: ApiExercise[] | null;
}

export interface ApiExerciseDetail extends ApiExercise {
  question_counts?: Record<string, number> | null;
}

export interface ApiVocabularyItem {
  id: string;
  word: string;
  english_translation?: string;
  semantic_hint?: string;
  phonemic_hint?: string;
  syllable_breakdown?: string;
  audio_model_url?: string;
  image_url?: string;
  difficulty_level?: number;
  created_at?: string;
}

export interface ApiQuestionContent {
  answer?: string;
  audio_url?: string;
  cues?: string[];
  options?: Array<{ text: string; image_url?: string }>;
}

export interface ApiQuestion {
  id: string;
  exercise_id?: string;
  difficulty_level?: number | string;
  target_item_id?: string;
  distractor_item_ids?: string[];
  target_item?: ApiVocabularyItem;
  distractors?: ApiVocabularyItem[];
  content?: ApiQuestionContent;
  created_at?: string;
}

export interface ApiAssignedModule {
  module_id: string;
  name: string;
  description?: string;
  icon_svg?: string;
  icon_color?: string;
  icon_bg_color?: string;
}

export interface ApiPatientModuleAssignment {
  id: string;
  patient_id: string;
  assigned_by?: string;
  assigned_at?: string;
  module_id?: string;
  modules?: ApiAssignedModule[];
}

export interface ApiTherapistPublic {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface ApiTherapistProfile {
  id: string;
  user_id: string;
  affiliation?: string;
  specialty?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAssignmentRequest {
  id: string;
  patient_id: string;
  therapist_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAssignmentRequestDetail extends ApiAssignmentRequest {
  patient_first_name?: string;
  patient_last_name?: string;
  /** Enriched fields — may be returned by newer API builds even if absent from older swagger. */
  patient_email?: string;
  email?: string;
  patient_date_of_birth?: string;
  date_of_birth?: string;
  patient_location?: string;
  location?: string;
  caregiver?: ApiCaregiver;
  caregiver_info?: ApiCaregiverInfo;
  note?: string;
  reason?: string;
  request_note?: string;
  message?: string;
}
