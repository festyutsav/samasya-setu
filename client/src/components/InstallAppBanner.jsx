import { useState, useEffect } from "react";

const InstallAppBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in installed standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handler = (e) => {
      // Prevent default Chrome install mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed it in this session
      const dismissed = sessionStorage.getItem("pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa_dismissed", "true");
  };

  if (isStandalone || !showBanner) return null;

  return (
    <aside aria-label="Install application" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in-up rounded-2xl border border-[#c9933b]/40 bg-[#032621]/95 p-4 text-white shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:w-96">
      <div className="flex items-center gap-3.5">
        <img
          src="/icon-192.png"
          alt="SamasyaSetu App Icon"
          className="h-12 w-12 rounded-xl border border-[#e9c985]/30 object-cover shadow-md"
        />

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white">Install SamasyaSetu</h4>
          <p className="text-xs text-[#9dc3b8]">
            Add to home screen for instant offline access &amp; real-time notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-lg text-[#9dc3b8] hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="mt-3.5 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#9dc3b8] transition hover:bg-white/10"
        >
          Not now
        </button>

        <button
          type="button"
          onClick={handleInstallClick}
          className="rounded-xl bg-[#e9c985] px-4 py-1.5 text-xs font-bold text-[#032621] shadow-md transition hover:scale-105 hover:bg-[#f3de9d]"
        >
          📲 Install App
        </button>
      </div>
    </aside>
  );
};

export default InstallAppBanner;
