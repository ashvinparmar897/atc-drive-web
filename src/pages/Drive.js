import React, { useState, useEffect } from 'react';
import { Container, Box, Snackbar, Alert, Tabs, Tab } from '@mui/material';
import DriveLayout from '../components/Drive/DriveLayout';
import DriveView from '../components/Drive/DriveView';
import CreateFolderDialog from '../components/Drive/CreateFolderDialog';
import FileUploadDialog from '../components/Drive/FileUploadDialog';
import ShareDialog from '../components/Drive/ShareDialog';
import AdminPanel from '../components/Admin/AdminPanel';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

export default function Drive() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const { logout, user } = useAuth();

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
  };

  const handleFileClick = async (file) => {
    try {
      // Download the file
      const response = await api.get(`/api/files/${file.id}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: `Downloading ${file.filename}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Download failed:', error);
      setSnackbar({
        open: true,
        message: 'Download failed. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleUpload = (files) => {
    if (!currentFolder) {
      setSnackbar({
        open: true,
        message: 'Please select a folder first to upload files',
        severity: 'warning'
      });
      return;
    }
    
    if (files.length > 0) {
      setUploadDialogOpen(true);
    } else {
      // Manual file selection
      setUploadDialogOpen(true);
    }
  };

  const handleUploadComplete = (uploadedFiles) => {
    setSnackbar({
      open: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      severity: 'success'
    });
    // Trigger refresh
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFolderCreated = (newFolder) => {
    setSnackbar({
      open: true,
      message: `Folder "${newFolder.name}" created successfully`,
      severity: 'success'
    });
    // Trigger refresh
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <DriveLayout onLogout={handleLogout}>
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Drive" />
            {user?.role === 'admin' && <Tab label="Admin Panel" />}
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <DriveView
            key={refreshTrigger} // Force re-render when refresh is needed
            currentFolder={currentFolder}
            onFolderClick={handleFolderClick}
            onFileClick={handleFileClick}
            onUpload={handleUpload}
            onCreateFolder={() => setCreateFolderOpen(true)}
          />
        )}
        
        {activeTab === 1 && user?.role === 'admin' && (
          <AdminPanel />
        )}
      </Container>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        parentFolder={currentFolder}
        onFolderCreated={handleFolderCreated}
      />

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        folder={currentFolder}
        onUploadComplete={handleUploadComplete}
      />

      <ShareDialog
        file={shareFile}
        onClose={() => setShareFile(null)}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DriveLayout>
  );
} 