import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  Warning as WarningIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import api from '../../api/axios';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILES = 100;

export default function FileUploadDialog({ open, onClose, folder, onUploadComplete, initialFiles = [] }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [folderInputRef, setFolderInputRef] = useState(null);


  useEffect(() => {
    if (open && initialFiles.length > 0) {
      const mapped = initialFiles.map(file => ({
        file,
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0,
        isFolder: Boolean(file.webkitRelativePath && file.webkitRelativePath.includes('/')),
        path: file.webkitRelativePath || file.name
      }));
      setFiles(mapped);
    }
    if (open && initialFiles.length === 0) {
      setFiles([]); 
    }
  }, [open, initialFiles]);

  const handleFolderUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      isFolder: Boolean(file.webkitRelativePath && file.webkitRelativePath.includes('/')),
      path: file.webkitRelativePath || file.name
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles) => {
      setFiles(prev => [
        ...prev,
        ...acceptedFiles.map(file => ({
          file,
          name: file.name,
          size: file.size,
          status: 'pending',
          progress: 0,
          isFolder: Boolean(file.webkitRelativePath && file.webkitRelativePath.includes('/')),
          path: file.path || file.name
        }))
      ]);
      console.log('Dropped files:', acceptedFiles);
    }, []),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.tif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.oasis.opendocument.presentation': ['.odp'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      'application/x-tar': ['.tar'],
      'application/gzip': ['.gz'],
      'application/x-bzip2': ['.bz2'],
      'text/html': ['.html', '.htm'],
      'text/css': ['.css'],
      'text/javascript': ['.js'],
      'application/json': ['.json'],
      'text/xml': ['.xml'],
      'text/yaml': ['.yaml', '.yml'],
      'text/markdown': ['.md'],
      'text/x-sql': ['.sql'],
      'application/x-sh': ['.sh'],
      'application/x-bat': ['.bat'],
      'application/x-powershell': ['.ps1'],
      'application/postscript': ['.ai', '.psd', '.eps'],
      'application/x-coreldraw': ['.cdr'],
      'application/x-indesign': ['.indd'],
      'application/x-sketch': ['.sketch'],
      'application/x-figma': ['.fig'],
      'application/dwg': ['.dwg', '.dxf'],
      'application/step': ['.stp', '.step'],
      'application/iges': ['.iges'],
      'application/x-parasolid': ['.x_t', '.x_b'],
      'video/mp4': ['.mp4'],
      'video/avi': ['.avi'],
      'video/quicktime': ['.mov'],
      'video/x-ms-wmv': ['.wmv'],
      'video/x-flv': ['.flv'],
      'video/webm': ['.webm'],
      'video/x-matroska': ['.mkv'],
      'video/x-m4v': ['.m4v'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/flac': ['.flac'],
      'audio/aac': ['.aac'],
      'audio/ogg': ['.ogg'],
      'audio/x-ms-wma': ['.wma'],
      'audio/x-m4a': ['.m4a'],
      'application/x-executable': ['.exe'],
      'application/x-msi': ['.msi'],
      'application/x-apple-diskimage': ['.dmg'],
      'application/x-pkg': ['.pkg'],
      'application/vnd.debian.binary-package': ['.deb'],
      'application/x-rpm': ['.rpm'],
      'application/vnd.android.package-archive': ['.apk']
    },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    maxFiles: MAX_FILES,
    noClick: false
  });

  const validateFiles = () => {
    for (let fileObj of files) {
      const file = fileObj.file;

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File ${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB)`);
        return false;
      }
    }
    return true;
  };

  const handleUpload = async () => {
    if (!folder) {
      setError('No folder selected. Please select a folder first.');
      return;
    }
    if (!validateFiles()) {
      return;
    }
    setUploading(true);
    setError('');
    setProgress(0);
    try {
      const formData = new FormData();
      files.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });

      const response = await api.post(`/api/files/upload?folder_id=${folder.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      setFiles(prev => prev.map(fileObj => ({
        ...fileObj,
        status: 'success',
        progress: 100
      })));

      onUploadComplete(response.data);

      if (window.refreshDriveView) {
        window.refreshDriveView();
      }
      handleClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
      setFiles(prev => prev.map(fileObj => ({
        ...fileObj,
        status: 'error'
      })));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setProgress(0);
    setError('');
    setUploading(false);
    setActiveTab(0);
    onClose();
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status, isFolder) => {
    if (isFolder) return <FolderIcon />;
    switch (status) {
      case 'success': return <SuccessIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <FileIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Files & Folders</DialogTitle>
      <DialogContent>
        {!folder && (
          <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
            No folder selected. Please select a folder first to upload files.
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Files" />
          <Tab label="Folders" />
        </Tabs>

        {activeTab === 1 && folder && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderUpload}
              style={{ display: 'none' }}
              ref={(el) => setFolderInputRef(el)}
            />
            <Button
              variant="outlined"
              onClick={() => folderInputRef?.click()}
              startIcon={<FolderIcon />}
              sx={{ mb: 2 }}
            >
              Select Folder to Upload
            </Button>
            <Typography variant="body2" color="text.secondary">
              This will upload the entire folder structure with all files
            </Typography>
          </Box>
        )}

        {activeTab === 0 && (
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              mb: 2,
              backgroundColor: isDragActive ? 'action.hover' : 'transparent',
              transition: 'all 0.2s',
              cursor: folder ? 'pointer' : 'not-allowed',
              opacity: folder ? 1 : 0.5
            }}
          >
            <input {...getInputProps()} disabled={!folder} />
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            {isDragActive ? (
              <Typography variant="h6" color="primary">Drop files and folders here...</Typography>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  {folder ? 'Drag & drop files and folders here' : 'Select a folder first'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {folder ? 'or click to select files and folders' : 'to upload files'}
                </Typography>
                {folder && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    All file types supported (max {MAX_FILE_SIZE_MB}MB each, up to {MAX_FILES} files)
                  </Typography>
                )}
              </>
            )}
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>Uploading files...</Typography>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption">{progress}%</Typography>
          </Box>
        )}

        {files.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Files to Upload ({files.length})
            </Typography>
            <List dense>
              {files.map((fileObj, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getStatusIcon(fileObj.status, fileObj.isFolder)}
                  </ListItemIcon>
                  <ListItemText
                    primary={fileObj.name}
                    secondary={formatFileSize(fileObj.size)}
                  />
                  <Chip
                    label={fileObj.isFolder ? 'Folder' : fileObj.status.toUpperCase()}
                    size="small"
                    sx={{borderRadius:1}}
                    color={
                      fileObj.status === 'success' ? 'success' :
                        fileObj.status === 'error' ? 'error' : 'default'
                    }
                  />

                  {!uploading && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeFile(index)}
                      sx={{ ml: 1 }}
                    >
                      Remove
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={uploading || files.length === 0 || !folder}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 