import type { ModuleCatalog, ModuleLevel, ModuleSession } from '../types/modules';

function mockLevels(
  counts: [number, number, number],
  sessions: ModuleSession[] = [],
): ModuleLevel[] {
  return [
    { id: '1', difficulty: 'easy', label: '1', questionCount: counts[0], sessions },
    { id: '2', difficulty: 'medium', label: '2', questionCount: counts[1], sessions },
    { id: '3', difficulty: 'hard', label: '3', questionCount: counts[2], sessions },
  ];
}

const kuIsokoSessions = [
  { number: 1, name: 'Animals', itemCount: 45 },
  { number: 2, name: 'Fruits', itemCount: 40 },
  { number: 3, name: 'Furniture', itemCount: 38 },
  { number: 4, name: 'Vegetables', itemCount: 42 },
  { number: 5, name: 'Clothing', itemCount: 35 },
  { number: 6, name: 'Kitchenware', itemCount: 36 },
  { number: 7, name: 'Tools', itemCount: 32 },
  { number: 8, name: 'Body parts', itemCount: 30 },
  { number: 9, name: 'Market phrases', itemCount: 28 },
];

const namingLevels = mockLevels([400, 320, 240], kuIsokoSessions);

const countingSessions = [
  { number: 1, name: '1–5', itemCount: 20 },
  { number: 2, name: '6–10', itemCount: 20 },
  { number: 3, name: '11–20', itemCount: 25 },
  { number: 4, name: 'Tens', itemCount: 20 },
  { number: 5, name: 'Money', itemCount: 30 },
];

const comprehendSessions = [
  { number: 1, name: 'Animals', itemCount: 40 },
  { number: 2, name: 'Fruits', itemCount: 38 },
  { number: 3, name: 'Household', itemCount: 36 },
  { number: 4, name: 'Actions', itemCount: 42 },
  { number: 5, name: 'Places', itemCount: 35 },
  { number: 6, name: 'People', itemCount: 34 },
  { number: 7, name: 'Food', itemCount: 40 },
  { number: 8, name: 'Objects', itemCount: 38 },
  { number: 9, name: 'Mixed review', itemCount: 50 },
];

const subiramoSessions = [
  { number: 1, name: 'Single words', itemCount: 30 },
  { number: 2, name: 'Two syllables', itemCount: 35 },
  { number: 3, name: 'Short phrases', itemCount: 28 },
  { number: 4, name: 'Longer phrases', itemCount: 25 },
  { number: 5, name: 'Greetings', itemCount: 20 },
  { number: 6, name: 'Daily needs', itemCount: 32 },
  { number: 7, name: 'Commands', itemCount: 28 },
  { number: 8, name: 'Questions', itemCount: 24 },
  { number: 9, name: 'Mixed review', itemCount: 40 },
];

// mock catalog — wire to backend later
export const mockModuleCatalog: ModuleCatalog = {
  domains: [
    {
      id: 'speech',
      name: 'Speech & Language',
      description: 'Naming, repetition, and expressive language recovery.',
      modules: [
        {
          id: 'ku-isoko',
          name: 'Ku Isoko',
          subtitle: 'At the Market',
          domain: 'speech',
          description:
            'Naming game set in a Rwandan market. Patients name culturally familiar items to complete purchases.',
          clinicalTarget: 'Anomia, expressive aphasia, word retrieval',
          exercises: [
            {
              id: 'ku-isoko-naming',
              code: 'L1',
              name: 'Naming',
              description: 'Name the item shown on screen. Cueing ladder available (semantic → phonemic → syllable → full model).',
              mechanic: 'Image prompt → spoken response → self-verify or caregiver check',
              levels: namingLevels,
            },
            {
              id: 'ku-isoko-counting',
              code: 'L2',
              name: 'Counting',
              description: 'Count items and quantities used in market scenarios.',
              mechanic: 'Visual quantity → spoken number',
              levels: mockLevels([120, 100, 80], countingSessions),
            },
          ],
        },
        {
          id: 'subiramo',
          name: 'Subiramo',
          subtitle: 'Say It With Me',
          domain: 'speech',
          description:
            'Listen to a native model, then repeat the word or phrase. Focus on articulation and self-monitoring.',
          clinicalTarget: 'Broca\'s aphasia, conduction aphasia, articulation',
          exercises: [
            {
              id: 'subiramo-repeat',
              code: 'L1',
              name: 'Repetition',
              description: 'Audio and mouth-shape video model, then patient repeats aloud.',
              mechanic: 'Listen → repeat → compare',
              levels: mockLevels([200, 160, 120], subiramoSessions),
            },
          ],
        },
      ],
    },
    {
      id: 'motion',
      name: 'Motion',
      description: 'Motor rehabilitation through guided movement videos.',
      modules: [
        {
          id: 'video-rehab',
          name: 'Video Rehab',
          subtitle: 'Video Rehab Engine',
          domain: 'motion',
          description:
            'Offline video blocks for home-based rehab. Dual-angle playback with optional front-camera mirror.',
          clinicalTarget: 'Hemiparesis, motor recovery, form mirroring',
          exercises: [
            {
              id: 'video-rehab-upper',
              code: 'L1',
              name: 'Upper limb',
              description: 'Shoulder, elbow, and hand movement sequences.',
              mechanic: 'Follow-along video with loop zones for specific joints',
              levels: [
                { id: '1', difficulty: 'easy', label: '1', sessions: [
                    { number: 1, name: 'Shoulder mobility' },
                    { number: 2, name: 'Elbow flexion' },
                    { number: 3, name: 'Wrist rotation' },
                  ] },
                { id: '2', difficulty: 'medium', label: '2', sessions: [
                    { number: 1, name: 'Reach & grasp' },
                    { number: 2, name: 'Fine motor' },
                    { number: 3, name: 'Coordination' },
                  ] },
                { id: '3', difficulty: 'hard', label: '3', sessions: [
                    { number: 1, name: 'Bilateral tasks' },
                    { number: 2, name: 'Functional reach' },
                    { number: 3, name: 'Speed & control' },
                  ] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'cognitive',
      name: 'Cognitive',
      description: 'Attention, spatial awareness, and comprehension tasks.',
      modules: [
        {
          id: 'comprehend',
          name: 'Comprehend',
          domain: 'cognitive',
          description:
            'Listen to a spoken word or phrase, then pick the matching image from a set of options.',
          clinicalTarget: 'Auditory comprehension, word recognition',
          exercises: [
            {
              id: 'comprehend-choice',
              code: 'L1',
              name: 'Image choice',
              description: 'Hear the target word, then tap the correct picture.',
              mechanic: 'Audio prompt → 4 image options → reveal answer',
              levels: mockLevels([400, 320, 240], comprehendSessions),
            },
          ],
        },
        {
          id: 'air-traffic',
          name: 'Air Traffic Controller',
          domain: 'cognitive',
          description:
            'Guide aircraft across the screen using touch drag. Trains attention into the neglected visual field.',
          clinicalTarget: 'Spatial neglect, hemispatial neglect, smooth pursuit',
          exercises: [
            {
              id: 'atc-tracking',
              code: 'L1',
              name: 'Visual tracking',
              description: 'Slow-moving targets cross from left anchor across the full visual field.',
              mechanic: 'Touch drag → multisensory feedback trail',
              levels: [
                { id: '1', difficulty: 'easy', label: '1', sessions: [
                    { number: 1, name: 'Single plane' },
                    { number: 2, name: 'Slow crossing' },
                    { number: 3, name: 'Left anchor focus' },
                  ] },
                { id: '2', difficulty: 'medium', label: '2', sessions: [
                    { number: 1, name: 'Two targets' },
                    { number: 2, name: 'Variable speed' },
                    { number: 3, name: 'Narrow paths' },
                  ] },
                { id: '3', difficulty: 'hard', label: '3', sessions: [
                    { number: 1, name: 'Distraction items' },
                    { number: 2, name: 'Fast crossing' },
                    { number: 3, name: 'Full field scan' },
                  ] },
              ],
            },
          ],
        },
      ],
    },
  ],
};
