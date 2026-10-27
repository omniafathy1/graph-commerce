import { useToastStore } from "../stores/toastStore";

export function useToast() {
  const show = useToastStore((state) => state.show);

  return {
    success: (message: string) => show(message, "success"),
    error: (message: string) => show(message, "error"),
  };
}