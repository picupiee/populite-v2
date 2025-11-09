// hooks/useAccess.ts

import { ACCESS_MATRIX, PERMISSIONS } from "@/config/permissions";
import { useAuth } from "@/context/AuthProvider";

/**
 * A hook to check if the current user has a specific permission.
 * @returns An object containing the can(permission) function and the PERMISSIONS constants.
 */
export const useAccess = () => {
  // Get the current user's role from the AuthContext
  const { role } = useAuth();

  /**
   * Checks if the user's role has the given permission.
   * @param permission The permission string (e.g., PERMISSIONS.DELETE_RECORD).
   * @returns boolean
   */
  const can = (permission: string): boolean => {
    // Lookup the allowed permissions for the user's current role
    const allowedPermissions = ACCESS_MATRIX[role];

    if (!allowedPermissions) {
      // Should not happen if roles are correctly typed/handled
      return false;
    }

    // Check if the permission exists in the role's array
    return allowedPermissions.includes(permission);
  };

  return { role, can, PERMISSIONS };
};
