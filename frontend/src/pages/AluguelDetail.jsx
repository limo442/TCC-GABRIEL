import React, { useEffect, useState } from 'react';
import { ArrowLeft, Car, User, Calendar, DollarSign, Clock } from 'lucide-react';
import { alugueisAPI } from '../services/api';
import { Button } from '../components/ui/button';

const STATUS_MAP = {
  reservado: { label: 'Reservado', cls: 'bg-amber-100 text-amber-700', step: 0 },
  ativo: { label: 'Ativo (Em Uso)', cls: 'bg-blue-100 text-blue-700', step: 1 },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700', step: -1 },
  concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700', step: 2 },
};

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:w-44">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value || '-'}</span>
    </div>
  );
}

function Stepper({ status }) {
  const steps = ['Reservado', 'Ativo', 'Concluído'];
  const current = STATUS_MAP[status]?.step ?? 0;
  const isCanceled = status === 'cancelado';

  if (isCanceled) {
    return (
      <div className="flex items-center gap-2 py-4">
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">X</div>
        <span className="text-sm font-medium text-red-600">Aluguel Cancelado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 py-4">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i <= current ? 'bg-[#0047FF] text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${i <= current ? 'text-[#0047FF]' : 'text-slate-400'}`}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-5 mx-1 ${i < current ? 'bg-[#0047FF]' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function AluguelDetail({ id, onBack }) {
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alugueisAPI.get(id).then(r => { setRental(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 w-full rounded" />)}
    </div>
  );

  if (!rental) return (
    <div className="text-center py-16 text-slate-400">
      <p>Aluguel não encontrado</p>
      <Button variant="outline" onClick={onBack} className="mt-4">Voltar</Button>
    </div>
  );

  const s = STATUS_MAP[rental.status] || { label: rental.status, cls: 'bg-slate-100 text-slate-600' };
  const fmt = (val) => val ? `R$ ${parseFloat(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
  const fmtDate = (d) => d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
  const pagLabel = { dinheiro: 'Dinheiro', pix: 'PIX', cartao: 'Cartão' };

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="aluguel-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" data-testid="btn-back">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-semibold text-slate-900">Aluguel #{rental.id}</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Fluxo do Aluguel</h3>
        <Stepper status={rental.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car size={18} className="text-[#0047FF]" />
            <h3 className="font-heading text-base font-semibold text-slate-900">Veículo</h3>
          </div>
          <InfoRow label="Marca / Modelo" value={`${rental.marca} ${rental.modelo}`} />
          <InfoRow label="Categoria" value={rental.categoria} />
          <InfoRow label="Placa" value={rental.placa} />
          <InfoRow label="Valor da Diária" value={rental.valor_diaria ? fmt(rental.valor_diaria) : '-'} />
        </div>

        {/* Client */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[#0047FF]" />
            <h3 className="font-heading text-base font-semibold text-slate-900">Cliente</h3>
          </div>
          <InfoRow label="Nome" value={rental.cliente_nome} />
          <InfoRow label="Código" value={rental.cliente_cod} />
          <InfoRow label="Telefone" value={rental.cliente_telefone} />
          <InfoRow label="Usuário Resp." value={rental.usuario_nome} />
        </div>

        {/* Dates */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-[#0047FF]" />
            <h3 className="font-heading text-base font-semibold text-slate-900">Datas</h3>
          </div>
          <InfoRow label="Data da Reserva" value={fmtDate(rental.created_at)} />
          <InfoRow label="Data de Saída" value={fmtDate(rental.data_saida)} />
          <InfoRow label="Dias Previstos" value={`${rental.dias_previsto} dia(s)`} />
          <InfoRow label="Data de Entrega" value={fmtDate(rental.data_entrega)} />
        </div>

        {/* Financial */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-[#0047FF]" />
            <h3 className="font-heading text-base font-semibold text-slate-900">Financeiro</h3>
          </div>
          <InfoRow label="Valor Previsto" value={fmt(rental.valor_previsto)} />
          <InfoRow label="Valor Realizado" value={rental.valor_realizado ? fmt(rental.valor_realizado) : 'Pendente'} />
          <InfoRow label="Forma de Pagamento" value={pagLabel[rental.forma_pagamento] || rental.forma_pagamento} />
          {rental.valor_realizado && rental.valor_previsto && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
              parseFloat(rental.valor_realizado) > parseFloat(rental.valor_previsto)
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}>
              {parseFloat(rental.valor_realizado) > parseFloat(rental.valor_previsto)
                ? `Acréscimo: ${fmt(rental.valor_realizado - rental.valor_previsto)}`
                : parseFloat(rental.valor_realizado) < parseFloat(rental.valor_previsto)
                  ? `Desconto: ${fmt(rental.valor_previsto - rental.valor_realizado)}`
                  : 'Valor exato conforme previsto'}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock size={12} />
        <span>Criado em {new Date(rental.created_at).toLocaleString('pt-BR')} &middot; Atualizado em {new Date(rental.updated_at).toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}
