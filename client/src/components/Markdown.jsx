// Tiny, safe Markdown renderer (headings, lists, paragraphs, **bold**, `code`,
// [links](url)). Builds React elements, so no HTML is ever injected.

function inline(text, keyBase) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${m.index}`;
    if (tok.startsWith('**')) parts.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) parts.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else {
      const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const safe = /^(https?:|mailto:|\/)/.test(href) ? href : '#';
      parts.push(
        <a key={key} href={safe} target={safe.startsWith('/') ? undefined : '_blank'} rel="noreferrer">
          {label}
        </a>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ source = '' }) {
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list) blocks.push(<ul key={`ul-${blocks.length}`}>{list}</ul>);
    list = null;
  };

  source.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.*)/);
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    if (bullet) {
      list ??= [];
      list.push(<li key={i}>{inline(bullet[1], i)}</li>);
      return;
    }
    flush();
    if (heading) {
      const Tag = `h${heading[1].length + 1}`;
      blocks.push(<Tag key={i}>{inline(heading[2], i)}</Tag>);
    } else if (line.trim()) {
      blocks.push(<p key={i}>{inline(line, i)}</p>);
    }
  });
  flush();
  return <div className="markdown">{blocks}</div>;
}
