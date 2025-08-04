import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Fade,
  useTheme 
} from '@mui/material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { $getRoot, $getSelection, EditorState } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $generateNodesFromDOM } from '@lexical/html';

// Lexical Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';

import EditorToolbar from './EditorToolbar';
import EditorStatusBar from './EditorStatusBar';
import AIPanel from './AIPanel';
import { SectionContent, SectionType } from '../../../types/section.types';
import './editor.css';

interface RichTextEditorProps {
  content: SectionContent;
  sectionType: SectionType;
  sectionId: string;
  onChange: (content: SectionContent) => void;
  onSave?: () => void;
  autoSave?: boolean;
  showAIPanel?: boolean;
  readOnly?: boolean;
}

const editorTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-token-attr',
    attr: 'editor-token-attr',
    boolean: 'editor-token-boolean',
    builtin: 'editor-token-builtin',
    cdata: 'editor-token-cdata',
    char: 'editor-token-char',
    class: 'editor-token-class',
    'class-name': 'editor-token-class-name',
    comment: 'editor-token-comment',
    constant: 'editor-token-constant',
    deleted: 'editor-token-deleted',
    doctype: 'editor-token-doctype',
    entity: 'editor-token-entity',
    function: 'editor-token-function',
    important: 'editor-token-important',
    inserted: 'editor-token-inserted',
    keyword: 'editor-token-keyword',
    namespace: 'editor-token-namespace',
    number: 'editor-token-number',
    operator: 'editor-token-operator',
    prolog: 'editor-token-prolog',
    property: 'editor-token-property',
    punctuation: 'editor-token-punctuation',
    regex: 'editor-token-regex',
    selector: 'editor-token-selector',
    string: 'editor-token-string',
    symbol: 'editor-token-symbol',
    tag: 'editor-token-tag',
    url: 'editor-token-url',
    variable: 'editor-token-variable',
  },
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  sectionType,
  sectionId,
  onChange,
  onSave,
  autoSave = true,
  showAIPanel = true,
  readOnly = false
}) => {
  const theme = useTheme();
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate reading time (average 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);

  const initialConfig = {
    namespace: `ProposalEditor-${sectionId}`,
    theme: editorTheme,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
    editable: !readOnly,
  };

  // Initialize editor with existing content
  const initializeEditor = useCallback((editor: any) => {
    if (content.text && content.text.trim()) {
      editor.update(() => {
        try {
          // Try to parse as HTML first
          const parser = new DOMParser();
          const dom = parser.parseFromString(content.text!, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          const root = $getRoot();
          root.clear();
          nodes.forEach(node => root.append(node));
        } catch (error) {
          // Fallback to plain text
          const root = $getRoot();
          root.clear();
          const textNode = root.createTextNode(content.text!);
          root.append(textNode);
        }
      });
    }
  }, [content.text]);

  // Handle editor changes
  const handleEditorChange = useCallback((newEditorState: EditorState) => {
    setEditorState(newEditorState);

    newEditorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      
      // Generate HTML content
      let htmlContent = '';
      try {
        htmlContent = $generateHtmlFromNodes(newEditorState.getLatestEditor(), null);
      } catch (error) {
        // Fallback to text content
        htmlContent = textContent;
      }
      
      // Update word and character counts
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharacterCount(textContent.length);

      // Update content
      const updatedContent: SectionContent = {
        ...content,
        text: htmlContent,
      };

      onChange(updatedContent);

      // Auto-save with debounce
      if (autoSave && !readOnly) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          handleAutoSave();
        }, 2000); // 2 second debounce
      }
    });
  }, [content, onChange, autoSave, readOnly]);

  const handleAutoSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Handle AI panel toggle
  const handleAIToggle = useCallback(() => {
    setIsAIPanelOpen(!isAIPanelOpen);
  }, [isAIPanelOpen]);

  // Handle AI content insertion
  const handleAIContentInsert = useCallback((aiContent: string) => {
    if (!editorState) return;

    const editor = editorState.getLatestEditor();
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        selection.insertText(aiContent);
      } else {
        const root = $getRoot();
        const paragraph = root.getLastChild();
        if (paragraph) {
          paragraph.selectNext();
          const newSelection = $getSelection();
          newSelection?.insertText('\n' + aiContent);
        }
      }
    });
  }, [editorState]);

  // Clean up auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 400 }}>
      {/* Main Editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <LexicalComposer initialConfig={initialConfig}>
            {/* Toolbar */}
            <EditorToolbar 
              onAIToggle={handleAIToggle}
              showAIPanel={showAIPanel}
              readOnly={readOnly}
            />
            
            <Divider />

            {/* Editor Content */}
            <Box 
              sx={{ 
                flex: 1, 
                position: 'relative',
                '& .editor-input': {
                  minHeight: 300,
                  padding: 2,
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  outline: 'none',
                  border: 'none',
                  resize: 'none',
                  color: theme.palette.text.primary,
                  fontFamily: theme.typography.fontFamily,
                  '&:focus': {
                    outline: 'none',
                  }
                },
                '& .editor-paragraph': {
                  margin: '0 0 16px 0',
                  '&:last-child': {
                    marginBottom: 0,
                  }
                },
                '& .editor-heading-h1': {
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: '0 0 16px 0',
                  lineHeight: 1.2,
                },
                '& .editor-heading-h2': {
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  margin: '0 0 14px 0',
                  lineHeight: 1.3,
                },
                '& .editor-heading-h3': {
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  margin: '0 0 12px 0',
                  lineHeight: 1.4,
                },
                '& .editor-heading-h4': {
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  margin: '0 0 10px 0',
                  lineHeight: 1.4,
                },
                '& .editor-heading-h5': {
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  margin: '0 0 8px 0',
                  lineHeight: 1.5,
                },
                '& .editor-heading-h6': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 8px 0',
                  lineHeight: 1.5,
                },
                '& .editor-text-bold': {
                  fontWeight: 'bold',
                },
                '& .editor-text-italic': {
                  fontStyle: 'italic',
                },
                '& .editor-text-underline': {
                  textDecoration: 'underline',
                },
                '& .editor-text-strikethrough': {
                  textDecoration: 'line-through',
                },
                '& .editor-text-code': {
                  backgroundColor: theme.palette.grey[100],
                  padding: '2px 4px',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                },
                '& .editor-link': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline',
                  '&:hover': {
                    color: theme.palette.primary.dark,
                  }
                },
                '& .editor-list-ul': {
                  paddingLeft: 20,
                  margin: '0 0 16px 0',
                },
                '& .editor-list-ol': {
                  paddingLeft: 20,
                  margin: '0 0 16px 0',
                },
                '& .editor-listitem': {
                  margin: '4px 0',
                },
                '& .editor-quote': {
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  paddingLeft: 16,
                  margin: '16px 0',
                  fontStyle: 'italic',
                  color: theme.palette.text.secondary,
                },
              }}
            >
              <RichTextPlugin
                contentEditable={
                  <ContentEditable 
                    className="editor-input"
                    style={{ minHeight: 300 }}
                  />
                }
                placeholder={
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      position: 'absolute', 
                      top: 16, 
                      left: 16, 
                      color: theme.palette.text.disabled,
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  >
                    Start writing your {sectionType} content...
                  </Typography>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </Box>

            {/* Plugins */}
            <OnChangePlugin onChange={handleEditorChange} />
            <HistoryPlugin />
            <LinkPlugin />
            <ListPlugin />
            <TabIndentationPlugin />

            {/* Status Bar */}
            <Divider />
            <EditorStatusBar
              wordCount={wordCount}
              characterCount={characterCount}
              readingTime={readingTime}
              isSaving={isSaving}
              lastSaved={lastSaved}
              sectionType={sectionType}
            />
          </LexicalComposer>
        </Paper>
      </Box>

      {/* AI Panel */}
      {showAIPanel && (
        <Fade in={isAIPanelOpen}>
          <Box sx={{ width: 400, ml: 2 }}>
            <AIPanel
              open={isAIPanelOpen}
              onClose={() => setIsAIPanelOpen(false)}
              sectionType={sectionType}
              currentContent={content.text || ''}
              onContentInsert={handleAIContentInsert}
              onContentReplace={(newContent) => {
                onChange({ ...content, text: newContent });
              }}
            />
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default RichTextEditor;