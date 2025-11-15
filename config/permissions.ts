// config/permissions.ts

import { UserRole } from "@/context/AuthProvider"; // Assuming you exported UserRole

// 1. Define the Permissions Constants (for type-safe use throughout the app)
export const PERMISSIONS = {
  VIEW_RECORD: "view:record",
  CREATE_RECORD: "create:record",
  UPDATE_RECORD: "update:record",
  DELETE_RECORD: "delete:record",
  VIEW_SENSITIVE_NAME: "view:sensitive_name",
  // EXPORT_RECORD: "export:record"
  CREATE_ACTIVITY: "create:activity",
  VIEW_ACTIVITY_DETAIL: "view:activity:detail",
  EDIT_ACTIVITY: "edit:activity",
  DELETE_ACTIVITY: "delete:activity",
};

// 2. Define the Access Matrix (The core RBAC logic)
export const ACCESS_MATRIX: Record<UserRole, string[]> = {
  // Can view, create, update, and delete
  admin: [
    PERMISSIONS.VIEW_RECORD,
    PERMISSIONS.CREATE_RECORD,
    PERMISSIONS.UPDATE_RECORD,
    PERMISSIONS.DELETE_RECORD,
    PERMISSIONS.VIEW_SENSITIVE_NAME,
    PERMISSIONS.CREATE_ACTIVITY,
    PERMISSIONS.VIEW_ACTIVITY_DETAIL,
    PERMISSIONS.EDIT_ACTIVITY,
    PERMISSIONS.DELETE_ACTIVITY,
  ],

  // Can view, create, and update, but NOT delete
  staff: [
    PERMISSIONS.VIEW_RECORD,
    PERMISSIONS.CREATE_RECORD,
    PERMISSIONS.UPDATE_RECORD,
    PERMISSIONS.VIEW_SENSITIVE_NAME,
    PERMISSIONS.CREATE_ACTIVITY,
    PERMISSIONS.VIEW_ACTIVITY_DETAIL,
    PERMISSIONS.EDIT_ACTIVITY,
  ],

  // Can only view
  viewer: [PERMISSIONS.VIEW_RECORD],

  // No access to secure areas
  unauthenticated: [],
};
