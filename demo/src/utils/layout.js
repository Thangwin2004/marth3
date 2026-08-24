/**
 * Scales a PixiJS Sprite like CSS `background-size: cover`.
 * The texture keeps its original aspect ratio and only the overflow is cropped.
 */
export function coverSprite(
  sprite,
  viewportWidth,
  viewportHeight,
  { focusX = 0.5, focusY = 0.5 } = {},
) {
  if (!sprite?.texture || viewportWidth <= 0 || viewportHeight <= 0) return;

  const textureWidth = sprite.texture.width || 1;
  const textureHeight = sprite.texture.height || 1;
  const coverScale = Math.max(
    viewportWidth / textureWidth,
    viewportHeight / textureHeight,
  );

  sprite.anchor.set(focusX, focusY);
  sprite.position.set(viewportWidth * focusX, viewportHeight * focusY);
  sprite.scale.set(coverScale);
}
