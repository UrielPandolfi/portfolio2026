let suppressClick = false;

export function beginCameraGesture() {
  suppressClick = false;
}

export function noteCameraGesture() {
  suppressClick = true;
  window.dispatchEvent(new Event("study-look"));
}

export function takeCameraClick() {
  const blocked = suppressClick;
  suppressClick = false;
  return blocked;
}
