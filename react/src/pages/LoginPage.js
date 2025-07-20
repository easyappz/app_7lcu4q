import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { TextField, Button, Box, Typography, Container, Alert, AlertTitle } from '@mui/material';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await instance.post('/api/login', { email, password });
      if (response.data.user && response.data.token) {
        login(response.data.user, response.data.token);
        navigate('/rate');
      } else {
        setError('Ошибка: Неверные данные пользователя');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Произошла ошибка при входе. Пожалуйста, попробуйте снова.';
      if (err.response) {
        const status = err.response.status;
        if (status === 400) {
          errorMessage = 'Неверный email или пароль. Проверьте введенные данные.';
        } else if (status === 401) {
          errorMessage = 'Доступ запрещен. Неверные учетные данные.';
        } else if (status === 500) {
          errorMessage = 'Ошибка сервера. Пожалуйста, попробуйте позже.';
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Вход
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            <AlertTitle>Ошибка</AlertTitle>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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
            disabled={isLoading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Пароль"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button href="/forgot-password" size="small" disabled={isLoading}>
              Забыли пароль?
            </Button>
            <Button href="/register" size="small" disabled={isLoading}>
              Регистрация
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default LoginPage;
