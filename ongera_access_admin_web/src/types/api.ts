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

export interface ApiLoginResponse {
  token: string;
  user: ApiUser;
  patient_id?: string;
  patient_profile?: ApiPatientProfile;
}

export interface ApiCreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'patient' | 'therapist' | 'admin';
  location?: string;
  date_of_birth?: string;
  therapist_id?: string;
  caregiver?: ApiCaregiver;
}

export type TherapistStatus = 'UNASSIGNED' | 'PENDING' | 'ASSIGNED';

export interface ApiCaregiver {
  fullname?: string;
  email?: string;
  relationship?: string;
  phone_number?: string;
}

export interface ApiCaregiverInfo {
  name?: string;
  email?: string;
  phone?: string;
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
  distractor_field?: 'word' | 'english_translation' | 'audio_model_url' | 'image_url' | string;
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

export interface ApiTherapistProfile {
  id: string;
  user_id: string;
  affiliation?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiErrorBody {
  error?: string;
}
