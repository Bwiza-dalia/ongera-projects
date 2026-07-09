import type { ExtractedPrescriptionInfo, PrescriptionUpload } from '../types/prescription';
import { demoPrescriptions, isDemoSeeded, markDemoSeeded } from '../data/mockCarePlans';

const STORAGE_KEY = 'ongera_prescription_uploads';

function loadAll(): PrescriptionUpload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrescriptionUpload[];
  } catch {
    return [];
  }
}

function saveAll(items: PrescriptionUpload[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listPrescriptions(): PrescriptionUpload[] {
  return loadAll().sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}

/** Seeds example prescriptions once so the Care plans UI can be previewed. */
export function seedDemoPrescriptionsIfEmpty() {
  if (isDemoSeeded() || loadAll().length > 0) return false;
  saveAll(demoPrescriptions);
  markDemoSeeded();
  return true;
}

export function listPrescriptionsWithDemo(): PrescriptionUpload[] {
  seedDemoPrescriptionsIfEmpty();
  return listPrescriptions();
}

export function getPrescription(id: string): PrescriptionUpload | null {
  return loadAll().find((p) => p.id === id) ?? null;
}

export function savePrescription(item: PrescriptionUpload): PrescriptionUpload {
  const all = loadAll();
  const index = all.findIndex((p) => p.id === item.id);
  if (index >= 0) all[index] = item;
  else all.unshift(item);
  saveAll(all);
  return item;
}

export function markPrescriptionSent(id: string, patientId: string) {
  const item = getPrescription(id);
  if (!item) return;
  savePrescription({
    ...item,
    patientId,
    status: 'sent',
  });
}

export function extractPrescriptionFromText(text: string): ExtractedPrescriptionInfo {
  const normalized = text.replace(/\r\n/g, '\n').trim();

  const patientLine = normalized.match(/patient\s*[:\-]\s*(.+)/i);
  const patientName = patientLine?.[1]?.split('\n')[0]?.trim();

  const sessionsMatch = normalized.match(
    /(\d+)\s*(?:sessions?\s*(?:per\s*week|\/\s*week|weekly)|times?\s*(?:per\s*)?week)/i,
  );
  const sessionsPerWeek = sessionsMatch ? Number(sessionsMatch[1]) : undefined;

  const startMatch = normalized.match(
    /(?:start|begin(?:ning)?)\s*(?:date|on)?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i,
  );
  const startDate = startMatch?.[1];

  let suggestedModuleType: ExtractedPrescriptionInfo['suggestedModuleType'];
  let suggestedModuleName: string | undefined;

  if (/speech|language|naming|comprehend|aphasia|verbal/i.test(normalized)) {
    suggestedModuleType = 'speech';
    suggestedModuleName = 'Speech and Language';
  } else if (/cognitive|memory|attention|recall|brain/i.test(normalized)) {
    suggestedModuleType = 'cognitive';
    suggestedModuleName = 'Cognitive';
  } else if (/motion|motor|movement|gait|coordination/i.test(normalized)) {
    suggestedModuleType = 'motion';
    suggestedModuleName = 'Motion';
  }

  const moduleLine = normalized.match(/module\s*[:\-]\s*(.+)/i);
  if (moduleLine?.[1]) {
    suggestedModuleName = moduleLine[1].split('\n')[0]?.trim();
  }

  const notesMatch = normalized.match(
    /(?:clinical\s*notes|notes|goals|diagnosis|recommendations?|plan)\s*[:\-]\s*([\s\S]+)/i,
  );
  const clinicalNotes = notesMatch?.[1]?.trim().slice(0, 4000);

  return {
    patientName,
    suggestedModuleType,
    suggestedModuleName,
    sessionsPerWeek,
    startDate,
    clinicalNotes,
    rawText: normalized.slice(0, 8000),
  };
}

export async function readPrescriptionFile(file: File): Promise<{
  text: string;
  extracted: ExtractedPrescriptionInfo;
}> {
  const textTypes = ['text/plain', 'application/json', 'text/csv'];
  const isText =
    textTypes.includes(file.type) || /\.(txt|md|json|csv)$/i.test(file.name);

  let text = '';
  if (isText) {
    text = await file.text();
  } else {
    text = [
      `Uploaded file: ${file.name}`,
      `Type: ${file.type || 'unknown'}`,
      '',
      'Review the document and confirm extracted fields below.',
    ].join('\n');
  }

  const extracted = extractPrescriptionFromText(text);
  if (!isText && file.name) {
    const nameGuess = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    if (!extracted.patientName && nameGuess.length > 2) {
      extracted.patientName = nameGuess;
    }
  }

  return { text, extracted };
}

export function createPrescriptionUpload(
  file: File,
  extracted: ExtractedPrescriptionInfo,
): PrescriptionUpload {
  return {
    id: `rx-${Date.now()}`,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
    status: 'pending',
    patientName: extracted.patientName,
    extracted,
  };
}
