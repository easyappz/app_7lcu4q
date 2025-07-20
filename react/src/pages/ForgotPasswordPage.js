import React, { useState } from 'react';
import { instance } from '../api/axios';
import { TextField, Button, Box, Typography, Container, Alert } from '@mui/material';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await instance.post('/api/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка сброса пароля');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Сброс пароля
        </Typography>
        {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Сбросить пароль
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button href="/login" size="small">
              Войти
            </Button>
            <Button href="/register" size="small">
              Регистрация
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default ForgotPasswordPage;
