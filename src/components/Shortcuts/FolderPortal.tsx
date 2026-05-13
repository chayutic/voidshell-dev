import type { Shortcut } from "../../types";
import ShortcutIcon from "./ShortcutIcon";

interface Props {
  folder: Shortcut;
  onClose: () => void;
}

// Renders the pop-out overlay sub-grid for a Folder shortcut.
export default function FolderPortal({ folder, onClose }: Props) {
  const children = folder.children ?? [];

  return (
    <div className="folder-portal" onClick={onClose}>
      <div className="folder-portal__grid" onClick={(e) => e.stopPropagation()}>
        {children.map((child) => (
          <ShortcutIcon key={child.id} shortcut={child} />
        ))}
      </div>
    </div>
  );
}
