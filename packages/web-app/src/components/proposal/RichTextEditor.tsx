import React, { useEffect, useState } from 'react';
import { Box, Stack, IconButton, Divider, Tooltip, Paper } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Code,
  Link,
  FormatQuote,
  Undo,
  Redo,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
} from '@mui/icons-material';
import { 
  $getRoot, 
  $getSelection, 
  $isRangeSelection, 
  EditorState, 
  $createTextNode 
} from 'lexical';
import { 
  $isHeadingNode,
  HeadingTagType,
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
  ListItemNode,
} from '@lexical/list';
import { CodeNode, $createCodeNode, $isCodeNode } from '@lexical/code';
import { LinkNode, $createLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {
  $setBlocksType,
} from '@lexical/selection';
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
} from 'lexical';

// Theme for the editor
const theme = {
  paragraph: 'rich-text-paragraph',
  heading: {
    h1: 'rich-text-h1',
    h2: 'rich-text-h2',
    h3: 'rich-text-h3',
  },
  list: {
    ol: 'rich-text-ol',
    ul: 'rich-text-ul',
    listitem: 'rich-text-listitem',
  },
  quote: 'rich-text-quote',
  code: 'rich-text-code',
  link: 'rich-text-link',
  text: {
    bold: 'rich-text-bold',
    italic: 'rich-text-italic',
    underline: 'rich-text-underline',
    strikethrough: 'rich-text-strikethrough',
    code: 'rich-text-text-code',
  },
};

// Toolbar component
function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const updateToolbar = () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element;
          const listType = parentList.getTag();
          setBlockType(listType);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
        }
      }
    }
  };

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (canUndo) => {
        setCanUndo(canUndo);
        return false;
      },
      1
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (canRedo) => {
        setCanRedo(canRedo);
        return false;
      },
      1
    );
  }, [editor]);

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const formatCode = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const formatAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  return (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider', 
      p: 1,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 0.5,
      alignItems: 'center',
    }}>
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Undo (Ctrl+Z)">
          <IconButton
            size="small"
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            disabled={!canUndo}
          >
            <Undo fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <IconButton
            size="small"
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            disabled={!canRedo}
          >
            <Redo fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Bold (Ctrl+B)">
          <IconButton
            size="small"
            onClick={() => formatText('bold')}
            color={isBold ? 'primary' : 'default'}
          >
            <FormatBold fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic (Ctrl+I)">
          <IconButton
            size="small"
            onClick={() => formatText('italic')}
            color={isItalic ? 'primary' : 'default'}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline (Ctrl+U)">
          <IconButton
            size="small"
            onClick={() => formatText('underline')}
            color={isUnderline ? 'primary' : 'default'}
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Align Left">
          <IconButton size="small" onClick={() => formatAlign('left')}>
            <FormatAlignLeft fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Center">
          <IconButton size="small" onClick={() => formatAlign('center')}>
            <FormatAlignCenter fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Align Right">
          <IconButton size="small" onClick={() => formatAlign('right')}>
            <FormatAlignRight fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Justify">
          <IconButton size="small" onClick={() => formatAlign('justify')}>
            <FormatAlignJustify fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Bullet List">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }}
            color={blockType === 'ul' ? 'primary' : 'default'}
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }}
            color={blockType === 'ol' ? 'primary' : 'default'}
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Quote">
          <IconButton
            size="small"
            onClick={() => formatQuote()}
            color={blockType === 'quote' ? 'primary' : 'default'}
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code Block">
          <IconButton
            size="small"
            onClick={() => formatCode()}
            color={blockType === 'code' ? 'primary' : 'default'}
          >
            <Code fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({ 
  initialContent = '', 
  onChange, 
  placeholder = 'Start typing...',
  readOnly = false 
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'ProposalEditor',
    theme,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      LinkNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    editorState: undefined,
    editable: !readOnly,
  };

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      if (onChange) {
        onChange(textContent);
      }
    });
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        {!readOnly && <Toolbar />}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          position: 'relative',
        }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                style={{
                  minHeight: '100%',
                  padding: '16px',
                  outline: 'none',
                  fontSize: '16px',
                  lineHeight: '1.5',
                }}
                placeholder={placeholder}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </Box>
      </LexicalComposer>

      <style>
        {`
          .rich-text-paragraph {
            margin: 0 0 8px 0;
          }
          .rich-text-h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 16px 0 8px 0;
          }
          .rich-text-h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 16px 0 8px 0;
          }
          .rich-text-h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 16px 0 8px 0;
          }
          .rich-text-ul {
            margin: 8px 0;
            padding-left: 20px;
          }
          .rich-text-ol {
            margin: 8px 0;
            padding-left: 20px;
          }
          .rich-text-listitem {
            margin: 4px 0;
          }
          .rich-text-quote {
            border-left: 4px solid #ddd;
            padding-left: 16px;
            margin: 8px 0;
            color: #666;
          }
          .rich-text-code {
            background-color: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            margin: 8px 0;
          }
          .rich-text-link {
            color: #1976d2;
            text-decoration: underline;
          }
          .rich-text-bold {
            font-weight: bold;
          }
          .rich-text-italic {
            font-style: italic;
          }
          .rich-text-underline {
            text-decoration: underline;
          }
          .rich-text-strikethrough {
            text-decoration: line-through;
          }
          .rich-text-text-code {
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.9em;
          }
        `}
      </style>
    </Paper>
  );
}