/** Age in whole years from an ISO date-of-birth string, or null if unknown/invalid. */
export function ageFromDateOfBirth(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 150 ? age : null;
}
