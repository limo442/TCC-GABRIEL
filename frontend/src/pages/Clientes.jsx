import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { clientesAPI } from '../services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const EMPTY = { cod: '', nome: '', endereco: '', telefone: '', data_nascimento: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

   const load = useCallback(async () => {
     setLoading(true);
     try { const r = await clientesAPI.list(); setClientes(r.items); }
     catch { toast.error('Erro ao carregar clientes'); }
     finally { setLoading(false); }
   }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModalOpen(true); };
  const openEdit = (c) => {
    setForm({ cod: c.cod, nome: c.nome, endereco: c.endereco || '', telefone: c.telefone || '', data_nascimento: c.data_nascimento ? c.data_nascimento.substring(0, 10) : '' });
    setEditId(c.id); setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, endereco: form.endereco || null, telefone: form.telefone || null, data_nascimento: form.data_nascimento || null };
      if (editId) { await clientesAPI.update(editId, payload); toast.success('Cliente atualizado!'); }
      else { await clientesAPI.create(payload); toast.success('Cliente cadastrado!'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await clientesAPI.delete(deleteModal.id); toast.success('Cliente excluído!'); setDeleteModal(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erro ao excluir'); }
  };

  const filtered = clientes.filter(c => `${c.cod} ${c.nome} ${c.telefone || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar por código ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="search-clientes" />
        </div>
        <Button onClick={openCreate} className="bg-[#0047FF] hover:bg-[#003BE0] text-white h-9 gap-2" data-testid="btn-novo-cliente">
          <Plus size={16} /> Novo Cliente
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="clientes-table">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['ID', 'Código', 'Nome', 'Telefone', 'Nascimento', 'Endereço', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">Nenhum cliente encontrado</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`cliente-row-${c.id}`}>
                    <td className="px-4 py-3 text-sm text-slate-500">#{c.id}</td>
                    <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{c.cod}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{c.nome}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.telefone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.data_nascimento ? new Date(c.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{c.endereco || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" data-testid={`edit-cliente-${c.id}`}><Pencil size={15} /></button>
                        <button onClick={() => setDeleteModal(c)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" data-testid={`delete-cliente-${c.id}`}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">{filtered.length} de {clientes.length} cliente(s)</div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" data-testid="modal-cliente">
          <DialogHeader><DialogTitle className="font-heading">{editId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Código *</Label>
                <Input value={form.cod} onChange={e => setForm(p => ({ ...p, cod: e.target.value }))} placeholder="CLI001" required data-testid="input-cod" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Nome *</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="João Silva" required data-testid="input-nome" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="11987654321" data-testid="input-telefone" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Data de Nascimento</Label>
                <Input type="date" value={form.data_nascimento} onChange={e => setForm(p => ({ ...p, data_nascimento: e.target.value }))} data-testid="input-data-nascimento" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Endereço</Label>
              <Input value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua das Flores, 123, São Paulo - SP" data-testid="input-endereco" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#0047FF] hover:bg-[#003BE0] text-white" disabled={saving} data-testid="btn-salvar-cliente">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading text-red-600">Excluir Cliente</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Tem certeza que deseja excluir o cliente <strong>{deleteModal?.nome}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete} data-testid="btn-confirm-delete-cliente">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
