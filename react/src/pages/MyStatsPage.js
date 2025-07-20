import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Alert, Grid, Card, CardContent, CardMedia, ButtonGroup, Button } from '@mui/material';
import { instance } from '../api/axios';

function MyStatsPage() {
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchMyPhotos = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await instance.get('/api/photos/my-photos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setPhotos(response.data.photos);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при загрузке ваших фото');
    }
  };

  const fetchStats = async (photoId) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await instance.get(`/api/stats/photo/${photoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setStats(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при загрузке статистики');
    }
  };

  const handleToggleActive = async (photoId, isActive) => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      await instance.post('/api/photos/toggle-active', { photoId, isActive }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchMyPhotos();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при изменении статуса фото');
    }
  };

  useEffect(() => {
    fetchMyPhotos();
  }, []);

  useEffect(() => {
    if (selectedPhoto) {
      fetchStats(selectedPhoto._id);
    }
  }, [selectedPhoto]);

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
          Статистика по вашим фотографиям
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box sx={{ width: '100%', mt: 3 }}>
          <Grid container spacing={2}>
            {photos.length > 0 ? (
              photos.map((photo) => (
                <Grid item xs={12} sm={6} md={4} key={photo._id}>
                  <Card sx={{ maxWidth: 345 }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={photo.filePath}
                      alt="Ваше фото"
                    />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Статус: {photo.isActive ? 'Активно' : 'Неактивно'}
                      </Typography>
                      <ButtonGroup fullWidth sx={{ mt: 2 }}>
                        <Button
                          variant={photo.isActive ? 'contained' : 'outlined'}
                          onClick={() => handleToggleActive(photo._id, true)}
                          disabled={photo.isActive}
                        >
                          Включить
                        </Button>
                        <Button
                          variant={!photo.isActive ? 'contained' : 'outlined'}
                          onClick={() => handleToggleActive(photo._id, false)}
                          disabled={!photo.isActive}
                        >
                          Выключить
                        </Button>
                      </ButtonGroup>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 1 }}
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        Показать статистику
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography variant="body1" align="center" sx={{ width: '100%' }}>
                У вас пока нет загруженных фотографий.
              </Typography>
            )}
          </Grid>
          {selectedPhoto && stats && (
            <Box sx={{ mt: 4, p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Статистика для фото
              </Typography>
              <Typography variant="body1">
                Всего оценок: {stats.total}
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                По полу:
                <ul>
                  <li>Мужчины: {stats.byGender.male}</li>
                  <li>Женщины: {stats.byGender.female}</li>
                  <li>Другие: {stats.byGender.other}</li>
                </ul>
              </Typography>
              <Typography variant="body1">
                По возрасту:
                <ul>
                  <li>Младше 20: {stats.byAge.under20}</li>
                  <li>20-30 лет: {stats.byAge.between20and30}</li>
                  <li>Старше 30: {stats.byAge.over30}</li>
                </ul>
              </Typography>
              <Button
                variant="contained"
                onClick={() => setSelectedPhoto(null)}
                sx={{ mt: 2 }}
              >
                Закрыть статистику
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default MyStatsPage;
