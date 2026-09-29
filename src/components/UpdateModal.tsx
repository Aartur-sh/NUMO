import React, { useState, useEffect } from 'react';
import { Sparkles, Settings, ArrowDownCircle, Loader2 } from 'lucide-react';
import type { AppReleaseInfo } from '../services/updateService';
import type { Language } from '../i18n';
import { NativeUpdate } from '../services/nativeUpdateService';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseInfo: AppReleaseInfo | null;
  lang: Language;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  releaseInfo,
  lang,
}) => {
  const [canInstall, setCanInstall] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStatusText, setDownloadStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check Android unknown sources permission (BlindDriver behavior)
  const checkInstallPermission = async () => {
    try {
      const allowed = await NativeUpdate.canInstall();
      setCanInstall(allowed);
    } catch {
      setCanInstall(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    checkInstallPermission();

    // Re-check permission when user returns from Android Settings
    const handleFocus = () => {
      checkInstallPermission();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isOpen]);

  if (!isOpen || !releaseInfo) {
    return null;
  }

  const downloadUrl = releaseInfo.apkUrl || releaseInfo.releaseUrl || '';

  const handleOpenSettings = async () => {
    setErrorMessage(null);
    try {
      await NativeUpdate.openInstallSettings();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Could not open settings');
    }
  };

  const handleDownloadAndInstall = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!downloadUrl) return;

    setErrorMessage(null);

    // If permission is not granted yet, guide user to settings first
    if (!canInstall) {
      await handleOpenSettings();
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatusText(
      lang === 'en'
        ? 'Connecting to download update...'
        : 'Підключення до завантаження оновлення...'
    );

    const result = await NativeUpdate.downloadAndInstall(
      downloadUrl,
      releaseInfo.latestVersion,
      (percent) => {
        setDownloadProgress(percent);
        setDownloadStatusText(
          lang === 'en'
            ? `Downloading: ${percent}%`
            : `Завантаження: ${percent}%`
        );
      }
    );

    if (result.success) {
      setDownloadProgress(100);
      setDownloadStatusText(
        lang === 'en'
          ? 'Download complete! Opening Android installer...'
          : 'Завантаження завершено! Відкриття вікна встановлення...'
      );
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 4000);
    } else {
      setIsDownloading(false);
      setDownloadProgress(null);
      setErrorMessage(
        lang === 'en'
          ? `Update failed: ${result.error || 'Please try manual download'}`
          : `Помилка: ${result.error || 'Спробуйте завантажити вручну'}`
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-label="App update banner"
      className="fixed left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-50 pointer-events-auto transition-all duration-300 ease-out"
      style={{
        top: 'max(calc(env(safe-area-inset-top, 0px) + 24px), 40px)',
      }}
    >
      {/* Floating Card - Exactly like BlindDriver, comfortable distance from camera notch */}
      <div className="w-full rounded-2xl bg-slate-900/98 border border-cyan-400/50 p-4 sm:p-5 shadow-2xl shadow-black/95 flex flex-col gap-3 text-white backdrop-blur-sm">
        {/* Header: Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-slate-950 flex-shrink-0 shadow-md shadow-cyan-500/30">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white tracking-wide leading-tight truncate">
              {lang === 'en'
                ? `Update Available: v${releaseInfo.latestVersion}`
                : `Доступна нова версія ${releaseInfo.latestVersion}`}
            </h3>
            <div className="text-[11px] text-cyan-300 font-mono mt-0.5">
              v{releaseInfo.currentVersion} → v{releaseInfo.latestVersion}
            </div>
          </div>
        </div>

        {/* Release Notes */}
        {releaseInfo.releaseNotes && !isDownloading && (
          <div className="text-xs text-slate-300 whitespace-pre-line max-h-24 overflow-y-auto pr-1 leading-relaxed rounded-xl bg-white/[0.04] p-2.5 border border-white/5">
            {releaseInfo.releaseNotes}
          </div>
        )}

        {/* Permission Prompt (BlindDriver Screenshot 2 & 3) */}
        {!canInstall && !isDownloading && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                {lang === 'en' ? 'Android Permission Required' : 'Потрібен дозвіл Android'}
              </span>
            </div>
            <p className="text-[11px] text-amber-100/90 leading-relaxed">
              {lang === 'en'
                ? 'Android requires your permission to install updates directly from this app. Open settings, enable the permission and return.'
                : 'Android потребує вашого дозволу на встановлення оновлень із цього застосунку. Відкрийте налаштування, увімкніть дозвіл і поверніться.'}
            </p>
            <button
              type="button"
              onClick={handleOpenSettings}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? 'Open permission settings'
                  : 'Відкрити налаштування дозволу'}
              </span>
            </button>
          </div>
        )}

        {/* Download Progress Bar (BlindDriver Screenshot 4) */}
        {isDownloading && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-xs text-cyan-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5 text-cyan-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {downloadStatusText}
              </span>
              {downloadProgress !== null && (
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {downloadProgress}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-cyan-500/20">
              <div
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-200 ease-out"
                style={{ width: `${downloadProgress ?? 10}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              {lang === 'en'
                ? 'After download finishes, Android will show "Update this app?"'
                : 'Після завантаження Android автоматично запитає «Оновити цей додаток?»'}
            </p>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        {!isDownloading && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownloadAndInstall}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-600 hover:opacity-95 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <ArrowDownCircle className="w-4 h-4 stroke-[2.5]" />
              <span>
                {lang === 'en'
                  ? `Download and install ${releaseInfo.latestVersion}`
                  : `Завантажити й встановити ${releaseInfo.latestVersion}`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              {lang === 'en' ? 'Remind me later' : 'Нагадати пізніше'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
