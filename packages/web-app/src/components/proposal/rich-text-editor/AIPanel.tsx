import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Fade,
  useTheme,
  alpha,
  Badge
} from '@mui/material';
import {
  Close,
  ExpandMore,
  ThumbUp,
  ThumbDown,
  ContentCopy,
  Refresh,
  Send,
  AutoAwesome,
  Psychology,
  Tune,
  SmartToy,
  Lightbulb,
  Star,
  CheckCircle
} from '@mui/icons-material';

import { SectionType } from '../../../types/section.types';
import { aiService, AIContentVariation } from '../../../services/ai.service';
import AIButton from './AIButton';

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
  sectionType: SectionType;
  currentContent: string;
  onContentInsert: (content: string) => void;
  onContentReplace: (content: string) => void;
}

interface AIResult {
  id: string;
  content: string;
  confidence: number;
  type: 'generated' | 'improved' | 'rephrased' | 'variation';
  timestamp: Date;
  liked?: boolean;
  metadata?: any;
}

const AIPanel: React.FC<AIPanelProps> = ({
  open,
  onClose,
  sectionType,
  currentContent,
  onContentInsert,
  onContentReplace
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'generate' | 'improve' | 'variations'>('generate');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<'formal' | 'conversational' | 'technical' | 'persuasive'>('formal');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AIResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [variations, setVariations] = useState<AIContentVariation[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load results from localStorage on mount
  useEffect(() => {
    const savedResults = localStorage.getItem(`ai-results-${sectionType}`);
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        setResults(parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })));
      } catch (error) {
        console.error('Failed to load saved AI results:', error);
      }
    }
  }, [sectionType]);

  // Save results to localStorage
  const saveResults = (newResults: AIResult[]) => {
    try {
      localStorage.setItem(`ai-results-${sectionType}`, JSON.stringify(newResults));
    } catch (error) {
      console.error('Failed to save AI results:', error);
    }
  };

  const handleGenerate = async (prompt?: string, options?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await aiService.generateContent({
        prompt: prompt || customPrompt || `Create content for this ${sectionType} section`,
        sectionType,
        tone: selectedTone,
        length: selectedLength,
        context: options?.context
      });

      const newResult: AIResult = {
        id: `result-${Date.now()}`,
        content: response.content,
        confidence: response.confidence,
        type: 'generated',
        timestamp: new Date(),
        metadata: response.metadata
      };

      const updatedResults = [newResult, ...results];
      setResults(updatedResults);
      saveResults(updatedResults);
      
      // Clear custom prompt after successful generation
      if (!prompt) {
        setCustomPrompt('');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async (improvements?: string[]) => {
    if (!currentContent.trim()) {
      setError('No content to improve. Please add some text first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiService.improveContent({
        content: currentContent,
        sectionType,
        improvements: improvements as any,
        tone: selectedTone
      });

      const newResult: AIResult = {
        id: `result-${Date.now()}`,
        content: response.content,
        confidence: response.confidence,
        type: 'improved',
        timestamp: new Date(),
        metadata: response.metadata
      };

      const updatedResults = [newResult, ...results];
      setResults(updatedResults);
      saveResults(updatedResults);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to improve content');
    } finally {
      setLoading(false);
    }
  };

  const handleRephrase = async (tone?: string) => {
    if (!currentContent.trim()) {
      setError('No content to rephrase. Please add some text first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiService.rephraseContent(
        currentContent,
        sectionType,
        tone || selectedTone
      );

      const newResult: AIResult = {
        id: `result-${Date.now()}`,
        content: response.content,
        confidence: response.confidence,
        type: 'rephrased',
        timestamp: new Date(),
        metadata: response.metadata
      };

      const updatedResults = [newResult, ...results];
      setResults(updatedResults);
      saveResults(updatedResults);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to rephrase content');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!currentContent.trim()) {
      setError('No content to create variations from. Please add some text first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generatedVariations = await aiService.generateVariations(currentContent, sectionType);
      setVariations(generatedVariations);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate variations');
    } finally {
      setLoading(false);
    }
  };

  const handleResultAction = (result: AIResult, action: 'like' | 'dislike' | 'copy' | 'insert' | 'replace') => {
    switch (action) {
      case 'like':
      case 'dislike':
        const updatedResults = results.map(r =>
          r.id === result.id ? { ...r, liked: action === 'like' } : r
        );
        setResults(updatedResults);
        saveResults(updatedResults);
        break;
      case 'copy':
        navigator.clipboard.writeText(result.content);
        break;
      case 'insert':
        onContentInsert(result.content);
        break;
      case 'replace':
        onContentReplace(result.content);
        break;
    }
  };

  const clearResults = () => {
    setResults([]);
    setVariations([]);
    localStorage.removeItem(`ai-results-${sectionType}`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.palette.success.main;
    if (confidence >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (!open) return null;

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy color="primary" />
            <Typography variant="h6" fontWeight={600}>
              AI Assistant
            </Typography>
            <Chip
              label={sectionType}
              size="small"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab Navigation */}
          <Box sx={{ display: 'flex', p: 1, gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            {[
              { key: 'generate', label: 'Generate', icon: AutoAwesome },
              { key: 'improve', label: 'Improve', icon: Psychology },
              { key: 'variations', label: 'Variations', icon: Refresh }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'contained' : 'text'}
                  size="small"
                  startIcon={<TabIcon fontSize="small" />}
                  onClick={() => setActiveTab(tab.key as any)}
                  sx={{ 
                    textTransform: 'none',
                    flex: 1,
                    ...(activeTab === tab.key && {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    })
                  }}
                >
                  {tab.label}
                </Button>
              );
            })}
          </Box>

          {/* Error Display */}
          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Box>
          )}

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {/* Generate Tab */}
            {activeTab === 'generate' && (
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Custom Prompt (optional)"
                  placeholder={`Describe what you want to generate for this ${sectionType}...`}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  variant="outlined"
                />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <AIButton
                    variant="generate"
                    size="small"
                    onClick={(action) => {
                      if (action.includes('short')) handleGenerate(undefined, { length: 'short' });
                      else if (action.includes('medium')) handleGenerate(undefined, { length: 'medium' });
                      else if (action.includes('long')) handleGenerate(undefined, { length: 'long' });
                      else handleGenerate();
                    }}
                    loading={loading}
                    fullWidth
                  />
                </Box>

                {customPrompt && (
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={() => handleGenerate()}
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                  >
                    Generate Custom Content
                  </Button>
                )}
              </Box>
            )}

            {/* Improve Tab */}
            {activeTab === 'improve' && (
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Improve your existing content with AI suggestions:
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <AIButton
                    variant="improve"
                    size="small"
                    onClick={(action) => {
                      if (action.includes('clarity')) handleImprove(['clarity']);
                      else if (action.includes('grammar')) handleImprove(['grammar']);
                      else if (action.includes('tone')) handleImprove(['tone']);
                      else if (action.includes('structure')) handleImprove(['structure']);
                      else if (action.includes('persuasiveness')) handleImprove(['persuasiveness']);
                      else handleImprove();
                    }}
                    loading={loading}
                    fullWidth
                  />
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => handleRephrase()}
                  disabled={loading || !currentContent.trim()}
                  sx={{ textTransform: 'none' }}
                >
                  Rephrase Content
                </Button>
              </Box>
            )}

            {/* Variations Tab */}
            {activeTab === 'variations' && (
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Generate alternative versions of your content:
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<AutoAwesome />}
                  onClick={handleGenerateVariations}
                  disabled={loading || !currentContent.trim()}
                  sx={{ textTransform: 'none' }}
                >
                  Generate Variations
                </Button>

                {variations.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {variations.map((variation, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                        <CardContent sx={{ pb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={variation.type}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Badge 
                              badgeContent={`${Math.round(variation.confidence * 100)}%`}
                              color={variation.confidence >= 0.8 ? 'success' : 'warning'}
                              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                              <Star 
                                fontSize="small" 
                                sx={{ color: getConfidenceColor(variation.confidence) }}
                              />
                            </Badge>
                          </Box>
                          <Typography variant="body2">
                            {variation.content}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ pt: 0, gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<ContentCopy />}
                            onClick={() => navigator.clipboard.writeText(variation.content)}
                          >
                            Copy
                          </Button>
                          <Button
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => onContentInsert(variation.content)}
                          >
                            Insert
                          </Button>
                          <Button
                            size="small"
                            color="primary"
                            startIcon={<Refresh />}
                            onClick={() => onContentReplace(variation.content)}
                          >
                            Replace
                          </Button>
                        </CardActions>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Settings */}
          <Accordion 
            expanded={showAdvanced} 
            onChange={() => setShowAdvanced(!showAdvanced)}
            sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tune fontSize="small" />
                <Typography variant="subtitle2">Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={selectedTone}
                    label="Tone"
                    onChange={(e) => setSelectedTone(e.target.value as any)}
                  >
                    <MenuItem value="formal">Formal</MenuItem>
                    <MenuItem value="conversational">Conversational</MenuItem>
                    <MenuItem value="technical">Technical</MenuItem>
                    <MenuItem value="persuasive">Persuasive</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Length</InputLabel>
                  <Select
                    value={selectedLength}
                    label="Length"
                    onChange={(e) => setSelectedLength(e.target.value as any)}
                  >
                    <MenuItem value="short">Short</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="long">Long</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Results */}
          {results.length > 0 && (
            <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', p: 2, pb: 1 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lightbulb fontSize="small" />
                  Recent Results ({results.length})
                </Typography>
                <Button
                  size="small"
                  onClick={clearResults}
                  sx={{ textTransform: 'none', ml: 'auto' }}
                >
                  Clear
                </Button>
              </Box>
              <Box sx={{ maxHeight: 300, overflow: 'auto', px: 2, pb: 2 }}>
                {results.map((result) => (
                  <Card key={result.id} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={result.type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Badge 
                          badgeContent={getConfidenceLabel(result.confidence)}
                          color={result.confidence >= 0.8 ? 'success' : 'warning'}
                        >
                          <Star 
                            fontSize="small" 
                            sx={{ color: getConfidenceColor(result.confidence) }}
                          />
                        </Badge>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {result.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {result.content}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0, gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleResultAction(result, 'like')}
                        color={result.liked === true ? 'primary' : 'default'}
                      >
                        <ThumbUp fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleResultAction(result, 'dislike')}
                        color={result.liked === false ? 'error' : 'default'}
                      >
                        <ThumbDown fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleResultAction(result, 'copy')}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                      <Button
                        size="small"
                        onClick={() => handleResultAction(result, 'insert')}
                      >
                        Insert
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleResultAction(result, 'replace')}
                      >
                        Replace
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              zIndex: 1000
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              AI is working on your request...
            </Typography>
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

export default AIPanel;