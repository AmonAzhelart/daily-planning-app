import React from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GppBadIcon from '@mui/icons-material/GppBad';

const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Paper
                elevation={3}
                sx={{
                    mt: 8,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 3,
                    borderTop: '4px solid',
                    borderColor: 'error.main'
                }}
            >
                <GppBadIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Accesso non Autorizzato
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Non disponi delle autorizzazioni necessarie per visualizzare questa pagina.
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/daily-planning')} // Torna alla pagina di default
                    size="large"
                >
                    Torna alla Home
                </Button>
            </Paper>
        </Container>
    );
};

export default UnauthorizedPage;