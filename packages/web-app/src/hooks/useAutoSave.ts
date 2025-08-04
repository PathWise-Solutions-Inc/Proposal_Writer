import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setAutoSaveStatus } from '../store/slices/proposalSlice';
import { debounce } from 'lodash';

interface AutoSaveOptions {
  interval?: number; // Auto-save interval in milliseconds
  debounceDelay?: number; // Debounce delay for changes
  onSave?: () => Promise<void>;
  enabled?: boolean;
}

export const useAutoSave = ({
  interval = 30000, // 30 seconds
  debounceDelay = 2000, // 2 seconds
  onSave,
  enabled = true,
}: AutoSaveOptions = {}) => {
  const dispatch = useDispatch();
  const lastSaveRef = useRef<Date>(new Date());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSaveRef = useRef<Function | null>(null);
  
  const { currentProposal, sectionTree, autoSaveEnabled } = useSelector(
    (state: RootState) => state.proposal
  );

  // Create version snapshot
  const createSnapshot = useCallback(() => {
    if (!currentProposal) return null;
    
    return {
      proposalId: currentProposal.id,
      title: currentProposal.title,
      sections: sectionTree.sections,
      timestamp: new Date().toISOString(),
      metadata: {
        wordCount: calculateWordCount(sectionTree.sections),
        sectionCount: sectionTree.sections.length,
      },
    };
  }, [currentProposal, sectionTree.sections]);

  // Save function
  const performSave = useCallback(async () => {
    if (!enabled || !autoSaveEnabled || !onSave) return;
    
    try {
      dispatch(setAutoSaveStatus({ status: 'saving' }));
      
      await onSave();
      
      lastSaveRef.current = new Date();
      dispatch(setAutoSaveStatus({ 
        status: 'saved',
        lastSaved: lastSaveRef.current.toISOString()
      }));
      
      // Store snapshot in localStorage for recovery
      const snapshot = createSnapshot();
      if (snapshot) {
        localStorage.setItem(
          `proposal_autosave_${snapshot.proposalId}`,
          JSON.stringify(snapshot)
        );
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      dispatch(setAutoSaveStatus({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Auto-save failed'
      }));
    }
  }, [enabled, autoSaveEnabled, onSave, dispatch, createSnapshot]);

  // Debounced save
  useEffect(() => {
    debouncedSaveRef.current = debounce(performSave, debounceDelay);
    
    return () => {
      if (debouncedSaveRef.current) {
        (debouncedSaveRef.current as any).cancel();
      }
    };
  }, [performSave, debounceDelay]);

  // Trigger save on content changes
  useEffect(() => {
    if (enabled && autoSaveEnabled && debouncedSaveRef.current) {
      debouncedSaveRef.current();
    }
  }, [sectionTree.sections, currentProposal?.title, enabled, autoSaveEnabled]);

  // Periodic auto-save
  useEffect(() => {
    if (enabled && autoSaveEnabled && interval > 0) {
      saveTimerRef.current = setInterval(() => {
        performSave();
      }, interval);
      
      return () => {
        if (saveTimerRef.current) {
          clearInterval(saveTimerRef.current);
        }
      };
    }
  }, [enabled, autoSaveEnabled, interval, performSave]);

  // Save on window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (enabled && autoSaveEnabled) {
        performSave();
        
        // Show warning if there are unsaved changes
        const timeSinceLastSave = Date.now() - lastSaveRef.current.getTime();
        if (timeSinceLastSave < debounceDelay) {
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, autoSaveEnabled, performSave, debounceDelay]);

  // Manual save trigger
  const triggerSave = useCallback(() => {
    if (debouncedSaveRef.current) {
      (debouncedSaveRef.current as any).cancel();
    }
    performSave();
  }, [performSave]);

  // Recover from auto-save
  const recoverFromAutoSave = useCallback((proposalId: string) => {
    const savedData = localStorage.getItem(`proposal_autosave_${proposalId}`);
    if (savedData) {
      try {
        const snapshot = JSON.parse(savedData);
        return snapshot;
      } catch (error) {
        console.error('Failed to recover auto-save:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Clear auto-save data
  const clearAutoSave = useCallback((proposalId: string) => {
    localStorage.removeItem(`proposal_autosave_${proposalId}`);
  }, []);

  return {
    triggerSave,
    recoverFromAutoSave,
    clearAutoSave,
    lastSaved: lastSaveRef.current,
  };
};

// Helper function to calculate word count
function calculateWordCount(sections: any[]): number {
  let totalWords = 0;
  
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const processSections = (sectionList: any[]) => {
    sectionList.forEach(section => {
      if (section.content) {
        if (typeof section.content === 'string') {
          totalWords += countWords(section.content);
        } else if (typeof section.content === 'object' && section.content.text) {
          totalWords += countWords(section.content.text);
        }
      }
      
      if (section.children && section.children.length > 0) {
        processSections(section.children);
      }
    });
  };
  
  processSections(sections);
  return totalWords;
}