import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfpService, AnalysisResult } from '../services/rfp.service';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Button,
  Box,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Skeleton,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Breadcrumbs,
  Link,
  Fade,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  BarChart,
  FileCheck,
  Brain,
  Building,
  Calendar,
  Target,
  Star,
  AlertTriangle,
  Download,
  Share,
  Edit,
  Eye,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  ExpandMore,
  Home,
  ChevronRight,
} from 'lucide-react';

const RfpDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (id) {
      loadAnalysisResults();
    }
  }, [id]);

  const loadAnalysisResults = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const result = await rfpService.getAnalysisResults(id);
      setAnalysis(result);
      
      // If still processing, poll for updates
      if (result.status === 'processing') {
        setTimeout(loadAnalysisResults, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RFP details');
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    if (!id) return;
    
    try {
      setIsAnalyzing(true);
      await rfpService.triggerAnalysis(id);
      // Start polling for results
      setTimeout(loadAnalysisResults, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'uploaded':
        return {
          icon: <Clock size={20} />,
          color: 'default' as const,
          label: 'Uploaded',
          description: 'Document uploaded, ready for analysis'
        };
      case 'processing':
        return {
          icon: (
            <Box
              sx={{
                width: 20,
                height: 20,
                border: '2px solid currentColor',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
          ),
          color: 'info' as const,
          label: 'Processing',
          description: 'AI analysis in progress'
        };
      case 'analyzed':
        return {
          icon: <CheckCircle size={20} />,
          color: 'success' as const,
          label: 'Analyzed',
          description: 'Analysis complete and ready for review'
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} />,
          color: 'error' as const,
          label: 'Error',
          description: 'Analysis failed, please try again'
        };
      default:
        return {
          icon: <FileText size={20} />,
          color: 'default' as const,
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      formatted: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      daysUntil: diffDays,
      isOverdue: diffDays < 0,
      isUrgent: diffDays <= 7 && diffDays >= 0
    };
  };

  if (loading && !analysis) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="text" width="60%" height={60} />
          <Skeleton variant="rectangular" height={200} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                <Skeleton variant="rectangular" height={300} />
                <Skeleton variant="rectangular" height={400} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
          </Grid>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Failed to Load RFP Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!analysis) {
    return null;
  }

  const statusConfig = getStatusConfig(analysis.status);
  const dueDate = formatDueDate(analysis.dueDate);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<ChevronRight size={16} />} sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Home size={16} />
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/rfps')}
        >
          RFPs
        </Link>
        <Typography variant="body2" color="text.primary">
          {analysis.title}
        </Typography>
      </Breadcrumbs>

      {/* Header Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                  {analysis.title}
                </Typography>
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  color={statusConfig.color}
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              
              <Stack direction="row" spacing={3} alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Building size={18} color={theme.palette.text.secondary} />
                  <Typography variant="body1" color="text.secondary">
                    {analysis.clientName}
                  </Typography>
                </Box>
                
                {dueDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Calendar size={18} color={theme.palette.text.secondary} />
                    <Typography 
                      variant="body1" 
                      color={dueDate.isOverdue ? 'error' : dueDate.isUrgent ? 'warning.main' : 'text.secondary'}
                    >
                      Due {dueDate.formatted}
                      {dueDate.isOverdue && ' (Overdue)'}
                      {dueDate.isUrgent && !dueDate.isOverdue && ` (${dueDate.daysUntil} days left)`}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Tooltip title="Share RFP">
                <IconButton size="small">
                  <Share size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit RFP Details">
                <IconButton size="small">
                  <Edit size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Original Document">
                <IconButton size="small">
                  <Eye size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Progress Section */}
      {analysis.status === 'processing' && (
        <Slide direction="down" in={true} mountOnEnter>
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Brain size={24} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Analysis in Progress
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={analysis.progress || 0}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {analysis.progress || 0}% complete - This may take a few minutes
            </Typography>
          </Paper>
        </Slide>
      )}

      {/* Start Analysis Action */}
      {analysis.status === 'uploaded' && (
        <Fade in={true}>
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
            <Stack spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                <Brain size={32} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Ready for AI Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
                Start the AI analysis to extract evaluation criteria, requirements, and key insights from your RFP document.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={triggerAnalysis}
                disabled={isAnalyzing}
                startIcon={isAnalyzing ? null : <Brain size={20} />}
                sx={{ 
                  minWidth: 200,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                {isAnalyzing ? (
                  <>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        border: '2px solid currentColor',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        mr: 1,
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    />
                    Starting Analysis...
                  </>
                ) : (
                  'Start AI Analysis'
                )}
              </Button>
            </Stack>
          </Paper>
        </Fade>
      )}

      {/* Analysis Results */}
      {analysis.status === 'analyzed' && analysis.analysisResults && (
        <Fade in={true} timeout={600}>
          <Grid container spacing={3}>
            {/* Left Column - Main Content */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                {/* Summary Card */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <FileText size={20} />
                      </Avatar>
                    }
                    title="Executive Summary"
                    subheader="AI-generated overview of the RFP"
                  />
                  <CardContent>
                    <Typography variant="body1" paragraph>
                      {analysis.analysisResults.summary}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Key Topics
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {analysis.analysisResults.keywords.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={keyword}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Evaluation Rubric */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Target size={20} />
                      </Avatar>
                    }
                    title="Evaluation Rubric"
                    subheader={`${analysis.analysisResults.evaluationCriteria.length} criteria identified`}
                    action={
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Total Points
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {analysis.analysisResults.totalPoints}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Confidence
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {Math.round(analysis.analysisResults.confidenceScore * 100)}%
                          </Typography>
                        </Box>
                      </Stack>
                    }
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      {analysis.analysisResults.evaluationCriteria.map((criterion, index) => (
                        <Accordion key={index} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', justifyContent: 'space-between' } }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {criterion.criterion}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {criterion.description}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={2} sx={{ mr: 2 }}>
                              <Chip
                                label={`${criterion.maxPoints} pts`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={`${criterion.weight}%`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {criterion.description}
                            </Typography>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                              Scoring Criteria:
                            </Typography>
                            <List dense>
                              {criterion.scoringCriteria.map((criteria, idx) => (
                                <ListItem key={idx} disableGutters>
                                  <ListItemIcon sx={{ minWidth: 24 }}>
                                    <Star size={16} color={theme.palette.warning.main} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={criteria}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            {/* Right Column - Sidebar */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {/* Quick Stats */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <TrendingUp size={20} />
                      </Avatar>
                    }
                    title="RFP Insights"
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {analysis.analysisResults.evaluationCriteria.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Criteria
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                            {analysis.analysisResults.requirements.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Requirements
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                            {analysis.analysisResults.requirements.filter(r => r.mandatory).length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Mandatory
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {Math.round(analysis.analysisResults.confidenceScore * 100)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Confidence
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Requirements Summary */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardHeader
                    avatar={
                      <Badge
                        badgeContent={analysis.analysisResults.requirements.length}
                        color="primary"
                      >
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <AlertTriangle size={20} />
                        </Avatar>
                      </Badge>
                    }
                    title="Requirements"
                    subheader="Critical and optional requirements"
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <List dense>
                      {analysis.analysisResults.requirements.slice(0, 5).map((req) => (
                        <ListItem key={req.id} divider>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {req.mandatory ? (
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'error.main', fontSize: '0.75rem' }}>
                                M
                              </Avatar>
                            ) : (
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'info.main', fontSize: '0.75rem' }}>
                                O
                              </Avatar>
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={req.text}
                            secondary={req.category}
                            primaryTypographyProps={{ 
                              variant: 'body2',
                              sx: { 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }
                            }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                      {analysis.analysisResults.requirements.length > 5 && (
                        <ListItem>
                          <ListItemText
                            primary={`+${analysis.analysisResults.requirements.length - 5} more requirements`}
                            primaryTypographyProps={{ 
                              variant: 'body2', 
                              color: 'text.secondary',
                              textAlign: 'center'
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>

                {/* Actions Card */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <Award size={20} />
                      </Avatar>
                    }
                    title="Next Steps"
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<FileCheck size={20} />}
                        onClick={() => navigate(`/proposals/new?rfpId=${id}`)}
                        sx={{ 
                          py: 1.5,
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          textTransform: 'none'
                        }}
                      >
                        Create Proposal
                      </Button>
                      
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Download size={20} />}
                        onClick={() => window.open(`/api/rfp/${id}/rubric/export`, '_blank')}
                        sx={{ 
                          py: 1.5,
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          borderRadius: 2,
                          textTransform: 'none'
                        }}
                      >
                        Export Analysis
                      </Button>
                      
                      <Button
                        variant="text"
                        fullWidth
                        startIcon={<Users size={20} />}
                        sx={{ 
                          py: 1.5,
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          borderRadius: 2,
                          textTransform: 'none'
                        }}
                      >
                        Share with Team
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Fade>
      )}

      {/* Error State */}
      {analysis.status === 'error' && analysis.error && (
        <Fade in={true}>
          <Alert 
            severity="error"
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={triggerAnalysis}
                disabled={isAnalyzing}
              >
                Retry
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              Analysis Failed
            </Typography>
            <Typography variant="body2">
              {analysis.error}
            </Typography>
          </Alert>
        </Fade>
      )}
    </Container>
  );
};

export default RfpDetailsPage;