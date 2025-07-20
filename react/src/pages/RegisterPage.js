import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { TextField, Button, Box, Typography, Container, Alert } from '@mui/material';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await instance.post('/api/register', { email, password });
      login(response.data.user, response.data.token);
      navigate('/rate');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Регистрация
        </Typography>
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
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Пароль"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Зарегистрироваться
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button href="/login" size="small">
              Уже есть аккаунт? Войти
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default RegisterPage;
