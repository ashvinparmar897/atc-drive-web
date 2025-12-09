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
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CreateNewFolder as NewFolderIcon,
  NavigateNext as NavigateNextIcon,
  ViewList as ListIcon,
  Apps as GridIcon,
  Search as SearchIcon,
  Sort as SortIcon,
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
import { useAuth } from '../../contexts/AuthContext';

export default function DriveView({ currentFolder, onFolderClick, onFileClick, onUpload, onCreateFolder }) {
  const [items, setItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [editError, setEditError] = useState('');
  const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState(null);
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

  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = items;
    if (searchQuery) {
      filtered = items.filter(item => {
        const searchTerm = searchQuery.toLowerCase();
        const itemName = (item.name || item.filename || '').toLowerCase();
        return itemName.includes(searchTerm);
      });
    }

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = (a.name || a.filename || '').toLowerCase();
          bValue = (b.name || b.filename || '').toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'size':
          aValue = a.file_size || 0;
          bValue = b.file_size || 0;
          break;
        case 'modified':
          aValue = new Date(a.updated_at || a.created_at || 0);
          bValue = new Date(b.updated_at || b.created_at || 0);
          break;
        default:
          aValue = a.name || a.filename || '';
          bValue = b.name || b.filename || '';
      }
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return filtered;
  }, [items, searchQuery, sortBy, sortOrder]);

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
      } else {
        await api.put(`/api/files/${editItem.id}`, {
          filename: newName.trim(),
        });
        handleFileUpdated({ ...editItem, name: newName.trim(), filename: newName.trim() });
      }
      handleEditClose();
    } catch (error) {
      console.error('Error updating item:', error);
      setEditError(error.response?.data?.detail || 'Failed to rename item');
    }
  };

  const handleDelete = async (item, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the ${item.type} "${item.name || item.filename}"?`)) {
      try {
        if (item.type === 'folder') {
          await api.delete(`/api/folders/${item.id}`);
          handleFolderDeleted(item.id);
        } else {
          await api.delete(`/api/files/${item.id}`);
          handleFileDeleted(item.id);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        setError(error.response?.data?.detail || `Failed to delete ${item.type}`);
      }
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
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 200 }}
        />

        <Tooltip title="Sort">
          <IconButton onClick={(e) => setSortMenuAnchorEl(e.currentTarget)}>
            <SortIcon />
          </IconButton>

        </Tooltip>

        <Menu
          anchorEl={sortMenuAnchorEl}
          open={Boolean(sortMenuAnchorEl)}
          onClose={() => setSortMenuAnchorEl(null)}
        >
          <MenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); setSortMenuOpen(false); }}>
            Name (A-Z)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('name'); setSortOrder('desc'); setSortMenuOpen(false); }}>
            Name (Z-A)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('type'); setSortOrder('asc'); setSortMenuOpen(false); }}>
            Type (A-Z)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('size'); setSortOrder('asc'); setSortMenuOpen(false); }}>
            Size (Small to Large)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('size'); setSortOrder('desc'); setSortMenuOpen(false); }}>
            Size (Large to Small)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('modified'); setSortOrder('desc'); setSortMenuOpen(false); }}>
            Modified (Newest First)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('modified'); setSortOrder('asc'); setSortMenuOpen(false); }}>
            Modified (Oldest First)
          </MenuItem>
        </Menu>
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
          {filteredAndSortedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
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
                {filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id} hover selected={selectedItems.includes(item.id)}>
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
                                <IconButton size="small" color="error" onClick={(e) => handleDelete(item, e)}>
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
                                <IconButton size="small" color="error" onClick={(e) => handleDelete(item, e)}>
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
      {/* {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredAndSortedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
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
                {filteredAndSortedItems.map((item) => (
                  <TableRow key={item.id} hover selected={selectedItems.includes(item.id)}>
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
                        sx={{borderRadius: 1}}
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
                                <IconButton size="small" color="error" onClick={(e) => handleDelete(item, e)}>
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
                                <IconButton size="small" color="error" onClick={(e) => handleDelete(item, e)}>
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

      {items.length === 0 && !loading && (
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
      )} */}

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
    </Box>
  );
}