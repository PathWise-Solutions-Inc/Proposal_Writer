import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Paper,
  IconButton,
  Fade,
  Zoom,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  FileType,
  Calendar,
  Building,
  FileText as DescriptionIcon,
  Send,
  History,
  HelpCircle,
} from 'lucide-react';
import { rfpService } from '../../services/rfp.service';

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  rfpId?: string;
  progress?: number;
}

interface FilePreview {
  file: File;
  preview: string;
  type: string;
}

const RFPUpload: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [formData, setFormData] = useState({
    clientName: '',
    dueDate: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const steps = ['Select Document', 'Provide Details', 'Upload & Analyze'];

  const acceptedFormats = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'application/rtf': ['.rtf'],
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      setUploadState({
        status: 'error',
        message: error.code === 'file-too-large' 
          ? 'File too large. Please select a file under 50MB.'
          : `Invalid file type. Please select: ${Object.values(acceptedFormats).flat().join(', ')}`
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const preview: FilePreview = {
        file,
        preview: URL.createObjectURL(file),
        type: file.type
      };
      setSelectedFile(preview);
      setUploadState({ status: 'idle' });
      setActiveStep(1);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.clientName.trim()) {
      errors.clientName = 'Client name is required';
    }
    
    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      errors.dueDate = 'Due date cannot be in the past';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !validateForm()) {
      setUploadState({ 
        status: 'error', 
        message: 'Please correct the errors above' 
      });
      return;
    }

    setUploadState({ status: 'uploading', progress: 0 });
    setActiveStep(2);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadState(prev => ({
        ...prev,
        progress: Math.min((prev.progress || 0) + Math.random() * 20, 85)
      }));
    }, 500);

    try {
      const response = await rfpService.uploadRFP(selectedFile.file, {
        title: selectedFile.file.name.replace(/\.[^/.]+$/, ''),
        clientName: formData.clientName,
        dueDate: formData.dueDate || undefined,
        description: formData.description || undefined,
      });

      clearInterval(progressInterval);
      setUploadState({ 
        status: 'success', 
        message: 'RFP uploaded successfully! Redirecting to analysis...',
        rfpId: response.data.rfpId,
        progress: 100
      });

      // Redirect to RFP details after 2 seconds
      setTimeout(() => {
        navigate(`/rfps/${response.data.rfpId}`);
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadState({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.' 
      });
    }
  };

  const handleRemoveFile = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.preview);
      setSelectedFile(null);
      setActiveStep(0);
      setUploadState({ status: 'idle' });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileType className="text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="text-blue-500" />;
    return <FileText className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Upload RFP Document
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Upload your Request for Proposal document and let our AI analyze it to extract 
          evaluation criteria, requirements, and key insights.
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 4, overflow: 'visible' }}>
        <CardContent sx={{ py: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '0.875rem',
                      fontWeight: activeStep === index ? 600 : 400
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* File Upload Section */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UploadIcon size={20} />
                  Document Upload
                </Typography>

                {selectedFile ? (
                  <Zoom in={true}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        border: `2px solid ${theme.palette.success.main}`,
                        backgroundColor: alpha(theme.palette.success.main, 0.05),
                        borderRadius: 2
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ fontSize: 48 }}>
                          {getFileIcon(selectedFile.type)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {selectedFile.file.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatFileSize(selectedFile.file.size)} • {selectedFile.file.type.split('/')[1].toUpperCase()}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label="Ready to upload"
                              color="success"
                              size="small"
                              icon={<CheckCircle size={16} />}
                            />
                          </Stack>
                        </Box>
                        <Tooltip title="Remove file">
                          <IconButton
                            onClick={handleRemoveFile}
                            color="error"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            <X size={20} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  </Zoom>
                ) : (
                  <Paper
                    {...getRootProps()}
                    elevation={0}
                    sx={{
                      p: 6,
                      border: `2px dashed ${
                        isDragActive 
                          ? theme.palette.primary.main 
                          : isDragReject 
                            ? theme.palette.error.main 
                            : theme.palette.divider
                      }`,
                      backgroundColor: isDragActive 
                        ? alpha(theme.palette.primary.main, 0.05)
                        : isDragReject
                          ? alpha(theme.palette.error.main, 0.05)
                          : theme.palette.background.paper,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      textAlign: 'center',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                  >
                    <input {...getInputProps()} />
                    <UploadIcon size={48} color={theme.palette.text.secondary} />
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      {isDragActive 
                        ? 'Drop your RFP document here'
                        : 'Drag & drop your RFP document'
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      or click to browse files
                    </Typography>
                    <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                      {Object.values(acceptedFormats).flat().map(format => (
                        <Chip key={format} label={format} size="small" variant="outlined" />
                      ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Maximum file size: 50MB
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Form Fields */}
          <Grid item xs={12}>
            <Collapse in={selectedFile !== null} timeout={300}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon size={20} />
                    RFP Details
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Client Name"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleInputChange}
                        error={!!formErrors.clientName}
                        helperText={formErrors.clientName || 'Enter the name of the client or organization'}
                        InputProps={{
                          startAdornment: <Building size={20} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Due Date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        error={!!formErrors.dueDate}
                        helperText={formErrors.dueDate || 'When is the proposal due? (Optional)'}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
                        InputProps={{
                          startAdornment: <Calendar size={20} style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        helperText="Brief description of the RFP or any additional context (Optional)"
                        placeholder="e.g., IT services procurement for new office setup..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Collapse>
          </Grid>

          {/* Status Messages */}
          <Grid item xs={12}>
            <Collapse in={uploadState.status !== 'idle'} timeout={300}>
              <Fade in={uploadState.status !== 'idle'}>
                <Alert
                  severity={
                    uploadState.status === 'error' ? 'error' :
                    uploadState.status === 'success' ? 'success' : 'info'
                  }
                  sx={{ mb: 2 }}
                  icon={
                    uploadState.status === 'uploading' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            border: `2px solid ${theme.palette.info.main}`,
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                      </Box>
                    ) : undefined
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {uploadState.status === 'uploading' && 'Uploading and analyzing your RFP...'}
                    {uploadState.status === 'error' && 'Upload Failed'}
                    {uploadState.status === 'success' && 'Upload Successful!'}
                  </Typography>
                  {uploadState.message && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {uploadState.message}
                    </Typography>
                  )}
                  {uploadState.status === 'uploading' && (
                    <LinearProgress
                      variant="determinate"
                      value={uploadState.progress || 0}
                      sx={{ mt: 1, borderRadius: 1 }}
                    />
                  )}
                </Alert>
              </Fade>
            </Collapse>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="View recent uploads">
                  <IconButton size="small" color="primary">
                    <History size={20} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Get help with file formats">
                  <IconButton size="small" color="primary">
                    <HelpCircle size={20} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!selectedFile || !formData.clientName || uploadState.status === 'uploading'}
                startIcon={uploadState.status === 'uploading' ? null : <Send size={20} />}
                sx={{
                  minWidth: 200,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                {uploadState.status === 'uploading' ? (
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
                    Uploading...
                  </>
                ) : (
                  'Upload & Analyze RFP'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default RFPUpload;