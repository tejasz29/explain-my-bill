type ErrorBannerProps = {
  message: string;
  onDismiss: () => void;
};

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="animate-float-up rounded-[28px] border border-red-200 bg-red-50/90 px-5 py-4 text-sm text-red-900 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <p>{message}</p>
        <button
          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:bg-red-100"
          onClick={onDismiss}
          type="button"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
