import React, { useState } from 'react';
import { TextField, Button, Box, Alert, Link } from '@mui/material';

export default function RegisterForm({ onSubmit, error, success }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, password);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField label="Username" fullWidth margin="normal" value={username} onChange={e => setUsername(e.target.value)} required />
      <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} required />
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Register</Button>
      <Box sx={{ mt: 2 }}>
        <Link href="/login">Already have an account? Login</Link>
      </Box>
    </Box>
  );
} 