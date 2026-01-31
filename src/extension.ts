import * as vscode from 'vscode';
import { VideoViewProvider, getVideoViewProvider } from './videoPanel';
import { parseVideoUrl } from './videoUtils';

export function activate(context: vscode.ExtensionContext) {
  const viewProvider = getVideoViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      VideoViewProvider.viewType,
      viewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  const openVideoCommand = vscode.commands.registerCommand(
    'videoPlayer.openVideo',
    async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter Vimeo video URL',
        placeHolder: 'https://vimeo.com/123456789',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Please enter a video URL';
          }
          return null;
        }
      });

      if (url) {
        const parsed = parseVideoUrl(url);

        if (!parsed) {
          vscode.window.showErrorMessage('Could not parse Vimeo URL. Paste a link like https://vimeo.com/123456789');
          return;
        }

        // Load in panel view
        viewProvider.loadVideo(url);
      }
    }
  );

  context.subscriptions.push(openVideoCommand);
}

export function deactivate() {
  // Clean up resources
}
