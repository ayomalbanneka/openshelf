import NodeClam from 'clamscan';
import { Readable } from 'stream';

let clamInstance = null;

async function getClamAV() {
  if (clamInstance) return clamInstance;

  const clam = await new NodeClam().init({
    clamdscan: {
      host: process.env.CLAMAV_HOST || '127.0.0.1',
      port: parseInt(process.env.CLAMAV_PORT || '3310'),
      timeout: 60000,
      active: true,
    },
    preference: 'clamdscan',
  });

  clamInstance = clam;
  return clam;
}

/**
 * Scans a Buffer for malware using ClamAV.
 * Returns { isInfected, viruses }
 * isInfected: true | false | null (null = scan error)
 */
async function scanBuffer(buffer) {
  const clam = await getClamAV();
  const stream = Readable.from(buffer);
  const { isInfected, viruses } = await clam.scanStream(stream);
  return { isInfected, viruses };
}

export { scanBuffer };
