'use client';

import { GooeyToaster } from 'goey-toast';

export function ToasterClient() {
  return (
    <GooeyToaster position="bottom-right" duration={4000} richColors closeButton preset="bouncy" />
  );
}
