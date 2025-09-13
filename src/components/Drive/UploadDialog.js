import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, LinearProgress, Box, Typography } from '@mui/material';
import axios from 'axios';

const ALLOWED_EXTENSIONS = ["png", "svg", "pdf", "ai", "cdr", "stp", "dwg", "x_t"];
const MAX_FILE_SIZE_MB = 100;
const MAX_FILES = 100;

export default function UploadDialog({ open, onClose, folder, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    setError('');
    if (!folder) return setError('No folder selected');
    if (files.length > MAX_FILES) return setError('Too many files');
    for (let file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) return setError(`File type ${ext} not allowed`);
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return setError('File too large');
    }
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const token = localStorage.getItem('token');
    try {
      await axios.post(`/files/upload?folder_id=${folder.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setFiles([]);
      setProgress(0);
      onUploaded && onUploaded(folder.id);
      onClose();
    } catch (err) {
      setError('Upload failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Files</DialogTitle>
      <DialogContent>
        <input type="file" multiple onChange={handleFileChange} />
        {progress > 0 && <Box sx={{ mt: 2 }}><LinearProgress variant="determinate" value={progress} /></Box>}
        {error && <Typography color="error">{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpload} variant="contained" disabled={!files.length}>Upload</Button>
      </DialogActions>
    </Dialog>
  );
} 