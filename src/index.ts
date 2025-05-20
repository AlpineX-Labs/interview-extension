import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  CommandToolbarButton,
  ICommandPalette,
  IThemeManager
} from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import InterviewSidebar from './sidebar';

const commandID: string = 'interview-extension:insert-simple-cell';
const sidebarID: string = 'interview-extension:sidebar';

/**
 * Initialization data for the interview-extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'interview-extension:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette],
  optional: [ISettingRegistry, IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    notebooks: INotebookTracker,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry | null,
    themeManager: IThemeManager | null
  ) => {
    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log(
            'interview-extension settings loaded:',
            settings.composite
          );
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for interview-extension.',
            reason
          );
        });
    }

    // Create the sidebar widget with access to the notebook tracker and theme manager
    const sidebar = new InterviewSidebar(notebooks, themeManager);

    // Add the sidebar to the shell's left area with a proper ID
    sidebar.id = 'interview-extension-sidebar';

    // Make sure to track if the sidebar has been added
    let sidebarAdded = false;

    // Add command to show the sidebar
    app.commands.addCommand(sidebarID, {
      label: 'Show Interview Sidebar',
      execute: () => {
        if (!sidebarAdded) {
          // Add the widget to the left area if not already added
          app.shell.add(sidebar, 'left', { rank: 900 });
          sidebarAdded = true;
        }

        // Make sure the sidebar is visible
        sidebar.show();

        // Make sure to activate the widget
        app.shell.activateById(sidebar.id);
      }
    });

    // Add sidebar command to palette
    palette.addItem({ command: sidebarID, category: 'AI Tools' });

    // Code cell insertion command
    app.commands.addCommand(commandID, {
      label: 'Insert Simple Code Cell',
      execute: () => {
        const notebookPanel = notebooks.currentWidget;
        if (!notebookPanel) {
          console.warn('No active notebook!');
          return;
        }

        NotebookActions.insertBelow(notebookPanel.content);

        const activeCell = notebookPanel.content.activeCell;
        if (activeCell) {
          activeCell.model.sharedModel.setSource('print("Hello, JupyterLab!")');

          activeCell.model.setMetadata('type', 'instructions');

          // Run the cell
          NotebookActions.run(
            notebookPanel.content,
            notebookPanel.sessionContext
          );

          // Refresh the cells list in the sidebar
          (sidebar as InterviewSidebar).refreshCellsList();
        }

        notebookPanel.content.activate();
      }
    });

    // Create a toolbar button for cell insertion
    notebooks.widgetAdded.connect((_, notebook) => {
      const insertButton = new CommandToolbarButton({
        commands: app.commands,
        id: commandID
      });

      notebook.toolbar.insertItem(10, 'createCodeCell', insertButton);
    });

    // Add a listener to the notebook tracker's currentChanged signal
    // This will be triggered when switching between notebooks
    notebooks.currentChanged.connect(() => {
      if (sidebar) {
        (sidebar as InterviewSidebar).refreshCellsList();
      }
    });

    // Connect button events to commands
    sidebar.connectCommands();

    // Make sure to show the sidebar after the application is fully restored
    app.restored.then(() => {
      console.log('App restored, adding sidebar with delay');
      // Use a small delay to ensure the shell is ready
      setTimeout(() => {
        console.log('Executing sidebar command after delay');
        app.commands.execute(sidebarID);
      }, 300);
    });
  }
};

export default plugin;
