import type { Patient, PatientProgressEntry } from '../types/patients';

export type InsightTone = 'positive' | 'warning' | 'neutral';

export interface PatientInsight {
  id: string;
  title: string;
  detail: string;
  tone: InsightTone;
}

function entryAccuracy(entry: PatientProgressEntry): number | null {
  if (entry.averageScore != null) return entry.averageScore;
  if (entry.totalQuestions > 0) return (entry.totalCorrect / entry.totalQuestions) * 100;
  return null;
}

export function buildPatientInsights(
  patient: Patient,
  entries: PatientProgressEntry[],
  exerciseName?: (id: string) => string,
): PatientInsight[] {
  const insights: PatientInsight[] = [];
  const name = exerciseName ?? ((id) => `Exercise ${id.slice(0, 6)}`);

  if (patient.status === 'inactive') {
    insights.push({
      id: 'inactive',
      title: 'No recent activity',
      detail: patient.lastSession
        ? `Last practised ${patient.lastSession}. Consider a check-in.`
        : 'No sessions logged yet.',
      tone: 'warning',
    });
  }

  if (patient.status === 'struggling') {
    insights.push({
      id: 'struggling',
      title: 'Accuracy below target',
      detail:
        patient.accuracy != null
          ? `Overall accuracy is ${patient.accuracy}%. Review easier levels or adjust the care plan.`
          : 'Recent scores are low. Review exercise levels in the care plan.',
      tone: 'warning',
    });
  }

  if (patient.status === 'new' && !patient.module) {
    insights.push({
      id: 'needs-plan',
      title: 'Care plan needed',
      detail: 'No module assigned yet. Build a care plan so practice can begin.',
      tone: 'warning',
    });
  }

  const weakExercises = entries
    .map((entry) => ({ entry, accuracy: entryAccuracy(entry) }))
    .filter((item) => item.accuracy != null && item.accuracy < 50)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  for (const { entry, accuracy } of weakExercises.slice(0, 2)) {
    insights.push({
      id: `weak-${entry.exerciseId}`,
      title: `${name(entry.exerciseId)} needs support`,
      detail: `${Math.round(accuracy ?? 0)}% accuracy · ${entry.totalSessions} session${
        entry.totalSessions === 1 ? '' : 's'
      }`,
      tone: 'warning',
    });
  }

  const strongExercises = entries
    .map((entry) => ({ entry, accuracy: entryAccuracy(entry) }))
    .filter((item) => item.accuracy != null && item.accuracy >= 75)
    .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0));

  if (strongExercises.length > 0 && patient.status === 'active') {
    const best = strongExercises[0];
    insights.push({
      id: `strong-${best.entry.exerciseId}`,
      title: 'Strong performance',
      detail: `${name(best.entry.exerciseId)} at ${Math.round(best.accuracy ?? 0)}% accuracy.`,
      tone: 'positive',
    });
  }

  const bestStreak = Math.max(patient.streakDays, ...entries.map((e) => e.streakDays));
  if (bestStreak >= 3) {
    insights.push({
      id: 'streak',
      title: `${bestStreak}-day high-score streak`,
      detail: 'Consistent practice is supporting recovery.',
      tone: 'positive',
    });
  }

  if (patient.totalHintsUsed > 0 && patient.avgHintsPerSession != null && patient.avgHintsPerSession >= 1.5) {
    insights.push({
      id: 'high-hints',
      title: 'Frequent hint use',
      detail: `${patient.totalHintsUsed} hints used · ${patient.avgHintsPerSession} avg per session. Consider an easier level or more cueing support.`,
      tone: 'warning',
    });
  } else if (patient.totalSessions > 0 && patient.totalHintsUsed === 0) {
    insights.push({
      id: 'independent',
      title: 'Practising independently',
      detail: 'No hints used across completed sessions — strong self-reliance.',
      tone: 'positive',
    });
  }

  const hintHeavyExercise = entries
    .filter((entry) => entry.hintsUsed > 0 && entry.totalSessions > 0)
    .map((entry) => ({
      entry,
      avg: entry.hintsUsed / entry.totalSessions,
    }))
    .sort((a, b) => b.avg - a.avg)[0];

  if (hintHeavyExercise && hintHeavyExercise.avg >= 1.5) {
    insights.push({
      id: `hints-${hintHeavyExercise.entry.exerciseId}`,
      title: `${name(hintHeavyExercise.entry.exerciseId)} uses many hints`,
      detail: `${hintHeavyExercise.entry.hintsUsed} hints across ${hintHeavyExercise.entry.totalSessions} sessions.`,
      tone: 'warning',
    });
  }

  if (insights.length === 0 && patient.totalSessions > 0) {
    insights.push({
      id: 'on-track',
      title: 'Steady progress',
      detail: `${patient.totalSessions} session${patient.totalSessions === 1 ? '' : 's'} completed${
        patient.accuracy != null ? ` · ${patient.accuracy}% accuracy` : ''
      }.`,
      tone: 'neutral',
    });
  }

  return insights.slice(0, 4);
}
