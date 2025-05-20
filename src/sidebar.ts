import type { INotebookTracker } from '@jupyterlab/notebook';
import type { IThemeManager } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
/**
 * A custom widget for our sidebar panel
 */
class InterviewSidebar extends Widget {
  private _notebookTracker: INotebookTracker;
  private _themeManager: IThemeManager | null;
  private _cellsList: HTMLElement;
  private _statusElement: HTMLElement;

  constructor(
    notebookTracker: INotebookTracker,
    themeManager: IThemeManager | null
  ) {
    super();
    this._notebookTracker = notebookTracker;
    this._themeManager = themeManager;
    this.addClass('interview-extension-sidebar');
    this.title.label = 'Interview Tools';
    this.title.closable = true;

    // Add some content to the sidebar
    const content = document.createElement('div');
    content.className = 'interview-sidebar-container';
    content.style.padding = '10px';
    content.style.height = '100%';
    content.style.overflow = 'auto';

    content.innerHTML = `
      <div class="interview-sidebar-content">
        <h3>Interview Tools</h3>
        <hr />
        <h4>Notebook Status</h4>
        <div id="notebook-status">No active notebook</div>
        <h4>Cells</h4>
        <div id="cells-list" style="max-height: 300px; overflow-y: auto; padding: 5px;"></div>
      </div>
    `;
    this.node.appendChild(content);

    // Store reference to cells list element
    this._cellsList = this.node.querySelector('#cells-list') as HTMLElement;
    this._statusElement = this.node.querySelector(
      '#notebook-status'
    ) as HTMLElement;

    // Set up listeners for notebook changes
    this._notebookTracker.currentChanged.connect(this._onNotebookChanged, this);

    // Set up additional listeners for cell changes
    this._notebookTracker.activeCellChanged.connect(
      this._onActiveCellChanged,
      this
    );
  }

  /**
   * Handle notebook change events
   */
  private _onNotebookChanged(): void {
    const current = this._notebookTracker.currentWidget;

    if (current) {
      this._statusElement.textContent = `Active notebook: ${current.title.label}`;

      // Connect to the model's contentChanged signal
      current.content.model?.contentChanged.connect(
        this._refreshCellsList,
        this
      );

      // Initial refresh of cells list
      this._refreshCellsList();
    } else {
      this._statusElement.textContent = 'No active notebook';
      this._cellsList.innerHTML = '<p>No notebook selected</p>';
    }
  }

  /**
   * Handle active cell change events
   */
  private _onActiveCellChanged(): void {
    this._refreshCellsList();
  }

  // Make this public so it can be called from outside the class
  public refreshCellsList(): void {
    this._refreshCellsList();
  }

  /**
   * Refresh the cells list display
   */
  private _refreshCellsList(): void {
    const current = this._notebookTracker.currentWidget;

    if (!current) {
      this._cellsList.innerHTML = '<p>No notebook selected</p>';
      return;
    }

    const notebook = current.content;
    const cells = notebook.widgets;

    // Clear the current content
    this._cellsList.innerHTML = '';

    // If no cells, show a message
    if (cells.length === 0) {
      this._cellsList.innerHTML = '<p>Notebook has no cells</p>';
      return;
    }

    // Create a list for the cells
    const cellListElement = document.createElement('ul');
    cellListElement.style.listStyleType = 'none';
    cellListElement.style.padding = '0';

    for (const [index, cell] of cells.entries()) {
      const cellItem = document.createElement('li');
      cellItem.classList.add('cell-item');
      cellItem.style.padding = '5px';

      // Determine cell metadata
      const cellMetadata = cell.model.metadata;
      const cellID = cell.model.id;

      // Get first line of content (truncated)
      const content = cell.model.sharedModel.getSource().split('\n')[0];
      const truncatedContent =
        content.length > 30 ? `${content.substring(0, 30)}...` : content;

      const isDarkTheme = this._themeManager?.theme?.includes('Dark');

      // Highlight the active cell
      if (notebook.activeCell === cell) {
        cellItem.style.fontWeight = 'bold';
        cellItem.style.borderLeft = isDarkTheme
          ? '2px solid #eee'
          : '2px solid #333';
      }

      const cellTitle = cellMetadata.type ? `${cellMetadata.type} |` : '';
      const cellContent =
        truncatedContent.length > 0 ? truncatedContent : '(empty)';

      cellItem.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <span id="cell-item-title" style="color: ${isDarkTheme ? '#white' : '#333'}; font-size: 0.8rem; font-weight: bold; text-transform: capitalize;">
          ${cellTitle} ${cellID}:
          </span>
          <span id="cell-item-content" style="color: ${isDarkTheme ? '#white' : '#333'}; font-size: 0.6rem;">${cellContent}</span>
        </div>
      `;

      // Add a click event to select this cell
      cellItem.addEventListener('click', () => {
        notebook.activeCellIndex = index;
        notebook.mode = 'edit';
      });

      cellListElement.appendChild(cellItem);
    }

    this._cellsList.appendChild(cellListElement);
  }

  /**
   * Connect button events to commands
   */
  connectCommands(): void {
    this._refreshCellsList();
  }
}

export default InterviewSidebar;
