import React, { useEffect, useState } from 'react';
import { solicitacoesAPI, integracoesAPI } from '../services/api';
import { toast } from 'sonner';

export default function Solicitacoes() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pendente');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [estados, setEstados] = useState(null);

  async function load(currentStatus = status) {
    setLoading(true);
    try {
      const data = await solicitacoesAPI.list({ status: currentStatus });
      setItems(data.items);
    } catch (_) {
      toast.error('Não foi possível carregar solicitações');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(status); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    integracoesAPI.ufs().then(data => setEstados(data.items.length)).catch(() => setEstados(0));
  }, []);

  async function processar(id, action) {
    const label = action === 'aprovar' ? 'aprovar' : 'recusar';
    if (!window.confirm(`Deseja ${label} esta solicitação?`)) return;
    setBusy(id);
    try {
      if (action === 'aprovar') await solicitacoesAPI.aprovar(id);
      else await solicitacoesAPI.recusar(id);
      toast.success('Solicitação processada.');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao processar solicitação');
    } finally { setBusy(null); }
  }

  return <div className="space-y-6">
    <header className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold">Solicitações de autoatendimento</h1>
        <p className="text-sm text-slate-600">Pedidos públicos são avaliados antes da criação de uma reserva.</p>
      </div>
      <select value={status} onChange={e => setStatus(e.target.value)}
        className="h-10 px-3 border border-slate-300 rounded">
        <option value="pendente">Pendentes</option>
        <option value="aprovada">Aprovadas</option>
        <option value="recusada">Recusadas</option>
        <option value="todas">Todas</option>
      </select>
    </header>
    <div className="text-xs text-slate-500">
      Integração externa com IBGE: {estados === null ? 'consultando localidades...' :
      estados === 0 ? 'indisponível, sem impacto nas reservas' : `${estados} UFs consultadas`}.
    </div>
    {loading ? <p>Carregando pedidos...</p> : items.length === 0 ?
      <p className="bg-white rounded p-6 text-slate-600">Nenhuma solicitação encontrada.</p> :
      <div className="grid gap-4">
        {items.map(item => <article key={item.id} className="bg-white rounded-xl border p-5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <h2 className="font-semibold">{item.marca} {item.modelo} — {item.status}</h2>
            <span className="text-sm text-slate-500">{new Date(item.created_at).toLocaleString('pt-BR')}</span>
          </div>
          <p className="text-sm">Solicitante: {item.nome} — {item.email} {item.telefone ? `— ${item.telefone}` : ''}</p>
          <p className="text-sm">Saída: {String(item.data_saida).slice(0, 10)} • {item.dias_previsto} dias •
            Estimativa: R$ {(Number(item.valor_diaria) * item.dias_previsto).toFixed(2)}</p>
          {item.aluguel_id && <p className="text-sm">Reserva criada: #{item.aluguel_id}</p>}
          {item.status === 'pendente' && <div className="flex gap-3 pt-2">
            <button disabled={busy === item.id} onClick={() => processar(item.id, 'aprovar')}
              className="bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50">Aprovar e criar reserva</button>
            <button disabled={busy === item.id} onClick={() => processar(item.id, 'recusar')}
              className="border border-slate-300 py-2 px-4 rounded disabled:opacity-50">Recusar</button>
          </div>}
          {item.status === 'recusada' && <button disabled={busy === item.id}
            onClick={async () => {
              if (!window.confirm('Excluir dados deste pedido recusado?')) return;
              setBusy(item.id);
              try { await solicitacoesAPI.excluirDados(item.id); toast.success('Solicitação eliminada'); await load(); }
              catch (e) { toast.error(e.response?.data?.message || 'Não foi possível excluir'); }
              finally { setBusy(null); }
            }} className="text-red-700 underline text-sm">Eliminar dados do pedido recusado</button>}
        </article>)}
      </div>}
  </div>;
}
