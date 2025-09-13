import React from 'react';
import { Button, Container, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h3" gutterBottom>ATC Drive</Typography>
      <Typography variant="body1" gutterBottom>Welcome to ATC Drive. Please login or register to continue.</Typography>
      <Stack spacing={2} direction="row" sx={{ mt: 4 }}>
        <Button variant="contained" onClick={() => navigate('/login')}>Login</Button>
        <Button variant="outlined" onClick={() => navigate('/register')}>Register</Button>
        <Button variant="text" onClick={() => navigate('/drive')}>Drive</Button>
      </Stack>
    </Container>
  );
} 