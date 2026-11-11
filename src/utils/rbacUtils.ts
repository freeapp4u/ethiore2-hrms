import { SystemRole, RolePermissions, ActionPermissions, ModulePermission } from "../types";
import { APP_MODULES, DEFAULT_ACTIONS } from "../config/permissions";

export const DEFAULT_ROLES: SystemRole[] = [
  {
    id: "Administrator",
    name: "Administrator",
    description: "Full system access with all administrative privileges.",
    status: "Active",
    isSystem: true,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  },
  {
    id: "HR Officer",
    name: "HR Officer",
    description: "Access to employee management, leaves, and payroll processing.",
    status: "Active",
    isSystem: true,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  },
  {
    id: "Department Head",
    name: "Department Head",
    description: "Access to department-specific reports and approvals.",
    status: "Active",
    isSystem: true,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  },
  {
    id: "Employee",
    name: "Employee",
    description: "Access to personal profile, attendance, and self-service leaves.",
    status: "Active",
    isSystem: true,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  },
  {
    id: "Auditor",
    name: "Auditor",
    description: "Read-only access to audit logs and reports.",
    status: "Active",
    isSystem: true,
    createdDate: "2026-01-01",
    updatedDate: "2026-01-01"
  }
];

const getFullActions = (): ActionPermissions => ({
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  export: true
});

const getReadOnlyActions = (): ActionPermissions => ({
  view: true,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  export: true
});

export const getDefaultRolePermissions = (roleId: string): RolePermissions => {
  const modulePermissions: { [moduleId: string]: ModulePermission } = {};

  APP_MODULES.forEach(module => {
    const submenus: { [submenuId: string]: boolean } = {};
    module.submenus.forEach(sub => {
      submenus[sub.id] = false;
    });

    modulePermissions[module.id] = {
      enabled: false,
      actions: { ...DEFAULT_ACTIONS },
      submenus
    };
  });

  // Assign specific defaults based on roleId
  if (roleId === "Administrator") {
    APP_MODULES.forEach(m => {
      modulePermissions[m.id].enabled = true;
      modulePermissions[m.id].actions = getFullActions();
      Object.keys(modulePermissions[m.id].submenus).forEach(s => {
        modulePermissions[m.id].submenus[s] = true;
      });
    });
  } else if (roleId === "Auditor") {
    APP_MODULES.forEach(m => {
      modulePermissions[m.id].enabled = true;
      modulePermissions[m.id].actions = getReadOnlyActions();
      Object.keys(modulePermissions[m.id].submenus).forEach(s => {
        modulePermissions[m.id].submenus[s] = true;
      });
    });
  } else if (roleId === "Employee") {
    const allowed = ["dashboard", "leaves", "attendance", "medical", "payroll", "help"];
    allowed.forEach(id => {
      if (modulePermissions[id]) {
        modulePermissions[id].enabled = true;
        modulePermissions[id].actions = { ...DEFAULT_ACTIONS, view: true };
        // Specific employee submenus
        if (id === "leaves") {
          modulePermissions[id].submenus["dashboard"] = true;
          modulePermissions[id].submenus["applications"] = true;
          modulePermissions[id].submenus["balances"] = true;
          modulePermissions[id].actions.create = true;
        }
        if (id === "medical") {
          modulePermissions[id].submenus["dashboard"] = true;
          modulePermissions[id].submenus["claims"] = true;
          modulePermissions[id].submenus["family"] = true;
          modulePermissions[id].actions.create = true;
        }
        if (id === "payroll") {
          modulePermissions[id].submenus["dashboard"] = true;
          modulePermissions[id].submenus["payslips"] = true;
        }
      }
    });
  }

  return {
    id: roleId,
    roleId,
    modulePermissions,
    updatedBy: "System",
    updatedAt: new Date().toISOString()
  };
};

export const hasPermission = (
  rolePermissions: RolePermissions | undefined,
  moduleId: string,
  action?: keyof ActionPermissions,
  submenuId?: string
): boolean => {
  if (!rolePermissions) return false;
  
  const modulePerm = rolePermissions.modulePermissions[moduleId];
  if (!modulePerm || !modulePerm.enabled) return false;

  if (action && !modulePerm.actions[action]) return false;

  if (submenuId && !modulePerm.submenus[submenuId]) return false;

  return true;
};
