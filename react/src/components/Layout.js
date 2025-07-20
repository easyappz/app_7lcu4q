import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItem, ListItemButton, ListItemText, Divider, Container, Button } from '@mui/material';

const drawerWidth = 240;

function Layout() {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex' }}>
      {user && (
        <>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                Оценка фотографий
              </Typography>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Баллы: {user.points || 0}
              </Typography>
              <Button color="inherit" onClick={logout}>Выйти</Button>
            </Toolbar>
          </AppBar>

          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/upload">
                    <ListItemText primary="Загрузить фото" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/rate">
                    <ListItemText primary="Оценить фото" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/stats">
                    <ListItemText primary="Моя статистика" />
                  </ListItemButton>
                </ListItem>
              </List>
              <Divider />
            </Box>
          </Drawer>
        </>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%', mt: user ? 8 : 0 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
