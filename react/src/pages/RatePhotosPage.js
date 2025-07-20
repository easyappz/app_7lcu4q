import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Alert, MenuItem, Select, FormControl, InputLabel, TextField, Grid, Card, CardMedia, CardContent } from '@mui/material';
import { instance } from '../api/axios';

function RatePhotosPage() {
  const [photos, setPhotos] = useState([]);
  const [gender, setGender] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPhotos = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = { gender, minAge, maxAge };
      const response = await instance.get('/api/photos/to-rate', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params,
      });
      setPhotos(response.data.photos);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при загрузке фото');
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchPhotos();
  };

  const handleRate = async (photoId) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await instance.post('/api/photos/rate', { photoId }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setSuccess('Фото оценено!');
      fetchPhotos();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при оценке фото');
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Оценка фотографий
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            {success}
          </Alert>
        )}
        <Box component="form" onSubmit={handleFilterSubmit} sx={{ mt: 3, mb: 3, width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Пол</InputLabel>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  label="Пол"
                >
                  <MenuItem value="">Все</MenuItem>
                  <MenuItem value="male">Мужской</MenuItem>
                  <MenuItem value="female">Женский</MenuItem>
                  <MenuItem value="other">Другой</MenuItem>
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
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                margin="normal"
                label="Максимальный возраст"
                name="maxAge"
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
          >
            Применить фильтры
          </Button>
        </Box>
        <Box sx={{ width: '100%', mt: 3 }}>
          {photos.length > 0 ? (
            photos.map((photo) => (
              <Card key={photo._id} sx={{ maxWidth: 345, margin: 'auto', mb: 2 }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={photo.filePath}
                  alt="Фото для оценки"
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Возраст: {photo.age}, Пол: {photo.gender === 'male' ? 'Мужской' : photo.gender === 'female' ? 'Женский' : 'Другой'}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => handleRate(photo._id)}
                  >
                    Оценить
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body1" align="center">
              Нет фотографий для оценки.
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default RatePhotosPage;
