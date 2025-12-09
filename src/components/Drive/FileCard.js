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
  Snackbar,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import api from '../../api/axios';
import ConfirmDialog from './ConfirmDialog';

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function FileCard({
  file,
  onFileClick,
  onSelectionChange,
  selected,
  onFileUpdated,
  onFileDeleted,
  canEdit = false,
  canDelete = false,
  onSuccess,
  onError,
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newName, setNewName] = useState(file.name || file.filename || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditOpen = (e) => {
    e.stopPropagation();
    setNewName(file.name || file.filename || '');
    setError('');
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    if (saving) return;
    setEditDialogOpen(false);
    setError('');
  };

  const handleSave = async () => {
    if (!newName.trim() || newName === (file.name || file.filename)) {
      setEditDialogOpen(false);
      return;
    }

    try {
      setSaving(true); 
      const response = await api.put(`/api/files/${file.id}`, {
        filename: newName.trim(),
      });
      onFileUpdated &&
        onFileUpdated({ ...file, name: newName.trim(), filename: newName.trim() });
      setEditDialogOpen(false);
      onSuccess && onSuccess('File renamed successfully');
    } catch (error) {
      console.error('Error updating file:', error);
      setError(error.response?.data?.detail || 'Failed to rename file');
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
      await api.delete(`/api/files/${file.id}`);
      setDeleteDialogOpen(false);
      onFileDeleted && onFileDeleted(file.id);
      onSuccess && onSuccess('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      setDeleteDialogOpen(false);
      onError && onError(error.response?.data?.detail || 'Failed to delete file');
    }
  };

  return (
    <>
      <Card variant="outlined">
        <CardActionArea onClick={() => onFileClick(file)}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileIcon color="action" fontSize="large" />
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle1" noWrap>
                {file.name || file.filename}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {formatFileSize(file.file_size)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClick(file);
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canEdit && (
                <Tooltip title="Rename File">
                  <IconButton size="small" onClick={handleEditOpen}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDelete && (
                <Tooltip title="Delete File">
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
        <DialogTitle>Rename File</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="File Name"
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
        title="Delete File"
        message={`Are you sure you want to delete the file "${file.name || file.filename}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Delete"
        confirmColor="error"
      />

    </>
  );
}
