import React, { useEffect, useState, useCallback } from 'react';
import { Plus, UserCheck } from 'lucide-react';
import { usuariosAPI } from '../services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);

   const load = useCallback(async () => {
     setLoading(true);
     try { const r = await usuariosAPI.list(); setUsuarios(r.items); }
     catch { toast.error('Erro ao carregar usuários'); }
     finally { setLoading(false); }
   }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await usuariosAPI.create(form);
      toast.success('Usuário cadastrado!');
      setModalOpen(false); setForm({ username: '', password: '' }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)} className="bg-[#0047FF] hover:bg-[#003BE0] text-white h-9 gap-2" data-testid="btn-novo-usuario">
          <Plus size={16} /> Novo Usuário
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="usuarios-table">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['ID', 'Username', 'Criado em'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={3} className="py-16 text-center text-slate-400 text-sm">Nenhum usuário encontrado</td></tr>
                ) : usuarios.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors" data-testid={`usuario-row-${u.id}`}>
                    <td className="px-4 py-3 text-sm text-slate-500">#{u.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0047FF] rounded-full flex items-center justify-center">
                          <UserCheck size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(u.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">{usuarios.length} usuário(s) cadastrado(s)</div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm" data-testid="modal-usuario">
          <DialogHeader><DialogTitle className="font-heading">Novo Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Username *</Label>
              <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="operador1" minLength={3} required data-testid="input-username" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Senha *</Label>
              <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 caracteres" minLength={6} required data-testid="input-password" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#0047FF] hover:bg-[#003BE0] text-white" disabled={saving} data-testid="btn-salvar-usuario">
                {saving ? 'Salvando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
