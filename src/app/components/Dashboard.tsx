import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import logo from "../../assets/logo.png";
import { 
  LayoutDashboard, 
  FilePlus, 
  FolderOpen, 
  Settings, 
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

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'files' | 'users'>('overview');
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

  // Upload form state
  const [docName, setDocName] = useState('');
  const [categoryDoc, setCategoryDoc] = useState('');
  const [departmentDoc, setDepartmentDoc] = useState('');
  const [accessLevel, setAccessLevel] = useState('Confidential (Restricted)');
  const [descriptionDoc, setDescriptionDoc] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB per file
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
      setNotification({ type: 'error', message: 'Unable to create user. See console for details.' });
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
          { label: 'Total Files', value: '14,284', change: '+12%', color: 'bg-blue-50 text-blue-600', icon: File },
          { label: 'Storage Used', value: '1.2 TB', change: '45%', color: 'bg-green-50 text-green-600', icon: HardDrive },
          { label: 'Uploads Today', value: '128', change: '+8%', color: 'bg-amber-50 text-amber-600', icon: Upload },
          { label: 'Active Users', value: users.length.toString(), change: 'Stable', color: 'bg-purple-50 text-purple-600', icon: Users },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Storage Usage Trends</h3>
            <select className="text-sm border-gray-200 rounded-lg text-gray-500 outline-none">
              <option>Last 7 Days</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">Lab_Report_Final_v2.pdf</h4>
                  <p className="text-xs text-gray-500">Pathology • 2.4 MB</p>
                </div>
                <span className="text-xs text-gray-400">2h ago</span>
              </div>
            ))}
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
            <input value={docName} onChange={(e) => setDocName(e.target.value)} type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all" placeholder="e.g. Patient Report 2023" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select value={categoryDoc} onChange={(e) => setCategoryDoc(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white">
              <option value="">Select Category</option>
              <option>Lab Reports</option>
              <option>Radiology/Imaging</option>
              <option>Prescriptions</option>
              <option>Administrative</option>
              <option>Legal/Consent</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <select value={departmentDoc} onChange={(e) => setDepartmentDoc(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white">
              <option value="">Select Department</option>
              <option>General</option>
              <option>Cardiology</option>
              <option>Neurology</option>
              <option>Pediatrics</option>
              <option>Emergency</option>
            </select>
          </div>

          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Access Level</label>
            <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-white">
              <option>Confidential (Restricted)</option>
              <option>Internal Staff Only</option>
              <option>Public</option>
            </select>
          </div> */}

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
          <p className="text-sm text-gray-500 mt-2 max-w-xs">Supported formats: PDF, JPG, PNG, DICOM, DOCX, XLSX (Max 200MB per file)</p>
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
            <div className="text-sm text-gray-600 mt-4 w-full max-h-32 overflow-y-auto">
              <p className="font-medium mb-2">Selected files ({selectedFiles.length}):</p>
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs text-gray-500 mb-1">
                  <span>{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button 
            className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
            onClick={async () => {
              if (selectedFiles.length === 0) { setNotification({ type: 'error', message: 'Please select at least one file to upload.' }); return; }
              
              // Check file sizes
              const oversizedFiles = selectedFiles.filter(f => f.size > MAX_UPLOAD_BYTES);
              if (oversizedFiles.length > 0) { 
                setNotification({ type: 'error', message: `${oversizedFiles.length} file(s) exceed 200MB limit.` }); 
                return; 
              }
              
              setUploading(true);
              try {
                const form = new FormData();
                
                // Add all selected files with the field name 'document'
                selectedFiles.forEach((file) => {
                  form.append('document', file as Blob);
                });
                
                form.append('document_name', docName);
                form.append('category', categoryDoc);
                form.append('department', departmentDoc);
                form.append('description', descriptionDoc);
                form.append('uploaded_by', String(user.id));

                const res = await fetch(`${apiUrl}/api/documents/upload`, {
                  method: 'POST',
                  body: form
                });
                const data = await res.json();
                if (data.success) {
                  setNotification({ type: 'success', message: data.message || 'Upload successful' });
                  // clear form
                  setDocName(''); setCategoryDoc(''); setDepartmentDoc(''); setDescriptionDoc(''); setSelectedFiles([]);
                  setActiveTab('files');
                } else {
                  setNotification({ type: 'error', message: 'Upload failed: ' + (data.message || 'Unknown error') });
                }
              } catch (err) {
                console.error('Upload error:', err);
                setNotification({ type: 'error', message: 'Upload failed. See console for details.' });
              } finally {
                setUploading(false);
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

  const renderFileManager = () => (
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
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-600" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
            />
          </div>
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
              <th className="p-4">Date Uploaded</th>
              <th className="p-4 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {mockFiles.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map((file) => (
              <tr key={file.id} className="hover:bg-green-50/30 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {file.category}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{file.department}</td>
                <td className="p-4 font-mono text-xs text-gray-500">{file.size}</td>
                <td className="p-4 text-gray-500">{file.date}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded transition-colors" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Showing {mockFiles.length} files</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
          <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Next</button>
        </div>
      </div>
    </motion.div>
  );

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
            {users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage).map((u) => (
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
                        if (!confirm('Are you sure you want to remove this user?')) return;
                        try {
                          const res = await fetch(`${apiUrl}/api/users/${u.id}?adminId=${user.id}`, {
                            method: 'DELETE'
                          });
                          const data = await res.json();
                          if (data.success) {
                            await fetchUsers();
                            setNotification({ type: 'success', message: data.message });
                          } else {
                            setNotification({ type: 'error', message: 'Delete failed: ' + (data.message || 'Unknown') });
                          }
                        } catch (err) {
                          console.error('Delete user error:', err);
                          setNotification({ type: 'error', message: 'Unable to delete user. See console for details.' });
                        }
                      }}
                      title="Delete user"
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
          Showing {Math.min((currentPage - 1) * usersPerPage + 1, users.length)} to {Math.min(currentPage * usersPerPage, users.length)} of {users.length} users
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
              {currentPage} / {Math.ceil(users.length / usersPerPage) || 1}
            </span>
          </div>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === Math.ceil(users.length / usersPerPage)}
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select 
                  value={newUser.status}
                  onChange={e => setNewUser({...newUser, status: e.target.value as 'Active' | 'Offline' | 'Inactive'})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Offline">Offline</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  onChange={e => setEditedUser({...editedUser, status: e.target.value as 'Active' | 'Offline' | 'Inactive'})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Offline">Offline</option>
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

            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-2">System</p>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
              <Settings className="w-5 h-5 text-gray-400" />
              Settings
            </button>
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
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
              {activeTab === 'overview' ? 'System Overview' : activeTab === 'upload' ? 'Upload Center' : activeTab === 'files' ? 'Digital Archive' : 'Account Management'}
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
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'upload' && renderAddFile()}
          {activeTab === 'files' && renderFileManager()}
          {activeTab === 'users' && renderUserManagement()}
        </div>
      </main>
    </div>
  );
}
