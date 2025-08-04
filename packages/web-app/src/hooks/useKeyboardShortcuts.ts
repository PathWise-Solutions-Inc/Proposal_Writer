import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatch = shortcut.meta ? event.metaKey : true;

      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global keyboard shortcuts hook
export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrl: true,
      description: 'Save proposal',
      action: () => {
        // Dispatch save action
        const saveEvent = new CustomEvent('proposal:save');
        window.dispatchEvent(saveEvent);
      }
    },
    {
      key: 'p',
      ctrl: true,
      shift: true,
      description: 'Preview proposal',
      action: () => {
        const previewEvent = new CustomEvent('proposal:preview');
        window.dispatchEvent(previewEvent);
      }
    },
    {
      key: 'n',
      ctrl: true,
      shift: true,
      description: 'New section',
      action: () => {
        const newSectionEvent = new CustomEvent('section:new');
        window.dispatchEvent(newSectionEvent);
      }
    },
    {
      key: 'd',
      ctrl: true,
      shift: true,
      description: 'Duplicate section',
      action: () => {
        const duplicateEvent = new CustomEvent('section:duplicate');
        window.dispatchEvent(duplicateEvent);
      }
    },
    {
      key: 'Delete',
      shift: true,
      description: 'Delete section',
      action: () => {
        const deleteEvent = new CustomEvent('section:delete');
        window.dispatchEvent(deleteEvent);
      }
    },
    {
      key: 'g',
      ctrl: true,
      shift: true,
      description: 'Generate AI content',
      action: () => {
        const generateEvent = new CustomEvent('ai:generate');
        window.dispatchEvent(generateEvent);
      }
    },
    {
      key: '/',
      ctrl: true,
      description: 'Toggle section tree',
      action: () => {
        const toggleEvent = new CustomEvent('tree:toggle');
        window.dispatchEvent(toggleEvent);
      }
    },
    {
      key: 'f',
      ctrl: true,
      shift: true,
      description: 'Search sections',
      action: () => {
        const searchEvent = new CustomEvent('search:open');
        window.dispatchEvent(searchEvent);
      }
    },
    {
      key: 'Escape',
      description: 'Close dialogs/Cancel',
      action: () => {
        const escapeEvent = new CustomEvent('dialog:close');
        window.dispatchEvent(escapeEvent);
      }
    },
    {
      key: 'ArrowUp',
      alt: true,
      description: 'Move section up',
      action: () => {
        const moveUpEvent = new CustomEvent('section:moveUp');
        window.dispatchEvent(moveUpEvent);
      }
    },
    {
      key: 'ArrowDown',
      alt: true,
      description: 'Move section down',
      action: () => {
        const moveDownEvent = new CustomEvent('section:moveDown');
        window.dispatchEvent(moveDownEvent);
      }
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Hook to display keyboard shortcuts
export function useKeyboardShortcutsList() {
  const shortcuts = useGlobalKeyboardShortcuts();
  
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.alt) keys.push('Alt');
    if (shortcut.meta) keys.push('Cmd');
    keys.push(shortcut.key);
    return keys.join('+');
  };

  return shortcuts.map(shortcut => ({
    keys: formatShortcut(shortcut),
    description: shortcut.description
  }));
}