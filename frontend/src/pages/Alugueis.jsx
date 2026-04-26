import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, Play, XCircle, CheckCircle, Trash2, Filter } from 'lucide-react';
import { alugueisAPI, veiculosAPI, clientesAPI, usuariosAPI } from '../services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import AluguelDetail from './AluguelDetail';

const STATUS_MAP = {
  reservado: { label: 'Reservado', cls: 'bg-amber-100 text-amber-700' },
  ativo: { label: 'Ativo', cls: 'bg-blue-100 text-blue-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
  concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
};

const PAGAMENTO_OPTS = ['dinheiro', 'pix', 'cartao'];
const PAGAMENTO_LABELS = { dinheiro: 'Dinheiro', pix: 'PIX', cartao: 'Cartão' };

const EMPTY_FORM = {
  veiculo_id: '', cliente_id: '', usuario_id: '',
  data_saida: '', dias_previsto: '', valor_previsto: '', forma_pagamento: 'dinheiro',
};

export default function Alugueis() {
  const [alugueis, setAlugueis] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // {rental, targetStatus}
  const [finalizarModal, setFinalizarModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [finalizarForm, setFinalizarForm] = useState({ data_entrega: '', valor_realizado: '', forma_pagamento: 'dinheiro', usuario_id: '' });
  const [saving, setSaving] = useState(false);

   const load = useCallback(async () => {
     setLoading(true);
     try {
       const params = {};
       if (filtroStatus) params.status = filtroStatus;
       const [ra, rv, rc, ru] = await Promise.all([
         alugueisAPI.list(params),
         veiculosAPI.list(),
         clientesAPI.list(),
         usuariosAPI.list(),
       ]);
       setAlugueis(ra.items);
       setVeiculos(rv.items);
       setClientes(rc.items);
       setUsuarios(ru.items);
     } catch { toast.error('Erro ao carregar dados'); }
     finally { setLoading(false); }
   }, [filtroStatus]);

  useEffect(() => { load(); }, [load]);

  // Auto-calculate valor_previsto when days or vehicle changes
  useEffect(() => {
    const v = veiculos.find(x => x.id === parseInt(form.veiculo_id));
    if (v && form.dias_previsto) {
      const val = (parseFloat(v.valor_diaria) * parseInt(form.dias_previsto)).toFixed(2);
      setForm(p => ({ ...p, valor_previsto: val }));
    }
  }, [form.veiculo_id, form.dias_previsto, veiculos]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await alugueisAPI.create({
        ...form,
        veiculo_id: parseInt(form.veiculo_id),
        cliente_id: parseInt(form.cliente_id),
        usuario_id: parseInt(form.usuario_id),
        dias_previsto: parseInt(form.dias_previsto),
        valor_previsto: parseFloat(form.valor_previsto),
      });
      toast.success('Reserva criada com sucesso!');
      setModalOpen(false); setForm(EMPTY_FORM); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao criar reserva'); }
    finally { setSaving(false); }
  };

  const handleStatus = async () => {
    setSaving(true);
    try {
      await alugueisAPI.updateStatus(statusModal.rental.id, { status: statusModal.targetStatus, usuario_id: statusModal.rental.usuario_id });
      toast.success(`Status atualizado para "${statusModal.targetStatus}"!`);
      setStatusModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao atualizar status'); }
    finally { setSaving(false); }
  };

  const handleFinalizar = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await alugueisAPI.finalizar(finalizarModal.id, {
        data_entrega: finalizarForm.data_entrega,
        valor_realizado: parseFloat(finalizarForm.valor_realizado),
        forma_pagamento: finalizarForm.forma_pagamento,
        usuario_id: parseInt(finalizarForm.usuario_id),
      });
      toast.success('Aluguel finalizado com sucesso!');
      setFinalizarModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao finalizar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await alugueisAPI.delete(deleteModal.id);
      toast.success('Aluguel excluído!');
      setDeleteModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao excluir'); }
  };

   const openFinalizar = (rental) => {
     const hoje = new Date().toISOString().split('T')[0];
     const diasReais = rental.data_saida
       ? Math.max(1, Math.ceil((new Date(hoje) - new Date(rental.data_saida)) / 86400000))
       : rental.dias_previsto;
     const valorDiaria = rental.valor_previsto / rental.dias_previsto;
     const valorEst = (diasReais * parseFloat(valorDiaria)).toFixed(2);
     setFinalizarForm({ data_entrega: hoje, valor_realizado: valorEst, forma_pagamento: rental.forma_pagamento || 'dinheiro', usuario_id: String(rental.usuario_id) });
     setFinalizarModal(rental);
   };

  if (detailId) {
    return <AluguelDetail id={detailId} onBack={() => { setDetailId(null); load(); }} usuarios={usuarios} />;
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Filter size={16} className="text-slate-400 mt-2.5" />
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-300 text-sm bg-white text-slate-700"
            data-testid="filter-status"
          >
            <option value="">Todos os status</option>
            <option value="reservado">Reservado</option>
            <option value="ativo">Ativo</option>
            <option value="cancelado">Cancelado</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }} className="bg-[#0047FF] hover:bg-[#003BE0] text-white h-9 gap-2 whitespace-nowrap" data-testid="btn-nova-reserva">
          <Plus size={16} /> Nova Reserva
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="alugueis-table">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['#', 'Cliente', 'Veículo', 'Saída', 'Dias', 'Valor Prev.', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alugueis.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-slate-400 text-sm">Nenhum aluguel encontrado</td></tr>
                ) : alugueis.map(a => {
                  const s = STATUS_MAP[a.status] || { label: a.status, cls: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`aluguel-row-${a.id}`}>
                      <td className="px-4 py-3 text-sm text-slate-500">#{a.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{a.cliente_nome || `#${a.cliente_id}`}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{a.marca ? `${a.marca} ${a.modelo}` : `#${a.veiculo_id}`}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{a.data_saida ? new Date(a.data_saida + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{a.dias_previsto}d</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        R$ {parseFloat(a.valor_previsto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setDetailId(a.id)} title="Detalhes" className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" data-testid={`view-aluguel-${a.id}`}>
                            <Eye size={14} />
                          </button>
                          {a.status === 'reservado' && (
                            <button onClick={() => setStatusModal({ rental: a, targetStatus: 'ativo' })} title="Ativar (Retirada)" className="p-1.5 rounded hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors" data-testid={`ativar-aluguel-${a.id}`}>
                              <Play size={14} />
                            </button>
                          )}
                          {a.status === 'ativo' && (
                            <button onClick={() => openFinalizar(a)} title="Finalizar (Devolução)" className="p-1.5 rounded hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors" data-testid={`finalizar-aluguel-${a.id}`}>
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {['reservado', 'ativo'].includes(a.status) && (
                            <button onClick={() => setStatusModal({ rental: a, targetStatus: 'cancelado' })} title="Cancelar" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-testid={`cancelar-aluguel-${a.id}`}>
                              <XCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => setDeleteModal(a)} title="Excluir" className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-testid={`delete-aluguel-${a.id}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">{alugueis.length} aluguel(s)</div>
      </div>

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" data-testid="modal-reserva">
          <DialogHeader><DialogTitle className="font-heading">Nova Reserva</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Veículo *</Label>
                <select value={form.veiculo_id} onChange={e => setForm(p => ({ ...p, veiculo_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm bg-white" required data-testid="select-veiculo">
                  <option value="">Selecione...</option>
                  {veiculos.filter(v => v.disponivel).map(v => (
                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placa} (R$ {parseFloat(v.valor_diaria).toFixed(2)}/dia)</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Cliente *</Label>
                <select value={form.cliente_id} onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm bg-white" required data-testid="select-cliente">
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.cod})</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Usuário Responsável *</Label>
                <select value={form.usuario_id} onChange={e => setForm(p => ({ ...p, usuario_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm bg-white" required data-testid="select-usuario">
                  <option value="">Selecione...</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Data de Saída *</Label>
                <Input type="date" value={form.data_saida} onChange={e => setForm(p => ({ ...p, data_saida: e.target.value }))} required data-testid="input-data-saida" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Dias Previstos *</Label>
                <Input type="number" min="1" value={form.dias_previsto} onChange={e => setForm(p => ({ ...p, dias_previsto: e.target.value }))} placeholder="3" required data-testid="input-dias-previsto" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Valor Previsto (R$)</Label>
                <Input type="number" step="0.01" min="0.01" value={form.valor_previsto} onChange={e => setForm(p => ({ ...p, valor_previsto: e.target.value }))} placeholder="Auto calculado" required data-testid="input-valor-previsto" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Forma de Pagamento</Label>
              <select value={form.forma_pagamento} onChange={e => setForm(p => ({ ...p, forma_pagamento: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm bg-white" data-testid="select-forma-pagamento">
                {PAGAMENTO_OPTS.map(o => <option key={o} value={o}>{PAGAMENTO_LABELS[o]}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#0047FF] hover:bg-[#003BE0] text-white" disabled={saving} data-testid="btn-criar-reserva">
                {saving ? 'Criando...' : 'Criar Reserva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status confirm modal */}
      <Dialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <DialogContent className="max-w-sm" data-testid="modal-status">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {statusModal?.targetStatus === 'ativo' ? 'Confirmar Retirada' : 'Cancelar Aluguel'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {statusModal?.targetStatus === 'ativo'
              ? `Confirmar a retirada do veículo para o aluguel #${statusModal?.rental?.id}?`
              : `Tem certeza que deseja cancelar o aluguel #${statusModal?.rental?.id}?`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModal(null)}>Voltar</Button>
            <Button
              className={statusModal?.targetStatus === 'ativo' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}
              onClick={handleStatus} disabled={saving}
              data-testid="btn-confirm-status"
            >
              {statusModal?.targetStatus === 'ativo' ? 'Confirmar Retirada' : 'Cancelar Aluguel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalizar modal */}
      <Dialog open={!!finalizarModal} onOpenChange={() => setFinalizarModal(null)}>
        <DialogContent className="max-w-md" data-testid="modal-finalizar">
          <DialogHeader><DialogTitle className="font-heading">Finalizar Aluguel #{finalizarModal?.id}</DialogTitle></DialogHeader>
          <form onSubmit={handleFinalizar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Data de Devolução *</Label>
                <Input type="date" value={finalizarForm.data_entrega} onChange={e => setFinalizarForm(p => ({ ...p, data_entrega: e.target.value }))} required data-testid="input-data-entrega" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Valor Realizado (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={finalizarForm.valor_realizado} onChange={e => setFinalizarForm(p => ({ ...p, valor_realizado: e.target.value }))} required data-testid="input-valor-realizado" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Forma de Pagamento *</Label>
                <select value={finalizarForm.forma_pagamento} onChange={e => setFinalizarForm(p => ({ ...p, forma_pagamento: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm bg-white" data-testid="select-forma-pagamento-final">
                  {PAGAMENTO_OPTS.map(o => <option key={o} value={o}>{PAGAMENTO_LABELS[o]}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Usuário Responsável *</Label>
                <select value={finalizarForm.usuario_id} onChange={e => setFinalizarForm(p => ({ ...p, usuario_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm bg-white" required data-testid="select-usuario-final">
                  <option value="">Selecione...</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFinalizarModal(null)}>Cancelar</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={saving} data-testid="btn-confirm-finalizar">
                {saving ? 'Finalizando...' : 'Finalizar Aluguel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading text-red-600">Excluir Aluguel</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Tem certeza que deseja excluir o aluguel <strong>#{deleteModal?.id}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete} data-testid="btn-confirm-delete-aluguel">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
