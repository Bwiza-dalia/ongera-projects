---
name: ongera-access
description: >
  Full context and domain knowledge for building Ongera Access — a Kinyarwanda-language
  mobile stroke rehabilitation app for post-stroke patients in Rwanda. Use this skill
  whenever working on any aspect of the Ongera Access app: feature design, UI/UX,
  Flutter implementation, clinical exercise modules, accessibility requirements,
  AI/ML integration, content writing, architecture decisions, or research questions.
  Also trigger when the user mentions any of the five core modules (Air Traffic Controller,
  Video Rehab Engine, Ku Isoko, Subiramo, Multi-Modal Speech/Movement), or asks about
  stroke rehab, aphasia, spatial neglect, Kinyarwanda localization, or offline-first
  mobile health in Rwanda.
---

# Ongera Access — Application Context Skill

> **Quick orientation:** Ongera Access is a Flutter-based, offline-first, Kinyarwanda-language
> mobile stroke rehabilitation app for post-stroke patients in Rwanda. It is the first of its
> kind for any Bantu language or East African population.

---

## 1. The Problem This App Solves

Rwanda — and sub-Saharan Africa broadly — faces three compounding failures that leave most
stroke survivors without any ongoing care:

| Failure | Detail |
|---|---|
| **Workforce shortage** | Fewer than 10 skilled rehab practitioners per 1 million people in the region. Most district hospitals have none at all. |
| **Language & culture gap** | Every validated stroke rehab app (Tactus Therapy, Constant Therapy, Lingraphica SmallTalk) is English-only, uses Western cultural stimuli, and is unusable by Kinyarwanda speakers. |
| **Infrastructure barrier** | Existing apps require persistent internet. Many patients in Rwanda — especially rural or elderly — have no reliable data plan. |

**The core opportunity:** Smartphones and basic Android devices are increasingly available
across Rwanda. Self-delivered app therapy has been clinically validated: a 2023 systematic
review found mobile apps mimicking massed practice, task-specific practice, feedback, and
multisensory stimulation produce the greatest rehabilitation gains. Patients using apps can
practice every 2 days vs. every 5 days for clinic-based patients.

---

## 2. Target Users

- **Primary:** Post-stroke patients in Rwanda (Kinyarwanda speakers), ranging from mild to
  severe impairment, often older, may have limited tech experience
- **Secondary:** Family caregivers and collocated carers who assist during sessions
- **Tertiary:** Doctors who input prescriptions and clinical parameters into the system
- **Quaternary:** Nurses/Carers and therapists who receive weekly reports and close the
  feedback loop back to the doctor

**Key UX constraints flowing from the user profile:**
- Motor impairments (hemiparesis, tremors) → minimum 48×48 dp touch targets with 8 dp padding
- Cognitive fatigue → one task per screen, no cluttered UI, short sessions (10–20 min default)
- Low tech literacy → icons always paired with text labels, no time pressure, easy back/undo
- Vision/contrast needs → WCAG 2.1 AA minimum 4.5:1 contrast ratio throughout
- Low literacy possible → voice instructions in Kinyarwanda, pictorial navigation

---

## 3. Clinical Foundation

### Post-Stroke Impairments Addressed

| Domain | Impairment | Modules Targeting It |
|---|---|---|
| Speech & Language | Aphasia (expressive/anomia), dysarthria | Ku Isoko, Subiramo, Multi-Modal |
| Motor | Hemiparesis, arm/hand weakness | Video Rehab Engine, Multi-Modal |
| Cognitive / Spatial | Spatial neglect, attention deficits | Air Traffic Controller |
| Fine Motor | Finger dexterity, coordination | Multi-Modal Speech/Movement |
| **Behavioural** | Post-stroke depression, mood, impulsivity | *(future module — not yet specified)* |

### Aphasia Types & App Relevance

- **Broca's (Expressive):** Effortful, limited speech, intact comprehension → primary target
- **Anomic:** Fluent but word-finding gaps → ideal for naming exercises (Ku Isoko)
- **Conduction:** Repetition errors → target for Subiramo
- **Global/Wernicke's:** Require simpler UX; app must degrade gracefully

### Evidence Base
- Stark & Warburton (2018): Self-delivered iPad speech therapy produced significant CAT
  improvement; 70% of patients had never used a tablet but all completed the study
- Bhogal et al. (2003): Intensity of therapy directly determines quality of recovery
- Szeto et al. (2023): Apps mimicking massed practice + multisensory stimulation → greatest gains
- Ghazavi et al. (2024): Mobile apps for stroke survivors produce measurable functional improvements

---

## 4. App Architecture Overview

**Tech Stack:** Flutter (Android-first, cross-platform)
**Architecture:** Offline-first; all core functionality available without internet
**Language:** Kinyarwanda primary; French and English as secondary toggles
**Localisation:** JSON-based i18n system — all user-facing strings externalised, never hardcoded
**Data:** Local database (user's data) for session history and progress; optional clinical export to authorised practitioners

### System Architecture (from architecture diagram)

The system has four actor types and a central data + AI loop:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ACTORS                                                             │
│  Patient ──┐                                                        │
│            ├──► Tablet/Mobile App                                   │
│  Caregiver ┘                                                        │
│                                                                     │
│  Nurses/Carer ──┐                                                   │
│                 ├──► Doctor ──► Prescription ──────────────────┐   │
│  (feedback) ◄───┘                                              │   │
└─────────────────────────────────────────────────────────────────────┘
                          │ (app entry)              │
                          ▼                          ▼
               Severity Assessment          ┌────────────────┐
                          │                 │  Therapies     │
                          ▼                 │  ┌──────────┐  │
               Therapy Recommendation ─────►  │ Speech & │  │
                                           │  │ Language │  │
                                           │  ├──────────┤  │
                                           │  │  Motor   │  │
                                           │  ├──────────┤  │
                                           │  │Cognitive │  │
                                           │  ├──────────┤  │
                                           │  │Behavioural│ │
                                           │  └──────────┘  │
                                           └───────┬─────────┘
                                                   │
                          ┌────────────────────────┘
                          ▼
               Daily Practice Session ◄──── AI Model
                          │                    ▲
                          ▼                    │
               Capture Performance Data ───────┤
                          │                    │
                          ▼                    │
               Database (User's Data) ─────────┘
                          │
                          ├──► Reports ──► Weekly Report (Therapist/Carer)
                          └──► Progress Report for Patient
```

### Key Architecture Decisions from the Diagram

| Component | Role | Notes |
|---|---|---|
| **Severity Assessment** | Gateway between app entry and module assignment | Determines which therapy domains are activated |
| **Therapy Recommendation** | Routes patient to appropriate therapy domains | Informed by both severity assessment and doctor prescription |
| **Doctor Prescription** | Clinical override / parameter setting | Doctor inputs target impairment, duration, frequency bounds; feeds directly into therapy recommendation |
| **Nurses/Carer** | Receive feedback loop from the system | Weekly report goes back to therapist/carer; they are consumers of the data, not just assistants |
| **AI Model** | Sits between therapy modules and daily practice session | Personalises session content and difficulty; feeds from and into the database |
| **Database (User's Data)** | Central persistence layer | Bidirectional with AI Model; source for both patient progress reports and weekly therapist/carer reports |
| **Reports** | Two distinct report types | (1) Progress Report for patient; (2) Weekly Report for therapist/carer — these are separate artifacts |

### Four Therapy Domains (from architecture diagram)

The architecture shows **four** therapy domains, not three. Note the addition of **Behavioural**:

| Domain | Modules |
|---|---|
| Speech & Language | Ku Isoko, Subiramo, Multi-Modal |
| Motor | Video Rehab Engine, Multi-Modal |
| Cognitive | Air Traffic Controller |
| **Behavioural** | *(not yet fully specified — future module area)* |

> **Design note:** The Behavioural domain is shown in the architecture but not yet mapped to
> a specific exercise module. This is a known gap. Post-stroke depression affects ~30% of
> survivors and is a priority area for future development.

### User Flow
```
Registration (email or phone)
        ↓
Tablet/Mobile App entry
        ↓
Severity Assessment (determines impairment profile)
        ↓
Doctor Prescription (clinical parameters: target impairment, duration, frequency)
        ↓
Therapy Recommendation Engine (rule-based + AI)
        ↓
Therapy Domain Assignment: Speech & Language | Motor | Cognitive | Behavioural
        ↓
Dashboard ("Welcome, [User]")
  ├── Continue where you left off
  ├── Statistics / Progress
  └── Module Grid
        ↓
Daily Practice Session ◄──── AI Model (personalisation)
        ↓
Capture Performance Data
        ↓
Database (User's Data) ◄──► AI Model (bidirectional learning loop)
        ↓
Reports
  ├── Progress Report → Patient
  └── Weekly Report → Therapist / Carer / Nurses
        ↓
Therapist/Carer → Doctor (feedback loop closes)
```

### Adaptive Difficulty Engine
```
Performance data captured after every session → fed to AI Model
Accuracy > 80%  → increase difficulty / reduce cueing / advance vocabulary
Accuracy < 50%  → decrease difficulty / increase cueing / simplify stimuli
Weekly report   → available to authorised clinician, carer, or nurses
```

---

## 5. The Five Core Exercise Modules

> For full clinical and technical detail on each module, see `references/modules.md`

### 5.1 Cognitive Module — "The Air Traffic Controller"
**Clinical target:** Spatial neglect / hemispatial neglect, smooth pursuit tracking
**Core mechanic:** Patient guides slow-moving aircraft from far-left anchor across the full
visual field using continuous touch drag. Forces attention into the neglected left hemispace.
**Key features:** Left-side flashing anchor gatekeeper, multisensory feedback (visual trail +
dynamic audio pitch), no reflexes required — intentional scanning only.

### 5.2 Motion Module — "Video Rehab Engine"
**Clinical target:** Motor rehabilitation, hemiparesis, form mirroring
**Core mechanic:** Interactive accessibility-first video playback for home-based rehab.
**Key features:** Dual-angle synchronized playback, split-screen front-camera mirror,
dual audio tracks (patient cues / caregiver safety directives), custom loop zones for
specific joint movements, offline H.265 compressed media (≤15 MB per 5-min block),
1.5s max load time on 3G.

### 5.3 Multi-Modal Speech/Movement Module
**Clinical target:** Fine motor, comprehension, expressive language (cross-functional)
**Core mechanic:** Hybrid tasks dynamically linking vocal response commands with physical
finger-dexterity gestures and on-screen coordination targets simultaneously.

### 5.4 Speech & Language Module — "Ku Isoko" (At the Market)
**Clinical target:** Anomia, expressive aphasia, word retrieval
**Core mechanic:** Naming game disguised as a trip to a Rwandan market. Patient names
culturally familiar items (inka, ifi, urutoki, ibirayi, inkweto) to "purchase" them.
**Key features:**
- **Hierarchical cueing ladder ("Mfasha"):** Semantic context → Phonemic cue → Syllable → Full model
- **No-ASR workaround:** Patient says word aloud → taps "Navuze" (I said it) → selects
  matching image from array OR caregiver verifies (sidesteps lack of Kinyarwanda ASR)
- **Adaptive item bank:** High failure → common items + more cueing; mastery → rare/complex terms
- **Localized stimuli:** Rwandan goods, local faces, native-recorded audio

### 5.5 Speech Repetition Module — "Subiramo" (Say It With Me)
**Clinical target:** Articulation, repetition, self-monitoring (Broca's, Conduction aphasia)
**Core mechanic:** Native speaker models word/phrase (audio + mouth-shape video) → patient
records themselves → both clips play back-to-back for auditory self-comparison.
**Key features:**
- **Comprehension interlock:** Before speaking, patient selects correct image from array
  (comprehension validated before articulation)
- **Difficulty ladder:** Single phonemes → words → functional phrases ("Ndashaka amazi") → sentences
- **Carer verification:** Recordings become lightweight progress artifacts for remote clinical review

---

## 6. AI & ML Integration Points

Three AI features are planned or under consideration:

| AI Feature | Description | Status |
|---|---|---|
| **Personalisation AI** | Learns from performance data; dynamically adjusts difficulty, cueing frequency, and vocabulary complexity | Planned |
| **Object Recognition AI** | Identifies real-world objects via camera for extended naming exercises | Planned |
| **ASR (Kinyarwanda + English)** | Automatic Speech Recognition to eventually replace or supplement the manual "Navuze" workaround | Planned (hard — no validated Kinyarwanda ASR currently exists) |

**Critical constraint on ASR:** Reliable Kinyarwanda speech recognition does not currently
exist. The "Navuze" + image-selection workaround is a deliberate, clinically sound design
choice — not a placeholder. Any ASR integration must be validated before replacing it.

---

## 7. Settings, Privacy & Permissions

- **FR-SET-01:** Patients can search for, select, and authorise specific clinicians to receive
  automated performance exports
- **FR-SET-02:** Granular toggles for microphone, local file storage, and front-facing camera
- **FR-SET-03:** Configurable daily push notification reminders for exercise adherence
- **Data privacy:** Patient health data requires careful storage and consent handling;
  offline-first minimises exposure

---

## 8. Non-Functional Requirements (Critical)

| NFR | Requirement |
|---|---|
| Touch targets | Minimum 48×48 dp with 8 dp safety padding on all interactive elements |
| Visual contrast | Minimum 4.5:1 ratio (WCAG 2.1 AA) across all text and UI elements |
| Video load time | ≤1.5s on 3G; ≤200ms cached locally |
| Offline media | ≤15 MB per 5-minute video block (H.265/HEVC) |
| Session length | Default 10–20 minutes; no mandatory time pressure |
| Language | All strings from Kinyarwanda JSON i18n files — zero hardcoded copy |

---

## 9. Kinyarwanda Vocabulary Reference (Clinical Terms)

| Kinyarwanda | Meaning / Context |
|---|---|
| Mfasha | "Help me" — the in-app cueing trigger |
| Navuze | "I said it" — speech confirmation button |
| Urashaka iki? | "What do you want?" — market vendor prompt |
| Ni ikiribwa | "It's a food" — semantic cue example |
| Ndashaka amazi | "I want water" — functional phrase example |
| Murakaza neza | "Welcome" |
| Tangira Iseance | "Start Session" |
| Aho ugeze | "Your progress" |
| Ku Isoko | "At the Market" |
| Subiramo | "Say It With Me" |
| Inka | Cow |
| Ifi | Fish |
| Urutoki | Banana |
| Ibirayi | Potatoes |
| Inkweto | Shoes |

---

## 11. Reference Files

- **`references/modules.md`** — Full functional requirement specs for all five modules
  (FR codes, clinical mechanics, technical constraints)
- **`references/research.md`** — Clinical evidence base, cited studies, aphasia type guide,
  UX principles for stroke patients

Read `references/modules.md` when implementing or designing any specific exercise module.
Read `references/research.md` when answering clinical questions, writing research sections,
or justifying design decisions.
# Module Specifications — Ongera Access

Full functional requirements for all five therapeutic exercise modules.
FR codes correspond to the official FRD.

---

## Module 1: "The Air Traffic Controller" (Cognitive / Spatial)

**Clinical basis:** Spatial neglect / hemispatial neglect rehabilitation via intentional
spatial scanning and smooth pursuit tracking. Designed around exploration rather than
reflexes — important distinction from Whack-a-Mole style games which would exacerbate
post-stroke spatial attention deficits.

### Functional Requirements

| Code | Requirement |
|---|---|
| FR-EXO-01 | Render a static, high-visibility vertical "Airport Control Tower" anchor on the far-left border. It must flash visually and play an audio tone to signal a new task. |
| FR-EXO-02 | Lock plane generation until verified gaze or manual touch confirmation occurs directly on the left-side anchor. |
| FR-EXO-03 | Once unlocked, the target plane advances slowly left-to-right. Continuous uninterrupted touch tracking (finger drag) is required to advance the plane. |
| FR-EXO-04 | Draw a high-contrast visual trail behind the plane. Adjust auditory pitch dynamically based on the plane's proximity to the horizontal center — pitch rises approaching center, drops instantly on tracking loss. |

### Clinical Mechanics Detail
- Airplanes spawn exclusively from the far-left viewport edge (forcing attention leftward)
- "Airport Control Tower" anchor flashes at high intensity + localized audio ping when a
  target is queued — multisensory draw into neglected hemispace
- Slow pace throughout — no time pressure, no rapid reflexes required
- Visual trail shows patient exactly how much of the left visual field has been "cleared"
- Auditory pitch drop = immediate signal to redirect attention leftward (sound as backdoor to attention)

---

## Module 2: "Video Rehab Engine" (Motion)

**Clinical basis:** Home-based motor rehabilitation for hemiparesis. Active visual coaching
interface, not a passive video gallery.

### Functional Requirements

| Code | Requirement |
|---|---|
| FR-EXM-01 | Two synchronized, frame-locked video streams: wide functional view + macro-joint zoom. Single-tap to shift focal priority between angles. |
| FR-EXM-02 | Split-screen or picture-in-picture with front-facing camera adjacent to playback for real-time physical form comparison. |
| FR-EXM-03 | Two distinct selectable audio tracks: Track 1 = patient-facing verbal cues (slow, clear); Track 2 = caregiver safety parameters, handling directives, red-flag strain protocols. |
| FR-EXM-04 | Custom loop zones — user selects exact timestamps to endlessly repeat specific joint movement phases. No manual timeline scrubber needed. |

### Non-Functional Requirements
- All controls: minimum 48×48 dp with 8 dp separation
- Offline-capable: downloaded media ≤15 MB per 5-minute block (H.265/HEVC encoding)
- Load time: ≤1.5s on 3G; ≤200ms cached locally
- WCAG 2.1 AA: 4.5:1 contrast for all overlays and icons

---

## Module 3: Multi-Modal Speech/Movement

**Clinical basis:** Simultaneous targeting of speech expression, language comprehension,
and upper-extremity fine motor rehabilitation.

### Functional Requirements

| Code | Requirement |
|---|---|
| FR-EXS-01 | Hybrid training tasks that cross-reference vocal response commands with physical finger-dexterity gestures and on-screen coordination targets simultaneously. |

### Design Notes
- This module bridges the speech and motor domains in a single interaction
- Finger-dexterity targets on screen are linked to spoken commands — completing one
  unlocks or advances the other
- Targets the same clinical gap as combined occupational therapy + speech therapy sessions

---

## Module 4: "Ku Isoko" — At the Market (Speech & Language)

**Clinical basis:** Expressive aphasia, anomia, word retrieval. Market framing provides
functional relevance — these are words patients actually need in daily life.

### Functional Requirements

| Code | Requirement |
|---|---|
| FR-EXL-01 | Automated hierarchical cueing ladder ("Mfasha") triggered when word-retrieval latency exceeds adaptive threshold. Sequence: Semantic Context ("Ni ikiribwa") → Phonemic Initial Prompt → Syllable Isolation → Full Target Word Model. |
| FR-EXL-02 | Manual validation flow: patient taps "Navuze" (I said it) → selects the matching object from a multi-image array. This bypasses the absence of validated Kinyarwanda ASR. |
| FR-EXL-03 | Caregiver Verification Mode: toggled interface allowing a collocated caregiver or family member to manually audit and log spoken expression accuracy. |
| FR-EXL-04 | Adaptive item bank: high failure rates → swap to high-frequency everyday items; mastery → advance to complex regional terms. |

### Clinical Mechanics Detail
- Vendor (audio + photo) asks "Urashaka iki?" → patient names the item to "buy" it
- Correct naming adds item to basket; full basket = session complete
- Cueing scoring: fewer cues used = higher quality retrieval score
- Cultural stimuli: inka (cow), ifi (fish), urutoki (banana), ibirayi (potatoes),
  inkweto (shoes) — real Rwandan goods, local faces, native-recorded audio
- Culturally localized stimuli is itself a research contribution (Gap 4 in the paper)

### No-ASR Workaround (Important)
The absence of reliable Kinyarwanda ASR is a hard technical constraint, not a temporary gap.
The current validation architecture (Navuze → image selection OR caregiver verify) is a
deliberate, clinically sound design. Do not attempt to replace this with unvalidated ASR.
Any future ASR integration requires clinical validation before deployment.

---

## Module 5: "Subiramo" — Say It With Me (Speech Repetition)

**Clinical basis:** Articulation, verbal repetition, self-monitoring. Targets conduction
aphasia and Broca's aphasia. Uses record-and-compare as a therapeutic mechanism.

### Functional Requirements

| Code | Requirement |
|---|---|
| FR-EXR-01 | Record patient vocalization after a native-speaker mouth-shape video model prompt. Immediately play model clip and patient recording back-to-back for auditory self-comparison. |
| FR-EXR-02 | Comprehension Interlock: before verbal repetition, patient must complete a visual item-verification matching challenge (select correct image from array). Comprehension must precede articulation. |

### Clinical Mechanics Detail
- Slow-paced model → countdown-free recording window for patient → instant back-to-back playback
- No timers, no pressure (aligns with UX principle: stress harms performance)
- Difficulty ladder (clinically meaningful progression):
  1. Single phonemes
  2. Single words
  3. High-utility phrases ("Ndashaka amazi" — I want water)
  4. Short functional sentences
- Recordings as progress artifacts: stored locally, available for remote clinician review
- The comprehension interlock means one screen simultaneously serves comprehension AND
  repetition modules — efficient design

---

## Cross-Reference Matrix

| Module | Speech & Language | Motor | Cognitive / Spatial | Primary Clinical Foundation |
|---|---|---|---|---|
| Air Traffic Controller | — | Secondary | **Primary** | Spatial Neglect / Tracking |
| Video Rehab Engine | — | **Primary** | Secondary | Form Mirroring & Guidance |
| Multi-Modal Speech/Movement | **Primary** | **Primary** | **Primary** | Fine Motor / Comprehension |
| Ku Isoko (At the Market) | **Primary** | — | Secondary | Anomia / Cueing Hierarchies |
| Subiramo (Say It With Me) | **Primary** | — | Secondary | Repetition & Self-Monitoring |
# Clinical Research & Evidence — Ongera Access

Reference material for clinical justifications, research citations, aphasia guide,
and UX principles grounded in stroke rehabilitation evidence.

---

## 1. Key Studies

### Stark & Warburton (2018)
**"Improved Language in Chronic Aphasia After Self-Delivered iPad Speech Therapy"**
*Neuropsychological Rehabilitation, Vol. 28, No. 5*

- Crossover design: speech therapy app vs Bejewelled (non-language control)
- 10 patients total (pilot n=3 + crossover n=7); chronic expressive aphasia, ≥1 year post-stroke
- 4 weeks per condition, 20 min/day recommended
- App used: Language Therapy by Tactus Therapy Solutions

**Key findings:**
- Significant CAT improvement after therapy app; no improvement after Bejewelled
- Inverse relationship: more severe baseline → greater proportional improvement
- Improvements maintained at 6-month follow-up
- Effect sizes: Cohen's d = 1.07 (post-therapy), d = 0.608 (post-Bejewelled)
- 70% had never used a tablet before — all completed the study
- Average ~85 exercises over 4 weeks (~3/day); ~85% compliance

**Relevance:** Directly validates the self-delivered app therapy approach this project uses.
The ceiling effect noted in mild patients is a design consideration for the adaptive engine.

---

### Bhogal, Teasell & Speechley (2003)
**"Intensity of Aphasia Therapy, Impact on Recovery"**
*Stroke, 34(4), 987–993*

- Intensity of therapy directly determines quality of recovery
- More hours of structured practice → better outcomes across motor, cognitive, and language domains

**Relevance:** Core justification for the app's daily-practice design and adherence nudges.

---

### Szeto et al. (2023)
**"Effect of Mobile Application Types on Stroke Rehabilitation: A Systematic Review"**
*Journal of NeuroEngineering and Rehabilitation, 20, 12*

- 29 studies reviewed
- Apps mimicking: massed practice + task-specific practice + feedback + multisensory stimulation
  produce the greatest rehabilitation gains

**Relevance:** Validates the multisensory design across modules (visual trail + audio in Air
Traffic Controller; dual video + audio in Video Rehab Engine; etc.)

---

### Ghazavi et al. (2024)
**"Effectiveness of Mobile Application Interventions for Stroke Survivors"**
*BMC Medical Informatics and Decision Making, 24, 6*

- Meta-analysis of 23 RCTs, 2,983 participants
- Mobile apps for stroke survivors (rehabilitation, education, self-care) produce measurable
  functional improvements

---

### Ericson et al. (2025)
**"Computer- and Smart-Tablet-Based Self-Administered Treatments in Chronic Post-Stroke Aphasia"**
*Frontiers in Neurology / MDPI*

- Self-administered home therapy: patients practice at least every 2 days
- Clinic-based patients receive therapy only once every 5 days
- Frequency advantage of app-based therapy is clinically significant

---

### Kankam et al. (2024)
**"Rehabilitation of Post-Stroke Aphasia in Sub-Saharan Africa"**
*International Journal of Language & Communication Disorders*

- Provision of rehabilitation services in sub-Saharan Africa faces profound challenges
- Digital rehabilitation is critically underserved both in practice and research

---

### Owolabi et al. (2021)
**"Stroke in Africa: Profile, Progress, Prospects and Priorities"**
*Nature Reviews Neurology, 17, 634–656*

- Annual stroke incidence in Africa: up to 316 per 100,000
- Prevalence: up to 1,460 per 100,000
- Three-year fatality rate exceeding 80%

---

### Nkusi et al. (2017)
**"Stroke Burden in Rwanda: A Multicenter Study"**
*World Neurosurgery, 106, 462–469*

- Rwanda-specific data: risk factor awareness low, case fatality elevated by delayed care

---

## 2. Aphasia Type Reference

| Type | Speech Output | Comprehension | Primary App Target |
|---|---|---|---|
| **Broca's (Expressive)** | Effortful, limited, telegraphic | Relatively intact | Ku Isoko, Subiramo, Multi-Modal |
| **Anomic** | Fluent, frequent word-finding gaps | Good | Ku Isoko (naming exercises) |
| **Conduction** | Fluent, repetition errors | Good | Subiramo |
| **Wernicke's (Receptive)** | Fluent but confused/jargon | Impaired | Simpler UX; limited app targeting |
| **Global** | Severely limited | Severely impaired | Very basic UX; require careful design |

**Key clinical insight (Stark & Warburton):** Patients with expressive aphasia show
heterogeneous phenotypes — intact components alongside severely restricted ones.
A one-size-fits-all approach doesn't work. The adaptive engine is clinically essential.

---

## 3. Post-Stroke Impairment Prevalence

| Impairment | Prevalence |
|---|---|
| Motor deficits (arm/leg weakness) | >50% of survivors long-term |
| Cognitive impairment | >50% within first year |
| Dementia within 5 years | ~1 in 3 |
| Aphasia | 30–40% |
| Post-stroke depression (within 5 years) | ~30% |
| Dysphagia (acute phase) | >50% |

---

## 4. Principles of Effective Stroke Rehabilitation

### The Massed Practice + Feedback Principle
1. **Intensity matters:** More therapy hours = better outcomes
2. **Feedback is essential:** Patients need to know if attempts are correct
3. **Specificity:** Learning is narrow — each skill must be practiced specifically
4. **Apps complement, not replace:** Extend therapy between clinical sessions

### Self-Delivered App Therapy Advantages
- Individualised dose — patient controls frequency
- Self-paced — no external time pressure
- Active role — patient is empowered
- ~30% cheaper than standard service delivery (Wenke et al., 2014)
- Available 24/7, at home, no transport required
- Scalable — reaches underserved rural patients

### What Drives Gains (from Szeto et al., 2023)
Apps that produce the greatest rehabilitation gains combine:
- Massed practice
- Task-specific practice
- Immediate feedback
- Multisensory stimulation

All five Ongera Access modules are designed around these four principles.

---

## 5. UX Design Principles for Stroke Patients

| Principle | Why It Matters | Implementation |
|---|---|---|
| Minimal cognitive load | Attention often impaired | One task per screen; no cluttered UI |
| Large touch targets | Motor control may be reduced | Buttons ≥48×48 dp; 8 dp separation |
| Clear iconography | Reading may be impaired | Icons + text labels always paired |
| Positive reinforcement | Motivation is critical | Celebratory feedback; no alarming negatives |
| Progress visibility | Builds hope and engagement | Always show how far they've come |
| Undo/back safety | Reduces anxiety about mistakes | Easy back navigation at all times |
| No time pressure | Stress harms performance | Avoid countdown timers unless optional |
| Short sessions | Fatigue is real | Default 10–20 minutes max |

---

## 6. Communicating With People Who Have Aphasia
*(Relevant for caregiver mode UX and instructional content design)*

- Ask yes/no questions when possible
- Use pictures and symbols alongside words
- Keep speech simple, slow, and natural
- Offer options rather than open-ended questions
- Give them time to respond — do not rush
- Do not speak for them — support, don't take over
- Do not talk down to them; intelligence is intact
- Keep them included in social situations

---

## 7. Global Context: Why No Existing App Works Here

Every clinically validated stroke rehabilitation app (Tactus Therapy, Constant Therapy,
Lingraphica SmallTalk) shares these disqualifying characteristics for the Rwandan context:

1. English-only language
2. Western cultural stimuli (objects, faces, references)
3. Assumes stable internet connectivity
4. No Bantu language support anywhere in the literature

As of the time of writing, no mobile stroke rehabilitation app exists for any Bantu
language or any East African population. Ongera Access is the first.
