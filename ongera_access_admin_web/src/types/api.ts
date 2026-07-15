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

/**
 * POST /api/v1/users (admin). Matches the live `AdminCreateUserRequest`:
 * caregiver/therapist_id are NOT accepted here — set them afterwards via the
 * patient profile endpoints (see ApiUpdatePatientRequest / assignTherapist).
 */
export interface ApiCreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'patient' | 'therapist' | 'admin';
  location?: string;
  date_of_birth?: string;
}

/**
 * POST /api/v1/auth/register. The only endpoint that accepts therapist
 * affiliation/specialty (and patient caregiver/therapist_id) at creation time.
 */
export interface ApiRegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'patient' | 'therapist';
  location?: string;
  date_of_birth?: string;
  affiliation?: string;
  specialty?: string;
  caregiver?: ApiCaregiver;
  therapist_id?: string;
}

/** PUT /api/v1/patients/{id} */
export interface ApiUpdatePatientRequest {
  caregiver_info?: ApiCaregiverInfo;
  location?: string;
}

export type TherapistStatus = 'UNASSIGNED' | 'PENDING' | 'ASSIGNED';

export interface ApiCaregiver {
  fullname?: string;
  email?: string;
  relationship?: string;
  phone_number?: string;
}

export interface ApiCaregiverInfo {
  fullname?: string;
  name?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  phone_number?: string;
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
  first_name?: string;
  last_name?: string;
  email?: string;
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

/** GET /api/v1/patients */
export type ApiPatientSummary = ApiPatientProfile;

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

export type DistractorField =
  | 'word'
  | 'english_translation'
  | 'audio_model_url'
  | 'image_url';

export interface CreateModulePayload {
  name: string;
  description?: string;
}

export interface CreateExercisePayload {
  name: string;
  description?: string;
  distractor_count: number;
  distractor_field: DistractorField;
}

export interface CreateVocabularyPayload {
  word: string;
  english_translation: string;
  difficulty_level: 1 | 2 | 3;
  audio_model_url?: string;
  image_url?: string;
}

export interface CreateQuestionPayload {
  difficulty_level: 1 | 2 | 3;
  target_item_id: string;
  distractor_item_ids: string[];
}

export interface ApiExercise {
  id: string;
  module_id: string;
  name: string;
  description?: string;
  distractor_count?: number;
  distractor_field?: DistractorField | string;
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
  // API may return distractors as embedded objects OR as an array of ID strings.
  distractors?: Array<ApiVocabularyItem | string>;
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
  specialty?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiUploadImageResponse {
  url: string;
}

export interface ApiErrorBody {
  error?: string;
}
