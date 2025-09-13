import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

export default function ShareDialog({ file, onClose }) {
  if (!file) return null;
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: file.filename,
        url: file.downloadUrl,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(file.downloadUrl)}`);
    }
  };
  return (
    <Dialog open={!!file} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Share File</DialogTitle>
      <DialogContent>
        <Typography>File: {file.filename}</Typography>
        <Box sx={{ mt: 2 }}>
          <Button href={file.downloadUrl} target="_blank" variant="contained">Download</Button>
          {isMobile() && (
            <Button onClick={handleShare} sx={{ ml: 2 }} variant="outlined">Share</Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 