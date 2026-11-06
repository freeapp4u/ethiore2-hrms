import React, { useState } from "react";
import { User, UserRole } from "../types";
import { Bell, HelpCircle, LogOut, User as UserIcon, Lock, Menu, X, Check, Save, ShieldCheck } from "lucide-react";

interface HeaderProps {
  currentUser: User | null;
  companyName: string;
  logoUrl: string;
  onLogout: () => void;
  onOpenHelp: () => void;
  onToggleSidebar: () => void;
  onUpdateOwnProfile: (fullName: string, email: string) => boolean;
  onUpdateOwnPassword: (oldPass: string, newPass: string) => boolean;
}

export default function Header({
  currentUser,
  companyName,
  logoUrl,
  onLogout,
  onOpenHelp,
  onToggleSidebar,
  onUpdateOwnProfile,
  onUpdateOwnPassword
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);

  // Form states
  const [profileName, setProfileName] = useState(currentUser?.fullName || "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifMessage, setNotifMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const mockNotifications = [
    { id: 1, text: "Welcome back! Keep Ethio-Re safe.", time: "Just now" },
    { id: 2, text: "September Public Holidays synchronized.", time: "1 day ago" },
    { id: 3, text: "System Audit Logs automatically backed up.", time: "2 days ago" }
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifMessage(null);
    if (!profileName.trim() || !profileEmail.trim()) {
      setNotifMessage({ type: "error", text: "Full Name and Email are required." });
      return;
    }
    const ok = onUpdateOwnProfile(profileName.trim(), profileEmail.trim());
    if (ok) {
      setNotifMessage({ type: "success", text: "Profile details updated successfully." });
      setTimeout(() => setEditProfileModal(false), 1200);
    } else {
      setNotifMessage({ type: "error", text: "Email already exists or is invalid." });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifMessage(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setNotifMessage({ type: "error", text: "All fields are required." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotifMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 5) {
      setNotifMessage({ type: "error", text: "New password must be at least 5 characters long." });
      return;
    }
    const ok = onUpdateOwnPassword(oldPassword, newPassword);
    if (ok) {
      setNotifMessage({ type: "success", text: "Password changed successfully." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setChangePasswordModal(false), 1200);
    } else {
      setNotifMessage({ type: "error", text: "Incorrect current password." });
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left section: mobile button + company info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-hidden"
          id="btn-toggle-sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary-custom flex items-center justify-center text-white font-black text-xs border border-accent-custom shadow-xs">
              ER
            </div>
          )}
          <span className="font-bold text-slate-800 text-sm md:text-base tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-xl">
            {companyName}
          </span>
        </div>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all relative"
            id="btn-notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">Notifications</span>
                <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">New</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors">
                    <p className="text-xs text-slate-700 leading-tight">{n.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Center Shortcut */}
        <button
          onClick={onOpenHelp}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all flex items-center justify-center gap-1.5"
          id="btn-header-help"
          title="Open Help Guides"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="hidden md:inline text-xs font-semibold text-slate-600">Help</span>
        </button>

        {/* Read-Only Auditor Badge */}
        {currentUser?.role === "Auditor" && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-full text-xs font-bold shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <span>Read-Only Auditor Mode</span>
          </div>
        )}

        {/* User Account Controls */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-slate-100 transition-all border border-slate-200"
              id="btn-user-profile-menu"
            >
              <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                {currentUser.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">{currentUser.fullName}</p>
                <p className="text-[10px] text-slate-500 font-medium">{currentUser.role}</p>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Logged in as</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-primary-custom text-white px-2 py-0.5 rounded-full mt-1.5">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setProfileName(currentUser.fullName);
                    setProfileEmail(currentUser.email);
                    setEditProfileModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  Manage Profile
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setChangePasswordModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Lock className="h-4 w-4 text-slate-400" />
                  Change Password
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">Manage Profile Details</h3>
              <button onClick={() => setEditProfileModal(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              {notifMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  notifMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}>
                  {notifMessage.text}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setEditProfileModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-custom hover:opacity-90 rounded-lg flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-primary-custom text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">Change Security Password</h3>
              <button onClick={() => setChangePasswordModal(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {notifMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  notifMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}>
                  {notifMessage.text}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs ring-primary-custom"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setChangePasswordModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-custom hover:opacity-90 rounded-lg flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
