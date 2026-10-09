const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const storageKey = 'my-day-data-v1';
const today = new Date();
const iso = today.toISOString().slice(0, 10);
const defaults = {
  tasks: [{ id: 1, title: 'Rencanakan tiga prioritas hari ini', date: iso, done: false, priority: 'Penting' }, { id: 2, title: 'Minum air yang cukup', date: iso, done: true, priority: 'Personal' }],
  habits: [{ id: 1, name: 'Minum 8 gelas air', icon: '💧', done: false }, { id: 2, name: 'Olahraga 20 menit', icon: '🏃', done: false }, { id: 3, name: 'Baca 10 halaman', icon: '📚', done: false }],
  journals: [], transactions: [], budget: 0, dark: false
};
let data = JSON.parse(localStorage.getItem(storageKey) || 'null') || defaults;
let activeFilter = 'all'; let mood = '🙂';
const money = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const save = () => localStorage.setItem(storageKey, JSON.stringify(data));
const esc = (text) => String(text).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;' }[c]));
const uid = () => Date.now() + Math.floor(Math.random() * 999);

function renderTasks() {
  let tasks = data.tasks;
  if (activeFilter === 'today') tasks = tasks.filter(t => t.date === iso && !t.done);
  if (activeFilter === 'done') tasks = tasks.filter(t => t.done);
  $('#task-list').innerHTML = tasks.length ? tasks.map(t => `<article class="task-item ${t.done ? 'done' : ''}"><input aria-label="Selesaikan tugas" class="check" type="checkbox" data-task="${t.id}" ${t.done ? 'checked' : ''}><div class="task-main"><strong>${esc(t.title)}</strong><span>${t.date === iso ? 'Hari ini' : new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span></div><span class="priority">${esc(t.priority)}</span><button class="delete" data-delete-task="${t.id}" aria-label="Hapus tugas">×</button></article>`).join('') : '<p class="empty">Belum ada tugas di sini.</p>';
  const top = data.tasks.filter(t => !t.done).slice(0, 3);
  $('#dashboard-tasks').innerHTML = top.length ? top.map(t => `<div class="mini-task"><input class="mini-check" type="checkbox" data-task="${t.id}"><span>${esc(t.title)}</span></div>`).join('') : '<p class="empty">Semua tugas sudah selesai. Hebat!</p>';
  $('#stat-tasks').textContent = data.tasks.filter(t => t.done).length;
}
function renderHabits() {
  const complete = data.habits.filter(h => h.done).length; const total = data.habits.length; const pct = total ? Math.round(complete / total * 100) : 0;
  $('#habit-list').innerHTML = total ? data.habits.map(h => `<article class="habit-card ${h.done ? 'complete' : ''}" data-habit="${h.id}"><div class="habit-top"><span class="habit-emoji">${h.icon}</span><span class="habit-tick">${h.done ? '✓' : ''}</span></div><h3>${esc(h.name)}</h3><p>${h.done ? 'Sudah dilakukan hari ini' : 'Tap untuk menandai selesai'}</p></article>`).join('') : '<p class="empty">Buat kebiasaan pertamamu.</p>';
  $('#progress-ring').style.setProperty('--progress', `${pct}%`); $('#habit-percent').textContent = `${pct}%`;
  $('#stat-habits').textContent = `${pct}%`; $('#habit-message').textContent = pct === 100 ? 'Semua habit selesai. Luar biasa!' : pct ? 'Kamu sedang membangun ritme yang baik.' : 'Mulai dari satu langkah kecil.';
  $('#habit-detail').textContent = `${complete} dari ${total} kebiasaan selesai hari ini.`;
}
function renderJournal() {
  $('#journal-list').innerHTML = data.journals.length ? data.journals.slice(0, 8).map(j => `<article class="journal-entry"><header><strong>${j.mood} ${esc(j.title)}</strong><time>${new Date(j.date).toLocaleDateString('id-ID',{day:'numeric',month:'long'})}</time></header><p>${esc(j.text)}</p></article>`).join('') : '<p class="empty">Belum ada entri. Mari tulis sedikit tentang harimu.</p>';
}
function renderFinance() {
  const income = data.transactions.filter(t => t.type === 'income').reduce((a,t)=>a+t.amount,0), expense = data.transactions.filter(t=>t.type === 'expense').reduce((a,t)=>a+t.amount,0), balance = income-expense;
  $('#finance-balance').textContent = money(balance); $('#stat-balance').textContent = money(balance); $('#income-label').textContent = `↑ Pemasukan ${money(income)}`; $('#expense-label').textContent = `↓ Pengeluaran ${money(expense)}`;
  $('#budget-number').textContent = `${money(expense)} / ${money(data.budget)}`; const percent = data.budget ? Math.min(100, expense / data.budget * 100) : 0; $('#budget-progress').style.width = `${percent}%`; $('#budget-caption').textContent = data.budget ? `${Math.round(percent)}% anggaran telah digunakan.` : 'Tetapkan anggaran untuk bulan ini.';
  $('#transaction-list').innerHTML = data.transactions.length ? data.transactions.slice(0,10).map(t=>`<div class="transaction"><span class="transaction-icon">${t.type === 'income' ? '↙' : '↗'}</span><div class="transaction-main"><strong>${esc(t.name)}</strong><span>${new Date(t.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span></div><span class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</span><button class="delete" data-delete-transaction="${t.id}" aria-label="Hapus transaksi">×</button></div>`).join('') : '<p class="empty">Belum ada transaksi bulan ini.</p>';
}
function renderAll(){renderTasks();renderHabits();renderJournal();renderFinance();save()}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)}
function showModal(title, fields, onSubmit, submit = 'Simpan') { $('#modal-content').innerHTML = `<h2 class="modal-title">${title}</h2><div class="modal-fields">${fields}</div><div class="modal-actions"><button value="cancel" class="secondary-button">Batal</button><button value="default" class="primary-button">${submit}</button></div>`; const modal=$('#modal'); modal.showModal(); $('#modal-form').onsubmit = (e) => {e.preventDefault(); onSubmit(new FormData(e.currentTarget)); modal.close();}; }

function switchView(view){$$('.view').forEach(v=>v.classList.toggle('active-view',v.id===view));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); const names={dashboard:'Selamat pagi, kamu!',todo:'Rencana hari ini',habits:'Kebiasaan baikmu',journal:'Catatan untuk diri sendiri',finance:'Kondisi keuanganmu'};$('#page-title').textContent=names[view];$('.sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));$$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
$('.menu-toggle').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
$('#theme-toggle').addEventListener('click',()=>{data.dark=!data.dark;document.body.classList.toggle('dark',data.dark);$('#theme-toggle').textContent=data.dark?'☀':'☾';save()});
$('#task-filters').addEventListener('click',e=>{if(!e.target.dataset.filter)return;activeFilter=e.target.dataset.filter;$$('.chip').forEach(b=>b.classList.toggle('active',b===e.target));renderTasks()});
document.addEventListener('change',e=>{if(e.target.dataset.task){const t=data.tasks.find(t=>t.id==e.target.dataset.task);t.done=e.target.checked;renderTasks();save();}});
document.addEventListener('click',e=>{const id=e.target.dataset.deleteTask;if(id){data.tasks=data.tasks.filter(t=>t.id!=id);renderTasks();save();toast('Tugas dihapus.')}const tr=e.target.dataset.deleteTransaction;if(tr){data.transactions=data.transactions.filter(t=>t.id!=tr);renderFinance();save();toast('Transaksi dihapus.')}const card=e.target.closest('[data-habit]');if(card){const h=data.habits.find(h=>h.id==card.dataset.habit);h.done=!h.done;renderHabits();save();}});
$('#add-task').addEventListener('click',()=>showModal('Tambah tugas',`<div class="modal-field"><label>Nama tugas</label><input required name="title" placeholder="Contoh: Kirim laporan" autofocus></div><div class="modal-field"><label>Tanggal</label><input required name="date" type="date" value="${iso}"></div><div class="modal-field"><label>Kategori</label><select name="priority"><option>Penting</option><option>Personal</option><option>Kerja</option></select></div>`,f=>{data.tasks.unshift({id:uid(),title:f.get('title'),date:f.get('date'),priority:f.get('priority'),done:false});renderTasks();save();toast('Tugas baru ditambahkan.')}));
$('#add-habit').addEventListener('click',()=>showModal('Buat habit',`<div class="modal-field"><label>Nama kebiasaan</label><input required name="name" placeholder="Contoh: Meditasi 5 menit" autofocus></div><div class="modal-field"><label>Ikon emoji</label><input name="icon" value="✨" maxlength="4"></div>`,f=>{data.habits.push({id:uid(),name:f.get('name'),icon:f.get('icon')||'✨',done:false});renderHabits();save();toast('Habit baru dibuat.')}));
$('#save-journal').addEventListener('click',()=>{const title=$('#journal-title').value.trim(),text=$('#journal-text').value.trim();if(!title||!text){toast('Isi judul dan ceritamu terlebih dahulu.');return}data.journals.unshift({id:uid(),title,text,mood,date:new Date().toISOString()});$('#journal-title').value='';$('#journal-text').value='';renderJournal();save();toast('Entri jurnal tersimpan.');});
$('#new-entry').addEventListener('click',()=>{switchView('journal');$('#journal-title').focus()});
$('#mood-picker').addEventListener('click',e=>{if(!e.target.dataset.mood)return;mood=e.target.dataset.mood;$$('#mood-picker button').forEach(b=>b.classList.toggle('selected',b===e.target))});
$('#add-transaction').addEventListener('click',()=>showModal('Catat transaksi',`<div class="modal-field"><label>Nama transaksi</label><input required name="name" placeholder="Contoh: Belanja mingguan" autofocus></div><div class="modal-field"><label>Jenis</label><select name="type"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></div><div class="modal-field"><label>Nominal (Rp)</label><input required name="amount" type="number" min="1" placeholder="50000"></div><div class="modal-field"><label>Tanggal</label><input required name="date" type="date" value="${iso}"></div>`,f=>{data.transactions.unshift({id:uid(),name:f.get('name'),type:f.get('type'),amount:Number(f.get('amount')),date:f.get('date')});renderFinance();save();toast('Transaksi tersimpan.')}));
$('#set-budget').addEventListener('click',()=>showModal('Atur anggaran',`<div class="modal-field"><label>Batas pengeluaran bulan ini (Rp)</label><input required name="budget" type="number" min="0" value="${data.budget}" autofocus></div>`,f=>{data.budget=Number(f.get('budget'));renderFinance();save();toast('Anggaran diperbarui.')}));
$('#today-label').textContent = today.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
document.body.classList.toggle('dark',data.dark); if(data.dark) $('#theme-toggle').textContent='☀'; renderAll();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
