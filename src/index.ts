import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, IToolbarWidgetRegistry } from '@jupyterlab/apputils';
import {
  INotebookTracker,
  Notebook,
  NotebookActions
} from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

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
    settingRegistry: ISettingRegistry | null,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    console.log('JupyterLab extension interview-extension is activated!');

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

    const testNotebookCommand: string = 'interview-extension:test-notebook';
    app.commands.addCommand(testNotebookCommand, {
      label: 'Test Notebook',
      execute: async () => {
        // Print the active notebook
        console.log(notebooks.currentWidget);
        // Example to add a cell
        NotebookActions.insertBelow(<Notebook>notebooks.currentWidget?.content);
        // Example to add text into a cell
        notebooks.currentWidget?.content.activeCell?.model.sharedModel.setSource(
          'Hello World'
        );
      }
    });

    palette.addItem({ command: testNotebookCommand, category: 'AI Tools' });
  }
};

export default plugin;
