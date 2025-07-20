import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { TextField, Button, Box, Typography, Container, Alert, AlertTitle, CircularProgress, Paper } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

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
        const serverMessage = err.response.data?.message || '';
        const additionalDetails = err.response.data?.details || '';

        if (status === 400) {
          errorMessage = 'Неверный email или пароль. Проверьте введенные данные.';
          if (serverMessage) {
            errorMessage = serverMessage;
          }
          if (additionalDetails) {
            errorMessage += ` Дополнительно: ${additionalDetails}`;
          }
        } else if (status === 401) {
          errorMessage = 'Доступ запрещен. Неверные учетные данные.';
          if (serverMessage) {
            errorMessage = serverMessage;
          }
        } else if (status === 403) {
          errorMessage = 'Доступ запрещен. Ваш аккаунт заблокирован.';
          if (serverMessage) {
            errorMessage = serverMessage;
          }
        } else if (status === 500) {
          errorMessage = 'Внутренняя ошибка сервера. Мы уже работаем над решением проблемы. Пожалуйста, попробуйте позже.';
          if (serverMessage) {
            errorMessage += ` Дополнительная информация: ${serverMessage}`;
          }
        } else {
          errorMessage = serverMessage || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Ошибка сети. Проверьте ваше подключение к интернету и попробуйте снова.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={6} sx={{ marginTop: 10, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LockOutlined sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            Вход
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%', maxHeight: '200px', overflow: 'auto', borderRadius: 1 }}>
            <AlertTitle>Ошибка</AlertTitle>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2, width: '100%' }}>
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
            variant="outlined"
            sx={{ borderRadius: 1 }}
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
            variant="outlined"
            sx={{ borderRadius: 1 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, padding: '12px 0', fontSize: '16px', fontWeight: 'bold', borderRadius: 1 }}
            disabled={isLoading}
            color="primary"
            startIcon={isLoading ? <CircularProgress size={24} /> : null}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button href="/forgot-password" size="small" disabled={isLoading} color="primary">
              Забыли пароль?
            </Button>
            <Button href="/register" size="small" disabled={isLoading} color="primary">
              Регистрация
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;
