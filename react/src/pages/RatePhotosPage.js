import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button, Card, CardMedia, CardContent, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Alert, Snackbar } from '@mui/material';

function RatePhotosPage() {
  const { user, updatePoints } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  const [ratedPhotos, setRatedPhotos] = useState(new Set());
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
        const newPhoto = response.data.photos[0];
        setPhoto(newPhoto);
        // Check if this photo was already rated in the current session
        if (ratedPhotos.has(newPhoto._id)) {
          setSnackbar({
            open: true,
            message: 'Вы уже оценили эту фотографию',
            severity: 'info'
          });
        }
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
    if (!photo || ratedPhotos.has(photo._id)) {
      setSnackbar({
        open: true,
        message: 'Вы уже оценили эту фотографию',
        severity: 'info'
      });
      return;
    }
    try {
      await instance.post('/api/photos/rate', { photoId: photo._id });
      // Update user points (+1 for rating)
      updatePoints(user.points + 1);
      // Mark photo as rated in the current session
      setRatedPhotos((prev) => new Set(prev).add(photo._id));
      // Show success message
      setSnackbar({
        open: true,
        message: 'Оценка учтена! +1 балл',
        severity: 'success'
      });
      // Fetch new photo
      fetchPhoto();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Ошибка при оценке фотографии';
      if (err.response?.status === 400 && errorMessage.includes('already rated')) {
        setSnackbar({
          open: true,
          message: 'Вы уже оценили эту фотографию',
          severity: 'info'
        });
        setRatedPhotos((prev) => new Set(prev).add(photo._id));
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ mt: 4, px: { xs: 2, sm: 0 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Оценить фотографии
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
        Текущие баллы: {user?.points || 0}
      </Typography>

      <Box sx={{ mb: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
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
                sx={{ borderRadius: 1 }}
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
              sx={{ borderRadius: 1 }}
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
              sx={{ borderRadius: 1 }}
            />
          </Grid>
        </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>}

      {loading ? (
        <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Загрузка...</Typography>
      ) : photo ? (
        <Card sx={{ maxWidth: 500, margin: '0 auto', borderRadius: 3, boxShadow: 3 }}>
          <CardMedia
            component="img"
            height="400"
            image={photo.filePath}
            alt="Фото для оценки"
            sx={{ objectFit: 'cover', borderTopLeftRadius: 3, borderTopRightRadius: 3 }}
          />
          <CardContent sx={{ p: 3 }}>
            <Typography gutterBottom variant="h6" component="div" sx={{ color: 'text.primary' }}>
              Возраст: {photo.age}, Пол: {photo.gender}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRate} 
              disabled={ratedPhotos.has(photo._id)}
              sx={{ mt: 2, borderRadius: 1, textTransform: 'none', fontSize: '1rem', px: 4 }}
            >
              Оценить (+1 балл)
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          Фотографии для оценки не найдены.
        </Typography>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RatePhotosPage;
