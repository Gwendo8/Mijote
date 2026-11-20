import { useEffect, useRef, useState } from 'react';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

// Lit les codes-barres avec la caméra. `videoRef` : l'élément <video> à remplir ; `onCode(texte)` est appelé
// à chaque code lu. Renvoie le statut : 'starting' | 'scanning' | 'unavailable' (pas de caméra, refus, HTTP non sécurisé).
// 1. `BarcodeDetector` du navigateur quand il existe (rapide, rien à télécharger) ;
// 2. sinon `@zxing/browser`, chargé seulement à ce moment-là (import dynamique) pour ne pas alourdir l'appli.
// La caméra s'éteint quand `active` repasse à false ou que la fenêtre se ferme.
export function useCodeScanner({ active, videoRef, onCode }) {
  const [status, setStatus] = useState('starting');
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  });

  useEffect(() => {
    if (!active) return undefined;
    let stopped = false;
    let stream = null;
    let timer = null;
    let controls = null;
    const found = (code) => {
      if (!stopped && code) onCodeRef.current(code);
    };

    async function start() {
      const video = videoRef.current;
      if (!video || !navigator.mediaDevices?.getUserMedia) return setStatus('unavailable');
      setStatus('starting');
      try {
        if ('BarcodeDetector' in window) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
          });
          if (stopped) return stream.getTracks().forEach((track) => track.stop());
          video.srcObject = stream;
          await video.play().catch(() => {});
          const detector = new window.BarcodeDetector({ formats: FORMATS });
          timer = setInterval(async () => {
            try {
              const codes = await detector.detect(video);
              found(codes[0]?.rawValue);
            } catch {
              // image pas encore prête : on réessaie au prochain passage
            }
          }, 300);
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          if (stopped) return;
          controls = await new BrowserMultiFormatReader().decodeFromConstraints(
            { video: { facingMode: { ideal: 'environment' } } },
            video,
            (result) => found(result?.getText()),
          );
          if (stopped) return controls.stop();
        }
        if (!stopped) setStatus('scanning');
      } catch {
        if (!stopped) setStatus('unavailable');
      }
    }
    start();

    return () => {
      stopped = true;
      clearInterval(timer);
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active, videoRef]);

  return status;
}
