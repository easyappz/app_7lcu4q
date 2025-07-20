import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Grid, Card, CardContent, CircularProgress } from '@mui/material';

function MyStatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyPhotos();
  }, [user, navigate]);

  const fetchMyPhotos = async () => {
    setLoading(true);
    try {
      const response = await instance.get('/api/photos/my-photos');
      setPhotos(response.data.photos);
      console.log(response.data.photos);
    } catch (err) {
      console.error('Ошибка загрузки фотографий', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (photoId) => {
    try {
      const response = await instance.get(`/api/stats/photo/${photoId}`);
      return response.data.stats;
    } catch (err) {
      console.error('Ошибка загрузки статистики', err);
      return null;
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Моя статистика
      </Typography>
      <Typography variant="h6" gutterBottom>
        Текущие баллы: {user?.points || 0}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : photos.length > 0 ? (
        <Grid container spacing={3}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} key={photo._id}>
              <Card>
                <Box
                  component="img"
                  sx={{ width: '100%', height: 200, objectFit: 'cover' }}
                  src={photo.filePath}
                  alt="Моя фотография"
                />
                <CardContent>
                  <Typography variant="h6">Возраст: {photo.age}, Пол: {photo.gender}</Typography>
                  <StatsLoader photoId={photo._id} fetchStats={fetchStats} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>У вас нет загруженных фотографий для отображения статистики.</Typography>
      )}
    </Box>
  );
}

function StatsLoader({ photoId, fetchStats }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchStats(photoId);
      setStats(data);
      setLoading(false);
    };
    loadStats();
  }, [photoId, fetchStats]);

  if (loading) {
    return <Typography>Загрузка статистики...</Typography>;
  }

  if (!stats) {
    return <Typography>Ошибка загрузки статистики.</Typography>;
  }

  return (
    <>
      <Typography>Всего оценок: {stats.total}</Typography>
      <Typography>По полу:</Typography>
      <ul>
        <li>Мужчины: {stats.byGender.male}</li>
        <li>Женщины: {stats.byGender.female}</li>
        <li>Другие: {stats.byGender.other}</li>
      </ul>
      <Typography>По возрасту:</Typography>
      <ul>
        <li>Меньше 20: {stats.byAge.under20}</li>
        <li>20-30: {stats.byAge.between20and30}</li>
        <li>Больше 30: {stats.byAge.over30}</li>
      </ul>
    </>
  );
}

export default MyStatsPage;
