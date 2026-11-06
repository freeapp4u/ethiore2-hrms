import React, { useState } from "react";
import { Department, Employee, User } from "../types";
import { Plus, Search, Landmark, Edit, Trash2, X, Save, AlertTriangle } from "lucide-react";

interface DepartmentsProps {
  departments: Department[];
  employees: Employee[];
  currentUser: User | null;
  onAddDepartment: (dept: Department) => boolean;
  onUpdateDepartment: (dept: Department) => void;
  onDeleteDepartment: (id: string) => boolean;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function Departments({
  departments,
  employees,
  currentUser,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onLogAction
}: DepartmentsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Dialogs
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Form Fields
  const [deptId, setDeptId] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [description, setDescription] = useState("");
  const [deptStatus, setDeptStatus] = useState<"Active" | "Inactive">("Active");
  const [headEmployeeId, setHeadEmployeeId] = useState("");
  const [parentDepartmentId, setParentDepartmentId] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setDeptId("");
    setDeptName("");
    setDeptCode("");
    setDescription("");
    setDeptStatus("Active");
    setHeadEmployeeId("");
    setParentDepartmentId("");
    setFormError("");
    setFormSuccess("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const handleOpenEdit = (d: Department) => {
    setSelectedDept(d);
    setDeptId(d.id);
    setDeptName(d.name);
    setDeptCode(d.code);
    setDescription(d.description);
    setDeptStatus(d.status);
    setHeadEmployeeId(d.headEmployeeId || "");
    setParentDepartmentId(d.parentDepartmentId || "");
    setFormError("");
    setFormSuccess("");
    setEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!deptName.trim() || !deptCode.trim()) {
      setFormError("Department Name and Code are required.");
      return;
    }

    // Uniqueness validation
    const nameExists = departments.some(d => d.name.toLowerCase() === deptName.trim().toLowerCase());
    const codeExists = departments.some(d => d.code.toLowerCase() === deptCode.trim().toLowerCase());

    if (nameExists) {
      setFormError(`Department Name '${deptName}' is already taken.`);
      return;
    }
    if (codeExists) {
      setFormError(`Department Code '${deptCode}' is already taken.`);
      return;
    }

    const uniqueId = deptCode.trim().toUpperCase();

    const newDept: Department = {
      id: uniqueId,
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase(),
      description: description.trim(),
      status: deptStatus,
      headEmployeeId: headEmployeeId || undefined,
      parentDepartmentId: parentDepartmentId || undefined,
      createdDate: new Date().toISOString().replace("T", " ").substring(0, 19),
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const ok = onAddDepartment(newDept);
    if (ok) {
      setFormSuccess("Department created successfully!");
      onLogAction(
        "Departments",
        "Department Created",
        newDept.code,
        `Created department: ${newDept.name} (${newDept.code})`
      );
      setTimeout(() => {
        setAddModalOpen(false);
        resetForm();
      }, 1000);
    } else {
      setFormError("Failed to persist department.");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!deptName.trim() || !deptCode.trim()) {
      setFormError("Department Name and Code are required.");
      return;
    }

    if (!selectedDept) return;

    // Safeguard: Check if trying to deactivate a department with active assigned employees
    if (deptStatus === "Inactive") {
      const assignedActiveEmps = employees.filter(emp => emp.departmentId === selectedDept.id && emp.status === "Active").length;
      if (assignedActiveEmps > 0) {
        setFormError(`Cannot set Department to Inactive: There are ${assignedActiveEmps} active employees assigned. Reassign employees before deactivating.`);
        return;
      }
    }

    // Check uniqueness excluding self
    const nameExists = departments.some(
      d => d.id !== selectedDept.id && d.name.toLowerCase() === deptName.trim().toLowerCase()
    );
    const codeExists = departments.some(
      d => d.id !== selectedDept.id && d.code.toLowerCase() === deptCode.trim().toLowerCase()
    );

    if (nameExists) {
      setFormError(`Department Name '${deptName}' is already taken.`);
      return;
    }
    if (codeExists) {
      setFormError(`Department Code '${deptCode}' is already taken.`);
      return;
    }

    const updatedDept: Department = {
      ...selectedDept,
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase(),
      description: description.trim(),
      status: deptStatus,
      headEmployeeId: headEmployeeId || undefined,
      parentDepartmentId: parentDepartmentId || undefined,
      updatedDate: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    onUpdateDepartment(updatedDept);
    setFormSuccess("Department updated successfully!");
    onLogAction(
      "Departments",
      "Department Updated",
      updatedDept.code,
      `Updated department options for ${updatedDept.name}`
    );
    setTimeout(() => {
      setEditModalOpen(false);
    }, 1000);
  };

  const handleDelete = (dept: Department) => {
    // Integrity Safeguard: verify if employees are assigned
    const assignedCount = employees.filter(emp => emp.departmentId === dept.id).length;
    
    if (assignedCount > 0) {
      alert(
        `CRITICAL SAFEGUARD: Cannot delete/remove Department '${dept.name}'.\n` +
        `There are currently ${assignedCount} employee folders assigned to this department.\n` +
        `Please reassign them to another department first.`
      );
      return;
    }

    const confirmCheck = window.confirm(`Are you absolutely sure you want to permanently delete '${dept.name}'? This action cannot be undone.`);
    if (confirmCheck) {
      const ok = onDeleteDepartment(dept.id);
      if (ok) {
        onLogAction(
          "Departments",
          "Department Deleted",
          dept.code,
          `Permanently deleted department: ${dept.name}`
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Department Management</h2>
          <p className="text-xs text-slate-500 mt-1">Configure physical &amp; operational organizational units.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          id="btn-add-department-trigger"
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white border rounded-lg p-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Department Name or Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs ring-primary-custom"
          />
        </div>
      </div>

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border text-slate-400 text-xs font-semibold">
            No departments found. Create one above.
          </div>
        ) : (
          filteredDepts.map(dept => {
            const assignedCount = employees.filter(emp => emp.departmentId === dept.id).length;
            return (
              <div key={dept.id} className="bg-white border rounded-lg p-5 flex flex-col justify-between shadow-2xs hover:border-slate-300 transition-all">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="inline-block text-[10px] font-bold bg-primary-custom text-white px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      {dept.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      dept.status === "Active" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {dept.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-800 mt-2 text-sm md:text-base leading-tight truncate">{dept.name}</h3>
                  
                  {/* Department Head & Parent Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
                    {dept.headEmployeeId && (() => {
                      const headEmp = employees.find(e => e.employeeId === dept.headEmployeeId);
                      return (
                        <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1" title="Department Head">
                          <span>Head:</span>
                          <span className="font-bold">{headEmp ? headEmp.fullName : dept.headEmployeeId}</span>
                        </span>
                      );
                    })()}
                    {dept.parentDepartmentId && (() => {
                      const parentDept = departments.find(d => d.id === dept.parentDepartmentId);
                      return (
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1" title="Parent Department">
                          <span>Parent:</span>
                          <span className="font-bold">{parentDept ? parentDept.name : dept.parentDepartmentId}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 min-h-[2.2rem] font-medium leading-relaxed">
                    {dept.description || "No description provided."}
                  </p>
                </div>

                <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Enrolled Personnel</span>
                    <span className="font-extrabold text-slate-800 text-sm">{assignedCount} employees</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit details"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD DEPARTMENT MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Register Organizational Unit</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  {formSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Department Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Human Resource &amp; Admin"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. HRAD"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Initial Status</label>
                  <select
                    value={deptStatus}
                    onChange={(e) => setDeptStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department Head (Master)</label>
                  <select
                    value={headEmployeeId}
                    onChange={(e) => setHeadEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                  >
                    <option value="">-- No Head Assigned --</option>
                    {employees.filter(e => e.status === "Active").map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Parent Department</label>
                  <select
                    value={parentDepartmentId}
                    onChange={(e) => setParentDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                  >
                    <option value="">-- Top Level (Root) --</option>
                    {departments.filter(d => d.status === "Active").map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe operational responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Modify Department: {selectedDept?.code}</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                  {formSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Department Name *</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department Code *</label>
                  <input
                    type="text"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold ring-primary-custom uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={deptStatus}
                    onChange={(e) => setDeptStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Department Head (Master)</label>
                  <select
                    value={headEmployeeId}
                    onChange={(e) => setHeadEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                  >
                    <option value="">-- No Head Assigned --</option>
                    {employees.filter(e => e.status === "Active").map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Parent Department</label>
                  <select
                    value={parentDepartmentId}
                    onChange={(e) => setParentDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                  >
                    <option value="">-- Top Level (Root) --</option>
                    {departments.filter(d => d.status === "Active" && d.id !== selectedDept?.id).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
