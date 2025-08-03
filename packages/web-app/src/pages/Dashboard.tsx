import { Grid, Paper, Typography, Box, Card, CardContent } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { TrendingUp, Description, Timer, CheckCircle } from '@mui/icons-material';

const stats = [
  {
    title: 'Active Proposals',
    value: '12',
    icon: <Description />,
    color: '#3f51b5',
  },
  {
    title: 'Win Rate',
    value: '68%',
    icon: <TrendingUp />,
    color: '#4caf50',
  },
  {
    title: 'Avg. Response Time',
    value: '3.5 days',
    icon: <Timer />,
    color: '#ff9800',
  },
  {
    title: 'Completed This Month',
    value: '8',
    icon: <CheckCircle />,
    color: '#9c27b0',
  },
];

export default function Dashboard() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Here's your proposal activity overview
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: stat.color,
                      borderRadius: '50%',
                      p: 1,
                      color: 'white',
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Proposals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No proposals yet. Create your first proposal to get started!
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="body2">• Upload new RFP</Typography>
              <Typography variant="body2">• Create proposal template</Typography>
              <Typography variant="body2">• View content library</Typography>
              <Typography variant="body2">• Generate compliance matrix</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}