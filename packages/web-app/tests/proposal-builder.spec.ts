import { test, expect } from '@playwright/test';

test.describe('Proposal Builder Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to proposals page first
    await page.goto('http://localhost:3000/proposals');
    
    // Create a test proposal if needed
    const proposalsExist = await page.locator('[data-testid="proposal-card"]').count() > 0;
    
    if (!proposalsExist) {
      // Click new proposal button
      await page.click('button:has-text("New Proposal")');
      
      // Fill in proposal details
      await page.fill('input[name="title"]', 'Test Proposal');
      await page.fill('textarea[name="description"]', 'Test description');
      
      // Select template and create
      await page.click('div[role="button"]:has-text("Blank Proposal")');
      await page.click('button:has-text("Create Proposal")');
      
      // Wait for navigation
      await page.waitForURL(/\/proposals\/.+/);
    } else {
      // Click first proposal
      await page.click('[data-testid="proposal-card"]:first-child');
    }
  });

  test('should load proposal builder page', async ({ page }) => {
    // Check main components are visible
    await expect(page.locator('text=Proposal Structure')).toBeVisible();
    await expect(page.locator('text=Content Editor')).toBeVisible();
  });

  test('should display section tree', async ({ page }) => {
    // Check section tree exists
    const sectionTree = page.locator('[role="tree"]');
    await expect(sectionTree).toBeVisible();
    
    // Check if sections exist
    const sections = page.locator('[role="treeitem"]');
    const sectionCount = await sections.count();
    
    if (sectionCount === 0) {
      // Add a section using the button
      await page.click('button:has-text("Add Section")');
      
      // Select section type
      const sectionTypeDialog = page.locator('text=Select Section Type');
      if (await sectionTypeDialog.isVisible()) {
        await page.click('text=Paragraph');
      }
    }
  });

  test('should show rich text editor when section is selected', async ({ page }) => {
    // Add a section if none exist
    const sections = page.locator('[role="treeitem"]');
    const sectionCount = await sections.count();
    
    if (sectionCount === 0) {
      await page.click('button:has-text("Add Section")');
      await page.click('text=Paragraph');
    }
    
    // Click first section
    await page.click('[role="treeitem"]:first-child');
    
    // Check editor is visible
    const editor = page.locator('[contenteditable="true"]');
    await expect(editor).toBeVisible();
    
    // Check toolbar is visible
    const toolbar = page.locator('[aria-label="Formatting toolbar"], [role="toolbar"]').first();
    await expect(toolbar).toBeVisible();
  });

  test('should format text in rich text editor', async ({ page }) => {
    // Ensure we have a section
    const sections = page.locator('[role="treeitem"]');
    if (await sections.count() === 0) {
      await page.click('button:has-text("Add Section")');
      await page.click('text=Paragraph');
    }
    
    // Click first section
    await page.click('[role="treeitem"]:first-child');
    
    // Type in editor
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.fill('Test content for formatting');
    
    // Select all text
    await page.keyboard.press('Control+a');
    
    // Apply bold formatting
    const boldButton = page.locator('button[aria-label="Bold"], button:has(svg[data-testid="FormatBoldIcon"])').first();
    await boldButton.click();
    
    // Check if text is bold
    const boldText = await editor.locator('.rich-text-bold, strong, b').count();
    expect(boldText).toBeGreaterThan(0);
  });

  test('should show keyboard shortcuts dialog', async ({ page }) => {
    // Find and click keyboard shortcuts button
    const keyboardButton = page.locator('button[aria-label="Keyboard shortcuts"], button:has(svg[data-testid="KeyboardIcon"])').first();
    
    if (await keyboardButton.isVisible()) {
      await keyboardButton.click();
      
      // Check dialog appears
      const dialog = page.locator('text=Keyboard Shortcuts');
      await expect(dialog).toBeVisible();
      
      // Check some shortcuts are listed
      await expect(page.locator('text=Save proposal')).toBeVisible();
      await expect(page.locator('text=Ctrl+S, text=Cmd+S').first()).toBeVisible();
      
      // Close dialog
      await page.click('button:has-text("Close")');
    }
  });

  test('should show templates dialog', async ({ page }) => {
    // Find and click templates button
    const templatesButton = page.locator('button:has-text("Templates")');
    
    if (await templatesButton.isVisible()) {
      await templatesButton.click();
      
      // Check dialog appears
      const dialog = page.locator('text=Section Templates');
      await expect(dialog).toBeVisible();
      
      // Check templates are shown
      const templateCards = page.locator('[role="article"], .MuiCard-root');
      const templateCount = await templateCards.count();
      expect(templateCount).toBeGreaterThan(0);
      
      // Close dialog
      await page.keyboard.press('Escape');
    }
  });

  test('should save proposal with keyboard shortcut', async ({ page }) => {
    // Add content to trigger save
    const sections = page.locator('[role="treeitem"]');
    if (await sections.count() === 0) {
      await page.click('button:has-text("Add Section")');
      await page.click('text=Paragraph');
    }
    
    await page.click('[role="treeitem"]:first-child');
    
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill('Content to save');
    
    // Use save shortcut
    await page.keyboard.press('Control+s');
    
    // Check for save indication (this might vary based on implementation)
    // Could be a toast notification, status change, etc.
    const saveButton = page.locator('button:has-text("Save")');
    
    // Save button should be disabled after saving (no unsaved changes)
    await expect(saveButton).toBeDisabled({ timeout: 5000 });
  });

  test('should handle drag and drop of sections', async ({ page }) => {
    // Ensure we have at least 2 sections
    const sections = page.locator('[role="treeitem"]');
    const initialCount = await sections.count();
    
    while (await sections.count() < 2) {
      await page.click('button:has-text("Add Section")');
      await page.click('text=Paragraph');
    }
    
    // Get section titles before drag
    const firstSectionTitle = await sections.first().textContent();
    const secondSectionTitle = await sections.nth(1).textContent();
    
    // Perform drag and drop
    const dragHandle = sections.first().locator('svg[data-testid="DragIndicatorIcon"]');
    const dropTarget = sections.nth(1);
    
    if (await dragHandle.isVisible()) {
      await dragHandle.hover();
      await page.mouse.down();
      await dropTarget.hover();
      await page.mouse.up();
      
      // Verify order changed
      await page.waitForTimeout(500); // Wait for animation
      
      const newFirstTitle = await sections.first().textContent();
      const newSecondTitle = await sections.nth(1).textContent();
      
      // Order should be swapped
      expect(newFirstTitle).toBe(secondSectionTitle);
      expect(newSecondTitle).toBe(firstSectionTitle);
    }
  });

  test('should toggle section tree visibility', async ({ page }) => {
    // Check section tree is visible initially
    const sectionTree = page.locator('text=Proposal Structure').locator('..');
    await expect(sectionTree).toBeVisible();
    
    // Press keyboard shortcut to toggle
    await page.keyboard.press('Control+/');
    
    // Section tree should be hidden
    await expect(sectionTree).not.toBeVisible();
    
    // Press again to show
    await page.keyboard.press('Control+/');
    
    // Should be visible again
    await expect(sectionTree).toBeVisible();
  });

  test('should handle undo/redo in editor', async ({ page }) => {
    // Select a section
    const sections = page.locator('[role="treeitem"]');
    if (await sections.count() === 0) {
      await page.click('button:has-text("Add Section")');
      await page.click('text=Paragraph');
    }
    
    await page.click('[role="treeitem"]:first-child');
    
    // Type content
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill('Original text');
    await page.waitForTimeout(100);
    
    // Type more content
    await editor.fill('Modified text');
    await page.waitForTimeout(100);
    
    // Find undo button
    const undoButton = page.locator('button[aria-label="Undo"], button:has(svg[data-testid="UndoIcon"])').first();
    
    if (await undoButton.isVisible()) {
      // Click undo
      await undoButton.click();
      
      // Should show original text
      await expect(editor).toHaveText('Original text');
      
      // Find redo button
      const redoButton = page.locator('button[aria-label="Redo"], button:has(svg[data-testid="RedoIcon"])').first();
      
      // Click redo
      await redoButton.click();
      
      // Should show modified text
      await expect(editor).toHaveText('Modified text');
    }
  });
});