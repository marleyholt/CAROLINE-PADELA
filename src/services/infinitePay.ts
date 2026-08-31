import QRCode from 'qrcode';
import { ConfiguracaoInfinitePay } from '../types';

/**
 * Calculates CRC16 CCITT for Pix EMV standard (ISO/IEC 13239)
 */
function crc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function gerarPayloadPixBacen(
  chavePix: string,
  nomeTitular: string,
  cidadeTitular: string,
  valor: number,
  txId: string = 'INFINITEPAY50'
): string {
  // Limpar e normalizar
  const cleanKey = (chavePix || 'caroline.padela@infinitepay.io').trim();
  const cleanName = (nomeTitular || 'CAROLINE PADELA')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 25);
  const cleanCity = (cidadeTitular || 'RIO DE JANEIRO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);
  const cleanTxId = txId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || 'INFPAY50';
  const formattedValor = valor.toFixed(2);

  // 00: Payload Format Indicator
  const f00 = formatEmvField('00', '01');
  
  // 26: Merchant Account Information - Pix
  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const keyField = formatEmvField('01', cleanKey);
  const f26 = formatEmvField('26', `${gui}${keyField}`);

  // 52: Merchant Category Code (0000 = Geral)
  const f52 = formatEmvField('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  const f53 = formatEmvField('53', '986');

  // 54: Transaction Amount
  const f54 = formatEmvField('54', formattedValor);

  // 58: Country Code
  const f58 = formatEmvField('58', 'BR');

  // 59: Merchant Name
  const f59 = formatEmvField('59', cleanName);

  // 60: Merchant City
  const f60 = formatEmvField('60', cleanCity);

  // 62: Additional Data Field Template (TxId)
  const txField = formatEmvField('05', cleanTxId);
  const f62 = formatEmvField('62', txField);

  // Partial string before CRC
  const partial = `${f00}${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`;
  const checksum = crc16(partial);

  return `${partial}${checksum}`;
}

export async function gerarQRCodeDataUrl(payloadPix: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payloadPix, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Erro ao gerar QR Code InfinitePay:', err);
    return '';
  }
}

export interface InfinitePayCobrancaPixResult {
  txid: string;
  pixCopiaECola: string;
  qrCodeDataUrl: string;
  valor: number;
  dataExpiracao: string;
  chavePix: string;
  infiniteTag?: string;
  linkPagamento?: string;
  status: 'ATIVA' | 'CONCLUIDA';
}

// Alias para compatibilidade
export type InterCobrancaPixResult = InfinitePayCobrancaPixResult;

export async function emitirCobrancaSinalInfinitePay(
  valorSinal: number,
  pacienteNome: string,
  procedimentoNome: string,
  configInfinitePay: ConfiguracaoInfinitePay
): Promise<InfinitePayCobrancaPixResult> {
  const cleanName = (pacienteNome || 'PACIENTE').replace(/\s+/g, '').slice(0, 6).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const txid = `INF${cleanName}${randomSuffix}`;

  const payloadPix = gerarPayloadPixBacen(
    configInfinitePay.chavePix || '(21) 97513-4597',
    configInfinitePay.nomeTitular || 'CAROLINE PADELA',
    configInfinitePay.cidadeTitular || 'RIO DE JANEIRO',
    valorSinal,
    txid
  );

  const qrCodeDataUrl = await gerarQRCodeDataUrl(payloadPix);

  // Data expiração (30 min)
  const expira = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Gera link do InfiniteTag ou link de pagamento direto
  let linkFinal = configInfinitePay.linkPagamento;
  if (!linkFinal && configInfinitePay.infiniteTag) {
    const tag = configInfinitePay.infiniteTag.startsWith('$')
      ? configInfinitePay.infiniteTag
      : `$${configInfinitePay.infiniteTag}`;
    linkFinal = `https://infinitepay.io/${tag}`;
  }

  return {
    txid,
    pixCopiaECola: payloadPix,
    qrCodeDataUrl,
    valor: valorSinal,
    dataExpiracao: expira,
    chavePix: configInfinitePay.chavePix || '(21) 97513-4597',
    infiniteTag: configInfinitePay.infiniteTag,
    linkPagamento: linkFinal,
    status: 'ATIVA',
  };
}

// Alias de compatibilidade
export const emitirCobrancaSinalBancoInter = emitirCobrancaSinalInfinitePay;
