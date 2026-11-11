import React, { useState, useMemo } from "react";
import { SystemRole, RolePermissions, ActionPermissions, ModulePermission, User } from "../types";
import { APP_MODULES, DEFAULT_ACTIONS } from "../config/permissions";
import { 
  ShieldCheck, Plus, Search, ChevronDown, ChevronRight, Copy, Save, 
  Trash2, AlertTriangle, CheckCircle2, Lock, Unlock, Settings, Users2 
} from "lucide-react";

interface RoleMatrixProps {
  roles: SystemRole[];
  rolePermissions: RolePermissions[];
  currentUser: User | null;
  onUpdateRoles: (roles: SystemRole[]) => void;
  onUpdateRolePermissions: (perms: RolePermissions[]) => void;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function RoleMatrix({
  roles,
  rolePermissions,
  currentUser,
  onUpdateRoles,
  onUpdateRolePermissions,
  onLogAction
}: RoleMatrixProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Local state for the selected role's permissions
  const [localPermissions, setLocalPermissions] = useState<RolePermissions | null>(null);

  const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);

  // Load local permissions when role changes
  React.useEffect(() => {
    const perm = rolePermissions.find(p => p.roleId === selectedRoleId);
    if (perm) {
      setLocalPermissions(JSON.parse(JSON.stringify(perm))); // Deep clone
    } else {
      setLocalPermissions(null);
    }
    setHasUnsavedChanges(false);
  }, [selectedRoleId, rolePermissions]);

  const handleToggleModule = (moduleId: string) => {
    if (!localPermissions) return;
    const updated = { ...localPermissions };
    const modulePerm = updated.modulePermissions[moduleId];
    
    modulePerm.enabled = !modulePerm.enabled;
    
    // If disabling, disable all submenus and actions
    if (!modulePerm.enabled) {
      Object.keys(modulePerm.submenus).forEach(key => {
        modulePerm.submenus[key] = false;
      });
      Object.keys(modulePerm.actions).forEach(key => {
        (modulePerm.actions as any)[key] = false;
      });
    } else {
      // If enabling, enable view by default
      modulePerm.actions.view = true;
    }
    
    setLocalPermissions(updated);
    setHasUnsavedChanges(true);
  };

  const handleToggleSubmenu = (moduleId: string, submenuId: string) => {
    if (!localPermissions) return;
    const updated = { ...localPermissions };
    updated.modulePermissions[moduleId].submenus[submenuId] = !updated.modulePermissions[moduleId].submenus[submenuId];
    
    // If enabling a submenu, ensure module is enabled
    if (updated.modulePermissions[moduleId].submenus[submenuId]) {
      updated.modulePermissions[moduleId].enabled = true;
      updated.modulePermissions[moduleId].actions.view = true;
    }
    
    setLocalPermissions(updated);
    setHasUnsavedChanges(true);
  };

  const handleToggleAction = (moduleId: string, action: keyof ActionPermissions) => {
    if (!localPermissions) return;
    const updated = { ...localPermissions };
    updated.modulePermissions[moduleId].actions[action] = !updated.modulePermissions[moduleId].actions[action];
    
    // If enabling any action, ensure module is enabled
    if (updated.modulePermissions[moduleId].actions[action]) {
      updated.modulePermissions[moduleId].enabled = true;
    }
    
    setLocalPermissions(updated);
    setHasUnsavedChanges(true);
  };

  const handleSelectAllActions = (type: "all" | "view" | "edit" | "none") => {
    if (!localPermissions) return;
    const updated = { ...localPermissions };
    
    Object.keys(updated.modulePermissions).forEach(moduleId => {
      const module = updated.modulePermissions[moduleId];
      if (type === "none") {
        module.enabled = false;
        Object.keys(module.actions).forEach(a => (module.actions as any)[a] = false);
        Object.keys(module.submenus).forEach(s => module.submenus[s] = false);
      } else {
        module.enabled = true;
        module.actions.view = true;
        if (type === "all") {
          Object.keys(module.actions).forEach(a => (module.actions as any)[a] = true);
          Object.keys(module.submenus).forEach(s => module.submenus[s] = true);
        } else if (type === "edit") {
          module.actions.edit = true;
          module.actions.create = true;
        }
      }
    });
    
    setLocalPermissions(updated);
    setHasUnsavedChanges(true);
  };

  const handleCopyFromRole = (fromRoleId: string) => {
    const fromPerm = rolePermissions.find(p => p.roleId === fromRoleId);
    if (!fromPerm || !localPermissions) return;
    
    const updated = {
      ...localPermissions,
      modulePermissions: JSON.parse(JSON.stringify(fromPerm.modulePermissions))
    };
    
    setLocalPermissions(updated);
    setHasUnsavedChanges(true);
    alert(`Permissions copied from ${fromRoleId}`);
  };

  const handleSavePermissions = () => {
    if (!localPermissions || !selectedRole) return;
    
    setIsSaving(true);
    const updatedPerms = rolePermissions.map(p => 
      p.roleId === selectedRoleId ? { ...localPermissions, updatedAt: new Date().toISOString(), updatedBy: currentUser?.email || "Admin" } : p
    );
    
    onUpdateRolePermissions(updatedPerms);
    onLogAction("Security", "Update Role Permissions", selectedRole.name, `Updated access matrix for role: ${selectedRole.name}`);
    
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      alert("Permissions saved and applied successfully.");
    }, 800);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    const newRole: SystemRole = {
      id: roleName.trim().replace(/\s+/g, "_"),
      name: roleName.trim(),
      description: roleDesc.trim(),
      status: "Active",
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0]
    };

    const newPerm: RolePermissions = {
      id: newRole.id,
      roleId: newRole.id,
      modulePermissions: JSON.parse(JSON.stringify(getDefaultModuleStructure())),
      updatedBy: currentUser?.email || "Admin",
      updatedAt: new Date().toISOString()
    };

    onUpdateRoles([...roles, newRole]);
    onUpdateRolePermissions([...rolePermissions, newPerm]);
    onLogAction("Security", "Create Role", newRole.name, `Created new system role: ${newRole.name}`);
    
    setSelectedRoleId(newRole.id);
    setShowRoleModal(false);
    setRoleName("");
    setRoleDesc("");
  };

  const getDefaultModuleStructure = () => {
    const structure: { [key: string]: ModulePermission } = {};
    APP_MODULES.forEach(m => {
      const submenus: { [key: string]: boolean } = {};
      m.submenus.forEach(s => submenus[s.id] = false);
      structure[m.id] = {
        enabled: false,
        actions: { ...DEFAULT_ACTIONS },
        submenus
      };
    });
    return structure;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary-custom" />
            Roles & Permissions Matrix
          </h2>
          <p className="text-xs text-slate-500 font-medium">Configure dynamic module access and functional permissions per role.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowRoleModal(true)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New Role
          </button>
          <button 
            onClick={handleSavePermissions}
            disabled={!hasUnsavedChanges || isSaving}
            className="px-4 py-1.5 bg-primary-custom text-white text-xs font-black rounded-lg hover:opacity-95 flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {isSaving ? <Settings className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save & Apply
          </button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            You have unsaved permission changes for the current role.
          </div>
          <button onClick={handleSavePermissions} className="text-[10px] font-black uppercase text-amber-900 underline">Apply Now</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role List Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">System Roles</h3>
              <Users2 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="p-2 space-y-1">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                    selectedRoleId === role.id 
                      ? "bg-primary-custom text-white shadow-md font-bold" 
                      : "text-slate-600 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span className="text-xs truncate pr-2">{role.name}</span>
                  {role.isSystem && <Lock className={`h-3 w-3 ${selectedRoleId === role.id ? "text-white/50" : "text-slate-300"}`} />}
                </button>
              ))}
            </div>
          </div>

          {selectedRole && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400">Role Summary</h4>
              <div>
                <p className="text-xs font-bold text-slate-800">{selectedRole.name}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{selectedRole.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold uppercase">Status</span>
                  <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">{selectedRole.status}</span>
                </div>
                {localPermissions && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">Last Updated</span>
                    <span className="text-slate-600 font-medium">{new Date(localPermissions.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter modules or submenus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary-custom"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleSelectAllActions("view")} className="px-2 py-1 bg-white border rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50">All View</button>
                  <button onClick={() => handleSelectAllActions("edit")} className="px-2 py-1 bg-white border rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50">All Edit</button>
                  <button onClick={() => handleSelectAllActions("all")} className="px-2 py-1 bg-white border rounded text-[10px] font-bold text-primary-custom hover:bg-blue-50 border-primary-custom">Select All</button>
                  <button onClick={() => handleSelectAllActions("none")} className="px-2 py-1 bg-white border rounded text-[10px] font-bold text-rose-600 hover:bg-rose-50 border-rose-200">Clear All</button>
                </div>
                <div className="h-6 w-px bg-slate-300 mx-1 shrink-0" />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Copy From:</span>
                  <select 
                    onChange={(e) => handleCopyFromRole(e.target.value)}
                    value=""
                    className="text-[10px] font-bold bg-white border rounded px-2 py-1 outline-none"
                  >
                    <option value="" disabled>Choose role</option>
                    {roles.filter(r => r.id !== selectedRoleId).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3 w-1/3">Module & Hierarchy</th>
                    <th className="px-3 py-3 text-center">View</th>
                    <th className="px-3 py-3 text-center">Create</th>
                    <th className="px-3 py-3 text-center">Edit</th>
                    <th className="px-3 py-3 text-center">Delete</th>
                    <th className="px-3 py-3 text-center">Approve</th>
                    <th className="px-3 py-3 text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {APP_MODULES.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(module => {
                    const localModule = localPermissions?.modulePermissions[module.id];
                    if (!localModule) return null;

                    return (
                      <React.Fragment key={module.id}>
                        <tr className={`group transition-colors ${localModule.enabled ? "bg-white" : "bg-slate-50/50"}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={localModule.enabled}
                                onChange={() => handleToggleModule(module.id)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-primary-custom focus:ring-primary-custom"
                              />
                              <span className={`text-xs font-bold ${localModule.enabled ? "text-slate-800" : "text-slate-400"}`}>
                                {module.name}
                              </span>
                            </div>
                          </td>
                          {(["view", "create", "edit", "delete", "approve", "export"] as (keyof ActionPermissions)[]).map(action => (
                            <td key={action} className="px-3 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={localModule.actions[action]}
                                disabled={!localModule.enabled}
                                onChange={() => handleToggleAction(module.id, action)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-primary-custom focus:ring-primary-custom disabled:opacity-30"
                              />
                            </td>
                          ))}
                        </tr>
                        {module.submenus.length > 0 && localModule.enabled && (
                          module.submenus.map(sub => (
                            <tr key={sub.id} className="bg-slate-50/30 border-l-4 border-l-primary-custom/20">
                              <td className="px-12 py-2.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={localModule.submenus[sub.id]}
                                    onChange={() => handleToggleSubmenu(module.id, sub.id)}
                                    className="h-3 w-3 rounded border-slate-300 text-primary-custom focus:ring-primary-custom"
                                  />
                                  <span className="text-[11px] font-semibold text-slate-500 italic">{sub.name}</span>
                                </div>
                              </td>
                              <td colSpan={6} className="px-3 py-2.5"></td>
                            </tr>
                          ))
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* New Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary-custom p-4 flex items-center justify-between text-white">
              <h3 className="font-black text-sm uppercase tracking-wider">Create New System Role</h3>
              <button onClick={() => setShowRoleModal(false)} className="hover:bg-white/20 rounded-full p-1"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Role Name</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Finance Officer"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary-custom"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                <textarea
                  rows={3}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Describe the purpose of this role..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary-custom"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3">
                <Info className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                  New roles are created with <strong>zero permissions</strong> by default. You will need to configure their access matrix manually after creation.
                </p>
              </div>
              <div className="pt-4 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 py-2 text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 text-xs font-black text-white bg-primary-custom hover:bg-blue-900 rounded-xl shadow-md shadow-blue-900/20 transition-all"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
