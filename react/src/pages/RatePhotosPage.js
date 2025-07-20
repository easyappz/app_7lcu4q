import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button, Card, CardMedia, CardContent, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Alert } from '@mui/material';

function RatePhotosPage() {
  const { user, updatePoints } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    minAge: '',
    maxAge: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPhoto();
  }, [user, navigate, filters]);

  const fetchPhoto = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await instance.get('/api/photos/to-rate', {
        params: filters
      });
      if (response.data.photos.length > 0) {
        setPhoto(response.data.photos[0]);
      } else {
        setPhoto(null);
        setError('Нет фотографий для оценки с заданными фильтрами');
      }
    } catch (err) {
      setError('Ошибка загрузки фотографии');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleRate = async () => {
    if (!photo) return;
    try {
      await instance.post('/api/photos/rate', { photoId: photo._id });
      // Update user points (+1 for rating)
      updatePoints(user.points + 1);
      // Fetch new photo
      fetchPhoto();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при оценке фотографии');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Оценить фотографии
      </Typography>
      <Typography variant="h6" gutterBottom>
        Текущие баллы: {user?.points || 0}
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Фильтры
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Пол</InputLabel>
              <Select
                name="gender"
                value={filters.gender}
                onChange={handleFilterChange}
                label="Пол"
              >
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="male">Мужской</MenuItem>
                <MenuItem value="female">Женский</MenuItem>
                <MenuItem value="other">Другое</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              margin="normal"
              label="Минимальный возраст"
              name="minAge"
              type="number"
              value={filters.minAge}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              margin="normal"
              label="Максимальный возраст"
              name="maxAge"
              type="number"
              value={filters.maxAge}
              onChange={handleFilterChange}
            />
          </Grid>
        </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Typography>Загрузка...</Typography>
      ) : photo ? (
        <Card sx={{ maxWidth: 500, margin: '0 auto' }}>
          <CardMedia
            component="img"
            height="400"
            image={photo.filePath}
            alt="Фото для оценки"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Возраст: {photo.age}, Пол: {photo.gender}
            </Typography>
            <Button variant="contained" color="primary" onClick={handleRate}>
              Оценить (+1 балл)
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Typography>Фотографии для оценки не найдены.</Typography>
      )}
    </Box>
  );
}

export default RatePhotosPage;
