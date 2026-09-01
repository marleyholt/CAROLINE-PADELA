import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Send,
  Activity,
  HeartPulse,
  Calendar,
  CheckCircle2,
  Clock,
  Camera,
  Plus,
  Trash2,
  ImageIcon,
  UploadCloud,
} from 'lucide-react';
import {
  ConfiguracaoClinica,
  EvolucaoClinica,
  Paciente,
  Procedimento,
  ComparativoVisual,
} from '../types';
import {
  baixarRelatorioPDF,
  gerarTextoWhatsAppEvolucao,
  abrirWhatsAppComTexto,
  enviarRelatorioAtendimentoWhatsAppComPDF,
} from '../services/pdfGenerator';

interface EvolucaoModalProps {
  isOpen?: boolean;
  paciente: Paciente;
  configClinica: ConfiguracaoClinica;
  procedimentos?: Procedimento[];
  evolucaoExistente?: EvolucaoClinica;
  procedimentoInicial?: string;
  procedimentoSugerido?: string;
  onClose: () => void;
  onSalvarEvolucao: (evolucao: EvolucaoClinica) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_REGIOES = [
  'Cervical',
  'Trapézio Superior',
  'Escápulas / Romboides',
  'Lombar / Fáscia Toracolombar',
  'Glúteos / Piriforme',
  'Isquiotibiais / Posterior de Coxa',
  'Quadríceps / Trato Iliotibial',
  'Panturrilhas / Gastrocnêmio',
  'Pés / Fáscia Plantar',
  'Membros Superiores / Ombros',
  'Abdômen / Linfonodos',
  'Crânio / Face / ATM',
];

// Otimiza e comprime imagem para armazenamento leve e geração rápida de PDF
const processarImagemUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Erro ao processar imagem'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

export const EvolucaoModal: React.FC<EvolucaoModalProps> = ({
  paciente,
  configClinica,
  procedimentos = [],
  evolucaoExistente,
  procedimentoInicial,
  procedimentoSugerido,
  onClose,
  onSalvarEvolucao,
  onShowToast,
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const defaultProcNome =
    evolucaoExistente?.procedimentoRealizado ||
    procedimentoSugerido ||
    procedimentoInicial ||
    (procedimentos.length > 0 ? procedimentos[0].nome : 'Massagem Terapêutica & Liberação Miofascial');

  const [dataSessao, setDataSessao] = useState(evolucaoExistente?.dataSessao || hoje);
  const [procedimentoRealizado, setProcedimentoRealizado] = useState(defaultProcNome);
  const [terapeutaResponsavel, setTerapeutaResponsavel] = useState(
    evolucaoExistente?.terapeutaResponsavel || configClinica.nomeTerapeuta
  );

  // Escala EVA de Dor
  const [evaInicial, setEvaInicial] = useState<number>(evolucaoExistente?.evaInicial ?? 7);
  const [evaFinal, setEvaFinal] = useState<number>(evolucaoExistente?.evaFinal ?? 2);

  // Regiões Anatômicas (com persistência local de novas regiões customizadas)
  const [listaRegioes, setListaRegioes] = useState<string[]>(() => {
    try {
      const salvas = localStorage.getItem('masso_regioes_anatomicas');
      if (salvas) {
        const parsed = JSON.parse(salvas);
        return Array.from(new Set([...DEFAULT_REGIOES, ...parsed]));
      }
    } catch {}
    return DEFAULT_REGIOES;
  });

  const [regioesTrabalhadas, setRegioesTrabalhadas] = useState<string[]>(
    evolucaoExistente?.regioesTrabalhadas || ['Cervical', 'Trapézio Superior']
  );
  const [novaRegiaoInput, setNovaRegiaoInput] = useState('');
  const [mostrarInputOutros, setMostrarInputOutros] = useState(false);

  const handleAdicionarOutraRegiao = () => {
    const limpo = novaRegiaoInput.trim();
    if (!limpo) return;

    if (!listaRegioes.includes(limpo)) {
      const novaLista = [...listaRegioes, limpo];
      setListaRegioes(novaLista);
      try {
        localStorage.setItem('masso_regioes_anatomicas', JSON.stringify(novaLista));
      } catch {}
    }

    if (!regioesTrabalhadas.includes(limpo)) {
      setRegioesTrabalhadas((prev) => [...prev, limpo]);
    }

    setNovaRegiaoInput('');
    setMostrarInputOutros(false);
    onShowToast('Região Adicionada', `"${limpo}" foi salva nas opções rápidas.`, 'success');
  };

  // Acompanhamento Corporal / Antropometria da Sessão (Drenagem & Perda de Líquidos)
  const [pesoKg, setPesoKg] = useState<string>(
    evolucaoExistente?.pesoKg !== undefined
      ? evolucaoExistente.pesoKg.toString()
      : (paciente.peso ? paciente.peso.replace(/[^\d.,]/g, '').replace(',', '.') : '')
  );
  const [pesoFinalSessaoKg, setPesoFinalSessaoKg] = useState<string>(
    evolucaoExistente?.pesoFinalSessaoKg !== undefined
      ? evolucaoExistente.pesoFinalSessaoKg.toString()
      : ''
  );
  const [circunferenciaCm, setCircunferenciaCm] = useState<string>(
    evolucaoExistente?.circunferenciaCm || ''
  );

  // Comparativos Visuais (Fotos de Antes e Depois da Sessão)
  const [comparativosVisuais, setComparativosVisuais] = useState<ComparativoVisual[]>(
    evolucaoExistente?.comparativosVisuais || []
  );

  // Relatório de Anamnese & Evolução Clínica
  const [queixaPrincipal, setQueixaPrincipal] = useState(
    evolucaoExistente?.queixaPrincipal || paciente.queixaInicial || ''
  );
  const [manobrasAplicadas, setManobrasAplicadas] = useState(
    evolucaoExistente?.manobrasAplicadas || 'Deslizamento profundo, desativação de trigger points e manobras de liberação miofascial.'
  );
  const [reacaoTecidual, setReacaoTecidual] = useState(
    evolucaoExistente?.reacaoTecidual || 'Hiperemia transitória leve a moderada, relaxamento imediato da fáscia muscular.'
  );
  const [orientacoesCasa, setOrientacoesCasa] = useState(
    evolucaoExistente?.orientacoesCasa || '1. Manter hidratação adequada (2.5L de água).\n2. Compressa morna na região de maior tensão.\n3. Alongamentos suaves.'
  );
  const [observacoesGerais, setObservacoesGerais] = useState(evolucaoExistente?.observacoesGerais || '');
  const [proximaSessaoRecomendada, setProximaSessaoRecomendada] = useState(
    evolucaoExistente?.proximaSessaoRecomendada || ''
  );

  const toggleRegiao = (reg: string) => {
    setRegioesTrabalhadas((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  // Funções de Comparativos Visuais (Antes & Depois)
  const handleAdicionarComparativo = () => {
    const novoComp: ComparativoVisual = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      fotoAntes: '',
      fotoDepois: '',
      descricao: '',
    };
    setComparativosVisuais((prev) => [...prev, novoComp]);
  };

  const handleRemoverComparativo = (id: string) => {
    setComparativosVisuais((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAtualizarDescricaoComparativo = (id: string, descricao: string) => {
    setComparativosVisuais((prev) =>
      prev.map((c) => (c.id === id ? { ...c, descricao } : c))
    );
  };

  const handleUploadFoto = async (
    id: string,
    tipo: 'antes' | 'depois',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await processarImagemUpload(file);
      setComparativosVisuais((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return tipo === 'antes' ? { ...c, fotoAntes: base64 } : { ...c, fotoDepois: base64 };
          }
          return c;
        })
      );
      onShowToast('Foto Carregada', `Foto de ${tipo === 'antes' ? 'Antes' : 'Depois'} anexada com sucesso.`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Erro no Upload', 'Não foi possível processar a foto. Tente outra imagem.', 'error');
    }
  };

  const construirObjetoEvolucao = (): EvolucaoClinica => {
    return {
      id: evolucaoExistente?.id || `evo-${Date.now()}`,
      pacienteId: paciente.id,
      agendamentoId: evolucaoExistente?.agendamentoId,
      dataSessao,
      horario: evolucaoExistente?.horario,
      statusRelatorio: 'concluido', // Salvar conclui o relatório da sessão
      procedimentoRealizado,
      terapeutaResponsavel,
      evaInicial,
      evaFinal,
      pesoKg: pesoKg.trim() ? pesoKg.trim() : undefined,
      pesoFinalSessaoKg: pesoFinalSessaoKg.trim() ? pesoFinalSessaoKg.trim() : undefined,
      circunferenciaCm: circunferenciaCm.trim() ? circunferenciaCm.trim() : undefined,
      comparativosVisuais: comparativosVisuais.filter((c) => c.fotoAntes || c.fotoDepois),
      regioesTrabalhadas,
      queixaPrincipal,
      manobrasAplicadas,
      reacaoTecidual,
      orientacoesCasa,
      observacoesGerais,
      proximaSessaoRecomendada: proximaSessaoRecomendada || undefined,
      criadoEm: evolucaoExistente?.criadoEm || new Date().toISOString(),
    };
  };

  const handleSalvar = () => {
    const evo = construirObjetoEvolucao();
    onSalvarEvolucao(evo);
    onClose();
  };

  const handleBaixarPDF = () => {
    const evo = construirObjetoEvolucao();
    baixarRelatorioPDF(evo, paciente, configClinica);
    onShowToast('Relatório PDF Gerado!', `Emitido timbrado (${configClinica.cidadeUf || 'Maricá - RJ'}) com registros da sessão.`, 'success');
  };

  const handleEnviarWhatsApp = () => {
    const evo = construirObjetoEvolucao();
    enviarRelatorioAtendimentoWhatsAppComPDF(evo, paciente, configClinica, onShowToast);
  };

  const melhoraPercentual =
    evaInicial > 0 ? Math.round(((evaInicial - evaFinal) / evaInicial) * 100) : 0;

  return (
    <div
      id="modal-adicionar-sessao"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-3 sm:my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {evolucaoExistente ? 'Editar Sessão & Anamnese' : 'Adicionar Sessão & Relatório de Anamnese'}
                </h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded font-mono">
                  Prontuário
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Paciente: <strong className="text-white">{paciente.nome}</strong> • {paciente.whatsapp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Lembrete de Sessão Agendada Pendente de Relatório */}
          {evolucaoExistente?.statusRelatorio === 'pendente' && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
              <div className="p-1 bg-amber-100 text-amber-700 rounded-md shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  Concluindo Relatório da Sessão Agendada
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Esta sessão foi registrada pelo agendamento. Preencha as manobras realizadas, avaliação EVA de dor e condutas aplicadas para finalizar o relatório clínico oficial.
                </p>
              </div>
            </div>
          )}

          {/* Seção 1: Procedimento Realizado, Data e Terapeuta Responsável */}
          <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              1. Procedimento Realizado & Terapeuta Responsável
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Procedimento */}
              <div className="sm:col-span-6">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Procedimento / Terapia Realizada
                </label>
                {procedimentos.length > 0 ? (
                  <select
                    value={procedimentoRealizado}
                    onChange={(e) => setProcedimentoRealizado(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    {procedimentos.map((proc) => (
                      <option key={proc.id} value={proc.nome}>
                        {proc.nome} ({proc.duracaoMinutos} min)
                      </option>
                    ))}
                    <option value="Outro Procedimento">Outro Procedimento Personalizado...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={procedimentoRealizado}
                    onChange={(e) => setProcedimentoRealizado(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Data da Sessão */}
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Data da Sessão</label>
                <input
                  type="date"
                  value={dataSessao}
                  onChange={(e) => setDataSessao(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Terapeuta */}
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Terapeuta Responsável</label>
                <input
                  type="text"
                  value={terapeutaResponsavel}
                  onChange={(e) => setTerapeutaResponsavel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Escala EVA de Dor */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Avaliação de Dor (Escala EVA 0 a 10)
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded font-mono border border-emerald-300">
                {melhoraPercentual >= 0 ? `Alívio: -${melhoraPercentual}%` : 'Sem alteração'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dor Antes */}
              <div className="bg-rose-50/80 border border-rose-200 rounded-md p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-rose-900">Dor Inicial (Chegada)</span>
                  <span className="font-bold font-mono text-sm text-rose-700">{evaInicial} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaInicial}
                  onChange={(e) => setEvaInicial(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] text-rose-700/80 font-medium">
                  <span>0 Sem Dor</span>
                  <span>5 Moderada</span>
                  <span>10 Severa / Incapacitante</span>
                </div>
              </div>

              {/* Dor Depois */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-md p-2.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-900">Dor Final (Pós-Sessão)</span>
                  <span className="font-bold font-mono text-sm text-emerald-700">{evaFinal} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={evaFinal}
                  onChange={(e) => setEvaFinal(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] text-emerald-700/80 font-medium">
                  <span>0 Alívio Total</span>
                  <span>5 Moderada</span>
                  <span>10 Sem Alívio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção Antropométrica da Sessão: Peso / Massa Corporal & Perda de Líquidos (Drenagem) */}
          <div className="bg-sky-50/70 p-3.5 rounded-lg border border-sky-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-sky-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Acompanhamento Corporal & Perda de Líquidos (Sessão / Drenagem)
                </h4>
              </div>
              {(() => {
                const pIni = parseFloat(pesoKg.replace(',', '.'));
                const pFim = parseFloat(pesoFinalSessaoKg.replace(',', '.'));
                if (!isNaN(pIni) && !isNaN(pFim) && pIni > 0 && pFim > 0) {
                  const dif = pIni - pFim;
                  const difGramas = Math.round(dif * 1000);
                  return (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono border ${
                      dif > 0
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {dif > 0 ? `💧 Perda Líquida: -${dif.toFixed(2)} kg (-${difGramas}g)` : `Variação: ${dif.toFixed(2)} kg`}
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  ⚖️ Peso Inicial da Sessão (kg)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 68.4"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-sky-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Peso na chegada à clínica</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  💧 Peso Pós-Sessão / Drenagem (kg)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 67.9 (Opcional)"
                  value={pesoFinalSessaoKg}
                  onChange={(e) => setPesoFinalSessaoKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-sky-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono font-bold text-sky-950"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Para tratamentos de retenção/edema</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  📏 Medidas / Circunferências (cm)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Abdômen: 78cm, Coxa: 54cm"
                  value={circunferenciaCm}
                  onChange={(e) => setCircunferenciaCm(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-sky-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Medidas corporais opcionais</span>
              </div>
            </div>
          </div>

          {/* Seção 4: Comparativo Visual (Fotos de Antes e Depois) */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  4. Comparativos Visuais (Fotos de Antes e Depois)
                </h4>
              </div>
              <button
                type="button"
                id="btn-add-comparativo-visual"
                onClick={handleAdicionarComparativo}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Comparativo Visual</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Adicione fotos de Antes e Depois para acompanhar visualmente a resposta tecidual, redução de edema, alinhamento postural ou relaxamento muscular. Estas imagens são exportadas lado a lado no Relatório Oficial do Paciente.
            </p>

            {comparativosVisuais.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-white">
                <ImageIcon className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-slate-600">Nenhum comparativo visual adicionado nesta sessão.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Clique no botão acima para anexar fotos de Antes e Depois com legenda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comparativosVisuais.map((comp, index) => (
                  <div
                    key={comp.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                        Comparativo #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoverComparativo(comp.id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-rose-50"
                        title="Remover este comparativo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Foto ANTES */}
                      <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                            Foto ANTES
                          </span>
                          {comp.fotoAntes && (
                            <label className="text-[10px] text-teal-700 hover:underline cursor-pointer">
                              Trocar foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleUploadFoto(comp.id, 'antes', e)}
                              />
                            </label>
                          )}
                        </div>

                        {comp.fotoAntes ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-[3/4] min-h-[260px] sm:min-h-[320px] flex items-center justify-center p-1 group">
                            <img
                              src={comp.fotoAntes}
                              alt="Antes da sessão"
                              className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-bold tracking-wider">
                              ANTES
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-rose-300 hover:border-rose-400 bg-white hover:bg-rose-50/40 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors aspect-[3/4] min-h-[260px] sm:min-h-[320px]">
                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-2">
                              <UploadCloud className="w-6 h-6 text-rose-600" />
                            </div>
                            <span className="text-xs font-bold text-rose-800">Enviar Foto de Antes</span>
                            <span className="text-[10px] text-slate-400 mt-1 text-center">Foto na vertical (em pé)<br/>JPG, PNG ou Câmera</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadFoto(comp.id, 'antes', e)}
                            />
                          </label>
                        )}
                      </div>

                      {/* Foto DEPOIS */}
                      <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Foto DEPOIS
                          </span>
                          {comp.fotoDepois && (
                            <label className="text-[10px] text-teal-700 hover:underline cursor-pointer">
                              Trocar foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleUploadFoto(comp.id, 'depois', e)}
                              />
                            </label>
                          )}
                        </div>

                        {comp.fotoDepois ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-[3/4] min-h-[260px] sm:min-h-[320px] flex items-center justify-center p-1 group">
                            <img
                              src={comp.fotoDepois}
                              alt="Depois da sessão"
                              className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold tracking-wider">
                              DEPOIS
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors aspect-[3/4] min-h-[260px] sm:min-h-[320px]">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                              <UploadCloud className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-emerald-800">Enviar Foto de Depois</span>
                            <span className="text-[10px] text-slate-400 mt-1 text-center">Foto na vertical (em pé)<br/>JPG, PNG ou Câmera</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadFoto(comp.id, 'depois', e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Descrição / Legenda opcional */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Descrição / Legenda do Comparativo (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Região lombar e flancos após liberação miofascial / drenagem manual"
                        value={comp.descricao || ''}
                        onChange={(e) => handleAtualizarDescricaoComparativo(comp.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 5: Regiões Anatômicas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                5. Regiões Anatômicas Trabalhadas
              </label>
              <button
                type="button"
                onClick={() => setMostrarInputOutros(!mostrarInputOutros)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                + Outros (Adicionar nova região)
              </button>
            </div>

            {/* Input para adicionar nova região em Outros */}
            {mostrarInputOutros && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <input
                  type="text"
                  value={novaRegiaoInput}
                  onChange={(e) => setNovaRegiaoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdicionarOutraRegiao();
                    }
                  }}
                  placeholder="Nome da nova região anatômica (ex: Manguito Rotador, Tendão de Aquiles...)"
                  className="flex-1 px-2.5 py-1.5 rounded-md border border-emerald-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAdicionarOutraRegiao}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
                >
                  Salvar Região
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarInputOutros(false)}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {listaRegioes.map((reg) => {
                const isSelected = regioesTrabalhadas.includes(reg);
                return (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => toggleRegiao(reg)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {reg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 6: Relatório de Anamnese & Evolução da Sessão */}
          <div className="space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              6. Relatório de Anamnese & Evolução da Sessão
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Queixa Principal & Anamnese da Sessão
              </label>
              <textarea
                rows={2}
                value={queixaPrincipal}
                onChange={(e) => setQueixaPrincipal(e.target.value)}
                placeholder="Descreva o motivo da procura, localização e tipo de dor, fatores de piora/melhora..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Manobras, Técnicas e Condutas Aplicadas
              </label>
              <textarea
                rows={2}
                value={manobrasAplicadas}
                onChange={(e) => setManobrasAplicadas(e.target.value)}
                placeholder="Ex: Desativação de trigger points, deslizamento miofascial profundo, ventosaterapia, drenagem..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Resposta Tecidual, Mobilidade e Avaliação Pós-Atendimento
              </label>
              <textarea
                rows={2}
                value={reacaoTecidual}
                onChange={(e) => setReacaoTecidual(e.target.value)}
                placeholder="Ex: Hiperemia transitória reativa esperada, relaxamento da fáscia, ganho de mobilidade articular..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
              <label className="text-xs font-bold text-emerald-900 block mb-1">
                Orientações de Autocuidado Domiciliar (Enviado ao Paciente no WhatsApp e PDF)
              </label>
              <textarea
                rows={2}
                value={orientacoesCasa}
                onChange={(e) => setOrientacoesCasa(e.target.value)}
                placeholder="Orientações sobre hidratação, compressas, postura, alongamentos e pausas..."
                className="w-full px-3 py-2 rounded-md border border-emerald-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Data Sugerida para Retorno / Próxima Sessão
                </label>
                <input
                  type="date"
                  value={proximaSessaoRecomendada}
                  onChange={(e) => setProximaSessaoRecomendada(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Observações Internas (Opcional)
                </label>
                <input
                  type="text"
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
                  placeholder="Anotações internas do terapeuta..."
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Salvar */}
            <button
              id="btn-salvar-sessao"
              onClick={handleSalvar}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Sessão & Prontuário</span>
            </button>

            {/* Gerar Relatório de Anamnese & Evolução PDF */}
            <button
              id="btn-gerar-relatorio-pdf"
              onClick={handleBaixarPDF}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              title="Gera o Relatório Clínico Oficial timbrado com os dados da clínica (Maricá - RJ) sem expor valores financeiros"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Gerar Relatório Anamnese (PDF)</span>
            </button>

            {/* Enviar WhatsApp */}
            <button
              id="btn-enviar-whats-sessao"
              onClick={handleEnviarWhatsApp}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              title="Abre o WhatsApp com o resumo clínico e anexo do PDF"
            >
              <Send className="w-4 h-4" />
              <span>Enviar WhatsApp com PDF</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-500">
            * O Relatório de Anamnese em PDF é emitido com cabeçalho timbrado oficial da clínica ({configClinica.nomeClinica || 'Espaço Terapêutico'} • {configClinica.cidadeUf || 'Maricá - RJ'}) e <strong>não contém dados de valores financeiros</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

