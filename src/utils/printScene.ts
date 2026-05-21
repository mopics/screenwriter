import type { Scene, SceneBlock } from '../types/scene'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderBlock(block: SceneBlock): string {
  if (block.type === 'action') {
    return `<p class="action">${esc(block.text)}</p>`
  }
  const { character, parenthetical, line } = block.data
  return [
    `<p class="character">${esc(character)}</p>`,
    parenthetical ? `<p class="parenthetical">(${esc(parenthetical)})</p>` : '',
    `<p class="dialogue">${esc(line)}</p>`,
  ].filter(Boolean).join('\n')
}

export function printScene(scene: Scene): void {
  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) return

  const title = scene.slugLine || 'Scene'
  const blocksHtml = scene.blocks.map(renderBlock).join('\n')

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    html { background: #d8d8d8; }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1.2;
      color: #000;
    }

    /* ── toolbar ── */
    .toolbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 38px;
      background: #222;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 20px;
      gap: 10px;
      z-index: 100;
    }
    .toolbar button {
      background: #c9a227;
      color: #000;
      border: none;
      padding: 5px 14px;
      font-size: 10pt;
      font-family: 'Courier New', Courier, monospace;
      font-weight: bold;
      letter-spacing: 0.1em;
      cursor: pointer;
      text-transform: uppercase;
    }
    .toolbar button:hover { background: #e0b52e; }

    /* ── page ── */
    .wrap {
      padding: 54px 0 32px;
    }

    .page {
      /* A4: 210mm × 297mm */
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto 20px;
      padding: 25mm 25mm 25mm 38mm;
      background: #fff;
      box-shadow: 0 3px 12px rgba(0,0,0,.25);
    }

    /* ── screenplay elements ── */

    /* INT. / EXT. slug line */
    .slug {
      text-transform: uppercase;
      font-weight: bold;
      margin-bottom: 1em;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #000;
      padding-bottom: 4pt;
    }

    /* Action / description */
    .action {
      margin-bottom: 1em;
      white-space: pre-wrap;
    }

    /* CHARACTER NAME (spoken) */
    .character {
      text-transform: uppercase;
      margin-left: 57mm;
      margin-bottom: 0;
      font-weight: normal;
    }

    /* (beat) / (angry) */
    .parenthetical {
      margin-left: 37mm;
      margin-right: 40mm;
      margin-bottom: 0;
      font-style: italic;
    }

    /* Spoken line */
    .dialogue {
      margin-left: 19mm;
      margin-right: 38mm;
      margin-bottom: 1em;
      white-space: pre-wrap;
    }

    /* ── print mode ── */
    @media print {
      html { background: #fff; }
      .toolbar { display: none; }
      .wrap { padding: 0; }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0;
        padding: 25mm 25mm 25mm 38mm;
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print</button>
  </div>
  <div class="wrap">
    <div class="page">
      <p class="slug">${esc(title)}</p>
      ${blocksHtml}
    </div>
  </div>
</body>
</html>`)

  win.document.close()
}
