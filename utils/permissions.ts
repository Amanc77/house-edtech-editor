import type { DocumentRole, PermissionAction } from "@/types";
import { DOCUMENT_ROLES, ROLE_PERMISSIONS } from "@/constants";

export function isValidRole(role: string): role is DocumentRole {
  return (DOCUMENT_ROLES as readonly string[]).includes(role);
}

export function hasPermission(
  role: DocumentRole | undefined | null,
  action: PermissionAction
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return (permissions as readonly string[]).includes(action);
}

export function canRead(role: DocumentRole | undefined | null): boolean {
  return hasPermission(role, "read");
}

export function canWrite(role: DocumentRole | undefined | null): boolean {
  return hasPermission(role, "write");
}

export function canShare(role: DocumentRole | undefined | null): boolean {
  return hasPermission(role, "share");
}

export function canDelete(role: DocumentRole | undefined | null): boolean {
  return hasPermission(role, "delete");
}

export function canRestore(role: DocumentRole | undefined | null): boolean {
  return hasPermission(role, "restore");
}

export function canSnapshot(role: DocumentRole | undefined | null): boolean {
  return hasPermission(role, "snapshot");
}

export function getRoleLabel(role: DocumentRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}

export function compareRoles(
  a: DocumentRole,
  b: DocumentRole
): number {
  const order: Record<DocumentRole, number> = {
    owner: 3,
    editor: 2,
    viewer: 1,
  };
  return order[a] - order[b];
}

export function getHighestRole(
  roles: DocumentRole[]
): DocumentRole | undefined {
  if (roles.length === 0) return undefined;
  return roles.reduce((highest, role) =>
    compareRoles(role, highest) > 0 ? role : highest
  );
}
