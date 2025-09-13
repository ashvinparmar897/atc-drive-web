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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [folders, setFolders] = useState([]);
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

  const fetchFolderPermissions = async (userEmail) => {
    try {
      const response = await api.get('/api/folders/');
      const foldersWithPermissions = await Promise.all(
        response.data.map(async (folder) => {
          const permResponse = await api.get(`/api/folders/${folder.id}/permissions`);
          if (permResponse.data.includes(userEmail)) {
            return folder;
          }
          return null;
        })
      );
      return foldersWithPermissions.filter((folder) => folder !== null);
    } catch (error) {
      console.error('Error fetching folder permissions:', error);
      showSnackbar('Failed to fetch folder permissions', 'error');
      return [];
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
    setPermissionForm({ folder_id: null, user_email: user.email });
    setPermissionDialog(true);
  };

  const handleAssignPermission = async () => {
    try {
      await api.post(`/api/folders/${permissionForm.folder_id}/permissions`, {
        user_email: permissionForm.user_email,
        action: 'add',
      });
      showSnackbar('Folder access assigned successfully', 'success');
      setPermissionDialog(false);
      setPermissionForm({ folder_id: null, user_email: '' });
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
      setPermissionDialog(false);
      setPermissionDialog(true); // Reopen to refresh permissions
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
        return '👑';
      case 'editor':
        return '✏️';
      case 'viewer':
        return '👁️';
      default:
        return '👤';
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
              {users.map((user) => (
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
                      icon={<span>{getRoleIcon(user.role)}</span>}
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
                    <IconButton
                      size="small"
                      onClick={() => handleManagePermissions(user)}
                      color="default"
                    >
                      <FolderIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Dialog */}
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
          {editingUser && (
            <TextField
              margin="dense"
              label="Current Password (for verification)"
              type="password"
              fullWidth
              variant="outlined"
              placeholder="Enter current password to confirm changes"
              sx={{ mb: 2 }}
            />
          )}
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

      {/* Folder Permissions Dialog */}
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
          <List>
            {selectedUser && (
              <FolderPermissionsList
                userEmail={selectedUser.email}
                onRemove={handleRemovePermission}
              />
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

// Component to display and manage assigned folders
function FolderPermissionsList({ userEmail, onRemove }) {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const foldersWithPermissions = await api.get('/api/folders/');
        const permissionsData = await Promise.all(
          foldersWithPermissions.data.map(async (folder) => {
            const permResponse = await api.get(`/api/folders/${folder.id}/permissions`);
            if (permResponse.data.includes(userEmail)) {
              return folder;
            }
            return null;
          })
        );
        setPermissions(permissionsData.filter((folder) => folder !== null));
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    fetchPermissions();
  }, [userEmail]);

  return (
    <>
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
    </>
  );
}