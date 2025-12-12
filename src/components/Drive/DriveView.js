import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Breadcrumbs,
  Link,
  Button,
  Stack,
  Alert,
  Tooltip,
  Fab,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CreateNewFolder as NewFolderIcon,
  NavigateNext as NavigateNextIcon,
  ViewList as ListIcon,
  Apps as GridIcon,
  Search as SearchIcon,
  DragIndicator as DragIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../api/axios';
import FolderCard from './FolderCard';
import FileCard from './FileCard';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

export default function DriveView({ currentFolder, onFolderClick, onFileClick, onUpload, onCreateFolder }) {
  const [items, setItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragDropEnabled, setDragDropEnabled] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [editError, setEditError] = useState('');
  const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const { user } = useAuth();

  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const canDelete = user?.role === 'admin';

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSearch = async (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await api.get(`/api/search/?q=${encodeURIComponent(query)}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = isSearching ? searchResults.map(r => ({ ...r, filename: r.name })) : items;
    return filtered;
  }, [items, searchResults, isSearching]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        if (!currentFolder) {
          setUploadError('Please select a folder first to upload files');
          return;
        }
        onUpload(acceptedFiles);
      }
    },
    noClick: true
  });

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const folderId = currentFolder?.id;

      const [foldersRes, filesRes] = await Promise.all([
        api.get(folderId ? `/api/folders/?parent_id=${folderId}` : `/api/folders/`),
        api.get(folderId ? `/api/files/?folder_id=${folderId}` : `/api/files/`)
      ]);

      const folders = foldersRes?.data.map(f => ({ ...f, type: 'folder' }));
      const files = filesRes?.data.map(f => ({ ...f, type: 'file' }));

      setItems([...folders, ...files]);
    } catch (error) {
      console.error('Error fetching items:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to fetch items';
      setError(errorMessage === 'Insufficient permissions'
        ? 'You do not have access to view these folders or files. Contact an admin for access.'
        : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const { handleDragStart, handleDragOver, handleDrop } = useDragAndDrop(
    items,
    setItems,
    setError,
    fetchItems
  );

  useEffect(() => {
    if (currentFolder !== undefined) {
      setItems([]);
      fetchItems();
      updateBreadcrumbs();
    }
  }, [currentFolder]);

  useEffect(() => {
    window.refreshDriveView = fetchItems;
  }, []);

  const updateBreadcrumbs = async () => {
    try {
      const crumbs = [];

      if (!currentFolder) {
        crumbs.push({ id: 'root', name: 'My Drive' });
        setBreadcrumbs(crumbs);
        return;
      }

      crumbs.unshift({ id: currentFolder.id, name: currentFolder.name });

      const getParentId = (folder) => {
        if (!folder) return null;
        if (typeof folder.parent === 'object' && folder.parent !== null) return folder.parent.id;
        if (typeof folder.parent === 'string' || typeof folder.parent === 'number') return folder.parent;
        if (folder.parent_id) return folder.parent_id;
        if (folder.parentId) return folder.parentId;
        return null;
      };

      let parentId = getParentId(currentFolder);

      while (parentId) {
        try {
          const res = await api.get(`/api/folders/${parentId}`);
          const parentFolder = res.data;
          crumbs.unshift({ id: parentFolder.id, name: parentFolder.name });
          parentId = getParentId(parentFolder);
        } catch (err) {
          console.error('Error fetching parent folder:', err);
          break;
        }
      }

      crumbs.unshift({ id: 'root', name: 'My Drive' });
      setBreadcrumbs(crumbs);
    } catch (err) {
      console.error('Error building breadcrumbs:', err);
      setBreadcrumbs([{ id: 'root', name: 'My Drive' }]);
    }
  };

  const handleBreadcrumbClick = async (crumb, index) => {
    if (index < breadcrumbs.length - 1) {
      if (crumb.id === 'root') {
        onFolderClick(null);
        return;
      }

      try {
        const res = await api.get(`/api/folders/${crumb.id}`);
        const folder = res.data;
        onFolderClick(folder);
      } catch (err) {
        console.error('Error fetching folder for breadcrumb navigation:', err);
        onFolderClick({ id: crumb.id, name: crumb.name });
      }
    }
  };

  const handleUploadClick = () => {
    if (!currentFolder) {
      setUploadError('Please select a folder first to upload files');
      return;
    }
    setUploadError('');
    onUpload([]);
  };

  const handleSelectionChange = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleFolderUpdated = (updatedFolder) => {
    setItems(prev => prev.map(item =>
      item.id === updatedFolder.id && item.type === 'folder'
        ? { ...updatedFolder, type: 'folder' }
        : item
    ));
  };

  const handleFolderDeleted = (folderId) => {
    setItems(prev => prev.filter(item => !(item.id === folderId && item.type === 'folder')));
  };

  const handleFileUpdated = (updatedFile) => {
    setItems(prev => prev.map(item =>
      item.id === updatedFile.id && item.type === 'file'
        ? { ...updatedFile, type: 'file' }
        : item
    ));
  };

  const handleFileDeleted = (fileId) => {
    setItems(prev => prev.filter(item => !(item.id === fileId && item.type === 'file')));
  };

  const handleEditOpen = (item, e) => {
    e.stopPropagation();
    setEditItem(item);
    setNewName(item.name || item.filename || '');
    setEditError('');
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditItem(null);
    setNewName('');
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!newName.trim() || newName === (editItem.name || editItem.filename)) {
      handleEditClose();
      return;
    }
    try {
      if (editItem.type === 'folder') {
        await api.put(`/api/folders/${editItem.id}`, {
          name: newName.trim(),
        });
        handleFolderUpdated({ ...editItem, name: newName.trim() });
        setSuccessMsg('Folder renamed successfully');
      } else {
        await api.put(`/api/files/${editItem.id}`, {
          filename: newName.trim(),
        });
        handleFileUpdated({ ...editItem, name: newName.trim(), filename: newName.trim() });
        setSuccessMsg('File renamed successfully');
      }
      handleEditClose();
    } catch (error) {
      console.error('Error updating item:', error);
      setEditError(error.response?.data?.detail || 'Failed to rename item');
    }
  };

  const handleDeleteOpen = (item, e) => {
    e.stopPropagation();
    setDeleteItem(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === 'folder') {
        await api.delete(`/api/folders/${deleteItem.id}`);
        handleFolderDeleted(deleteItem.id);
        setSuccessMsg('Folder deleted successfully');
      } else {
        await api.delete(`/api/files/${deleteItem.id}`);
        handleFileDeleted(deleteItem.id);
        setSuccessMsg('File deleted successfully');
      }
      setDeleteDialogOpen(false);
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.response?.data?.detail || `Failed to delete ${deleteItem.type}`);
      setDeleteDialogOpen(false);
      setDeleteItem(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        {breadcrumbs.map((crumb, index) => (
          <Link
            key={crumb.id}
            color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
            onClick={() => handleBreadcrumbClick(crumb, index)}
            sx={{ cursor: index < breadcrumbs.length - 1 ? 'pointer' : 'default' }}
          >
            {crumb.name}
          </Link>
        ))}
      </Breadcrumbs>

      {uploadError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
          {uploadError}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        {user?.role !== 'viewer' && (
          <>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
              disabled={!currentFolder}
            >
              Upload Files
            </Button>
            <Button
              variant="outlined"
              startIcon={<NewFolderIcon />}
              onClick={onCreateFolder}
            >
              New Folder
            </Button>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Grid View">
          <IconButton
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <GridIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="List View">
          <IconButton
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ListIcon />
          </IconButton>
        </Tooltip>
        <TextField
          size="small"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 200 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={dragDropEnabled}
              onChange={(e) => setDragDropEnabled(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DragIcon fontSize="small" />
              <Typography variant="body2">Drag Sort</Typography>
            </Box>
          }
        />
      </Stack>

      {user?.role !== 'viewer' && (
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            mb: 3,
            backgroundColor: isDragActive ? 'action.hover' : 'transparent',
            transition: 'all 0.2s',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: currentFolder ? 1 : 0.5
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography variant="h6" color="primary">Drop files and folders here...</Typography>
          ) : (
            <Typography variant="body1" color="text.secondary">
              {currentFolder
                ? "Drag & drop files and folders here to upload"
                : "Select a folder first to upload files"
              }
            </Typography>
          )}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredAndSortedItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No files or folders here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'viewer'
              ? 'You may not have access to any folders or files. Contact an admin for access.'
              : 'Upload files or create a folder to get started'}
          </Typography>
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredAndSortedItems.map((item, index) => (
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3} 
              key={item.id}
              draggable={dragDropEnabled}
              onDragStart={dragDropEnabled ? (e) => handleDragStart(e, item, index) : undefined}
              onDragOver={dragDropEnabled ? handleDragOver : undefined}
              onDrop={dragDropEnabled ? (e) => handleDrop(e, index) : undefined}
              sx={{ cursor: dragDropEnabled ? 'move' : 'default' }}
            >
              {item.type === 'folder' ? (
                <FolderCard
                  folder={item}
                  onFolderClick={onFolderClick}
                  onSelectionChange={handleSelectionChange}
                  selected={selectedItems.includes(item.id)}
                  onFolderUpdated={handleFolderUpdated}
                  onFolderDeleted={handleFolderDeleted}
                  canEdit={user?.role === 'admin' || user?.role === 'editor'}
                  canDelete={user?.role === 'admin'}
                  onSuccess={setSuccessMsg}
                  onError={setError}
                />
              ) : (
                <FileCard
                  file={item}
                  onFileClick={onFileClick}
                  onSelectionChange={handleSelectionChange}
                  selected={selectedItems.includes(item.id)}
                  onFileUpdated={handleFileUpdated}
                  onFileDeleted={handleFileDeleted}
                  canEdit={user?.role === 'admin' || user?.role === 'editor'}
                  canDelete={user?.role === 'admin'}
                  onSuccess={setSuccessMsg}
                  onError={setError}
                />
              )}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Modified</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedItems.map((item, index) => (
                  <TableRow 
                    key={item.id} 
                    hover 
                    selected={selectedItems.includes(item.id)}
                    draggable={dragDropEnabled}
                    onDragStart={dragDropEnabled ? (e) => handleDragStart(e, item, index) : undefined}
                    onDragOver={dragDropEnabled ? handleDragOver : undefined}
                    onDrop={dragDropEnabled ? (e) => handleDrop(e, index) : undefined}
                    sx={{ cursor: dragDropEnabled ? 'move' : 'default' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.type === 'folder' ? <FolderIcon color="primary" /> : <FileIcon />}
                        <Typography
                          sx={{ ml: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => item.type === 'folder' ? onFolderClick(item) : onFileClick(item)}
                        >
                          {item.name || item.filename}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.type.toUpperCase()}
                        size="small"
                        sx={{ borderRadius: 1 }}
                        color={item.type === 'folder' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {item.type === 'folder' ? '-' : formatFileSize(item.file_size || 0)}
                    </TableCell>
                    <TableCell>
                      {item.updated_at || item.created_at ?
                        new Date(item.updated_at || item.created_at).toLocaleDateString() :
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {item.type === 'folder' ? (
                          <>
                            {canEdit && (
                              <Tooltip title="Rename Folder">
                                <IconButton size="small" onClick={(e) => handleEditOpen(item, e)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Delete Folder">
                                <IconButton size="small" color="error" onClick={(e) => handleDeleteOpen(item, e)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <>
                            <Tooltip title="Download">
                              <IconButton size="small" onClick={() => onFileClick(item)}>
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            {canEdit && (
                              <Tooltip title="Rename File">
                                <IconButton size="small" onClick={(e) => handleEditOpen(item, e)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Delete File">
                                <IconButton size="small" color="error" onClick={(e) => handleDeleteOpen(item, e)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="xs" fullWidth>
        <DialogTitle>Rename {editItem?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError('')}>
              {editError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label={editItem?.type === 'folder' ? 'Folder Name' : 'File Name'}
            type="text"
            fullWidth
            variant="standard"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleEditSave();
              }
              if (e.key === 'Escape') {
                handleEditClose();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={!newName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={`Delete ${deleteItem?.type === 'folder' ? 'Folder' : 'File'}`}
        message={`Are you sure you want to delete the ${deleteItem?.type} "${deleteItem?.name || deleteItem?.filename}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeleteItem(null);
        }}
        confirmText="Delete"
        confirmColor="error"
      />

      {user?.role !== 'viewer' && (
        <Fab
          color="primary"
          aria-label="upload"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleUploadClick}
          disabled={!currentFolder}
        >
          <UploadIcon />
        </Fab>
      )}

      <Snackbar
        open={error !== ''}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert
          onClose={() => setError('')}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
