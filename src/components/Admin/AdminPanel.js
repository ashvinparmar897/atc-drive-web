import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Folder as FolderIcon,
  AdminPanelSettings as AdminIcon,
  EditNote as EditorIcon,
  Visibility as ViewerIcon,
} from '@mui/icons-material';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });
  const [permissionForm, setPermissionForm] = useState({
    folder_id: null,
    user_email: '',
    permission: 'viewer',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchFolders();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await api.get('/api/folders/');
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      showSnackbar('Failed to fetch folders', 'error');
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'viewer',
    });
    setUserDialog(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setUserDialog(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/admin/users/${userId}`);
        showSnackbar('User deleted successfully', 'success');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        showSnackbar('Failed to delete user', 'error');
      }
    }
  };

  const handleManagePermissions = async (user) => {
    setSelectedUser(user);
    setPermissionForm({ folder_id: null, user_email: user.email, permission: 'viewer' });
    setPermissions([]); // Reset permissions
    setPermissionDialog(true);
    // Fetch permissions for the selected user
    if (user.email) {
      try {
        const response = await api.get(`/api/folders/users/${user.email}/folder_permissions`);
        setPermissions(response.data);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        showSnackbar('Failed to fetch folder permissions', 'error');
        setPermissions([]);
      }
    }
  };

  const handleAssignPermission = async () => {
    try {
      await api.post(`/api/folders/${permissionForm.folder_id}/permissions`, {
        user_email: permissionForm.user_email,
        action: 'add',
        permission: permissionForm.permission,
      });
      showSnackbar('Folder access assigned successfully', 'success');
      // Refresh permissions
      const response = await api.get(`/api/folders/users/${permissionForm.user_email}/folder_permissions`);
      setPermissions(response.data);
      setPermissionForm({ folder_id: null, user_email: permissionForm.user_email, permission: 'viewer' });
    } catch (error) {
      console.error('Error assigning folder permission:', error);
      showSnackbar(error.response?.data?.detail || 'Failed to assign folder access', 'error');
    }
  };

  const handleRemovePermission = async (folderId, userEmail) => {
    try {
      await api.post(`/api/folders/${folderId}/permissions`, {
        user_email: userEmail,
        action: 'remove',
      });
      showSnackbar('Folder access removed successfully', 'success');
      // Update permissions state to reflect removal
      setPermissions((prev) => prev.filter((folder) => folder.id !== folderId));
    } catch (error) {
      console.error('Error removing folder permission:', error);
      showSnackbar(error.response?.data?.detail || 'Failed to remove folder access', 'error');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        const updateData = { ...userForm };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.put(`/api/users/admin/users/${editingUser.id}`, updateData);
        showSnackbar('User updated successfully', 'success');
      } else {
        await api.post('/api/users/admin/create', userForm);
        showSnackbar('User created successfully', 'success');
      }
      setUserDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar(error.response?.data?.detail || 'Failed to save user', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'editor':
        return 'warning';
      case 'viewer':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminIcon />;
      case 'editor':
        return <EditorIcon />;
      case 'viewer':
        return <ViewerIcon />;
      default:
        return <PersonIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Admin Panel
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateUser}>
          Create User
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        <Typography variant="body2" fontWeight="500">
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                        icon={getRoleIcon(user.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                     {user.role !== 'admin' && ( 
                      <IconButton
                        size="small"
                        onClick={() => handleManagePermissions(user)}
                        color="default"
                      >
                        <FolderIcon />
                      </IconButton>
                    )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            variant="outlined"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            helperText={editingUser ? 'Leave blank to keep current password' : 'Required for new users'}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={userForm.role}
              label="Role"
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={permissionDialog} onClose={() => setPermissionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Folder Permissions for {selectedUser?.email}</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={folders}
            getOptionLabel={(option) => option.name}
            onChange={(event, value) =>
              setPermissionForm({ ...permissionForm, folder_id: value ? value.id : null })
            }
            renderInput={(params) => (
              <TextField {...params} label="Select Folder" variant="outlined" fullWidth sx={{ mb: 2 }} />
            )}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Permission</InputLabel>
            <Select
              value={permissionForm.permission}
              label="Permission"
              onChange={(e) => setPermissionForm({ ...permissionForm, permission: e.target.value })}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleAssignPermission}
            disabled={!permissionForm.folder_id}
            sx={{ mb: 2 }}
          >
            Assign Folder Access
          </Button>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Assigned Folders
          </Typography>
          <FolderPermissionsList
            userEmail={selectedUser?.email}
            permissions={permissions}
            setPermissions={setPermissions}
            onRemove={handleRemovePermission}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function FolderPermissionsList({ userEmail, permissions, setPermissions, onRemove }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!userEmail) return;
      setLoading(true);
      try {
        const response = await api.get(`/api/folders/users/${userEmail}/folder_permissions`);
        setPermissions(response.data);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
        showSnackbar('Failed to fetch folder permissions', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, [userEmail, setPermissions]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : permissions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No folders assigned
        </Typography>
      ) : (
        <List>
          {permissions.map((folder) => (
            <ListItem key={folder.id}>
              <ListItemText primary={folder.name} />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => onRemove(folder.id, userEmail)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
}