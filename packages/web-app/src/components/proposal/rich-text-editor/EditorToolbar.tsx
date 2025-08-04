import React, { useCallback, useState } from 'react';
import {
  Box,
  Toolbar,
  IconButton,
  Tooltip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  Undo,
  Redo,
  SmartToy,
  TableChart,
  Image,
  InsertLink
} from '@mui/icons-material';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  UNDO_COMMAND,
  REDO_COMMAND
} from 'lexical';
import {
  $isHeadingNode,
  $createHeadingNode,
  HeadingTagType
} from '@lexical/rich-text';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  $isListNode
} from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { $createQuoteNode } from '@lexical/rich-text';

import AIButton from './AIButton';

interface EditorToolbarProps {
  onAIToggle: () => void;
  showAIPanel?: boolean;
  readOnly?: boolean;
}

type TextFormatType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onAIToggle,
  showAIPanel = true,
  readOnly = false
}) => {
  const theme = useTheme();
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set());
  const [blockType, setBlockType] = useState<string>('paragraph');
  const [canUndo] = useState(false);
  const [canRedo] = useState(false);

  // Update formatting state
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const newFormats = new Set<TextFormatType>();
      
      if (selection.hasFormat('bold')) newFormats.add('bold');
      if (selection.hasFormat('italic')) newFormats.add('italic');
      if (selection.hasFormat('underline')) newFormats.add('underline');
      if (selection.hasFormat('strikethrough')) newFormats.add('strikethrough');
      if (selection.hasFormat('code')) newFormats.add('code');
      
      setActiveFormats(newFormats);

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' 
        ? anchorNode 
        : anchorNode.getTopLevelElementOrThrow();
      
      if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else if ($isListNode(element)) {
        setBlockType(element.getTag() === 'ul' ? 'bullet' : 'number');
      } else {
        setBlockType('paragraph');
      }
    }
  }, []);

  // Register selection change listener
  React.useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  // Text formatting commands
  const handleFormatText = useCallback((format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }, [editor]);

  // Block type commands
  const handleBlockFormat = useCallback((blockType: string) => {
    if (blockType === 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('p' as HeadingTagType));
        }
      });
    } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(blockType)) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(blockType as HeadingTagType));
        }
      });
    } else if (blockType === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (blockType === 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else if (blockType === 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  }, [editor]);

  // History commands
  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  const formatOptions = [
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'h4', label: 'Heading 4' },
    { value: 'h5', label: 'Heading 5' },
    { value: 'h6', label: 'Heading 6' },
    { value: 'bullet', label: 'Bullet List' },
    { value: 'number', label: 'Numbered List' },
    { value: 'quote', label: 'Quote' },
  ];

  if (readOnly) {
    return null;
  }

  return (
    <Toolbar 
      variant="dense" 
      sx={{ 
        minHeight: 56,
        px: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        gap: 1,
        flexWrap: 'wrap'
      }}
    >
      {/* Block Format Selector */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={blockType}
          onChange={(e) => handleBlockFormat(e.target.value)}
          displayEmpty
          sx={{ 
            fontSize: '0.875rem',
            '& .MuiSelect-select': {
              py: 0.5
            }
          }}
        >
          {formatOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider orientation="vertical" flexItem />

      {/* History Controls */}
      <Box sx={{ display: 'flex' }}>
        <Tooltip title="Undo">
          <IconButton 
            size="small" 
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo">
          <IconButton 
            size="small" 
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Text Formatting */}
      <ToggleButtonGroup
        size="small"
        exclusive={false}
        value={Array.from(activeFormats)}
        sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.5 } }}
      >
        <ToggleButton
          value="bold"
          onClick={() => handleFormatText('bold')}
          selected={activeFormats.has('bold')}
        >
          <FormatBold fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="italic"
          onClick={() => handleFormatText('italic')}
          selected={activeFormats.has('italic')}
        >
          <FormatItalic fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="underline"
          onClick={() => handleFormatText('underline')}
          selected={activeFormats.has('underline')}
        >
          <FormatUnderlined fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="strikethrough"
          onClick={() => handleFormatText('strikethrough')}
          selected={activeFormats.has('strikethrough')}
        >
          <FormatStrikethrough fontSize="small" />
        </ToggleButton>
        <ToggleButton
          value="code"
          onClick={() => handleFormatText('code')}
          selected={activeFormats.has('code')}
        >
          <Code fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem />

      {/* List and Quote Controls */}
      <Box sx={{ display: 'flex' }}>
        <Tooltip title="Bullet List">
          <IconButton 
            size="small" 
            onClick={() => handleBlockFormat('bullet')}
            color={blockType === 'bullet' ? 'primary' : 'default'}
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton 
            size="small" 
            onClick={() => handleBlockFormat('number')}
            color={blockType === 'number' ? 'primary' : 'default'}
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quote">
          <IconButton 
            size="small" 
            onClick={() => handleBlockFormat('quote')}
            color={blockType === 'quote' ? 'primary' : 'default'}
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Insert Controls */}
      <Box sx={{ display: 'flex' }}>
        <Tooltip title="Insert Link">
          <IconButton size="small">
            <InsertLink fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Table">
          <IconButton size="small">
            <TableChart fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Image">
          <IconButton size="small">
            <Image fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* AI Tools */}
      {showAIPanel && (
        <>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <AIButton
              variant="generate"
              size="small"
              tooltip="Generate content with AI"
            />
            <AIButton
              variant="improve"
              size="small"
              tooltip="Improve existing content"
            />
            <AIButton
              variant="rephrase"
              size="small"
              tooltip="Rephrase content"
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          <Tooltip title="Toggle AI Panel">
            <Button
              size="small"
              onClick={onAIToggle}
              startIcon={<SmartToy />}
              variant="outlined"
              sx={{ 
                textTransform: 'none',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }
              }}
            >
              AI
            </Button>
          </Tooltip>
        </>
      )}
    </Toolbar>
  );
};

export default EditorToolbar;