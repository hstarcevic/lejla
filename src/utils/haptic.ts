export function haptic(duration = 10) {
  navigator?.vibrate?.(duration);
}
