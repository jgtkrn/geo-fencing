import { RolesBuilder } from 'nest-access-control';

export enum Role {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  Hr = 'hr',
}

export const role: RolesBuilder = new RolesBuilder();
role
  .grant(Role.ADMIN)
  .readAny(['users', 'companies'])
  .createAny(['users', 'companies'])
  .deleteAny(['users', 'companies'])
  .updateAny(['users', 'companies']);
role.grant(Role.EMPLOYEE).readOwn(['users', 'companies']).updateOwn(['users']);
