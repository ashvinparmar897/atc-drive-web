import React, { useState } from 'react';
import { TextField, Button, Box, Alert, Link } from '@mui/material';

export default function LoginForm({ onSubmit, error }) {
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
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Login</Button>
      <Box sx={{ mt: 2 }}>
        <Link href="/forgot-password">Forgot password?</Link> | <Link href="/register">Register</Link>
      </Box>
    </Box>
  );
} 