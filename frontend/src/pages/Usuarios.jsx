import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';
import { usuariosAPI } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const EMPTY = { username: '', password: '', role: 'operador' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await usuariosAPI.list({ pageSize: 100 });
      setUsuarios(r.items);
    } catch (_) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };
  const openEdit = user => {
    setEditing(user);
    setForm({ username: user.username, password: '', role: user.role });
    setModalOpen(true);
  };

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const data = { username: form.username, role: form.role };
        if (form.password) data.password = form.password;
        await usuariosAPI.update(editing.id, data);
      } else {
        await usuariosAPI.create(form);
      }
      toast.success(editing ? 'Usuário atualizado!' : 'Usuário cadastrado!');
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await usuariosAPI.delete(deleting.id);
      toast.success('Usuário excluído');
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao excluir usuário');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-[#0047FF] hover:bg-[#003BE0] text-white h-9 gap-2" data-testid="btn-novo-usuario">
          <Plus size={16} /> Novo Usuário
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="usuarios-table">
        {loading ? <div className="p-6">Carregando usuários...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                {['ID', 'Usuário', 'Permissão', 'Criado em', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {usuarios.length === 0 ? <tr><td colSpan={5} className="p-8 text-center">Nenhum usuário cadastrado</td></tr>
                  : usuarios.map(u => (
                  <tr key={u.id} className="border-b border-slate-100" data-testid={`usuario-row-${u.id}`}>
                    <td className="px-4 py-3 text-sm">#{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className="inline-flex items-center gap-2"><UserCheck size={16} />{u.username}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.role === 'admin' ? 'Administrador' : 'Operador'}</td>
                    <td className="px-4 py-3 text-sm">{new Date(u.created_at).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(u)}
                          data-testid={`edit-usuario-${u.id}`}><Pencil size={14} /> Editar</Button>
                        <Button type="button" size="sm" variant="outline"
                          onClick={() => setDeleting(u)} disabled={u.id === currentUser.id}
                          data-testid={`delete-usuario-${u.id}`}><Trash2 size={14} /> Excluir</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 text-xs text-slate-500">{usuarios.length} usuário(s) exibido(s)</div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Nome de usuário *</Label>
              <Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                minLength={3} maxLength={50} required data-testid="input-username" />
            </div>
            <div>
              <Label className="mb-1.5 block">Senha {editing ? '(deixe em branco para manter)' : '*'}</Label>
              <Input type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                minLength={8} required={!editing} data-testid="input-password" />
            </div>
            <div>
              <Label className="mb-1.5 block">Perfil</Label>
              <select className="w-full h-10 rounded border border-slate-300 px-2"
                value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                data-testid="select-role">
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} data-testid="btn-salvar-usuario">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir usuário?</DialogTitle></DialogHeader>
          <p className="text-sm">Deseja excluir {deleting?.username}? Usuários com locações vinculadas não podem ser excluídos.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button onClick={handleDelete} disabled={saving} data-testid="confirm-delete-usuario">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
