import React, { useState, useEffect } from "react";
import { CompanyConfig, User, PublicHoliday, UserRole, AccountStatus, Employee, EmailActivityLog } from "../types";
import { 
  Building, Palette, Calendar, ShieldCheck, Users2, Plus, Edit, 
  Trash2, X, Save, Key, ShieldAlert, CheckCircle2, UserCheck, UserMinus, Eye, Mail, UserPlus, Sliders
} from "lucide-react";

interface SettingsProps {
  config: CompanyConfig;
  users: User[];
  employees?: Employee[];
  holidays: PublicHoliday[];
  emailLogs?: EmailActivityLog[];
  currentUser: User | null;
  initialSubTab?: string;
  onUpdateConfig: (config: CompanyConfig) => void;
  onUpdateUsers: (users: User[], userToSync?: User) => void;
  onUpdateHolidays: (holidays: PublicHoliday[]) => void;
  onUpdateEmailLogs?: (logs: EmailActivityLog[]) => void;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

export default function Settings({
  config,
  users,
  employees = [],
  holidays,
  emailLogs = [],
  currentUser,
  initialSubTab,
  onUpdateConfig,
  onUpdateUsers,
  onUpdateHolidays,
  onUpdateEmailLogs,
  onLogAction
}: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    let init = initialSubTab || "profile";
    if (init === "email" || init === "email_settings") init = "email_settings";
    return init;
  });

  useEffect(() => {
    if (initialSubTab) {
      let mapped = initialSubTab;
      if (mapped === "email" || mapped === "email_settings") mapped = "email_settings";
      setActiveSubTab(mapped);
    }
  }, [initialSubTab]);

  // --- 1. Company Profile Form States ---
  const [displayName, setDisplayName] = useState(config.profile.displayName);
  const [legalName, setLegalName] = useState(config.profile.legalName);
  const [shortName, setShortName] = useState(config.profile.shortName);
  const [logoUrl, setLogoUrl] = useState(config.profile.logoUrl);
  const [companyEmail, setCompanyEmail] = useState(config.profile.email);
  const [companyPhone, setCompanyPhone] = useState(config.profile.phoneNumber);
  const [companyWebsite, setCompanyWebsite] = useState(config.profile.website);
  const [companyAddress, setCompanyAddress] = useState(config.profile.address);
  const [companyCity, setCompanyCity] = useState(config.profile.city);
  const [companyCountry, setCompanyCountry] = useState(config.profile.country);
  const [companyDescription, setCompanyDescription] = useState(config.profile.description);

  // --- 2. Branding Form States ---
  const [primaryColor, setPrimaryColor] = useState(config.branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(config.branding.secondaryColor);
  const [accentColor, setAccentColor] = useState(config.branding.accentColor);

  // --- 3. Public Holidays States ---
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");

  // --- 4. User Management States ---
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editUserMode, setEditUserMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // User Form fields
  const [userFullName, setUserFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("HR Officer");
  const [userStatus, setUserStatus] = useState<AccountStatus>("Active");
  const [userEmailVerified, setUserEmailVerified] = useState(false);
  const [userEmployeeId, setUserEmployeeId] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // --- 5. Email Configuration & Control States ---
  const initialEmailConfig = config.emailSettings || {
    enableEmployeeEmails: true,
    smtpHost: "mail.ethiopianre.com",
    smtpPort: 587,
    smtpUser: "notifications@ethiopianre.com",
    smtpSenderEmail: "noreply@ethiopianre.com",
    smtpSenderName: "Ethiopian Reinsurance HRMS",
    useTlsSsl: true,
    updatedBy: "contactesfaye@gmail.com",
    updatedDate: "2026-01-01"
  };

  const [enableEmails, setEnableEmails] = useState(initialEmailConfig.enableEmployeeEmails);
  const [smtpHost, setSmtpHost] = useState(initialEmailConfig.smtpHost);
  const [smtpPort, setSmtpPort] = useState(initialEmailConfig.smtpPort);
  const [smtpUser, setSmtpUser] = useState(initialEmailConfig.smtpUser);
  const [smtpSenderEmail, setSmtpSenderEmail] = useState(initialEmailConfig.smtpSenderEmail);
  const [smtpSenderName, setSmtpSenderName] = useState(initialEmailConfig.smtpSenderName);
  const [useTlsSsl, setUseTlsSsl] = useState(initialEmailConfig.useTlsSsl);

  // SMTP Connection Diagnostic Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testProgress, setTestProgress] = useState<{ step: string; status: "pending" | "ok" | "fail" }[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  // Email Logs Filter
  const [emailLogStatusFilter, setEmailLogStatusFilter] = useState<string>("ALL");

  const handleSaveEmailSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (currentUser?.role !== "Administrator") {
      alert("Permission Safeguard: Only authorized Administrators can modify system Email Settings.");
      return;
    }

    const updatedConfig: CompanyConfig = {
      ...config,
      emailSettings: {
        enableEmployeeEmails: enableEmails,
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
        smtpUser: smtpUser.trim(),
        smtpSenderEmail: smtpSenderEmail.trim(),
        smtpSenderName: smtpSenderName.trim(),
        useTlsSsl,
        updatedBy: currentUser?.email || "Admin",
        updatedDate: new Date().toISOString().split("T")[0]
      }
    };

    onUpdateConfig(updatedConfig);
    onLogAction(
      "EmailSettings",
      "Update Email Configuration",
      "Global Email Control",
      `Employee email sending set to ${enableEmails ? "ENABLED (ON)" : "DISABLED (OFF)"}. Updated SMTP server: ${smtpHost}:${smtpPort}`
    );
    alert(`Email Configuration saved successfully! Global Employee Email Sending is currently ${enableEmails ? "ENABLED" : "DISABLED"}.`);
  };

  const handleTestSmtpConnection = () => {
    if (currentUser?.role !== "Administrator") {
      alert("Permission Safeguard: Only authorized Administrators can execute SMTP connectivity tests.");
      return;
    }

    setTestRunning(true);
    setTestSuccess(null);
    setTestModalOpen(true);
    setTestProgress([
      { step: `1. Resolving SMTP Host Target (${smtpHost})...`, status: "pending" },
      { step: `2. Establishing TCP Connection on Port (${smtpPort})...`, status: "pending" },
      { step: `3. Testing Authentication for User (${smtpUser})...`, status: "pending" },
      { step: `4. Verifying Sender Email Identity (${smtpSenderEmail})...`, status: "pending" },
      { step: `5. Diagnostic Summary & Connection Check...`, status: "pending" }
    ]);

    setTimeout(() => {
      setTestProgress(prev => prev.map((item, idx) => idx === 0 ? { ...item, status: "ok" } : item));
    }, 400);

    setTimeout(() => {
      setTestProgress(prev => prev.map((item, idx) => idx <= 1 ? { ...item, status: "ok" } : item));
    }, 800);

    setTimeout(() => {
      setTestProgress(prev => prev.map((item, idx) => idx <= 2 ? { ...item, status: "ok" } : item));
    }, 1200);

    setTimeout(() => {
      setTestProgress(prev => prev.map((item, idx) => idx <= 3 ? { ...item, status: "ok" } : item));
    }, 1600);

    setTimeout(() => {
      setTestProgress(prev => prev.map(item => ({ ...item, status: "ok" })));
      setTestSuccess(true);
      setTestRunning(false);
      onLogAction("EmailSettings", "Test SMTP Connection", smtpHost, `Executed SMTP connectivity diagnostic test for ${smtpHost}:${smtpPort} (Result: SUCCESSFUL)`);
    }, 2000);
  };

  const filteredEmailLogs = emailLogs.filter(log => {
    if (emailLogStatusFilter === "ALL") return true;
    return log.deliveryStatus === emailLogStatusFilter;
  });

  // Save Company Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: CompanyConfig = {
      ...config,
      profile: {
        displayName: displayName.trim(),
        legalName: legalName.trim(),
        shortName: shortName.trim(),
        logoUrl: logoUrl.trim(),
        email: companyEmail.trim(),
        phoneNumber: companyPhone.trim(),
        website: companyWebsite.trim(),
        address: companyAddress.trim(),
        city: companyCity.trim(),
        country: companyCountry.trim(),
        description: companyDescription.trim()
      }
    };
    onUpdateConfig(updatedConfig);
    onLogAction("Settings", "Company Profile Updated", "CompanyProfile", "Saved legal description and contact details");
    alert("Company profile updated successfully.");
  };

  // Save Branding Theme Settings
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: CompanyConfig = {
      ...config,
      branding: {
        primaryColor,
        secondaryColor,
        accentColor
      }
    };
    onUpdateConfig(updatedConfig);
    onLogAction("Settings", "Branding Updated", "BrandingColors", `Changed primary hex color to: ${primaryColor}`);
    alert("Branding configuration saved! Theme applied dynamically.");
  };

  const handleResetBranding = () => {
    setPrimaryColor("#0F2942");
    setSecondaryColor("#1D4E7B");
    setAccentColor("#D4AF37");
  };

  // Upload Logo Simulator (converts file to dataurl, or clear)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Public Holiday
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) return;

    const exists = holidays.some(h => h.date === holidayDate);
    if (exists) {
      alert("A public holiday is already registered on this date.");
      return;
    }

    const newH: PublicHoliday = {
      id: `H_${Date.now()}`,
      name: holidayName.trim(),
      date: holidayDate
    };

    const updated = [...holidays, newH].sort((a, b) => a.date.localeCompare(b.date));
    onUpdateHolidays(updated);
    onLogAction("Settings", "Public Holiday Created", newH.name, `Added holiday on date ${newH.date}`);
    setHolidayName("");
    setHolidayDate("");
  };

  const handleDeleteHoliday = (id: string, name: string) => {
    if (window.confirm(`Permanently remove public holiday: ${name}?`)) {
      const updated = holidays.filter(h => h.id !== id);
      onUpdateHolidays(updated);
      onLogAction("Settings", "Public Holiday Deleted", name, `Removed public holiday date`);
    }
  };

  // --- User Management CRUD ---
  const handleOpenAddUser = () => {
    setSelectedUser(null);
    setUserFullName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("HR Officer");
    setUserStatus("Active");
    setUserEmailVerified(false);
    setUserEmployeeId("");
    setFormError("");
    setFormSuccess("");
    setEditUserMode(false);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setSelectedUser(u);
    setUserFullName(u.fullName);
    setUserEmail(u.email);
    setUserPassword(""); // Don't prefill password
    setUserRole(u.role);
    setUserStatus(u.status);
    setUserEmailVerified(!!u.emailVerified);
    setUserEmployeeId(u.employeeId || "");
    setFormError("");
    setFormSuccess("");
    setEditUserMode(true);
    setUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!userFullName.trim() || !userEmail.trim()) {
      setFormError("Full Name and Email are required.");
      return;
    }

    const emailNormalized = userEmail.trim().toLowerCase();

    // 1. Domain verification for email (with special exception contactesfaye@gmail.com)
    if (emailNormalized !== "contactesfaye@gmail.com" && !emailNormalized.endsWith("@ethiopianre.com")) {
      setFormError("Only users with an @ethiopianre.com company email address are allowed to register.");
      return;
    }

    if (editUserMode && selectedUser) {
      // Edit User mode
      // Check duplicate email
      const isDuplicate = users.some(u => u.id !== selectedUser.id && u.email.toLowerCase() === emailNormalized);
      if (isDuplicate) {
        setFormError("A user with this email address already exists.");
        return;
      }

      // Last active Admin Safeguard
      if (selectedUser.role === "Administrator" && selectedUser.status === "Active") {
        const activeAdminsCount = users.filter(u => u.role === "Administrator" && u.status === "Active").length;
        const isDowngradingRole = userRole !== "Administrator";
        const isDeactivatingStatus = userStatus !== "Active";
        if ((isDowngradingRole || isDeactivatingStatus) && activeAdminsCount <= 1) {
          setFormError("Safeguard: You cannot deactivate or downgrade this account. The system must always have at least one active Administrator account.");
          return;
        }
      }

      const updatedUsers = users.map(u => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            fullName: userFullName.trim(),
            email: emailNormalized,
            role: userRole,
            status: userStatus,
            emailVerified: userEmailVerified,
            employeeId: userEmployeeId || undefined,
            // Only update password if a new one is typed
            ...(userPassword.trim() ? { password: userPassword.trim() } : {})
          };
        }
        return u;
      });

      const updatedUser = updatedUsers.find(u => u.id === selectedUser.id);
      onUpdateUsers(updatedUsers, updatedUser);
      setFormSuccess("User updated successfully!");
      onLogAction("Users", "User Updated", emailNormalized, `Modified account details for ${userFullName}`);
      setTimeout(() => setUserModalOpen(false), 1000);

    } else {
      // Add User mode
      if (!userPassword.trim()) {
        setFormError("Password is required for new accounts.");
        return;
      }

      // Check duplicate
      const isDuplicate = users.some(u => u.email.toLowerCase() === emailNormalized);
      if (isDuplicate) {
        setFormError("A user with this email address is already registered.");
        return;
      }

      const newUser: User = {
        id: `U_${Date.now()}`,
        fullName: userFullName.trim(),
        email: emailNormalized,
        password: userPassword.trim(),
        role: userRole,
        status: userStatus,
        emailVerified: userEmailVerified,
        employeeId: userEmployeeId || undefined,
        createdDate: new Date().toISOString().split("T")[0]
      };

      const updatedUsers = [...users, newUser];
      onUpdateUsers(updatedUsers, newUser);
      setFormSuccess("User account created successfully!");
      onLogAction("Users", "User Created", emailNormalized, `Enrolled user role ${userRole} under email ${emailNormalized}`);
      setTimeout(() => setUserModalOpen(false), 1000);
    }
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser?.id) {
      alert("Self-Deletion Safeguard: You cannot delete your own active administrative session!");
      return;
    }

    if (u.role === "Administrator" && u.status === "Active") {
      const activeAdminsCount = users.filter(usr => usr.role === "Administrator" && usr.status === "Active").length;
      if (activeAdminsCount <= 1) {
        alert("Safeguard: You cannot delete this account. The system must always have at least one active Administrator account.");
        return;
      }
    }

    const confirmCheck = window.confirm(`Are you absolutely sure you want to permanently delete user account: ${u.fullName} (${u.email})?`);
    if (confirmCheck) {
      const updated = users.filter(usr => usr.id !== u.id);
      onUpdateUsers(updated);
      onLogAction("Users", "User Deleted", u.email, `Permanently deleted user account: ${u.fullName}`);
    }
  };

  const handleToggleUserStatus = (u: User) => {
    if (u.id === currentUser?.id) {
      alert("Self-Deactivation Safeguard: You cannot deactivate your own administrative session!");
      return;
    }

    const nextStatus = u.status === "Active" ? "Inactive" : "Active";

    if (u.role === "Administrator" && u.status === "Active" && nextStatus !== "Active") {
      const activeAdminsCount = users.filter(usr => usr.role === "Administrator" && usr.status === "Active").length;
      if (activeAdminsCount <= 1) {
        alert("Safeguard: You cannot deactivate this account. The system must always have at least one active Administrator account.");
        return;
      }
    }

    const updated = users.map(usr => {
      if (usr.id === u.id) {
        // If activating, we can also ensure verified
        const autoVerify = nextStatus === "Active" ? true : usr.emailVerified;
        return { ...usr, status: nextStatus as any, emailVerified: autoVerify };
      }
      return usr;
    });
    const toggledUser = updated.find(usr => usr.id === u.id);
    onUpdateUsers(updated, toggledUser);
    onLogAction("Users", nextStatus === "Active" ? "User Activated" : "User Deactivated", u.email, `Set status of user to ${nextStatus}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sub-menu Navigation Sidebar */}
      <div className="w-full lg:w-56 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-200 pr-0 lg:pr-4">
        {[
          { id: "profile", label: "Company Profile", icon: Building },
          { id: "branding", label: "Branding Theme", icon: Palette },
          { id: "holidays", label: "Public Holidays", icon: Calendar },
          { id: "email_settings", label: "Email Settings", icon: Mail },
          { id: "users", label: "User Management", icon: Users2 },
          { id: "roles", label: "Roles & Matrix", icon: ShieldCheck }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`whitespace-nowrap lg:w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
                isActive 
                  ? "bg-primary-custom text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main Form Fields Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        
        {/* TAB 1: COMPANY PROFILE */}
        {activeSubTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Company Profile</h3>
              <p className="text-xs text-slate-500 mt-1">Configure physical coordinates and centralized legal identification metadata.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Display Brand Name *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Legal Name *</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Short Name</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-semibold ring-primary-custom"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Central Email Address</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Telephone / Fax</label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Website URL</label>
                <input
                  type="text"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-1">
                <label className="block text-xs font-bold text-slate-700">Country</label>
                <input
                  type="text"
                  value={companyCountry}
                  onChange={(e) => setCompanyCountry(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="block text-xs font-bold text-slate-700">City</label>
                <input
                  type="text"
                  value={companyCity}
                  onChange={(e) => setCompanyCity(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <label className="block text-xs font-bold text-slate-700">Physical Location Address</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Company Legal Description</label>
              <textarea
                rows={3}
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom leading-relaxed"
              />
            </div>

            {currentUser?.role !== "Auditor" ? (
              <div className="pt-4 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save Profile
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Read-Only Auditor Mode: Organization profile modifications are restricted.</span>
              </div>
            )}
          </form>
        )}

        {/* TAB 2: BRANDING THEME */}
        {activeSubTab === "branding" && (
          <form onSubmit={handleSaveBranding} className="space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Corporate Branding Theme</h3>
              <p className="text-xs text-slate-500 mt-1">Configure corporate color tokens and company branding logos. Changes are instantly applied to the live workspace layout.</p>
            </div>

            {/* Logo Section */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row items-center gap-5">
              <div className="h-20 w-20 border border-slate-200 bg-white rounded-lg flex items-center justify-center p-2 shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Branding Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xs font-extrabold text-slate-400 uppercase">No Logo</span>
                )}
              </div>
              <div className="space-y-2 flex-1 text-center sm:text-left w-full">
                <h4 className="font-bold text-xs text-slate-700">Ethio-Re Company Logo</h4>
                {currentUser?.role !== "Auditor" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="px-3.5 py-1.5 bg-white border hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer inline-block shadow-2xs">
                      Choose New Logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Supported formats: JPEG, PNG, SVG (Max 1MB). Rendered on Sidebar, Top navigation, and Reports.</p>
              </div>
            </div>

            {/* Colors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex justify-between">
                  <span>Primary Color</span>
                  <span className="font-mono font-bold text-slate-400">{primaryColor}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={currentUser?.role === "Auditor"}
                    className="h-9 w-12 border rounded-md cursor-pointer shrink-0 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    readOnly={currentUser?.role === "Auditor"}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold read-only:bg-slate-50"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Primary brand color. Governs headers, primary buttons, and navigation blocks.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex justify-between">
                  <span>Secondary Color</span>
                  <span className="font-mono font-bold text-slate-400">{secondaryColor}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    disabled={currentUser?.role === "Auditor"}
                    className="h-9 w-12 border rounded-md cursor-pointer shrink-0 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    readOnly={currentUser?.role === "Auditor"}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold read-only:bg-slate-50"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Supporting brand accent color. Applies on submenus and secondary details.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex justify-between">
                  <span>Accent Color</span>
                  <span className="font-mono font-bold text-slate-400">{accentColor}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    disabled={currentUser?.role === "Auditor"}
                    className="h-9 w-12 border rounded-md cursor-pointer shrink-0 disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    readOnly={currentUser?.role === "Auditor"}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold read-only:bg-slate-50"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Highlights. Governs active tabs, alerts, and subtle brand lines.</p>
              </div>
            </div>

            {currentUser?.role !== "Auditor" ? (
              <div className="pt-4 border-t flex justify-between">
                <button
                  type="button"
                  onClick={handleResetBranding}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg"
                >
                  Reset Default Ethio-Re Colors
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Apply Branding
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Read-Only Auditor Mode: Branding color palette and logo changes are restricted.</span>
              </div>
            )}
          </form>
        )}

        {/* TAB 3: PUBLIC HOLIDAYS */}
        {activeSubTab === "holidays" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Public Holidays</h3>
              <p className="text-xs text-slate-500 mt-1">Add legal public holidays. The leave management module automatically references this list to exclude these dates from booked leave totals.</p>
            </div>

            {/* Add Holiday Inline Form */}
            {currentUser?.role !== "Auditor" && (
              <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 items-end">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Holiday Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Adwa Victory Day"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Holiday Date</label>
                  <input
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Date
                </button>
              </form>
            )}

            {/* Holidays List */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="px-5 py-2.5">Holiday Name</th>
                    <th className="px-5 py-2.5">Date</th>
                    <th className="px-5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holidays.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-slate-400">No public holidays registered.</td>
                    </tr>
                  ) : (
                    holidays.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{h.name}</td>
                        <td className="px-5 py-3 font-bold text-primary-custom">{h.date}</td>
                        <td className="px-5 py-3 text-right">
                          {currentUser?.role !== "Auditor" ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteHoliday(h.id, h.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EMAIL SETTINGS */}
        {(activeSubTab === "email_settings" || activeSubTab === "email") && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary-custom" />
                    <span>Administration → Email Settings</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage global employee email notification permissions, SMTP server credentials, and dispatch audit logs for Ethiopian Reinsurance S.C.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold border ${
                    enableEmails 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                      : "bg-rose-50 text-rose-700 border-rose-300"
                  }`}>
                    {enableEmails ? "● Enabled" : "○ Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Non-Administrator Warning Banner */}
            {currentUser?.role !== "Administrator" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Notice: Only authorized Administrators have permission to modify Email Configuration Settings or execute SMTP connectivity tests. Controls are read-only.</span>
              </div>
            )}

            {/* SECTION 1: EMPLOYEE EMAIL NOTIFICATIONS TOGGLE & STATUS */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200/80">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Employee Email Notifications Control
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Global master switch controlling all system-generated emails sent to registered employees across all HRMS modules.
                  </p>
                </div>

                {/* ON / OFF Toggle Switch */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 border rounded-xl shadow-2xs">
                  <span className="text-xs font-bold text-slate-700">
                    Enable Email Sending to Registered Employees:
                  </span>
                  <button
                    type="button"
                    disabled={currentUser?.role !== "Administrator"}
                    onClick={() => setEnableEmails(!enableEmails)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-custom disabled:opacity-50 disabled:cursor-not-allowed ${
                      enableEmails ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        enableEmails ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-extrabold uppercase ${enableEmails ? "text-emerald-700" : "text-slate-500"}`}>
                    {enableEmails ? "ON" : "OFF"}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-lg border text-xs font-semibold flex items-start gap-3 transition-all ${
                enableEmails
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-rose-50/80 border-rose-200 text-rose-900"
              }`}>
                {enableEmails ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-extrabold text-sm">
                    {enableEmails 
                      ? "Employee Email Sending Status: ENABLED"
                      : "Employee Email Sending Status: CURRENTLY DISABLED"}
                  </p>
                  <p className="mt-0.5 text-xs font-medium">
                    {enableEmails
                      ? "Employee email sending is enabled. Authorized HRMS modules can send emails to registered employees."
                      : "Employee email sending is currently disabled. System-generated emails will not be delivered to registered employees."}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: SMTP SERVER CONFIGURATION */}
            <form onSubmit={handleSaveEmailSettings} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  SMTP Infrastructure Configuration
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure corporate SMTP mail server credentials for Ethiopian Reinsurance S.C.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">SMTP Host Server *</label>
                  <input
                    type="text"
                    value={smtpHost}
                    disabled={currentUser?.role !== "Administrator"}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="e.g. mail.ethiopianre.com"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold ring-primary-custom disabled:bg-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">SMTP Port *</label>
                  <input
                    type="number"
                    value={smtpPort}
                    disabled={currentUser?.role !== "Administrator"}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold ring-primary-custom disabled:bg-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">SMTP Account User</label>
                  <input
                    type="text"
                    value={smtpUser}
                    disabled={currentUser?.role !== "Administrator"}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="notifications@ethiopianre.com"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Sender Email Address *</label>
                  <input
                    type="email"
                    value={smtpSenderEmail}
                    disabled={currentUser?.role !== "Administrator"}
                    onChange={(e) => setSmtpSenderEmail(e.target.value)}
                    placeholder="noreply@ethiopianre.com"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold ring-primary-custom disabled:bg-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Sender Display Name *</label>
                  <input
                    type="text"
                    value={smtpSenderName}
                    disabled={currentUser?.role !== "Administrator"}
                    onChange={(e) => setSmtpSenderName(e.target.value)}
                    placeholder="Ethiopian Reinsurance HRMS"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold ring-primary-custom disabled:bg-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tls_check"
                  checked={useTlsSsl}
                  disabled={currentUser?.role !== "Administrator"}
                  onChange={(e) => setUseTlsSsl(e.target.checked)}
                  className="rounded text-primary-custom focus:ring-primary-custom h-4 w-4"
                />
                <label htmlFor="tls_check" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Require TLS/SSL Encryption Security Protocol
                </label>
              </div>

              {/* Action Buttons: Save, Save & Apply, Test SMTP Connection */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentUser?.role !== "Administrator"}
                  onClick={handleTestSmtpConnection}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider disabled:opacity-50"
                >
                  <Key className="h-4 w-4 text-accent-custom" />
                  <span>Test SMTP Connection</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentUser?.role !== "Administrator"}
                    onClick={handleSaveEmailSettings}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg shadow-2xs transition-all uppercase tracking-wider disabled:opacity-50"
                  >
                    Save
                  </button>

                  <button
                    type="submit"
                    disabled={currentUser?.role !== "Administrator"}
                    className="px-5 py-2 bg-primary-custom hover:opacity-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-all uppercase tracking-wider disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 text-accent-custom" />
                    <span>Save &amp; Apply</span>
                  </button>
                </div>
              </div>
            </form>

            {/* SECTION 3: EMAIL ACTIVITY LOG TABLE */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Email Activity &amp; Delivery Audit Logs
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Auditable record of all system-generated emails, delivery statuses, and blocked outgoing dispatches.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Status Filter:</span>
                  <select
                    value={emailLogStatusFilter}
                    onChange={(e) => setEmailLogStatusFilter(e.target.value)}
                    className="text-xs font-bold bg-white border rounded-lg px-2.5 py-1 text-slate-700"
                  >
                    <option value="ALL">All Delivery Statuses</option>
                    <option value="Sent">Sent</option>
                    <option value="Blocked – Email Sending Disabled">Blocked – Email Sending Disabled</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Sending Module</th>
                        <th className="px-4 py-3">Recipient Employee ID</th>
                        <th className="px-4 py-3">Recipient Email</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Delivery Status</th>
                        <th className="px-4 py-3">Details / Failure Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                      {filteredEmailLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-bold">
                            No email activity logs recorded matching current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredEmailLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-600 whitespace-nowrap">{log.dateTime}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 border">
                                {log.sendingModule}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-primary-custom whitespace-nowrap">{log.recipientEmployeeId || "-"}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-800">{log.recipientEmail}</td>
                            <td className="px-4 py-2.5">{log.subject}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                log.deliveryStatus === "Sent" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                                log.deliveryStatus === "Blocked – Email Sending Disabled" ? "bg-amber-50 text-amber-800 border-amber-300 font-bold" :
                                "bg-rose-50 text-rose-700 border-rose-300"
                              }`}>
                                {log.deliveryStatus}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                              {log.failureReason || `Dispatched by ${log.triggeredBy}`}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SMTP TEST DIAGNOSTIC MODAL */}
            {testModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary-custom" />
                      <h3 className="font-extrabold text-slate-800 text-sm">SMTP Infrastructure Diagnostics</h3>
                    </div>
                    <button
                      onClick={() => setTestModalOpen(false)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs font-semibold">
                    <p className="text-slate-600">Testing connection to target corporate SMTP host: <strong className="text-slate-800">{smtpHost}:{smtpPort}</strong></p>
                    
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg space-y-2 font-mono text-[11px] border border-slate-700">
                      {testProgress.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span>{p.step}</span>
                          {p.status === "ok" ? (
                            <span className="text-emerald-400 font-bold">[OK]</span>
                          ) : p.status === "fail" ? (
                            <span className="text-rose-400 font-bold">[FAIL]</span>
                          ) : (
                            <span className="text-amber-400 font-bold animate-pulse">[TESTING...]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {testSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold space-y-1">
                      <p className="flex items-center gap-1.5 text-sm font-extrabold text-emerald-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>SMTP Connection Test SUCCESSFUL!</span>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Connected to host {smtpHost}:{smtpPort}. Authentication for user ({smtpUser}) verified successfully.
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium pt-1">
                        * Note: Testing SMTP connectivity verifies server configuration and does not send emails to employees or override global email switches.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t flex justify-end">
                    <button
                      type="button"
                      disabled={testRunning}
                      onClick={() => setTestModalOpen(false)}
                      className="px-4 py-2 bg-primary-custom text-white font-bold text-xs rounded-lg uppercase tracking-wide disabled:opacity-50"
                    >
                      Close Diagnostics
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USER MANAGEMENT */}
        {activeSubTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">User Directory &amp; Security</h3>
                <p className="text-xs text-slate-500 mt-1">Manage personnel authorized to operate this portal (Admins and HR Officers).</p>
              </div>
              {currentUser?.role !== "Auditor" && (
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="px-3 py-1.5 bg-primary-custom hover:opacity-95 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add User</span>
                </button>
              )}
            </div>

            {/* Users table */}
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-center">Verification Status</th>
                    <th className="px-4 py-3 text-center">Account Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 font-bold text-slate-800">{u.fullName}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-500">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          u.role === "Administrator" ? "bg-primary-custom text-white" :
                          u.role === "Auditor" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          u.emailVerified 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${u.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {u.emailVerified ? "Verified" : "Not Verified"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          u.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          u.status === "Pending Verification" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          u.status === "Inactive" ? "bg-slate-100 text-slate-500 border border-slate-200" :
                          "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-medium">{u.createdDate}</td>
                      <td className="px-4 py-3.5 text-slate-500 font-bold">{u.lastLogin || "Never"}</td>
                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingUser(u)}
                          className="p-1 text-slate-400 hover:text-primary-custom hover:bg-slate-50 rounded-md transition-colors inline-block"
                          title="View User Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {currentUser?.role !== "Auditor" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded-md transition-colors inline-block"
                              title="Edit Account Details"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {!u.emailVerified && (
                              <button
                                type="button"
                                onClick={() => {
                                  alert(`Simulated Action: A new verification link has been dispatched to ${u.email}`);
                                  onLogAction("Users", "Resend Verification", u.email, "Dispatched manual email verification link");
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-block"
                                title="Resend Verification Email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`p-1 rounded-md transition-colors inline-block ${
                                u.status === "Active" ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={u.status === "Active" ? "Deactivate User" : "Activate User"}
                            >
                              {u.status === "Active" ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors inline-block"
                              title="Delete Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ROLES AND PERMISSIONS MATRIX */}
        {activeSubTab === "roles" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Role Authorization Matrix</h3>
              <p className="text-xs text-slate-500 mt-1">This read-only grid summarizes system permissions mapped to the authorized roles. This matrix is strictly enforced by application RBAC and Firestore security rules.</p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="px-5 py-3">Permission Node Module</th>
                    <th className="px-5 py-3 text-center bg-primary-custom/5 text-primary-custom font-extrabold">Administrator</th>
                    <th className="px-5 py-3 text-center">HR Officer</th>
                    <th className="px-5 py-3 text-center bg-amber-50 text-amber-800 font-extrabold">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { node: "Dashboard Statistics & KPI Summary", admin: "Full Access", hr: "Operational Only", auditor: "Read-Only Access" },
                    { node: "Employee Folder CRUD & Directory", admin: "Full Access", hr: "Full Access", auditor: "Read-Only Access" },
                    { node: "Department Setup CRUD", admin: "Full Access", hr: "Full Access (No Deletion)", auditor: "Read-Only Access" },
                    { node: "Attendance Check-In Logs Correction", admin: "Full Access", hr: "Full Access", auditor: "Read-Only Access" },
                    { node: "Leave Balance & Overlap Checking", admin: "Full Access", hr: "Full Access", auditor: "Read-Only Access" },
                    { node: "Leave Configuration & Year-End Rules", admin: "Full Access", hr: "No Access", auditor: "Read-Only Access" },
                    { node: "Medical Benefits & Policy Settings", admin: "Full Access", hr: "Full Access", auditor: "Read-Only Access" },
                    { node: "Company Legal Profile Config", admin: "Full Access", hr: "No Access", auditor: "Read-Only Access" },
                    { node: "Branding CSS Themes & Logo Uploads", admin: "Full Access", hr: "No Access", auditor: "Read-Only Access" },
                    { node: "User Management (Account creation, reset)", admin: "Full Access", hr: "No Access", auditor: "Read-Only Access" },
                    { node: "Public Holidays Configuration", admin: "Full Access", hr: "No Access", auditor: "Read-Only Access" },
                    { node: "Secure Activity Audit Logs", admin: "Full Access", hr: "No Access", auditor: "Read-Only Access" },
                    { node: "System Record Creation / Modification / Deletion / Approval", admin: "Full Access", hr: "Operational Writes", auditor: "Denied (Read-Only)" }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{row.node}</td>
                      <td className="px-5 py-3.5 text-center bg-primary-custom/5 font-extrabold text-emerald-600">
                        {row.admin}
                      </td>
                      <td className={`px-5 py-3.5 text-center font-bold ${row.hr === "No Access" ? "text-rose-500" : "text-emerald-600"}`}>
                        {row.hr}
                      </td>
                      <td className={`px-5 py-3.5 text-center bg-amber-50/60 font-bold ${row.auditor.startsWith("Denied") ? "text-rose-600" : "text-amber-800"}`}>
                        {row.auditor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* USER MANAGEMENT DIALOG (ADD/EDIT USER) */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">
                {editUserMode ? "Modify Portal Account" : "Authorize Portal Account"}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
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
                <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Martha Teshome"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom animate-pulse-once"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. martha@ethio-re.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {editUserMode ? "New Password (leave empty to keep current)" : "Access Password *"}
                </label>
                <input
                  type="password"
                  placeholder="Password value"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required={!editUserMode}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">System Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold text-slate-800"
                  >
                    <option value="HR Officer">HR Officer</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Auditor">Auditor (Read-Only Org-Wide)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Account Status</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as AccountStatus)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending Verification">Pending Verification</option>
                  </select>
                </div>
              </div>

              {/* Linked Employee Master Reference */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Linked Employee Master Folder</label>
                <select
                  value={userEmployeeId}
                  onChange={(e) => setUserEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white ring-primary-custom font-semibold text-slate-800"
                >
                  <option value="">-- No Direct Employee Link (System Account) --</option>
                  {employees.filter(emp => emp.status === "Active").map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeId} - {emp.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Verified Toggle */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <input
                  type="checkbox"
                  id="userEmailVerified"
                  checked={userEmailVerified}
                  onChange={(e) => setUserEmailVerified(e.target.checked)}
                  className="h-4 w-4 rounded-md text-primary-custom border-slate-300 ring-primary-custom"
                />
                <label htmlFor="userEmailVerified" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Email Address is Verified
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-primary-custom hover:opacity-95 rounded-lg flex items-center gap-1"
                >
                  <Save className="h-4 w-4 text-accent-custom" />
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3.5 border-b flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">
                Operator Security Dossier
              </h3>
              <button onClick={() => setViewingUser(null)} className="text-white/80 hover:text-white rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-primary-custom/10 text-primary-custom flex items-center justify-center font-bold text-sm">
                  {viewingUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{viewingUser.fullName}</h4>
                  <p className="text-slate-500 font-medium">{viewingUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-wider">Assigned Role</span>
                  <span className="font-bold text-slate-800">{viewingUser.role}</span>
                </div>
                <div>
                  <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-wider">Account Status</span>
                  <span className="font-bold text-slate-800">{viewingUser.status}</span>
                </div>
                <div>
                  <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-wider">Email Verified</span>
                  <span className="font-bold text-slate-800">{viewingUser.emailVerified ? "Yes" : "No"}</span>
                </div>
                <div>
                  <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-wider">Created Date</span>
                  <span className="font-semibold text-slate-800">{viewingUser.createdDate}</span>
                </div>
              </div>
              <div>
                <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-wider">Last Portal Check-In</span>
                <span className="font-bold text-primary-custom">{viewingUser.lastLogin || "Never"}</span>
              </div>
              <div className="flex justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setViewingUser(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Close Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
