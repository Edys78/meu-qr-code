import { PixData } from './types';

/**
 * Normalizes text to ASCII (removing accents and special characters)
 * required by BCB EMVCo standard for merchant name and city.
 */
function normalizeAscii(str: string, maxLength: number): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Calculates CRC16-CCITT checksum (0xFFFF initial, 0x1021 poly)
 */
function calculateCrc16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats an EMV tag: ID (2 chars) + Length (2 chars) + Value
 */
function formatEmv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generates the standard Brazilian PIX payload (EMVCo BR Code).
 * This string can be scanned by any Brazilian banking app or pasted in "PIX Copia e Cola".
 */
export function generatePixPayload(data: PixData): string {
  let cleanKey = data.key.trim();

  // If phone, ensure it has country code +55 or format properly
  if (data.keyType === 'phone') {
    cleanKey = cleanKey.replace(/\D/g, '');
    if (!cleanKey.startsWith('+') && !cleanKey.startsWith('55') && cleanKey.length >= 10) {
      cleanKey = `+55${cleanKey}`;
    } else if (!cleanKey.startsWith('+') && cleanKey.startsWith('55')) {
      cleanKey = `+${cleanKey}`;
    }
  } else if (data.keyType === 'cpf' || data.keyType === 'cnpj') {
    cleanKey = cleanKey.replace(/\D/g, '');
  }

  const merchantName = normalizeAscii(data.merchantName || 'RECEBEDOR', 25) || 'RECEBEDOR';
  const merchantCity = normalizeAscii(data.merchantCity || 'BRASIL', 15) || 'BRASIL';
  const txId = (data.txId ? normalizeAscii(data.txId, 25) : '***') || '***';

  // 26: Merchant Account Information
  // 00: GUI 'br.gov.bcb.pix'
  // 01: PIX Key
  // 02: Description / Info adicional (optional)
  const gui = formatEmv('00', 'br.gov.bcb.pix');
  const keyTag = formatEmv('01', cleanKey);
  const descTag = data.description ? formatEmv('02', normalizeAscii(data.description, 40)) : '';
  const merchantAccountInfo = formatEmv('26', `${gui}${keyTag}${descTag}`);

  // 00: Payload Format Indicator
  const pfi = formatEmv('00', '01');

  // 52: Merchant Category Code (0000 = default)
  const mcc = formatEmv('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  const currency = formatEmv('53', '986');

  // 54: Transaction Amount (optional)
  let amountTag = '';
  if (data.amount && parseFloat(data.amount) > 0) {
    const num = parseFloat(data.amount).toFixed(2);
    amountTag = formatEmv('54', num);
  }

  // 58: Country Code (BR)
  const country = formatEmv('58', 'BR');

  // 59: Merchant Name
  const nameTag = formatEmv('59', merchantName);

  // 60: Merchant City
  const cityTag = formatEmv('60', merchantCity);

  // 62: Additional Data Field Template (TxID)
  const txIdTag = formatEmv('05', txId);
  const additionalData = formatEmv('62', txIdTag);

  // Build the payload without CRC
  const rawPayload = `${pfi}${merchantAccountInfo}${mcc}${currency}${amountTag}${country}${nameTag}${cityTag}${additionalData}6304`;

  // Calculate CRC16 checksum and append
  const checksum = calculateCrc16(rawPayload);
  return `${rawPayload}${checksum}`;
}
