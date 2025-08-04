import React, { useState } from 'react';
import {
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  AutoAwesome,
  Psychology,
  Refresh,
  SmartToy,
  Tune,
  Speed,
  FormatAlignJustify,
  TrendingUp,
  KeyboardArrowDown
} from '@mui/icons-material';

export type AIButtonVariant = 'generate' | 'improve' | 'rephrase' | 'suggestions';
export type AIButtonSize = 'small' | 'medium' | 'large';

interface AIButtonProps {
  variant: AIButtonVariant;
  size?: AIButtonSize;
  tooltip?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (action: string, options?: any) => void;
  fullWidth?: boolean;
}

const AIButton: React.FC<AIButtonProps> = ({
  variant,
  size = 'medium',
  tooltip,
  disabled = false,
  loading = false,
  onClick,
  fullWidth = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getButtonConfig = () => {
    const configs = {
      generate: {
        icon: AutoAwesome,
        label: 'Generate',
        color: theme.palette.primary.main,
        actions: [
          { key: 'generate-short', label: 'Generate Short', icon: Speed },
          { key: 'generate-medium', label: 'Generate Medium', icon: FormatAlignJustify },
          { key: 'generate-long', label: 'Generate Detailed', icon: TrendingUp },
          { key: 'generate-custom', label: 'Custom Prompt...', icon: Tune }
        ]
      },
      improve: {
        icon: Psychology,
        label: 'Improve',
        color: theme.palette.secondary.main,
        actions: [
          { key: 'improve-clarity', label: 'Improve Clarity', icon: Psychology },
          { key: 'improve-grammar', label: 'Fix Grammar', icon: AutoAwesome },
          { key: 'improve-tone', label: 'Adjust Tone', icon: Tune },
          { key: 'improve-structure', label: 'Improve Structure', icon: FormatAlignJustify },
          { key: 'improve-persuasiveness', label: 'Make More Persuasive', icon: TrendingUp }
        ]
      },
      rephrase: {
        icon: Refresh,
        label: 'Rephrase',
        color: theme.palette.info.main,
        actions: [
          { key: 'rephrase-formal', label: 'More Formal', icon: FormatAlignJustify },
          { key: 'rephrase-conversational', label: 'More Conversational', icon: Psychology },
          { key: 'rephrase-technical', label: 'More Technical', icon: Tune },
          { key: 'rephrase-persuasive', label: 'More Persuasive', icon: TrendingUp }
        ]
      },
      suggestions: {
        icon: SmartToy,
        label: 'Suggestions',
        color: theme.palette.warning.main,
        actions: [
          { key: 'suggest-alternatives', label: 'Alternative Versions', icon: Refresh },
          { key: 'suggest-expansions', label: 'Expand Content', icon: TrendingUp },
          { key: 'suggest-summaries', label: 'Summarize', icon: Speed }
        ]
      }
    };

    return configs[variant];
  };

  const config = getButtonConfig();
  const IconComponent = config.icon;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (config.actions.length === 1) {
      // Single action - execute directly
      onClick?.(config.actions[0].key);
    } else {
      // Multiple actions - show menu
      setAnchorEl(event.currentTarget);
      setIsMenuOpen(true);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setIsMenuOpen(false);
  };

  const handleMenuItemClick = (actionKey: string) => {
    onClick?.(actionKey);
    handleMenuClose();
  };

  const isIconButton = size === 'small';
  const hasMultipleActions = config.actions.length > 1;

  const buttonContent = (
    <>
      {loading ? (
        <CircularProgress size={isIconButton ? 16 : 20} color="inherit" />
      ) : (
        <IconComponent fontSize={isIconButton ? 'small' : 'medium'} />
      )}
      {!isIconButton && (
        <>
          <Box sx={{ ml: 1 }}>{config.label}</Box>
          {hasMultipleActions && (
            <KeyboardArrowDown sx={{ ml: 0.5, fontSize: 16 }} />
          )}
        </>
      )}
    </>
  );

  const buttonSx = {
    color: config.color,
    backgroundColor: alpha(config.color, 0.04),
    border: `1px solid ${alpha(config.color, 0.2)}`,
    '&:hover': {
      backgroundColor: alpha(config.color, 0.08),
      borderColor: alpha(config.color, 0.3),
    },
    '&:disabled': {
      backgroundColor: alpha(theme.palette.action.disabled, 0.04),
      borderColor: alpha(theme.palette.action.disabled, 0.2),
      color: theme.palette.action.disabled,
    },
    ...(fullWidth && { width: '100%' }),
    textTransform: 'none' as const,
    fontWeight: 500,
  };

  const button = isIconButton ? (
    <IconButton
      onClick={handleClick}
      disabled={disabled || loading}
      size={size}
      sx={buttonSx}
    >
      {buttonContent}
    </IconButton>
  ) : (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      size={size}
      variant="outlined"
      sx={buttonSx}
    >
      {buttonContent}
    </Button>
  );

  return (
    <>
      {tooltip ? (
        <Tooltip title={tooltip} arrow placement="top">
          <span>{button}</span>
        </Tooltip>
      ) : (
        button
      )}

      {/* Action Menu */}
      {hasMultipleActions && (
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              minWidth: 200,
              boxShadow: theme.shadows[8],
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {config.label} Options
            </Typography>
          </Box>
          <Divider />
          {config.actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <MenuItem
                key={action.key}
                onClick={() => handleMenuItemClick(action.key)}
                sx={{
                  py: 1,
                  '&:hover': {
                    backgroundColor: alpha(config.color, 0.04),
                  }
                }}
              >
                <ListItemIcon sx={{ color: config.color }}>
                  <ActionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="body2">
                    {action.label}
                  </Typography>
                </ListItemText>
              </MenuItem>
            );
          })}
        </Menu>
      )}
    </>
  );
};

export default AIButton;