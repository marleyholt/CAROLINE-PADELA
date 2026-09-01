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

export interface InfinitePayCheckoutParams {
  handle: string; // Ex: caroline-padela (sem $)
  linkPagamento?: string; // Link direto do app InfinitePay configurado pela terapeuta
  valor: number; // Em reais, ex: 80.00
  descricaoItem: string;
  orderNsu: string; // ID do agendamento
  redirectUrl?: string; // URL para onde o cliente volta após pagar
  webhookUrl?: string; // URL do webhook no servidor
  cliente?: {
    nome: string;
    email?: string;
    telefone?: string;
  };
}

export interface InfinitePayCheckoutResult {
  sucesso: boolean;
  checkoutUrl: string;
  slug?: string;
  orderNsu: string;
  mensagem?: string;
}

export interface InfinitePayRetornoParams {
  orderNsu?: string;
  slug?: string;
  transactionNsu?: string;
  receiptUrl?: string;
  captureMethod?: string;
  status?: string;
}

export function obterLinkPagamentoPublicoInfinitePay(handleOuLink?: string): string {
  if (!handleOuLink) return 'https://link.infinitepay.io/caroline-padela';
  const trimmed = handleOuLink.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Se o usuário colou com /$, ou link da InfinitePay, retorna o link limpo
    return trimmed.replace('infinitepay.io/$', 'link.infinitepay.io/');
  }
  const cleanHandle = trimmed.replace(/^\$/, '').trim();
  return `https://link.infinitepay.io/${cleanHandle}`;
}

/**
 * Cria um link de Checkout Externo oficial da InfinitePay
 * Documentação: https://app.infinitepay.io/external-checkout#documentacao
 */
export async function criarCheckoutLinkInfinitePay(
  params: InfinitePayCheckoutParams
): Promise<InfinitePayCheckoutResult> {
  const cleanHandle = (params.handle || 'caroline-padela').replace(/^\$/, '').trim();
  const valorCentavos = Math.round(params.valor * 100);

  // Determina a URL de retorno dinamicamente se não informada
  let returnUrl = params.redirectUrl;
  if (!returnUrl && typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    returnUrl = `${origin}${pathname}?order_nsu=${encodeURIComponent(params.orderNsu)}&status=retorno_infinitepay`;
  }

  // Prepara o payload oficial para API da InfinitePay
  const payload: any = {
    handle: cleanHandle,
    items: [
      {
        description: (params.descricaoItem || 'Sinal 50% - Agendamento').slice(0, 100),
        price: valorCentavos,
        quantity: 1,
      },
    ],
    order_nsu: params.orderNsu,
    redirect_url: returnUrl,
  };

  if (params.webhookUrl) {
    payload.webhook_url = params.webhookUrl;
  }

  if (params.cliente) {
    let cleanPhone = (params.cliente.telefone || '').replace(/\D/g, '');
    if (cleanPhone && !cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }
    payload.customer = {
      name: (params.cliente.nome || 'Cliente').slice(0, 100),
      email: params.cliente.email || 'contato@carolinepadela.com.br',
      phone_number: cleanPhone ? `+${cleanPhone}` : undefined,
    };
  }

  try {
    const response = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const checkoutUrl = data.url || data.checkout_url || data.link || (data.slug ? `https://checkout.infinitepay.io/pay/${data.slug}` : '');
      if (checkoutUrl) {
        return {
          sucesso: true,
          checkoutUrl,
          slug: data.slug,
          orderNsu: params.orderNsu,
        };
      }
    } else {
      console.warn('API InfinitePay retornou status:', response.status, 'usando fallback.');
    }
  } catch (err) {
    console.warn('Falha na requisição direta API InfinitePay:', err);
  }

  // Fallback garantido: Link personalizado configurado pela terapeuta ou link padrão
  const fallbackUrl = params.linkPagamento && params.linkPagamento.startsWith('http')
    ? params.linkPagamento
    : obterLinkPagamentoPublicoInfinitePay(params.linkPagamento || cleanHandle);

  return {
    sucesso: true,
    checkoutUrl: fallbackUrl,
    orderNsu: params.orderNsu,
    mensagem: 'Link de pagamento InfinitePay pronto.',
  };
}

/**
 * Verifica o status do pagamento na InfinitePay
 */
export async function verificarPagamentoInfinitePay(
  paramsOrHandle: string | { handle: string; orderNsu?: string; slug?: string; transactionNsu?: string },
  orderNsuParam?: string,
  slugParam?: string,
  transactionNsuParam?: string
): Promise<{ pago: boolean; dados?: any }> {
  try {
    let handle = '';
    let orderNsu = '';
    let slug: string | undefined;
    let transactionNsu: string | undefined;

    if (typeof paramsOrHandle === 'object') {
      handle = paramsOrHandle.handle;
      orderNsu = paramsOrHandle.orderNsu || '';
      slug = paramsOrHandle.slug;
      transactionNsu = paramsOrHandle.transactionNsu;
    } else {
      handle = paramsOrHandle;
      orderNsu = orderNsuParam || '';
      slug = slugParam;
      transactionNsu = transactionNsuParam;
    }

    const cleanHandle = handle.replace(/^\$/, '').trim();
    const response = await fetch('https://api.checkout.infinitepay.io/payment_check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: cleanHandle,
        order_nsu: orderNsu || undefined,
        slug: slug || undefined,
        transaction_nsu: transactionNsu || undefined,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const statusStr = (data.status || data.payment_status || '').toLowerCase();
      const pago = statusStr === 'paid' || statusStr === 'approved' || statusStr === 'success' || data.paid === true;
      return { pago, dados: data };
    }
  } catch (err) {
    console.warn('Erro ao consultar status InfinitePay:', err);
  }
  return { pago: false };
}

/**
 * Extrai os parâmetros retornados na URL após o cliente pagar no InfinitePay
 */
export function extrairParametrosRetornoInfinitePay(searchQuery?: string): InfinitePayRetornoParams | null {
  if (typeof window === 'undefined' && !searchQuery) return null;

  const queryString = searchQuery ?? (typeof window !== 'undefined' ? window.location.search : '');
  const urlParams = new URLSearchParams(queryString);
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');

  const orderNsu = urlParams.get('order_nsu') || urlParams.get('order_id') || hashParams.get('order_nsu');
  const slug = urlParams.get('slug') || hashParams.get('slug');
  const transactionNsu = urlParams.get('transaction_nsu') || urlParams.get('nsu') || hashParams.get('transaction_nsu');
  const receiptUrl = urlParams.get('receipt_url') || hashParams.get('receipt_url');
  const captureMethod = urlParams.get('capture_method') || hashParams.get('capture_method');
  const status = urlParams.get('status') || hashParams.get('status');

  if (orderNsu || transactionNsu || slug || status) {
    return {
      orderNsu: orderNsu || undefined,
      slug: slug || undefined,
      transactionNsu: transactionNsu || undefined,
      receiptUrl: receiptUrl || undefined,
      captureMethod: captureMethod || undefined,
      status: status || undefined,
    };
  }

  return null;
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
  checkoutUrl?: string;
  slug?: string;
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

  // Gera link do InfiniteTag ou link de pagamento direto oficial
  let linkFinal = configInfinitePay.linkPagamento;
  if (!linkFinal && configInfinitePay.infiniteTag) {
    linkFinal = obterLinkPagamentoPublicoInfinitePay(configInfinitePay.infiniteTag);
  } else if (linkFinal) {
    linkFinal = obterLinkPagamentoPublicoInfinitePay(linkFinal);
  } else {
    linkFinal = 'https://infinitepay.io/pay/caroline-padela';
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
    checkoutUrl: linkFinal,
    status: 'ATIVA',
  };
}

// Alias de compatibilidade
export const emitirCobrancaSinalBancoInter = emitirCobrancaSinalInfinitePay;
