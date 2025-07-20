import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { instance } from '../api/axios';
import { Container, Typography, Box, CircularProgress, Alert, Card, CardContent, CardHeader, Divider } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Функция для получения данных статистики по фотографиям пользователя
const fetchStats = async () => {
  const response = await instance.get('/api/photos/my-photos');
  const photos = response.data.photos;
  
  // Для каждой фотографии получаем статистику
  const statsPromises = photos.map(photo => 
    instance.get(`/api/stats/photo/${photo._id}`).then(res => ({
      photoId: photo._id,
      filePath: photo.filePath,
      stats: res.data.stats
    })));
  
  return Promise.all(statsPromises);
};

// Цвета для круговой диаграммы
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Компонент страницы статистики
const MyStatsPage = () => {
  const { data, isLoading, isError, error } = useQuery(['stats'], fetchStats, {
    staleTime: 60000, // Данные считаются свежими 1 минуту
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedPhoto(data[0]);
    }
  }, [data]);

  // Обработка состояния загрузки
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Обработка состояния ошибки
  if (isError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Ошибка загрузки данных: {error.message}
        </Alert>
      </Container>
    );
  }

  // Если данных нет или список пустой
  if (!data || data.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          У вас нет загруженных фотографий для отображения статистики.
        </Alert>
      </Container>
    );
  }

  // Данные для графиков по выбранной фотографии
  const genderData = selectedPhoto ? [
    { name: 'Мужчины', value: selectedPhoto.stats.byGender.male },
    { name: 'Женщины', value: selectedPhoto.stats.byGender.female },
    { name: 'Другие', value: selectedPhoto.stats.byGender.other },
  ] : [];

  const ageData = selectedPhoto ? [
    { name: 'До 20', value: selectedPhoto.stats.byAge.under20 },
    { name: '20-30', value: selectedPhoto.stats.byAge.between20and30 },
    { name: 'Старше 30', value: selectedPhoto.stats.byAge.over30 },
  ] : [];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Статистика по вашим фотографиям
      </Typography>

      <Box sx={{ display: 'flex', overflowX: 'auto', mb: 2 }}>
        {data.map(photo => (
          <Box
            key={photo.photoId}
            sx={{ 
              minWidth: 100, 
              margin: 1, 
              cursor: 'pointer', 
              border: selectedPhoto?.photoId === photo.photoId ? '2px solid #1976d2' : 'none',
              borderRadius: 1,
              overflow: 'hidden'
            }}
            onClick={() => setSelectedPhoto(photo)}
          >
            <img 
              src={photo.filePath} 
              alt="Фотография" 
              style={{ width: '100%', height: 'auto', display: 'block' }} 
            />
          </Box>
        ))}
      </Box>

      {selectedPhoto && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardHeader title={`Статистика для фотографии`} subheader={`Всего оценок: ${selectedPhoto.stats.total}`} />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Распределение по полу
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `Оценок: ${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Распределение по возрасту" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `Оценок: ${value}`} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Возрастная группа" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
};

export default MyStatsPage;
