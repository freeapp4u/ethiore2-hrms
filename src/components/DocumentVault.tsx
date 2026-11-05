import React, { useState, useEffect } from "react";
import { 
  FolderPlus, Upload, Trash2, Search, ArrowLeft, ExternalLink, 
  FileText, Folder, Eye, CheckCircle2, RefreshCw, LogOut, Plus, Link as LinkIcon, User, Landmark, ShieldCheck, AlertCircle
} from "lucide-react";
import { GoogleAuthProvider, signInWithPopup, auth, signOut } from "../firebase";
import { Employee, Department } from "../types";

// Local storage and Firestore collection for storing document associations
export interface DriveAssociation {
  id: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink: string;
  targetType: "Employee" | "Department";
  targetId: string;
  associatedBy: string;
  associatedDate: string;
}

interface DocumentVaultProps {
  employees: Employee[];
  departments: Department[];
  currentUser: { email: string; role: string } | null;
  onLogAction: (module: string, action: string, record: string, details: string) => void;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
  thumbnailLink?: string;
}

// Memory caching of OAuth token
let cachedAccessToken: string | null = null;

export default function DocumentVault({
  employees,
  departments,
  currentUser,
  onLogAction
}: DocumentVaultProps) {
  // Authentication states
  const [accessToken, setAccessToken] = useState<string | null>(cachedAccessToken);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive Navigator States
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & User actions
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Associations States
  const [associations, setAssociations] = useState<DriveAssociation[]>([]);
  const [associatingFile, setAssociatingFile] = useState<DriveFile | null>(null);
  const [assocTargetType, setAssocTargetType] = useState<"Employee" | "Department">("Employee");
  const [assocTargetId, setAssocTargetId] = useState("");

  // Load local associations on boot
  useEffect(() => {
    const saved = localStorage.getItem("drive_associations");
    if (saved) {
      try {
        setAssociations(JSON.parse(saved));
      } catch (err) {
        console.error("Error reading drive associations", err);
      }
    }
  }, []);

  // Sync associations to LocalStorage
  const saveAssociations = (newAssocs: DriveAssociation[]) => {
    setAssociations(newAssocs);
    localStorage.setItem("drive_associations", JSON.stringify(newAssocs));
  };

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Scopes requested matching the exact parameters accepted by OAuth
      provider.addScope("https://www.googleapis.com/auth/drive");
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      provider.addScope("https://www.googleapis.com/auth/drive.metadata.readonly");

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error("No Google access token received from sign-in.");
      }

      cachedAccessToken = credential.accessToken;
      setAccessToken(cachedAccessToken);
      setGoogleUser(result.user);
      onLogAction("DocumentVault", "Google Drive Auth", result.user.email || "", "Operator successfully connected Google Drive workspace credentials");
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setAuthError(err?.message || "Failed to establish a Google Drive session.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    cachedAccessToken = null;
    setAccessToken(null);
    setGoogleUser(null);
    setFiles([]);
    setFolderHistory([]);
    setCurrentFolderId("root");
  };

  // List files/folders under current parent folder
  const fetchDriveContents = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      let query = `'${currentFolderId}' in parents and trashed = false`;
      if (searchQuery.trim()) {
        query = `name contains '${searchQuery.replace(/'/g, "\\'")}' and trashed = false`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id, name, mimeType, webViewLink, size, createdTime, thumbnailLink)&orderBy=folder,name&pageSize=100`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, reset state to prompt reconnect
          handleDisconnect();
          throw new Error("Google Drive session expired. Please sign in again.");
        }
        throw new Error(`Google API returned status: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      console.error("Error fetching files:", err);
      setUploadError(err.message || "Failed to synchronize contents with Google Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when folder or token or query changes
  useEffect(() => {
    if (accessToken) {
      fetchDriveContents();
    }
  }, [accessToken, currentFolderId, searchQuery]);

  // Navigate deeper into a subfolder
  const handleNavigateToFolder = (folderId: string, folderName: string) => {
    setFolderHistory(prev => [...prev, { id: currentFolderId, name: folderName }]);
    setCurrentFolderId(folderId);
    setSearchQuery(""); // Clear search when navigating
  };

  // Navigate back to previous folder
  const handleNavigateBack = () => {
    if (folderHistory.length === 0) return;
    const previous = folderHistory[folderHistory.length - 1];
    setFolderHistory(prev => prev.slice(0, -1));
    setCurrentFolderId(previous.id);
    setSearchQuery("");
  };

  // Create subfolder in current workspace folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !accessToken) return;

    setIsCreatingFolder(true);
    setUploadError(null);
    try {
      const url = "https://www.googleapis.com/drive/v3/files";
      const body = {
        name: newFolderName.trim(),
        mimeType: "application/vnd.google-apps.folder",
        parents: currentFolderId !== "root" ? [currentFolderId] : []
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`Google Drive API error ${res.status}`);

      setNewFolderName("");
      onLogAction("DocumentVault", "Create Folder", body.name, `Created folder inside Google Drive directory`);
      fetchDriveContents();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Could not complete folder creation.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // File Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const metadata = {
        name: file.name,
        parents: currentFolderId !== "root" ? [currentFolderId] : []
      };

      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: form
      });

      if (!res.ok) throw new Error("Could not upload file asset to Google Drive.");

      const uploaded = await res.json();
      onLogAction("DocumentVault", "Upload File", uploaded.name || file.name, `Uploaded file to Google Drive with ID: ${uploaded.id}`);
      fetchDriveContents();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // File deletion with MANDATORY explicit confirmation as required by prompt
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(`[CRITICAL CONFIRMATION] Are you sure you want to permanently delete "${fileName}" from Google Drive? This action cannot be undone.`);
    if (!confirmed) return;

    setIsLoading(true);
    setUploadError(null);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!res.ok) throw new Error(`Google Drive API deletion returned status: ${res.status}`);

      // Also clean up any local associations with this file
      const updatedAssoc = associations.filter(a => a.fileId !== fileId);
      saveAssociations(updatedAssoc);

      onLogAction("DocumentVault", "Delete File", fileName, `Permanently deleted Google Drive resource: ${fileId}`);
      fetchDriveContents();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to complete deletion on Google Drive.");
    } finally {
      setIsLoading(false);
    }
  };

  // Associate Drive File to Internal Entity
  const handleCreateAssociation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!associatingFile || !assocTargetId) return;

    const targetName = assocTargetType === "Employee"
      ? employees.find(emp => emp.employeeId === assocTargetId)?.fullName || "Unknown Employee"
      : departments.find(dept => dept.id === assocTargetId)?.name || "Unknown Department";

    const newAssoc: DriveAssociation = {
      id: `ASSOC_${Date.now()}`,
      fileId: associatingFile.id,
      fileName: associatingFile.name,
      mimeType: associatingFile.mimeType,
      webViewLink: associatingFile.webViewLink || "",
      targetType: assocTargetType,
      targetId: assocTargetId,
      associatedBy: currentUser?.email || "Unknown",
      associatedDate: new Date().toLocaleDateString("en-US")
    };

    const updated = [newAssoc, ...associations];
    saveAssociations(updated);
    
    onLogAction(
      "DocumentVault", 
      "Associate Document", 
      associatingFile.name, 
      `Linked document to ${assocTargetType}: ${targetName} (ID: ${assocTargetId})`
    );

    setAssociatingFile(null);
    setAssocTargetId("");
  };

  const handleRemoveAssociation = (id: string, fileName: string) => {
    const confirmed = window.confirm(`Are you sure you want to remove the link/association for "${fileName}"? This does not delete the file in Google Drive.`);
    if (!confirmed) return;

    const updated = associations.filter(assoc => assoc.id !== id);
    saveAssociations(updated);
    onLogAction("DocumentVault", "Remove Association", fileName, `Removed internal link to system entity`);
  };

  // Helper formatting for bytes size
  const formatBytes = (bytes?: string) => {
    if (!bytes) return "N/A";
    const num = parseInt(bytes);
    if (isNaN(num)) return "N/A";
    if (num < 1024) return `${num} B`;
    if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-50 rounded text-sky-600">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.347 14.625l-4.14-7.17h-5.414l4.14 7.17h5.414zm-6.287 4.125h-5.414l-4.14-7.17h5.414l4.14 7.17zm1.147-7.17l-2.707-4.69H6.08l2.707 4.69h5.414z"/>
              </svg>
            </span>
            <h1 className="text-lg font-bold text-slate-800">HR Document Vault</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Manage and share digital personnel contracts, verification forms, and team policies with direct Google Drive cloud storage integration.</p>
        </div>

        {/* CONNECTION CARD */}
        <div>
          {accessToken ? (
            <div className="flex items-center gap-3 bg-slate-50 border p-2 px-3 rounded-lg">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="h-3 w-3" /> Drive Connected
                </span>
                <span className="text-[10px] font-medium text-slate-500">{googleUser?.email || "Google Drive Workspace"}</span>
              </div>
              <button 
                onClick={handleDisconnect}
                className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border rounded transition-all"
                title="Disconnect Google Drive"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="flex items-center gap-2 px-4 py-2 bg-white border hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isAuthenticating ? "Connecting Workspace..." : "Connect Google Drive"}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start gap-2.5 animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Google Session Connection Error</p>
            <p className="mt-0.5 text-[11px] font-normal">{authError}</p>
          </div>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {uploadError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sync warning</p>
            <p className="mt-0.5 text-[11px] font-normal">{uploadError}</p>
          </div>
        </div>
      )}

      {accessToken ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FILE EXPLORER CANVAS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              
              {/* TOP CONTROLS */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/50">
                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Drive files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* Toolbar buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {/* Folder Back Trigger */}
                  {folderHistory.length > 0 && (
                    <button
                      onClick={handleNavigateBack}
                      className="flex items-center gap-1 p-1.5 px-3 border bg-white rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                  )}

                  {/* Upload Trigger */}
                  <label className="flex items-center gap-1 p-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>

                  {/* New Folder Modal Toggle */}
                  <button
                    onClick={() => {
                      const name = window.prompt("Enter new folder name:");
                      if (name && name.trim()) {
                        setNewFolderName(name);
                        setTimeout(() => {
                          const mockForm = { preventDefault: () => {} };
                          // Create folder immediately
                          const url = "https://www.googleapis.com/drive/v3/files";
                          const body = {
                            name: name.trim(),
                            mimeType: "application/vnd.google-apps.folder",
                            parents: currentFolderId !== "root" ? [currentFolderId] : []
                          };
                          fetch(url, {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${accessToken}`,
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify(body)
                          }).then(res => {
                            if (res.ok) {
                              onLogAction("DocumentVault", "Create Folder", body.name, `Created Google Drive folder`);
                              fetchDriveContents();
                            }
                          });
                        }, 50);
                      }
                    }}
                    className="p-1.5 bg-white hover:bg-slate-50 border rounded-lg text-slate-600"
                    title="Create New Folder"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>

                  <button
                    onClick={fetchDriveContents}
                    className="p-1.5 bg-white hover:bg-slate-50 border rounded-lg text-slate-600"
                    title="Reload contents"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* BREADCRUMB */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                <span className="text-slate-400">Google Drive</span>
                <span>/</span>
                <span className="text-slate-700 font-bold bg-slate-100 p-0.5 px-2 rounded">
                  {folderHistory.length > 0 ? folderHistory[folderHistory.length - 1].name : "My Drive"}
                </span>
              </div>

              {/* DRIVE CONTENT VIEW */}
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-sky-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Synchronizing directory...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Folder className="h-10 w-10 mx-auto text-slate-300 stroke-1 mb-2" />
                    <span className="text-xs font-semibold block">No files or folders found here.</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Use the Upload File action to add documents.</span>
                  </div>
                ) : (
                  files.map((file) => {
                    const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                    return (
                      <div 
                        key={file.id} 
                        className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-all"
                      >
                        {/* File details & icons */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isFolder ? (
                            <Folder className="h-5 w-5 text-amber-500 fill-amber-500/20 shrink-0" />
                          ) : (
                            <FileText className="h-5 w-5 text-sky-500 shrink-0" />
                          )}

                          <div className="min-w-0">
                            {isFolder ? (
                              <button
                                onClick={() => handleNavigateToFolder(file.id, file.name)}
                                className="text-xs font-extrabold text-slate-800 hover:text-sky-600 hover:underline text-left block truncate"
                              >
                                {file.name}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-slate-800 block truncate">
                                {file.name}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                              <span>{isFolder ? "Folder" : formatBytes(file.size)}</span>
                              <span>•</span>
                              <span>{file.createdTime ? new Date(file.createdTime).toLocaleDateString() : "Date N/A"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-slate-700 bg-white border rounded hover:shadow-2xs transition-all"
                              title="View Document"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {!isFolder && (
                            <button
                              onClick={() => setAssociatingFile(file)}
                              className="p-1 px-2 text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded flex items-center gap-1 transition-all"
                              title="Link file to Employee/Department"
                            >
                              <LinkIcon className="h-3 w-3" /> Link
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 bg-white border rounded hover:shadow-2xs transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ASSOCIATION DRAWER MODAL */}
            {associatingFile && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 shadow-2xs space-y-4 animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-black text-sky-600 tracking-wider">Internal Association Panel</span>
                    <h3 className="text-xs font-extrabold text-slate-800">
                      Link: <span className="font-bold text-slate-600">"{associatingFile.name}"</span>
                    </h3>
                  </div>
                  <button 
                    onClick={() => setAssociatingFile(null)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded border bg-white"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateAssociation} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Entity Type</label>
                    <select
                      value={assocTargetType}
                      onChange={(e) => {
                        setAssocTargetType(e.target.value as any);
                        setAssocTargetId("");
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-white text-slate-800"
                    >
                      <option value="Employee">Employee Record</option>
                      <option value="Department">Department Vault</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Specific Entity</label>
                    <select
                      value={assocTargetId}
                      onChange={(e) => setAssocTargetId(e.target.value)}
                      className="w-full text-xs p-1.5 border rounded bg-white text-slate-800"
                      required
                    >
                      <option value="">-- Choose Target --</option>
                      {assocTargetType === "Employee" ? (
                        employees.map(emp => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.fullName} ({emp.position})
                          </option>
                        ))
                      ) : (
                        departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Establish Link
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ACTIVE ASSOCIATIONS LIST */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-sky-500" /> Linked Documents ({associations.length})
              </h2>

              <div className="space-y-3 max-h-[460px] overflow-y-auto">
                {associations.length === 0 ? (
                  <div className="text-center p-8 text-slate-400">
                    <LinkIcon className="h-8 w-8 mx-auto text-slate-200 mb-1.5 stroke-1" />
                    <p className="text-[11px] font-semibold">No active file associations</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Use the "Link" action on any Drive file to map it to an employee or department.</p>
                  </div>
                ) : (
                  associations.map(assoc => {
                    const employeeObj = employees.find(e => e.employeeId === assoc.targetId);
                    const departmentObj = departments.find(d => d.id === assoc.targetId);
                    const label = assoc.targetType === "Employee" 
                      ? employeeObj?.fullName || "Employee Deleted"
                      : departmentObj?.name || "Department Deleted";

                    return (
                      <div key={assoc.id} className="p-3 bg-slate-50 border rounded-lg space-y-2 hover:border-slate-300 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-700 truncate block max-w-[150px]" title={assoc.fileName}>
                            {assoc.fileName}
                          </span>
                          <button
                            onClick={() => handleRemoveAssociation(assoc.id, assoc.fileName)}
                            className="text-slate-400 hover:text-rose-600"
                            title="Remove link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[9px] text-slate-400">
                            {assoc.targetType === "Employee" ? (
                              <User className="h-3 w-3 text-sky-500" />
                            ) : (
                              <Landmark className="h-3 w-3 text-indigo-500" />
                            )}
                            {assoc.targetType} Link
                          </span>
                          <span className="font-bold text-slate-800">{label}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1 text-[9px] text-slate-400">
                          <span>By: {assoc.associatedBy.split("@")[0]}</span>
                          {assoc.webViewLink && (
                            <a
                              href={assoc.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 hover:underline flex items-center gap-0.5 font-bold"
                            >
                              Open Drive <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DISCONNECTED PROMPT STATE */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-12 text-center max-w-xl mx-auto space-y-5">
          <div className="h-16 w-16 bg-sky-50 text-sky-600 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-md animate-pulse">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.347 14.625l-4.14-7.17h-5.414l4.14 7.17h5.414zm-6.287 4.125h-5.414l-4.14-7.17h5.414l4.14 7.17zm1.147-7.17l-2.707-4.69H6.08l2.707 4.69h5.414z"/>
            </svg>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Establish Cloud Storage Link</h2>
            <p className="text-xs text-slate-500 font-medium">To view or upload employment agreements, verify documents, and store files inside your secure corporate drive, connect your account credentials using Google Workspace.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-white border hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isAuthenticating ? "Establishing Authentication Session..." : "Authorize with Google Account"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
