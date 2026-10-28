export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}

// Isolate each silhouette in memory. Some generated poses extend beyond a grid
// cell; clipping by its outline prevents a neighboring pose from appearing.
export async function loadFighters() {
  const response = await fetch('assets/fighters-atlas.json');
  if (!response.ok) throw new Error('Could not load fighter animation data.');
  const metadata = await response.json();
  const actors = {};
  for (const [name, actor] of Object.entries(metadata)) {
    const sheet = await loadImage(`assets/${actor.file}`);
    const frames = actor.frames.map(frame => {
      const [x, y, width, height] = frame.rect;
      const image = document.createElement('canvas');
      image.width = width; image.height = height;
      const context = image.getContext('2d');
      context.beginPath();
      frame.outline.forEach(([px, py], index) => index ? context.lineTo(px, py) : context.moveTo(px, py));
      context.closePath();
      context.clip();
      context.drawImage(sheet, x, y, width, height, 0, 0, width, height);
      return { image, anchor: frame.anchor };
    });
    actors[name] = { frames, referenceHeight: actor.referenceHeight };
  }
  return actors;
}
