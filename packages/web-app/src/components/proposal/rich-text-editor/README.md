# Rich Text Editor with AI Integration

A comprehensive rich text editing solution for the Proposal Writer application, built with Lexical and integrated with AI-powered content generation.

## Features

### 🎨 Rich Text Editing
- **Full formatting capabilities**: Bold, italic, underline, strikethrough, code
- **Structured content**: Headings (H1-H6), bullet lists, numbered lists, quotes
- **Modern editor**: Built on Meta's Lexical framework for performance and extensibility
- **Responsive design**: Works seamlessly across desktop and mobile devices

### 🤖 AI-Powered Content Generation
- **Context-aware prompts**: AI suggestions tailored to section type (heading, paragraph, list, etc.)
- **Multiple generation modes**: 
  - Generate new content from scratch
  - Improve existing content for clarity, grammar, and persuasiveness
  - Rephrase content with different tones (formal, conversational, technical, persuasive)
  - Create content variations (shorter, longer, different tone)
- **OpenRouter integration**: Leverages Claude 3.5 Sonnet and other advanced AI models
- **Confidence scoring**: AI suggestions include confidence ratings to help users make informed decisions

### 📊 Smart Analytics
- **Real-time statistics**: Word count, character count, and estimated reading time
- **Content quality indicators**: Length assessment (short, medium, detailed)
- **Auto-save functionality**: Automatic content saving with visual indicators
- **Last saved tracking**: Shows when content was last saved

### 🎯 Section-Specific Optimization
- **Adaptive interface**: Editor adapts to section type (heading, paragraph, list, etc.)
- **Contextual AI prompts**: AI understands the purpose of each section type
- **Template-driven content**: Section-specific content templates and suggestions

### 🔄 Seamless Integration
- **Redux state management**: Fully integrated with existing proposal state
- **Material-UI theming**: Consistent with application design system
- **Responsive layouts**: Editor scales from mobile to desktop
- **Accessibility support**: ARIA labels and keyboard navigation

## Components

### RichTextEditor
Main editor component that orchestrates all functionality:
- Lexical editor initialization and configuration
- Content synchronization with Redux store
- AI panel integration
- Auto-save and change tracking

### EditorToolbar
Comprehensive formatting toolbar with:
- Text formatting controls (bold, italic, underline, etc.)
- Block formatting (headings, lists, quotes)
- Insert tools (links, tables, images)
- AI action buttons
- Undo/redo functionality

### AIPanel
Intelligent content assistance panel featuring:
- Content generation with custom prompts
- Content improvement suggestions
- Multiple content variations
- Tone and length controls
- Suggestion history and management

### EditorStatusBar
Informative status display showing:
- Real-time word and character counts
- Estimated reading time
- Content quality indicators
- Auto-save status
- Section type indicator

### AIButton
Reusable AI action buttons with:
- Context menus for multiple actions
- Loading states and animations
- Consistent styling across the application
- Configurable variants (generate, improve, rephrase, suggestions)

## Usage

### Basic Implementation
```tsx
import { RichTextEditor } from './components/proposal/rich-text-editor';

<RichTextEditor
  content={sectionContent}
  sectionType={SectionType.PARAGRAPH}
  sectionId="section-123"
  onChange={handleContentChange}
  onSave={handleSave}
  autoSave={true}
  showAIPanel={true}
/>
```

### Integration with SectionEditor
The rich text editor is seamlessly integrated into the existing SectionEditor dialog:
- Toggle between basic and rich text modes
- Full-screen editing experience for rich content
- Preserves all existing section metadata and controls

## AI Service Integration

### OpenRouter Configuration
- Supports multiple AI models (Claude 3.5 Sonnet, GPT-4, etc.)
- Configurable model selection and parameters
- Robust error handling and fallbacks

### Context-Aware Prompts
- Section-specific prompt templates
- Tone-based content modification
- Length-controlled generation
- Professional business proposal optimization

## Performance Optimizations

### Efficient Rendering
- Lexical's virtual DOM for fast updates
- Debounced auto-save to prevent excessive API calls
- Lazy loading of AI panel components
- Optimized Material-UI component usage

### Memory Management
- Proper cleanup of editor instances
- Timeout clearing for auto-save
- Local storage for AI result caching

## Styling and Theming

### Material-UI Integration
- Consistent with application theme
- Responsive design patterns
- Proper color scheme support
- Accessibility-compliant styling

### Custom CSS
- Editor-specific styling in `editor.css`
- Lexical theme configuration
- Syntax highlighting for code blocks
- Smooth animations and transitions

## Future Enhancements

### Planned Features
- [ ] Real-time collaboration indicators
- [ ] Advanced table editing capabilities
- [ ] Image upload and management
- [ ] Custom component insertion
- [ ] Template library integration
- [ ] Version history and comparison
- [ ] Comments and review system

### AI Improvements
- [ ] Content suggestions while typing
- [ ] Grammar and style checking
- [ ] Plagiarism detection
- [ ] Industry-specific content optimization
- [ ] Automated compliance checking

## Technical Requirements

### Dependencies
- React 18+
- Lexical 0.33+
- Material-UI 5+
- Redux Toolkit
- OpenRouter API access

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Notes

### Code Quality
- TypeScript strict mode enabled
- Comprehensive error handling
- Proper prop validation
- Performance monitoring hooks

### Testing Considerations
- Unit tests for AI service integration
- Component testing with React Testing Library
- E2E testing with Playwright
- Accessibility testing with axe-core

This rich text editor represents a significant enhancement to the Proposal Writer application, providing users with professional-grade editing capabilities powered by cutting-edge AI technology.