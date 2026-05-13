import { invoke } from "@tauri-apps/api/core";
import type { AlternateAction } from "../../types";

interface Props {
  actions: AlternateAction[];
  onClose: () => void;
}

export default function NinjaMenu({ actions, onClose }: Props) {
  const handleAction = (action: AlternateAction) => {
    invoke("execute_ninja_action", {
      command: action.command,
      actionType: action.actionType,
    });
    onClose();
  };

  return (
    <div className="ninja-menu" onMouseLeave={onClose}>
      {actions.map((action) => (
        <button key={action.label} onClick={() => handleAction(action)}>
          {action.label}
        </button>
      ))}
    </div>
  );
}
