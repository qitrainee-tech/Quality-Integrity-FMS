import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import logo from "../../assets/logo.png";
import { 
  LayoutDashboard, 
  FilePlus, 
  FolderOpen, 
  LogOut, 
  Activity, 
  Search,
  Bell,
  Menu,
  X,
  Upload,
  MoreVertical,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  Filter,
  HardDrive,
  Users,
  UserPlus,
  Shield,
  Trash2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { User } from '../App';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (updatedUserData: Partial<User>) => void;
}

const mockChartData = [
  { name: 'Mon', uploads: 45, size: 120 },
  { name: 'Tue', uploads: 52, size: 150 },
  { name: 'Wed', uploads: 38, size: 180 },
  { name: 'Thu', uploads: 65, size: 200 },
  { name: 'Fri', uploads: 48, size: 140 },
  { name: 'Sat', uploads: 25, size: 50 },
  { name: 'Sun', uploads: 20, size: 40 },
];

const mockFiles = [
  { id: 'F-1001', name: 'Blood_Test_Results_J_Doe.pdf', type: 'PDF', category: 'Lab Report', size: '2.4 MB', department: 'Pathology', date: '2023-10-24' },
  { id: 'F-1002', name: 'Chest_XRay_004.jpg', type: 'Image', category: 'Radiology', size: '15.8 MB', department: 'Radiology', date: '2023-10-23' },
  { id: 'F-1003', name: 'Staff_Schedule_Nov.xlsx', type: 'Excel', category: 'Administrative', size: '450 KB', department: 'HR', date: '2023-10-23' },
  { id: 'F-1004', name: 'Patient_Consent_Form_Template.docx', type: 'Word', category: 'Legal', size: '1.2 MB', department: 'Admin', date: '2023-10-22' },
  { id: 'F-1005', name: 'MRI_Scan_Sequence_4.dcm', type: 'DICOM', category: 'Radiology', size: '45.2 MB', department: 'Radiology', date: '2023-10-21' },
];

const initialUsers = [
  { id: 2, name: 'Admin', email: 'admin@pjghospital.com', role: 'Admin', department: 'Quality Improvement', status: 'Active' },
  { id: 4, name: 'Admin', email: 'admin@gmail.com', role: 'User', department: 'General', status: 'Active' },
  { id: 5, name: 'sample1', email: 'sample1@gmail.com', role: 'User', department: 'General', status: 'Active' },
  { id: 6, name: 'sample2', email: 'sample2@gmail.com', role: 'User', department: 'General', status: 'Active' },
  { id: 7, name: 'sample3', email: 'sample3@gmail.com', role: 'User', department: 'General', status: 'Active' },
  { id: 8, name: 'sample4', email: 'sample4@gmail.com', role: 'User', department: 'General', status: 'Active' },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'PDF': return <FileText className="w-5 h-5 text-red-500" />;
    case 'Image': return <ImageIcon className="w-5 h-5 text-purple-500" />;
    case 'DICOM': return <Activity className="w-5 h-5 text-blue-500" />;
    default: return <File className="w-5 h-5 text-gray-500" />;
  }
};

export function Dashboard({ user, onLogout, onUserUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'files' | 'users' | 'profile'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = !!(user && user.role && user.role.toString().toLowerCase() === 'admin');
  
  // User Management State
  const [users, setUsers] = useState(initialUsers);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'User', department: 'General', status: 'Active' });
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', password: '', role: 'User', department: 'General', status: 'Active' });
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  // Dashboard stats fetched from backend
  const [stats, setStats] = useState<{ 
    totalFiles: number; 
    totalFilesChange: string;
    storageUsed: number; 
    storageUsedChange: string;
    uploadsToday: number; 
    uploadsTodayChange: string;
    activeUsers: number;
    activeUsersChange: string;
  }>({
    totalFiles: 0,
    totalFilesChange: '—',
    storageUsed: 0,
    storageUsedChange: '—',
    uploadsToday: 0,
    uploadsTodayChange: '—',
    activeUsers: 0,
    activeUsersChange: 'Stable'
  });

  // Chart data for upload trends
  const [chartData, setChartData] = useState<any[]>([
    { name: 'Sun', uploads: 0, size: 0 },
    { name: 'Mon', uploads: 0, size: 0 },
    { name: 'Tue', uploads: 0, size: 0 },
    { name: 'Wed', uploads: 0, size: 0 },
    { name: 'Thu', uploads: 0, size: 0 },
    { name: 'Fri', uploads: 0, size: 0 },
    { name: 'Sat', uploads: 0, size: 0 }
  ]);
  const [trendsPeriod, setTrendsPeriod] = useState<7 | 30>(7);

  // Profile state
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [tempProfilePicture, setTempProfilePicture] = useState<string | null>(null);
  const [pendingProfilePictureFile, setPendingProfilePictureFile] = useState<File | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: user.name,
    email: user.email || '',
    password: '',
    confirmPassword: ''
  });
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0)} ${sizes[i]}`;
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/dashboard?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || { 
          totalFiles: 0, 
          totalFilesChange: '—',
          storageUsed: 0, 
          storageUsedChange: '—',
          uploadsToday: 0, 
          uploadsTodayChange: '—',
          activeUsers: 0,
          activeUsersChange: 'Stable'
        });
      } else {
        console.error('Failed to fetch dashboard stats:', data.message);
      }
    } catch (err) {
      console.error('Fetch dashboard stats error:', err);
    }
  };

  const fetchUploadTrends = async (period: 7 | 30 = trendsPeriod) => {
    try {
      const res = await fetch(`${apiUrl}/api/upload-trends?userId=${user.id}&period=${period}`);
      const data = await res.json();
      if (data.success && data.trends) {
        setChartData(data.trends);
        setTrendsPeriod(period);
      } else {
        console.error('Failed to fetch upload trends:', data.message);
      }
    } catch (err) {
      console.error('Fetch upload trends error:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/users/${user.id}/profile`);
      const data = await res.json();
      if (data.success && data.user.profilePicture) {
        setProfilePicture(`data:image/jpeg;base64,${data.user.profilePicture}`);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  const handleProfileUpdate = async () => {
    if (profileFormData.password !== profileFormData.confirmPassword) {
      setNotification({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    try {
      const updateData: any = {
        name: profileFormData.name,
        email: profileFormData.email
      };
      if (profileFormData.password) {
        updateData.password = profileFormData.password;
      }

      const res = await fetch(`${apiUrl}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Profile updated successfully' });
        setEditingProfile(false);
        // Update parent component's user state
        onUserUpdate({
          name: profileFormData.name,
          email: profileFormData.email
        });
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to update profile' });
      console.error('Update profile error:', err);
    }
  };

  const handleProfilePictureSelect = (file: File) => {
    // Just preview the file, don't save yet
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setTempProfilePicture(e.target.result as string);
        setPendingProfilePictureFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProfilePicture = async () => {
    if (!pendingProfilePictureFile) {
      setNotification({ type: 'error', message: 'No picture selected' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profilePicture', pendingProfilePictureFile);

      const res = await fetch(`${apiUrl}/api/users/${user.id}/profile/picture`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        // Update the actual profile picture after successful save
        setProfilePicture(tempProfilePicture);
        setTempProfilePicture(null);
        setPendingProfilePictureFile(null);
        setNotification({ type: 'success', message: 'Profile picture updated' });
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to upload picture' });
      console.error('Upload profile picture error:', err);
    }
  };

  useEffect(() => {
    // fetch on mount and when activeTab is overview
    fetchDashboardStats();
    fetchUploadTrends(7);
    fetchProfile();
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardStats();
      fetchUploadTrends();
    }
  }, [activeTab]);

  // Upload form state
  const [docName, setDocName] = useState('');
  const [categoryDoc, setCategoryDoc] = useState('');
  const [departmentDoc, setDepartmentDoc] = useState('');
  const [accessLevel, setAccessLevel] = useState('Admin Only');
  const [descriptionDoc, setDescriptionDoc] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadController, setUploadController] = useState<AbortController | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ docName?: string; category?: string; department?: string }>({});
  const MAX_UPLOAD_BYTES = 1000 * 1024 * 1024; // 1GB per upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Account management: search and filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilterDept, setUserFilterDept] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('');

  const filteredUsers = users
    .filter(u => {
      const q = userSearch.trim().toLowerCase();
      if (!q) return true;
      return (u.name || '').toString().toLowerCase().includes(q) || (u.email || '').toString().toLowerCase().includes(q);
    })
    .filter(u => userFilterDept ? ((u.department || '') === userFilterDept) : true)
    .filter(u => userFilterRole ? ((u.role || '').toString().toLowerCase() === userFilterRole.toLowerCase()) : true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [currentFilesList, setCurrentFilesList] = useState<any[]>([]);
  const [currentDocumentName, setCurrentDocumentName] = useState('');
  const [currentDocumentDescription, setCurrentDocumentDescription] = useState('');
  const [currentUploadedBy, setCurrentUploadedBy] = useState('');
  // File Manager pagination
  const [filePage, setFilePage] = useState(1);
  const [filesPerPage, setFilesPerPage] = useState(10);
  // File Manager filters
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/documents?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      } else {
        console.error('Failed to fetch documents:', data.message);
      }
    } catch (err) {
      console.error('Fetch documents error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'files') fetchDocuments();
  }, [activeTab]);

  const viewFiles = async (docId: number, docName: string, description: string = '') => {
    try {
      const res = await fetch(`${apiUrl}/api/documents/${docId}/download`);
      const data = await res.json();
      if (data.success && data.files) {
        // attach document id for download links
        const mapped = data.files.map((f: any) => ({ ...f, documentId: docId }));
        setCurrentFilesList(mapped);
        setCurrentDocumentName(docName || 'Files');
        setCurrentDocumentDescription(description || '');
        setCurrentUploadedBy(data.uploadedBy || '');
        setShowFilesModal(true);
      } else {
        setNotification({ type: 'error', message: data.message || 'Unable to load files' });
      }
    } catch (err) {
      console.error('View files error:', err);
      setNotification({ type: 'error', message: 'Unable to load files. See console.' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        status: newUser.status,
        password: newUser.password || undefined,
        adminId: user.id
      } as any;

      const res = await fetch(`${apiUrl}/api/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        // refresh list from server
        await fetchUsers();
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'User', department: 'General', status: 'Active' });
        setNotification({ type: 'success', message: data.message + (data.user && data.user.tempPassword ? `\nTemporary password: ${data.user.tempPassword}` : '') });
      } else {
        setNotification({ type: 'error', message: 'Create failed: ' + (data.message || 'Unknown error') });
      }
    } catch (err) {
      console.error('Create user error:', err);
      setNotification({ type: 'error', message: 'Unable to create user' });
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditedUser({ name: user.name, email: user.email, password: '', role: user.role, department: user.department, status: user.status });
    setShowEditUserModal(true);
  };

  // Fetch users from backend when admin opens dashboard
  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${apiUrl}/api/users?adminId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        // reset pagination if needed
        setCurrentPage(1);
      } else {
        console.error('Failed to fetch users:', data.message);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/users/${editingUser.id}?adminId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedUser)
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        setShowEditUserModal(false);
        setEditingUser(null);
        setEditedUser({ name: '', email: '', password: '', role: 'User', department: 'General', status: 'Active' });
        setNotification({ type: 'success', message: 'User updated successfully!' });
      } else {
        setNotification({ type: 'error', message: 'Update failed: ' + (data.message || 'Unknown') });
      }
    } catch (err) {
      console.error('Update user error:', err);
      setNotification({ type: 'error', message: 'Unable to update user. See console for details.' });
    }
  };




  
  const renderOverview = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Files', value: stats.totalFiles.toLocaleString(), change: stats.totalFilesChange, color: 'bg-blue-50 text-blue-600', icon: File },
          { label: 'Storage Used', value: formatBytes(stats.storageUsed), change: stats.storageUsedChange, color: 'bg-green-50 text-green-600', icon: HardDrive },
          { label: 'Uploads Today', value: stats.uploadsToday.toLocaleString(), change: stats.uploadsTodayChange, color: 'bg-amber-50 text-amber-600', icon: Upload },
          { label: 'Active Users', value: stats.activeUsers.toString(), change: stats.activeUsersChange, color: 'bg-purple-50 text-purple-600', icon: Users },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change === '45%' || stat.change === 'Stable' ? 'bg-blue-100 text-blue-700' : stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Storage Usage Trends</h3>
            <select 
              value={trendsPeriod} 
              onChange={(e) => fetchUploadTrends(parseInt(e.target.value) as 7 | 30)}
              className="text-sm border-gray-200 rounded-lg text-gray-500 outline-none"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last Month</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="uploads" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Access</h3>
          <div className="space-y-4">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No files available</p>
            ) : (
              documents.slice(0, 4).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100" onClick={() => viewFiles(doc.id, doc.document_name, doc.description)}>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.document_name}</h4>
                    <p className="text-xs text-gray-500">{doc.category} • {doc.document_size ? `${(doc.document_size/1024/1024).toFixed(1)} MB` : 'N/A'}</p>
                  </div>
                  <span className="text-xs text-gray-400">{doc.uploaded_at ? (() => {
                    const date = new Date(doc.uploaded_at);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 60) return `${diffMins}m ago`;
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) return `${diffHours}h ago`;
                    const diffDays = Math.floor(diffHours / 24);
                    return `${diffDays}d ago`;
                  })() : 'N/A'}</span>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setActiveTab('files')}
            className="w-full mt-6 py-2 text-sm text-green-600 font-medium hover:bg-green-50 rounded-lg transition-colors"
          >
            Go to File Manager
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderAddFile = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
          <p className="text-sm text-gray-500 mt-1">Add new files to the hospital registry</p>
        </div>
        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
          <Upload className="w-6 h-6" />
        </div>
      </div>
      
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Document Name</label>
            <input
              value={docName}
              onChange={(e) => { setDocName(e.target.value); if (uploadErrors.docName) setUploadErrors(prev => ({ ...prev, docName: undefined })); }}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${uploadErrors.docName ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-green-500 focus:ring-green-500/20'} outline-none transition-all`}
              placeholder="e.g. Patient Report 2023"
            />
            {uploadErrors.docName && <p className="text-xs text-red-600 mt-1">{uploadErrors.docName}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={categoryDoc}
              onChange={(e) => { setCategoryDoc(e.target.value); if (uploadErrors.category) setUploadErrors(prev => ({ ...prev, category: undefined })); }}
              className={`w-full px-4 py-2 rounded-lg border ${uploadErrors.category ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-green-500 focus:ring-green-500/20'} outline-none transition-all bg-white`}
            >
              <option value="">Select Category</option>
              <option>CIP</option>
              <option>CAR</option>
              <option>DCN</option>
              <option>IQA</option>
            </select>
            {uploadErrors.category && <p className="text-xs text-red-600 mt-1">{uploadErrors.category}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Access Level</label>
            <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white">
              <option>Admin Only</option>
              <option>Public</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">Description / Tags</label>
            <textarea value={descriptionDoc} onChange={(e) => setDescriptionDoc(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all h-24 resize-none" placeholder="Add relevant tags or a brief description..." />
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-green-400 hover:bg-green-50/10 transition-colors group bg-gray-50/30 cursor-pointer"
        >
          <div className="p-4 bg-green-50 text-green-600 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Click to upload or drag and drop</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs">Supported formats: PDF, JPG, PNG, DICOM, DOCX, XLSX (Max 1GB per upload)</p>
          <input 
            ref={fileInputRef} 
            type="file" 
            multiple
            accept="*/*" 
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              setSelectedFiles(files);
            }} 
            className="mt-4 hidden" 
          />
          {selectedFiles.length > 0 && (
            <div className="text-sm text-gray-600 mt-4 w-full max-h-48 overflow-y-auto">
              <p className="font-medium mb-2">Selected files ({selectedFiles.length}):</p>
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs text-gray-500 mb-1">
                  <div className="flex items-center gap-3">
                    <span>{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSelectedFiles(prev => prev.filter((_, i) => i !== idx)); }}
                    className="text-xs text-red-600 hover:underline px-2 py-1 rounded"
                    title="Remove file"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            onClick={() => {
              // If an upload is in progress, abort it
              if (uploading && uploadController) {
                uploadController.abort();
              }
              // Reset form state
              setUploading(false);
              setUploadController(null);
              setSelectedFiles([]);
              setDocName('');
              setCategoryDoc('');
              setDepartmentDoc('');
              setDescriptionDoc('');
              setAccessLevel('Admin Only');
              setUploadErrors({});
            }}
          >
            Cancel
          </button>
          <button 
            className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
            onClick={async () => {
                // Validate required fields and set per-field errors
                const errors: { docName?: string; category?: string; department?: string } = {};
                if (!docName.trim()) errors.docName = 'Document name is required';
                if (!categoryDoc) errors.category = 'Please select a category';
                if (Object.keys(errors).length > 0) {
                  setUploadErrors(errors);
                  setNotification({ type: 'error', message: 'Please complete the highlighted fields before uploading.' });
                  return;
                }

              if (selectedFiles.length === 0) { setNotification({ type: 'error', message: 'Please select at least one file to upload.' }); return; }

              // Check file sizes
              const oversizedFiles = selectedFiles.filter(f => f.size > MAX_UPLOAD_BYTES);
              if (oversizedFiles.length > 0) { 
                setNotification({ type: 'error', message: `${oversizedFiles.length} file(s) exceed 1GB limit.` }); 
                return; 
              }

              // create an AbortController so the upload can be cancelled
              const controller = new AbortController();
              setUploadController(controller);
              setUploading(true);
              try {
                const form = new FormData();
                
                // Add all selected files with the field name 'document'
                selectedFiles.forEach((file) => {
                  form.append('document', file as Blob);
                });
                
                form.append('document_name', docName);
                form.append('category', categoryDoc);
                form.append('department', isAdmin ? 'Global' : (user.department || 'General'));
                form.append('description', descriptionDoc);
                form.append('uploaded_by', String(user.id));
                form.append('access_level', accessLevel);

                const res = await fetch(`${apiUrl}/api/documents/upload`, {
                  method: 'POST',
                  body: form,
                  signal: controller.signal
                });
                const data = await res.json();
                if (data.success) {
                  setNotification({ type: 'success', message: data.message || 'Upload successful' });
                  // clear form
                  setDocName(''); setCategoryDoc(''); setDepartmentDoc(''); setDescriptionDoc(''); setSelectedFiles([]);
                  setAccessLevel('Admin Only');
                  setActiveTab('files');
                } else {
                  setNotification({ type: 'error', message: 'Upload failed: ' + (data.message || 'Unknown error') });
                }
              } catch (err) {
                if ((err as any).name === 'AbortError') {
                  setNotification({ type: 'error', message: 'Upload cancelled.' });
                } else {
                  console.error('Upload error:', err);
                  setNotification({ type: 'error', message: 'Upload failed. See console for details.' });
                }
              } finally {
                setUploading(false);
                setUploadController(null);
              }
            }}
            disabled={uploading}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} File(s)`}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderFileManager = () => {
    let filteredDocuments = documents.filter(d => (d.document_name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply category filter
    if (filterCategory) {
      filteredDocuments = filteredDocuments.filter(d => (d.category || '') === filterCategory);
    }
    
    // Apply department filter
    if (filterDepartment) {
      filteredDocuments = filteredDocuments.filter(d => (d.department || '') === filterDepartment);
    }
    
    // Apply access_level filter (only visible to admin)
    if (filterAccessLevel && isAdmin) {
      filteredDocuments = filteredDocuments.filter(d => (d.access_level || '') === filterAccessLevel);
    }
    
    const totalDocs = filteredDocuments.length;
    const startIndex = totalDocs === 0 ? 0 : (filePage - 1) * filesPerPage + 1;
    const endIndex = Math.min(filePage * filesPerPage, totalDocs);
    const displayedDocuments = filteredDocuments.slice((filePage - 1) * filesPerPage, filePage * filesPerPage);

    return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">File Manager</h2>
          <p className="text-sm text-gray-500 mt-1">Browse and manage hospital documents</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={() => setShowFilterModal(true)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setFilePage(1); }}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
            />
          </div>
          <select value={filesPerPage} onChange={(e) => { setFilesPerPage(Number(e.target.value)); setFilePage(1); }} className="ml-2 px-2 py-1 rounded border border-gray-200 bg-white text-sm">
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="p-4 rounded-tl-lg">File Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Department</th>
              <th className="p-4">Size</th>
              <th className="p-4">Access Level</th>
              <th className="p-4">Date Uploaded</th>
              <th className="p-4 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {displayedDocuments.map((doc: any) => (
              <tr key={doc.id} className="hover:bg-green-50/30 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.document_name}</p>
                      
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {doc.category}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{doc.department}</td>
                <td className="p-4 font-mono text-xs text-gray-500">{doc.document_size ? `${(doc.document_size/1024/1024).toFixed(2)} MB` : '-'}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${doc.access_level === 'Public' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{doc.access_level}</span>
                </td>
                <td className="p-4 text-gray-500">{doc.uploaded_at ? new Date(doc.uploaded_at).toISOString().split('T')[0] : '-'}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded transition-colors" title="View files" onClick={() => viewFiles(doc.id, doc.document_name, doc.description)}>
                      <File className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-colors" title="Download all files as ZIP" onClick={() => window.open(`${apiUrl}/api/documents/${doc.id}/download-zip`, '_blank')}>
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Showing {startIndex} to {endIndex} of {totalDocs} files</span>
        <div className="flex gap-2 items-center">
          <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" onClick={() => setFilePage(p => Math.max(1, p - 1))} disabled={filePage === 1}>Previous</button>
          <div className="text-sm text-gray-600">{filePage} / {Math.max(1, Math.ceil(totalDocs / filesPerPage))}</div>
          <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" onClick={() => setFilePage(p => Math.min(Math.ceil(totalDocs / filesPerPage), p + 1))} disabled={filePage === Math.ceil(totalDocs / filesPerPage)}>Next</button>
        </div>
      </div>
      
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Filter Documents</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilePage(1); }} className="w-full px-3 py-2 rounded border border-gray-200 bg-white text-sm">
                  <option value="">All Categories</option>
                  <option>Lab Reports</option>
                  <option>Radiology/Imaging</option>
                  <option>Prescriptions</option>
                  <option>Administrative</option>
                  <option>Legal/Consent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select value={filterDepartment} onChange={(e) => { setFilterDepartment(e.target.value); setFilePage(1); }} className="w-full px-3 py-2 rounded border border-gray-200 bg-white text-sm">
                  <option value="">All Departments</option>
                  <option>General</option>
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Pediatrics</option>
                  <option>Emergency</option>
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                  <select value={filterAccessLevel} onChange={(e) => { setFilterAccessLevel(e.target.value); setFilePage(1); }} className="w-full px-3 py-2 rounded border border-gray-200 bg-white text-sm">
                    <option value="">All Access Levels</option>
                    <option>Admin Only</option>
                    <option>Public</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button onClick={() => { setFilterCategory(''); setFilterDepartment(''); setFilterAccessLevel(''); setFilePage(1); }} className="flex-1 px-3 py-2 text-sm rounded border border-gray-200 bg-gray-50 hover:bg-gray-100">Clear Filters</button>
                <button onClick={() => setShowFilterModal(false)} className="flex-1 px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700">Done</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {showFilesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">{currentDocumentName} — Files</h3>
              <button onClick={() => setShowFilesModal(false)} className="text-gray-500">Close</button>
            </div>
            <div className="p-4 space-y-4">
              {currentUploadedBy && (
                <div className="pb-4 border-b">
                  <p className="text-xs font-medium text-gray-600 mb-1">Uploaded by:</p>
                  <p className="text-sm text-gray-700">{currentUploadedBy}</p>
                </div>
              )}
              {currentDocumentDescription && (
                <div className="pb-4 border-b">
                  <p className="text-xs font-medium text-gray-600 mb-1">Tags / Description:</p>
                  <p className="text-sm text-gray-700">{currentDocumentDescription}</p>
                </div>
              )}
              <div className="space-y-2">
                {currentFilesList.length === 0 && <div className="text-sm text-gray-500">No files found.</div>}
                {currentFilesList.map((f: any) => (
                  <div key={f.index} className="flex items-center justify-between gap-3 p-2 border border-gray-100 rounded">
                    <div>
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-gray-400">{(f.size/1024/1024).toFixed(2)} MB • {f.type}</div>
                    </div>
                    <div>
                      <button onClick={() => window.open(`${apiUrl}/api/documents/${f.documentId || ''}/download?fileIndex=${f.index}`, '_blank')} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
    );
  };

  const renderUserManagement = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Account Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage system access and user roles</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none text-sm"
            />
          </div>
          <select
            value={userFilterDept}
            onChange={(e) => { setUserFilterDept(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          >
            <option value="">All Departments</option>
            <option>General</option>
            <option>Cardiology</option>
            <option>Pediatrics</option>
            <option>Quality Improvement</option>
            <option>Administration</option>
          </select>
          <select
            value={userFilterRole}
            onChange={(e) => { setUserFilterRole(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
          <button
            onClick={() => { setUserSearch(''); setUserFilterDept(''); setUserFilterRole(''); setCurrentPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50"
          >
            Clear
          </button>
        </div>
        <button 
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="p-4 rounded-tl-lg">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Status</th>
              <th className="p-4 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage).map((u) => (
              <tr key={u.id} className="hover:bg-green-50/30 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {(() => {
                    const isAdminRole = ((u.role || '').toString().toLowerCase() === 'admin');
                    const displayRole = (u.role || '').toString();
                    const label = displayRole ? (displayRole.charAt(0).toUpperCase() + displayRole.slice(1)) : '';
                    return (
                      <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${isAdminRole ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        {/* {isAdminRole && <Shield className="w-3 h-3 text-white" />} */}
                        {label}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-4 text-gray-600">{u.department}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      onClick={() => openEditModal(u)}
                      title="Edit user"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                      onClick={async () => {
                        if (!confirm('Deactivate this user? They will not be able to sign in, but the account can be reactivated by an admin.')) return;
                        try {
                          const res = await fetch(`${apiUrl}/api/users/${u.id}?adminId=${user.id}`, {
                            method: 'DELETE'
                          });
                          const data = await res.json();
                          if (data.success) {
                            await fetchUsers();
                            setNotification({ type: 'success', message: data.message });
                          } else {
                            setNotification({ type: 'error', message: 'Deactivation failed: ' + (data.message || 'Unknown') });
                          }
                        } catch (err) {
                          console.error('Deactivate user error:', err);
                          setNotification({ type: 'error', message: 'Unable to deactivate user. See console for details.' });
                        }
                      }}
                      title="Deactivate user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 rounded-lg transition-colors"
            title="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              {currentPage} / {Math.ceil(filteredUsers.length / usersPerPage) || 1}
            </span>
          </div>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === Math.ceil(filteredUsers.length / usersPerPage)}
            className="p-2 hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 rounded-lg transition-colors"
            title="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                  placeholder="Dr. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                  placeholder="jane@pjg.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password (optional)</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                  placeholder="Leave blank to auto-generate a temporary password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select 
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none bg-white"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                {newUser.role !== 'Admin' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <select 
                      required
                      value={newUser.department}
                      onChange={e => setNewUser({...newUser, department: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none bg-white"
                    >
                      <option value="General">General</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Quality Improvement">Quality Improvement</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
              <button onClick={() => setShowEditUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={editedUser.name}
                  onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                  placeholder="Dr. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={editedUser.email}
                  onChange={e => setEditedUser({...editedUser, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                  placeholder="jane@pjg.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password (optional)</label>
                <input
                  type="password"
                  value={editedUser.password}
                  onChange={e => setEditedUser({...editedUser, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select 
                    value={editedUser.role}
                    onChange={e => setEditedUser({...editedUser, role: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none bg-white"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <select 
                    required
                    value={editedUser.department}
                    onChange={e => setEditedUser({...editedUser, department: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Quality Improvement">Quality Improvement</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select 
                  value={editedUser.status}
                  onChange={e => setEditedUser({...editedUser, status: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );

  const renderProfile = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">My Profile</h3>
        
        {!editingProfile ? (
          <>
            {/* Profile Picture Display */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-2xl overflow-hidden">
                  {tempProfilePicture ? (
                    <img src={tempProfilePicture} alt="Preview" className="w-full h-full object-cover" />
                  ) : profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <button 
                  onClick={() => profileFileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
              </div>
              <input 
                ref={profileFileInputRef}
                type="file" 
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleProfilePictureSelect(e.target.files[0])}
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Profile Picture</p>
                <p className="text-xs text-gray-500 mt-1">Click the icon to upload a new picture</p>
                {tempProfilePicture && (
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={saveProfilePicture}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setTempProfilePicture(null);
                        setPendingProfilePictureFile(null);
                      }}
                      className="px-3 py-1 border border-gray-200 text-gray-700 text-xs rounded font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid gap-6 mb-8">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="mt-2 text-gray-900 font-medium">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="mt-2 text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Department</label>
                <p className="mt-2 text-gray-900">{user.department}</p>
              </div>
            </div>

            <button 
              onClick={() => {
                setEditingProfile(true);
                setProfileFormData({
                  name: user.name,
                  email: user.email || '',
                  password: '',
                  confirmPassword: ''
                });
              }}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <>
            {/* Edit Form */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input 
                  type="text"
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({...profileFormData, name: e.target.value})}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email"
                  value={profileFormData.email}
                  onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">New Password (optional)</label>
                <input 
                  type="password"
                  value={profileFormData.password}
                  onChange={(e) => setProfileFormData({...profileFormData, password: e.target.value})}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <input 
                  type="password"
                  value={profileFormData.confirmPassword}
                  onChange={(e) => setProfileFormData({...profileFormData, confirmPassword: e.target.value})}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none"
                />
              </div>
              <p className="text-xs text-gray-500">Your department cannot be changed.</p>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleProfileUpdate}
                className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditingProfile(false)}
                className="flex-1 px-6 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-gray-100">
            <div className="p-1 rounded-lg text-white">
                {/* <Activity className="w-6 h-6 text-white" /> */}
                <img src={logo} alt="PJG Hospital" className="w-12 h-12 object-cover" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">QI-IPCPSU</h1>
            <button className="lg:hidden ml-auto" onClick={toggleSidebar}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
            {[
              { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'upload', label: 'Upload Files', icon: FilePlus },
              { id: 'files', label: 'File Manager', icon: FolderOpen },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-green-50 text-green-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-green-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            ))}

            {isAdmin && (
              <>
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-2">Admin</p>
                <div className="flex items-center gap-2 px-4">
                  <button
                    onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'users' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Users className={`w-5 h-5 ${activeTab === 'users' ? 'text-green-600' : 'text-gray-400'}`} />
                    Account Management
                  </button>
                  
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={() => {
                setActiveTab('profile');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl mb-3 transition-all ${
                activeTab === 'profile' 
                  ? 'bg-green-50' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden">
                {tempProfilePicture ? (
                  <img src={tempProfilePicture} alt="Preview" className="w-full h-full object-cover" />
                ) : profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className={`text-xs truncate ${isAdmin ? 'text-gray-500' : 'text-gray-600'}`}>
                  {isAdmin ? 'Admin' : user.department}
                </p>
              </div>
            </button>

            {tempProfilePicture && (
              <div className="flex gap-2 mb-3">
                <button 
                  onClick={saveProfilePicture}
                  className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium transition-colors"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setTempProfilePicture(null);
                    setPendingProfilePictureFile(null);
                  }}
                  className="flex-1 px-2 py-1 border border-gray-200 text-gray-700 text-xs rounded font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
              {activeTab === 'overview' ? 'System Overview' : activeTab === 'upload' ? 'Upload Center' : activeTab === 'files' ? 'Digital Archive' : activeTab === 'profile' ? 'My Profile' : 'Account Management'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {notification.message && (
            <div className={`m-4 p-4 rounded-lg border ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm">
                  {notification.message.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <button onClick={() => setNotification({ type: null, message: null })} className="text-sm font-medium underline">
                  Dismiss
                </button>
              </div>
            </div>
          )}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'upload' && renderAddFile()}
          {activeTab === 'files' && renderFileManager()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </main>
    </div>
  );
}
