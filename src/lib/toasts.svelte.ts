export type ToastTone = "success" | "error" | "info";

export type ToastEntry = {
  id: number;
  tone: ToastTone;
  message: string;
};

class ToastController {
  entries = $state<ToastEntry[]>([]);
  nextId = 1;

  push(tone: ToastTone, message: string) {
    const id = this.nextId++;
    this.entries = [...this.entries, { id, tone, message }];

    const timeout = setTimeout(() => {
      this.remove(id);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      this.remove(id);
    };
  }

  success(message: string) {
    return this.push("success", message);
  }

  error(message: string) {
    return this.push("error", message);
  }

  info(message: string) {
    return this.push("info", message);
  }

  remove(id: number) {
    this.entries = this.entries.filter((entry) => entry.id !== id);
  }
}

export const toast = new ToastController();
