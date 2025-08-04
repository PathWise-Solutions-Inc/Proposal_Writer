import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  TipsAndUpdates as TipsIcon,
  Speed as SpeedIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ProposalSection, SectionType } from '../../types/section.types';
import { aiService, AIGenerationOptions, GeneratedContent } from '../../services/ai.service';
import { aiBackendService } from '../../services/ai-backend.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface AIContentGeneratorProps {
  section: ProposalSection;
  onContentGenerated: (content: string) => void;
  onClose?: () => void;
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  section,
  onContentGenerated,
  onClose,
}) => {
  const currentProposal = useSelector((state: RootState) => state.proposal.currentProposal);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generation state
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<AIGenerationOptions['tone']>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  
  // Template prompts based on section type
  const getTemplatePrompts = (): string[] => {
    switch (section.type) {
      case 'heading':
        return [
          'Create a compelling executive summary that highlights our unique value proposition',
          'Write a project overview that emphasizes our expertise and track record',
          'Generate an introduction that captures the client\'s attention',
        ];
      case 'paragraph':
        return [
          'Describe our technical approach and methodology',
          'Explain how our solution addresses the client\'s specific needs',
          'Detail our implementation timeline and milestones',
        ];
      case 'list':
        return [
          'List the key benefits and features of our solution',
          'Outline our team\'s relevant qualifications and certifications',
          'Enumerate the deliverables and success metrics',
        ];
      case 'table':
        return [
          'Create a pricing breakdown table with clear cost categories',
          'Generate a project timeline table with phases and milestones',
          'Build a comparison table showing our advantages over competitors',
        ];
      default:
        return [
          'Generate professional content for this section',
          'Create compelling content that addresses client needs',
          'Write persuasive content that highlights our strengths',
        ];
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options: AIGenerationOptions = {
        tone,
        context: {
          proposalTitle: currentProposal?.title || '',
          sectionTitle: section.title,
          sectionType: section.type,
          previousContent: section.content,
          rfpRequirements: '', // TODO: Get from RFP analysis
        },
        prompt: prompt || `Generate ${length} content for "${section.title}" section`,
      };

      // Use backend service if available, fallback to local
      const useBackend = import.meta.env.VITE_USE_AI_BACKEND !== 'false';
      const result = useBackend
        ? await aiBackendService.generateContent(section.type, options)
        : await aiService.generateContent(section.type, options);
      setGeneratedContent([result]);
      setSelectedVariation(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options: AIGenerationOptions = {
        tone,
        context: {
          proposalTitle: currentProposal?.title || '',
          sectionTitle: section.title,
          sectionType: section.type,
          previousContent: section.content,
        },
        prompt: prompt || `Generate content variations for "${section.title}" section`,
      };

      // Use backend service if available, fallback to local
      const useBackend = import.meta.env.VITE_USE_AI_BACKEND !== 'false';
      const variations = useBackend
        ? await aiBackendService.generateVariations(section.type, options, 3)
        : await aiService.generateVariations(section.type, options, 3);
      setGeneratedContent(variations);
      setSelectedVariation(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variations');
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!section.content) {
      setError('No content to improve. Please add some content first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use backend service if available, fallback to local
      const useBackend = import.meta.env.VITE_USE_AI_BACKEND !== 'false';
      const result = useBackend
        ? await aiBackendService.improveContent(section.content, {
            tone,
            focusAreas: focusAreas.length > 0 ? focusAreas : ['clarity', 'persuasiveness'],
          })
        : await aiService.improveContent(section.content, {
            tone,
            focusAreas: focusAreas.length > 0 ? focusAreas : ['clarity', 'persuasiveness'],
          });
      
      setGeneratedContent([result]);
      setSelectedVariation(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve content');
    } finally {
      setLoading(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent[selectedVariation]) {
      onContentGenerated(generatedContent[selectedVariation].content);
      onClose?.();
    }
  };

  const handleCopyContent = () => {
    if (generatedContent[selectedVariation]) {
      navigator.clipboard.writeText(generatedContent[selectedVariation].content);
    }
  };

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'professional':
        return <BusinessIcon />;
      case 'technical':
        return <SchoolIcon />;
      case 'persuasive':
        return <CampaignIcon />;
      case 'conversational':
        return <PsychologyIcon />;
      default:
        return <AutoAwesomeIcon />;
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6">AI Content Generator</Typography>
          <Chip 
            label={section.title} 
            size="small" 
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Generate New" icon={<AutoAwesomeIcon />} iconPosition="start" />
          <Tab label="Improve Existing" icon={<TipsIcon />} iconPosition="start" />
          <Tab label="Quick Templates" icon={<SpeedIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Custom Prompt */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Describe what you want to generate (optional)"
              placeholder={`E.g., "Write about our cloud migration expertise and how it reduces costs by 30%"`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              helperText="Be specific about key points, data, or themes you want to include"
            />

            {/* Generation Options */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Tone</InputLabel>
                <Select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as AIGenerationOptions['tone'])}
                  label="Tone"
                  startAdornment={getToneIcon(tone)}
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="persuasive">Persuasive</MenuItem>
                  <MenuItem value="conversational">Conversational</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Length</InputLabel>
                <Select
                  value={length}
                  onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
                  label="Length"
                >
                  <MenuItem value="short">Short (50-100 words)</MenuItem>
                  <MenuItem value="medium">Medium (100-200 words)</MenuItem>
                  <MenuItem value="long">Long (200-400 words)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleGenerate}
                disabled={loading}
                sx={{ flex: 1 }}
              >
                Generate Content
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleGenerateVariations}
                disabled={loading}
              >
                Generate 3 Variations
              </Button>
            </Box>
          </Stack>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            {/* Current Content Preview */}
            {section.content ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Content
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.content.text ? section.content.text.substring(0, 200) : 'No content yet'}...
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">
                No existing content to improve. Switch to "Generate New" tab to create content.
              </Alert>
            )}

            {/* Improvement Focus Areas */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Focus Areas for Improvement
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {['clarity', 'persuasiveness', 'conciseness', 'grammar', 'tone', 'data'].map((area) => (
                  <Chip
                    key={area}
                    label={area}
                    onClick={() => {
                      setFocusAreas(prev =>
                        prev.includes(area)
                          ? prev.filter(a => a !== area)
                          : [...prev, area]
                      );
                    }}
                    color={focusAreas.includes(area) ? 'primary' : 'default'}
                    variant={focusAreas.includes(area) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>

            {/* Improve Button */}
            <Button
              variant="contained"
              startIcon={<TipsIcon />}
              onClick={handleImprove}
              disabled={loading || !section.content}
              fullWidth
            >
              Improve Content
            </Button>
          </Stack>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Templates for {section.type}
            </Typography>
            {getTemplatePrompts().map((template, index) => (
              <Card
                key={index}
                variant="outlined"
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => {
                  setPrompt(template);
                  setTabValue(0);
                }}
              >
                <CardContent>
                  <Typography variant="body2">{template}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </TabPanel>

        {/* Loading State */}
        {loading && (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Generating AI content...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Generated Content */}
        {generatedContent.length > 0 && !loading && (
          <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Generated Content
            </Typography>
            
            {generatedContent.length > 1 && (
              <Tabs
                value={selectedVariation}
                onChange={(_, v) => setSelectedVariation(v)}
                sx={{ mb: 2 }}
              >
                {generatedContent.map((_, index) => (
                  <Tab key={index} label={`Variation ${index + 1}`} />
                ))}
              </Tabs>
            )}

            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">
                      Quality Score:
                    </Typography>
                    <Rating
                      value={generatedContent[selectedVariation].metadata.qualityScore / 20}
                      readOnly
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({generatedContent[selectedVariation].metadata.qualityScore}%)
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Copy to clipboard">
                      <IconButton size="small" onClick={handleCopyContent}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {generatedContent[selectedVariation].content}
                </Typography>

                {/* Metadata */}
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip
                      size="small"
                      label={`${generatedContent[selectedVariation].metadata.wordCount} words`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`~${generatedContent[selectedVariation].metadata.readingTime} min read`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={generatedContent[selectedVariation].metadata.tone}
                      variant="outlined"
                      icon={getToneIcon(generatedContent[selectedVariation].metadata.tone)}
                    />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleUseContent}
          disabled={generatedContent.length === 0}
          startIcon={<ThumbUpIcon />}
        >
          Use This Content
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIContentGenerator;