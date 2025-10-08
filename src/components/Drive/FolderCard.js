import React, { useState } from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Checkbox,
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
} from '@mui/material';
import {
  Folder as FolderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../api/axios';

export default function FolderCard({
  folder,
  onFolderClick,
  onSelectionChange,
  selected,
  onFolderUpdated,
  onFolderDeleted,
  canEdit = false,
  canDelete = false,
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [error, setError] = useState('');

  const handleEditOpen = (e) => {
    e.stopPropagation();
    setNewName(folder.name);
    setError('');
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setError('');
  };

  const handleSave = async () => {
    if (!newName.trim() || newName === folder.name) {
      setEditDialogOpen(false);
      return;
    }

    try {
      const response = await api.put(`/api/folders/${folder.id}`, {
        name: newName.trim(),
      });
      onFolderUpdated && onFolderUpdated({ ...folder, name: newName.trim() });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating folder:', error);
      setError(error.response?.data?.detail || 'Failed to rename folder');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      try {
        await api.delete(`/api/folders/${folder.id}`);
        onFolderDeleted && onFolderDeleted(folder.id);
      } catch (error) {
        console.error('Error deleting folder:', error);
        alert(error.response?.data?.detail || 'Failed to delete folder');
      }
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
                  <IconButton size="small" color="error" onClick={handleDelete}>
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
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!newName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}