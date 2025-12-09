import React, { useState } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../api/axios';
import ConfirmDialog from './ConfirmDialog';

export default function FolderCard({
  folder,
  onFolderClick,
  onSelectionChange,
  selected,
  onFolderUpdated,
  onFolderDeleted,
  canEdit = false,
  canDelete = false,
  onSuccess,
  onError,
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditOpen = (e) => {
    e.stopPropagation();
    setNewName(folder.name);
    setError('');
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    if (saving) return; 
    setEditDialogOpen(false);
    setError('');
  };

  const handleSave = async () => {
    if (!newName.trim() || newName === folder.name) {
      setEditDialogOpen(false);
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(`/api/folders/${folder.id}`, {
        name: newName.trim(),
      });
      onFolderUpdated && onFolderUpdated({ ...folder, name: newName.trim() });
      setEditDialogOpen(false);
      onSuccess && onSuccess('Folder renamed successfully');
    } catch (error) {
      console.error('Error updating folder:', error);
      setError(error.response?.data?.detail || 'Failed to rename folder');
    } finally {
      setSaving(false); 
    }
  };

  const handleDeleteOpen = (e) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/folders/${folder.id}`);
      setDeleteDialogOpen(false);
      onFolderDeleted && onFolderDeleted(folder.id);
      onSuccess && onSuccess('Folder deleted successfully');
    } catch (error) {
      console.error('Error deleting folder:', error);
      setDeleteDialogOpen(false);
      onError && onError(error.response?.data?.detail || 'Failed to delete folder');
    }
  };

  return (
    <>
      <Card variant="outlined">
        <CardActionArea onClick={() => onFolderClick(folder)}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon color="primary" fontSize="large" />
            <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1 }}>
              {folder.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {canEdit && (
                <Tooltip title="Rename Folder">
                  <IconButton size="small" onClick={handleEditOpen}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDelete && (
                <Tooltip title="Delete Folder">
                  <IconButton size="small" color="error" onClick={handleDeleteOpen}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>

      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            variant="standard"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                handleEditClose();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!newName.trim() || saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Folder"
        message={`Are you sure you want to delete the folder "${folder.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Delete"
        confirmColor="error"
      />

    </>
  );
}
