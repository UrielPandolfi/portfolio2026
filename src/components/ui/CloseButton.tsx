import { Icon } from "./Icon";
export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      className="close-button"
      onClick={onClose}
      aria-label="Close and return to the study"
    >
      <span>BACK TO THE STUDY</span>
      <kbd>ESC</kbd>
      <Icon name="close" size={20} />
    </button>
  );
}
