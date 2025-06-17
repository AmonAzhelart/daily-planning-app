import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Mt Ortho Daily Planning
        </Typography>
        <Typography variant="body1">
          Select an option from the navigation drawer to get started.
        </Typography>
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Application Purpose:</Typography>
            <Typography variant="body2" paragraph>
                This application is designed for the preparation of the Daily Planning (DP), replacing the current paper-based methodology. [cite: 6]
            </Typography>
            <Typography variant="h6">Key Modules:</Typography>
            <ul>
                <li><Typography variant="body2">Daily Planning: Manage daily schedules and tasks.</Typography></li>
                <li><Typography variant="body2">Client Management: Handle client information and locations. [cite: 34]</Typography></li>
                <li><Typography variant="body2">Intervention Management: Manage types of surgical interventions. [cite: 34]</Typography></li>
            </ul>
        </Box>
      </Paper>
    </Container>
  );
}

export default HomePage;