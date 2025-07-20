import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instance } from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, Alert, Switch, FormControlLabel } from '@mui/material';

function UploadPhotoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myPhotos, setMyPhotos] = useState([]);
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
      setMyPhotos(response.data.photos);
    } catch (err) {
      setError('Ошибка загрузки ваших фотографий');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !gender || !age) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('gender', gender);
    formData.append('age', age);

    try {
      await instance.post('/api/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Фотография успешно загружена');
      setFile(null);
      setGender('');
      setAge('');
      fetchMyPhotos();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки фотографии');
    }
  };

  const handleToggleActive = async (photoId, currentStatus) => {
    if (!user) return;
    if (!currentStatus && user.points <= 0) {
      setError('Недостаточно баллов для активации фотографии');
      return;
    }

    try {
      await instance.post('/api/photos/toggle-active', {
        photoId,
        isActive: !currentStatus
      });
      fetchMyPhotos();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка изменения статуса фотографии');
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Загрузить фотографию
      </Typography>
      <Typography variant="h6" gutterBottom>
        Текущие баллы: {user?.points || 0}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Выбрать файл
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {file && <Typography variant="body2">Выбранный файл: {file.name}</Typography>}
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Пол</InputLabel>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                label="Пол"
              >
                <MenuItem value="male">Мужской</MenuItem>
                <MenuItem value="female">Женский</MenuItem>
                <MenuItem value="other">Другое</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              margin="normal"
              label="Возраст"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Загрузить
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Мои фотографии
      </Typography>
      {loading ? (
        <Typography>Загрузка...</Typography>
      ) : myPhotos.length > 0 ? (
        <Grid container spacing={2}>
          {myPhotos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} key={photo._id}>
              <Box
                component="img"
                sx={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover' }}
                src={photo.filePath}
                alt="Моя фотография"
              />
              <Typography>Возраст: {photo.age}, Пол: {photo.gender}</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={photo.isActive}
                    onChange={() => handleToggleActive(photo._id, photo.isActive)}
                  />
                }
                label={photo.isActive ? 'Активно (видно другим)' : 'Неактивно'}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>У вас нет загруженных фотографий.</Typography>
      )}
    </Box>
  );
}

export default UploadPhotoPage;
