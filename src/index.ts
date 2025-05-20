import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  CommandToolbarButton,
  ICommandPalette,
  IToolbarWidgetRegistry
} from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

const commandID: string = 'interview-extension:insert-simple-cell';

/**
 * Initialization data for the interview-extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'interview-extension:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette],
  optional: [ISettingRegistry, IToolbarWidgetRegistry],
  activate: (
    app: JupyterFrontEnd,
    notebooks: INotebookTracker,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry | null
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
        }

        notebookPanel.content.activate();
      }
    });

    // Add the command to the palette
    palette.addItem({ command: commandID, category: 'AI Tools' });

    // Create a toolbar button
    notebooks.widgetAdded.connect((_, notebook) => {
      const button = new CommandToolbarButton({
        commands: app.commands,
        id: commandID
      });
      notebook.toolbar.insertItem(10, 'createCodeCell', button);
    });
  }
};

export default plugin;
