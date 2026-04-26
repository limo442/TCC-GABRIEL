import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, CheckCircle, XCircle, Filter } from 'lucide-react';
import { veiculosAPI } from '../services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const EMPTY_FORM = {
  marca: '', modelo: '', categoria: '', ano_fabricacao: '', placa: '', valor_diaria: '', disponivel: true,
};

function Badge({ disponivel }) {
  return disponivel
    ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={11} />Disponível</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={11} />Indisponível</span>;
}

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroDisp, setFiltroDisp] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

   const load = useCallback(async () => {
     setLoading(true);
     try {
       const params = {};
       if (filtroDisp !== '') params.disponivel = filtroDisp;
       const res = await veiculosAPI.list(params);
       setVeiculos(res.items);
     } catch (error) {
       toast.error('Erro ao carregar veículos');
     }
     finally {
       setLoading(false);
     }
   }, [filtroDisp]);

   useEffect(() => {
     load();
   }, [load]);

   const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModalOpen(true); };
   const openEdit = (v) => {
     setForm({ marca: v.marca, modelo: v.modelo, categoria: v.categoria, ano_fabricacao: v.ano_fabricacao, placa: v.placa, valor_diaria: v.valor_diaria, disponivel: v.disponivel });
     setEditId(v.id); setModalOpen(true);
   };

   const handleSave = async (e) => {
     e.preventDefault(); setSaving(true);
     try {
       const payload = { ...form, valor_diaria: parseFloat(form.valor_diaria) };
       if (editId) { await veiculosAPI.update(editId, payload); toast.success('Veículo atualizado!'); }
       else { await veiculosAPI.create(payload); toast.success('Veículo cadastrado!'); }
       setModalOpen(false); load();
     } catch (err) { toast.error(err.response?.data?.message || 'Erro ao salvar'); }
     finally { setSaving(false); }
   };

   const handleDelete = async () => {
     try {
       await veiculosAPI.delete(deleteModal.id);
       toast.success('Veículo excluído!');
       setDeleteModal(null); load();
     } catch (err) { toast.error('Erro ao excluir'); }
   };

   const filteredVeiculos = veiculos.filter(v =>
     v.marca.toLowerCase().includes(search.toLowerCase()) ||
     v.modelo.toLowerCase().includes(search.toLowerCase()) ||
     v.placa.toLowerCase().includes(search.toLowerCase())
   );

   return (
     <div className="space-y-6">
       <div className="flex justify-end">
         <Button onClick={openCreate} className="bg-[#0047FF] hover:bg-[#003BE0] text-white h-9 gap-2" data-testid="btn-novo-veiculo">
           <Plus size={16} /> Novo Veículo
         </Button>
       </div>

       <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="veiculos-table">
         {loading ? (
           <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded" />)}</div>
         ) : (
           <>
             {/* Filters */}
             <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 border-b border-slate-200">
               <div className="flex gap-2 flex-1 flex-wrap">
                 <div className="relative flex-1 min-w-[200px]">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input
                     type="text"
                     placeholder="Buscar por marca, modelo ou placa..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="pl-9 h-9 w-full rounded-md border border-slate-300 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                     data-testid="search-veiculos"
                   />
                 </div>
                 <select
                   value={filtroDisp}
                   onChange={(e) => setFiltroDisp(e.target.value)}
                   className="h-9 px-3 rounded-md border border-slate-300 text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                   data-testid="filter-disponivel"
                 >
                   <option value="">Todos</option>
                   <option value="true">Disponíveis</option>
                   <option value="false">Indisponíveis</option>
                 </select>
               </div>
             </div>

             {/* Table */}
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200">
                     {['Marca', 'Modelo', 'Placa', 'Ano', 'Valor', 'Status', 'Ações'].map(h => (
                       <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {filteredVeiculos.map(v => (
                     <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150">
                       <td className="px-4 py-3 text-sm text-slate-700 font-medium">{v.marca}</td>
                       <td className="px-4 py-3 text-sm text-slate-600">{v.modelo}</td>
                       <td className="px-4 py-3 text-sm text-slate-600">{v.placa}</td>
                       <td className="px-4 py-3 text-sm text-slate-600">{v.ano_fabricacao}</td>
                       <td className="px-4 py-3 text-sm text-slate-900 font-medium">R$ {parseFloat(v.valor_diaria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                       <td className="px-4 py-3"><Badge disponivel={v.disponivel} /></td>
                       <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                           <button onClick={() => openEdit(v)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                             <Pencil size={16} />
                           </button>
                           <button onClick={() => setDeleteModal(v)} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Excluir">
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {filteredVeiculos.length === 0 && (
                 <div className="py-16 text-center text-slate-400 text-sm">
                   {veiculos.length === 0 ? 'Nenhum veículo cadastrado ainda' : 'Nenhum veículo encontrado com os filtros aplicados'}
                 </div>
               )}
             </div>
           </>
         )}
       </div>

       {/* Create/Edit Modal */}
       <Dialog open={modalOpen} onOpenChange={setModalOpen}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{editId ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSave}>
             <div className="grid gap-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="marca">Marca</Label>
                   <Input id="marca" value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} required />
                 </div>
                 <div>
                   <Label htmlFor="modelo">Modelo</Label>
                   <Input id="modelo" value={form.modelo} onChange={(e) => setForm({...form, modelo: e.target.value})} required />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="categoria">Categoria</Label>
                   <Input id="categoria" value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})} />
                 </div>
                 <div>
                   <Label htmlFor="ano_fabricacao">Ano</Label>
                   <Input id="ano_fabricacao" type="number" value={form.ano_fabricacao} onChange={(e) => setForm({...form, ano_fabricacao: e.target.value})} required />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="placa">Placa</Label>
                   <Input id="placa" value={form.placa} onChange={(e) => setForm({...form, placa: e.target.value})} required />
                 </div>
                 <div>
                   <Label htmlFor="valor_diaria">Valor Diário</Label>
                   <Input id="valor_diaria" type="number" step="0.01" value={form.valor_diaria} onChange={(e) => setForm({...form, valor_diaria: e.target.value})} required />
                 </div>
               </div>
               <div className="flex items-center space-x-2">
                 <input type="checkbox" id="disponivel" checked={form.disponivel} onChange={(e) => setForm({...form, disponivel: e.target.checked})} />
                 <Label htmlFor="disponivel">Disponível</Label>
               </div>
             </div>
             <DialogFooter>
               <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
               <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>

       {/* Delete Modal */}
       <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>Excluir Veículo</DialogTitle>
           </DialogHeader>
           <div className="py-4">
             <p className="text-sm text-slate-600">
               Tem certeza que deseja excluir o veículo <strong>{deleteModal?.marca} {deleteModal?.modelo}</strong>?
             </p>
             <p className="text-sm text-slate-500 mt-2">Esta ação não pode ser desfeita.</p>
           </div>
           <DialogFooter>
             <Button type="button" variant="secondary" onClick={() => setDeleteModal(null)}>Cancelar</Button>
             <Button type="button" variant="destructive" onClick={handleDelete}>Excluir</Button>
             </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
}