import * as vscode from 'vscode';
import { parseVideoUrl, ParsedVideo } from './videoUtils';

/**
 * Content Security Policy for Vimeo embeds
 */
function getCSP(): string {
  return [
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
    "frame-src *",
    "style-src * 'unsafe-inline'"
  ].join('; ');
}

/**
 * WebviewViewProvider for the video player sidebar view
 */
export class VideoViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'videoPlayer.view';
  private _view?: vscode.WebviewView;
  private _currentVideo: ParsedVideo | null = null;
  private _pendingUrl: string | null = null;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true
    };

    if (this._pendingUrl) {
      const url = this._pendingUrl;
      this._pendingUrl = null;
      this.loadVideo(url);
    } else {
      webviewView.webview.html = this._getWelcomeHtml();
    }
  }

  public loadVideo(url: string): void {
    if (!this._view) {
      this._pendingUrl = url;
      return;
    }

    const parsed = parseVideoUrl(url);

    if (!parsed) {
      this._view.webview.html = this._getErrorHtml(url);
      return;
    }

    this._currentVideo = parsed;
    this._view.webview.html = this._getVideoHtml(parsed);
  }

  private _getWelcomeHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${getCSP()}">
  <title>Video Player</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .welcome {
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: var(--vscode-foreground);
      margin-bottom: 16px;
      font-size: 1.2em;
    }
    p {
      color: var(--vscode-descriptionForeground);
      line-height: 1.6;
      font-size: 0.9em;
    }
    code {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="welcome">
    <h1>Vimeo Player</h1>
    <p>Use the command <code>Open Vimeo Video</code> and paste a Vimeo URL to start watching.</p>
  </div>
</body>
</html>`;
  }

  private _getVideoHtml(video: ParsedVideo): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${getCSP()}">
  <title>Video Player</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000;
    }
    .video-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <iframe
      src="${video.embedUrl}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>
</body>
</html>`;
  }

  private _getErrorHtml(url: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${getCSP()}">
  <title>Video Player - Error</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .error {
      text-align: center;
      max-width: 500px;
    }
    h1 {
      color: var(--vscode-errorForeground);
      margin-bottom: 16px;
    }
    p {
      color: var(--vscode-descriptionForeground);
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .url {
      word-break: break-all;
      background-color: var(--vscode-textBlockQuote-background);
      padding: 8px 12px;
      border-radius: 4px;
      margin: 16px 0;
      font-size: 0.85em;
    }
    code {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="error">
    <h1>Unable to Load Video</h1>
    <p>Could not parse the provided URL:</p>
    <div class="url">${escapeHtml(url)}</div>
    <p>Paste a Vimeo URL (e.g. <code>https://vimeo.com/123456789</code>)</p>
  </div>
</body>
</html>`;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Singleton instance holder
 */
let _viewProvider: VideoViewProvider | undefined;

export function getVideoViewProvider(extensionUri: vscode.Uri): VideoViewProvider {
  if (!_viewProvider) {
    _viewProvider = new VideoViewProvider(extensionUri);
  }
  return _viewProvider;
}
