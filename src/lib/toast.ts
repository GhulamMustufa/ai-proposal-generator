type ToastType = "success" | "error" | "info";
type ToastHandler = (message: string, type: ToastType) => void;

let _handler: ToastHandler | null = null;

export const toast = {
  success: (message: string) => _handler?.(message, "success"),
  error: (message: string) => _handler?.(message, "error"),
  info: (message: string) => _handler?.(message, "info"),
  _register: (fn: ToastHandler) => { _handler = fn; },
  _unregister: () => { _handler = null; },
};
