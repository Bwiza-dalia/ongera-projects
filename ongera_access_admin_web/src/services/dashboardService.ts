import { listModules } from './catalogService';
import { listPatients } from './patientService';
import { listTherapists } from './therapistService';
import { listUsers } from './userService';

export async function getDashboardCounts(token: string) {
  const [users, patients, therapists, modules] = await Promise.all([
    listUsers(token),
    listPatients(token),
    listTherapists(token),
    listModules(token),
  ]);

  return {
    users: users.length,
    patients: patients.length,
    therapists: therapists.length,
    modules: modules.length,
    verifiedTherapists: therapists.filter((t) => t.is_verified).length,
  };
}
