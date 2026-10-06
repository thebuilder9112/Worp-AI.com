export interface AttachedItem {
  id: string;
  name: string;
  type: string;
  data: string; // base64 string
  size?: number;
  snippetContent?: string;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getItemBadgeLabel(item: AttachedItem): string {
  if (item.type.startsWith('image/')) {
    return (item.type.split('/')[1] || 'IMAGE').toUpperCase();
  }
  const extMatch = item.name.match(/\.([a-zA-Z0-9]+)$/);
  if (extMatch) {
    return extMatch[1].toUpperCase();
  }
  if (item.type.includes('json')) return 'JSON';
  if (item.type.includes('javascript') || item.type.includes('typescript')) return 'CODE';
  if (item.type.includes('pdf')) return 'PDF';
  return 'FILE';
}

export async function readFileAsAttachedItem(file: File): Promise<AttachedItem> {
  const fileId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const size = file.size;

  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          return resolve({
            id: fileId,
            name: file.name || `image_${Date.now()}.jpg`,
            type: file.type || 'image/jpeg',
            data: '',
            size
          });
        }

        const img = new window.Image();
        img.onload = () => {
          try {
            const maxDim = 1600;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const optimizedDataUrl = canvas.toDataURL(outputMime, 0.85);
              const pureBase64 = optimizedDataUrl.split(',')[1] || optimizedDataUrl;
              const fileName = file.name && file.name !== 'image.png' && file.name !== 'blob'
                ? file.name
                : `pasted_image_${Date.now()}.${outputMime.split('/')[1] || 'jpg'}`;

              return resolve({
                id: fileId,
                name: fileName,
                type: outputMime,
                data: pureBase64,
                size
              });
            }
          } catch (canvasErr) {
            console.warn("Canvas optimization fallback:", canvasErr);
          }

          const pureBase64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : rawDataUrl;
          resolve({
            id: fileId,
            name: file.name || `image_${Date.now()}.jpg`,
            type: file.type || 'image/jpeg',
            data: pureBase64,
            size
          });
        };

        img.onerror = () => {
          const pureBase64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : rawDataUrl;
          resolve({
            id: fileId,
            name: file.name || `image_${Date.now()}.jpg`,
            type: file.type || 'image/jpeg',
            data: pureBase64,
            size
          });
        };

        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // Non-image files (Code, text, documents, JSON, PDF, etc.)
  return new Promise((resolve) => {
    const isText = file.type.startsWith('text/') ||
      Boolean(file.name && file.name.match(/\.(ts|tsx|js|jsx|json|md|py|css|html|txt|csv|sql|env|yaml|yml|sh|rs|go|c|cpp|h|java|xml|rb|php)$/i));

    if (isText) {
      const textReader = new FileReader();
      textReader.onload = (event) => {
        const textContent = (event.target?.result as string) || '';
        try {
          const base64Data = btoa(unescape(encodeURIComponent(textContent)));
          resolve({
            id: fileId,
            name: file.name,
            type: file.type || 'text/plain',
            data: base64Data,
            size,
            snippetContent: textContent
          });
        } catch {
          const dataUrlReader = new FileReader();
          dataUrlReader.onload = (e) => {
            const raw = (e.target?.result as string) || '';
            const pureBase64 = raw.includes(',') ? raw.split(',')[1] : raw;
            resolve({
              id: fileId,
              name: file.name,
              type: file.type || 'text/plain',
              data: pureBase64,
              size,
              snippetContent: textContent
            });
          };
          dataUrlReader.readAsDataURL(file);
        }
      };
      textReader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string) || '';
      const pureBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      resolve({
        id: fileId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: pureBase64,
        size
      });
    };
    reader.readAsDataURL(file);
  });
}

export function createTextSnippetItem(title: string, content: string, extension: string = 'txt'): AttachedItem {
  const safeTitle = title.trim() || `snippet_${Date.now()}`;
  const filename = safeTitle.includes('.') ? safeTitle : `${safeTitle}.${extension}`;
  let base64 = '';
  try {
    base64 = btoa(unescape(encodeURIComponent(content)));
  } catch {
    base64 = btoa(content);
  }

  return {
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: filename,
    type: extension === 'json' ? 'application/json' : 'text/plain',
    data: base64,
    size: new Blob([content]).size,
    snippetContent: content
  };
}

export function createUrlLinkItem(url: string, label?: string): AttachedItem {
  const trimmedUrl = url.trim();
  let hostname = trimmedUrl;
  try {
    hostname = new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`).hostname;
  } catch {
    // fallback
  }
  const name = label?.trim() || `link_${hostname}`;
  const content = `[Referenced External URL Link: ${trimmedUrl}]\nHostname: ${hostname}\nDirect Target: ${trimmedUrl}`;
  let base64 = '';
  try {
    base64 = btoa(unescape(encodeURIComponent(content)));
  } catch {
    base64 = btoa(content);
  }

  return {
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: `${name}.url`,
    type: 'text/uri-list',
    data: base64,
    size: new Blob([content]).size,
    snippetContent: content
  };
}
