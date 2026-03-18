interface StatusPageParams {
  apiBaseUrl: string;
  docsUrl: string;
  version: string;
}

export function renderStatusPage({
  apiBaseUrl,
  docsUrl,
  version,
}: StatusPageParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Influencer Backend</title>
  <style>
    :root {
      --panel: rgba(12, 21, 38, 0.9);
      --panel-strong: rgba(15, 23, 42, 0.96);
      --panel-border: rgba(148, 163, 184, 0.14);
      --text: #e2e8f0;
      --muted: #8ea4c7;
      --accent: #34d399;
      --accent-soft: rgba(52, 211, 153, 0.14);
      --link: #7dd3fc;
      --link-soft: rgba(125, 211, 252, 0.14);
      --shadow: 0 30px 80px rgba(2, 6, 23, 0.45);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Consolas, 'Segoe UI', sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 30%),
        radial-gradient(circle at bottom right, rgba(52, 211, 153, 0.12), transparent 24%),
        linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px;
    }

    .shell {
      width: min(1320px, 100%);
      border: 1px solid var(--panel-border);
      border-radius: 28px;
      overflow: hidden;
      background: var(--panel);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }

    .shell-top {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 22px;
      border-bottom: 1px solid var(--panel-border);
      background: var(--panel-strong);
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .dot.red { background: #fb7185; }
    .dot.yellow { background: #fbbf24; }
    .dot.green { background: #34d399; }

    .shell-title {
      margin-left: 12px;
      color: var(--muted);
      font-size: 15px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .content {
      padding: 44px;
      display: grid;
      gap: 28px;
    }

    .hero {
      display: grid;
      gap: 16px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      width: fit-content;
      padding: 9px 16px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: #bbf7d0;
      border: 1px solid rgba(52, 211, 153, 0.26);
      font-size: 13px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
      70% { box-shadow: 0 0 0 14px rgba(52, 211, 153, 0); }
      100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
    }

    h1 {
      margin: 0;
      font-size: clamp(34px, 5vw, 64px);
      line-height: 1.02;
      letter-spacing: -0.05em;
      max-width: 900px;
    }

    .subtitle {
      margin: 0;
      color: var(--muted);
      max-width: 840px;
      font-size: 18px;
      line-height: 1.7;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1.3fr 1.3fr;
      gap: 20px;
      align-items: stretch;
    }

    .card {
      min-width: 0;
      padding: 24px;
      border-radius: 20px;
      border: 1px solid var(--panel-border);
      background: rgba(15, 23, 42, 0.62);
    }

    .label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }

    .value {
      font-size: 16px;
      line-height: 1.5;
      min-width: 0;
    }

    .meta-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      align-items: start;
    }

    .meta-block {
      min-width: 0;
    }

    .status-text {
      color: #bbf7d0;
      font-size: 17px;
      font-weight: 700;
    }

    .version-text {
      font-size: 17px;
      font-weight: 700;
    }

    .url-link {
      display: inline-flex;
      align-items: center;
      width: 100%;
      color: var(--link);
      text-decoration: none;
      background: var(--link-soft);
      border: 1px solid rgba(125, 211, 252, 0.14);
      padding: 14px 16px;
      border-radius: 14px;
      font-size: 15px;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background 0.18s ease, transform 0.18s ease;
    }

    .url-link:hover {
      background: rgba(125, 211, 252, 0.22);
      transform: translateY(-1px);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14px 18px;
      border-radius: 14px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      color: var(--text);
      text-decoration: none;
      background: rgba(14, 165, 233, 0.12);
      transition: transform 0.18s ease, background 0.18s ease;
    }

    .button:hover {
      transform: translateY(-1px);
      background: rgba(14, 165, 233, 0.2);
    }

    .footer {
      color: var(--muted);
      font-size: 13px;
      border-top: 1px solid var(--panel-border);
      padding-top: 20px;
    }

    @media (max-width: 1100px) {
      .grid {
        grid-template-columns: 1fr;
      }

      .meta-row {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 720px) {
      body {
        padding: 14px;
      }

      .content {
        padding: 24px;
      }

      h1 {
        font-size: 40px;
      }

      .meta-row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="shell-top">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="shell-title">Influencer Marketplace Backend</span>
    </div>

    <section class="content">
      <div class="hero">
        <div class="badge">
          <span class="pulse"></span>
          Server Running
        </div>
        <h1>Backend is live and ready.</h1>
        <p class="subtitle">
          The Influencer Marketplace API is up, connected, and ready to serve requests.
          Use this page as a clean local status screen while developing.
        </p>
      </div>

      <div class="grid">
        <article class="card">
          <div class="meta-row">
            <div class="meta-block">
              <div class="label">Status</div>
              <div class="status-text">Connected</div>
            </div>
            <div class="meta-block">
              <div class="label">Version</div>
              <div class="version-text">v${version}</div>
            </div>
          </div>
        </article>

        <article class="card">
          <div class="label">Backend URL</div>
          <div class="value">
            <a class="url-link" href="${apiBaseUrl}" target="_blank" rel="noreferrer">${apiBaseUrl}</a>
          </div>
        </article>

        <article class="card">
          <div class="label">Swagger URL</div>
          <div class="value">
            <a class="url-link" href="${docsUrl}" target="_blank" rel="noreferrer">${docsUrl}</a>
          </div>
        </article>
      </div>

      <div class="actions">
        <a class="button" href="${docsUrl}" target="_blank" rel="noreferrer">Open Swagger</a>
      </div>

      <div class="footer">
        Local development status page for the Influencer Marketplace backend.
      </div>
    </section>
  </main>
</body>
</html>`;
}
