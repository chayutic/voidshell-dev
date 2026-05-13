// Top-level container for all positioned widgets.
// Widgets are rendered with absolute positioning and do not interfere with the grid.
export default function WidgetLayer() {
  return <div className="widget-layer" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
}
