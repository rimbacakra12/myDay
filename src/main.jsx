import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {createClient} from "@supabase/supabase-js";
import {Check, Circle, Wallet, BookOpen, Target, ListTodo, Plus, Trash2, LogIn, LogOut, Menu, X, TrendingUp, TrendingDown, CalendarDays} from "lucide-react";
import "./styles.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const today = () => new Date().toISOString().slice(0,10);
const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

const seed = {
  todos:[
    {id:1,title:"Review pekerjaan utama",done:false,priority:"Tinggi"},
    {id:2,title:"30 menit belajar",done:false,priority:"Sedang"},
  ],
  habits:[
    {id:1,name:"Olahraga",streak:4,done:false},
    {id:2,name:"Journaling",streak:7,done:true},
    {id:3,name:"Baca buku",streak:3,done:false},
  ],
  journal:[],
  transactions:[
    {id:1,date:today(),type:"income",category:"Gaji",amount:5000000,note:"Gaji bulanan"},
    {id:2,date:today(),type:"expense",category:"Makan",amount:800000,note:"Budget makan"},
  ]
};

async function loadCloud(userId){
  if(!supabase) return null;
  const {data,error}=await supabase.from("myday_data").select("payload").eq("user_id",userId).maybeSingle();
  if(error) console.warn(error);
  return data?.payload || null;
}
async function saveCloud(userId,payload){
  if(!supabase) return;
  await supabase.from("myday_data").upsert({user_id:userId,payload,updated_at:new Date().toISOString()});
}

function App(){
  const [session,setSession]=useState(null);
  const [tab,setTab]=useState("dashboard");
  const [data,setData]=useState(seed);
  const [menu,setMenu]=useState(false);
  const [auth,setAuth]=useState({email:"",password:"",mode:"login"});
  const [authMsg,setAuthMsg]=useState("");

  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session) return;
    loadCloud(session.user.id).then(x=>x && setData(x));
  },[session]);

  useEffect(()=>{
    localStorage.setItem("myday-data",JSON.stringify(data));
    if(session) {
      const t=setTimeout(()=>saveCloud(session.user.id,data),500);
      return ()=>clearTimeout(t);
    }
  },[data,session]);

  useEffect(()=>{
    const local=localStorage.getItem("myday-data");
    if(local && !session) try{setData(JSON.parse(local))}catch{}
  },[]);

  const totals=useMemo(()=>{
    const income=data.transactions.filter(x=>x.type==="income").reduce((a,x)=>a+x.amount,0);
    const expense=data.transactions.filter(x=>x.type==="expense").reduce((a,x)=>a+x.amount,0);
    return {income,expense,balance:income-expense};
  },[data.transactions]);

  const update=(key,val)=>setData(d=>({...d,[key]:typeof val==="function"?val(d[key]):val}));

  async function submitAuth(e){
    e.preventDefault(); setAuthMsg("");
    if(!supabase){setAuthMsg("Cloud belum dikonfigurasi. Isi .env sesuai README.");return}
    const fn=auth.mode==="login"?supabase.auth.signInWithPassword({email:auth.email,password:auth.password}):supabase.auth.signUp({email:auth.email,password:auth.password});
    const {error}=await fn; if(error)setAuthMsg(error.message); else setAuthMsg(auth.mode==="login"?"Berhasil masuk.":"Akun dibuat, cek email jika verifikasi aktif.");
  }

  if(!session && supabase) return <Auth auth={auth} setAuth={setAuth} submitAuth={submitAuth} msg={authMsg}/>;

  const nav=[
    ["dashboard","Dashboard",Target],["todos","To-do List",ListTodo],["habits","Habit Tracker",Check],
    ["journal","Journal",BookOpen],["finance","Finansial",Wallet]
  ];
  return <div className="app">
    <aside className={menu?"open":""}>
      <div className="brand"><div className="brandmark">M</div><div><b>My Day</b><small>Personal Planner</small></div></div>
      <button className="close" onClick={()=>setMenu(false)}><X size={20}/></button>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={tab===id?"active":""} onClick={()=>{setTab(id);setMenu(false)}}><Icon size={19}/>{label}</button>)}</nav>
      <div className="sidebottom">
        <span>{session?.user?.email || "Local mode"}</span>
        {session && <button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Keluar</button>}
      </div>
    </aside>
    <main>
      <header><button className="hamb" onClick={()=>setMenu(true)}><Menu/></button><div><h1>{nav.find(x=>x[0]===tab)?.[1]}</h1><p>{new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long"})}</p></div></header>
      {tab==="dashboard"&&<Dashboard data={data} totals={totals} setTab={setTab}/>}
      {tab==="todos"&&<Todos data={data} update={update}/>}
      {tab==="habits"&&<Habits data={data} update={update}/>}
      {tab==="journal"&&<Journal data={data} update={update}/>}
      {tab==="finance"&&<Finance data={data} update={update} totals={totals}/>}
    </main>
  </div>
}

function Auth({auth,setAuth,submitAuth,msg}){
 return <div className="auth"><div className="authbox"><div className="brand center"><div className="brandmark">M</div><div><b>My Day</b><small>Personal Planner</small></div></div><h2>{auth.mode==="login"?"Selamat datang kembali":"Buat akun"}</h2><p className="muted">Sinkronkan planner kamu di PC dan Android.</p><form onSubmit={submitAuth}><input required type="email" placeholder="Email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/><input required minLength="6" type="password" placeholder="Password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/><button className="primary">{auth.mode==="login"?"Masuk":"Daftar"}</button></form>{msg&&<p className="error">{msg}</p>}<button className="link" onClick={()=>setAuth({...auth,mode:auth.mode==="login"?"signup":"login"})}>{auth.mode==="login"?"Belum punya akun? Daftar":"Sudah punya akun? Masuk"}</button></div></div>
}

function Dashboard({data,totals,setTab}){
 const done=data.todos.filter(x=>x.done).length;
 return <section>
  <div className="hero"><div><span className="eyebrow">Hari ini</span><h2>Pelan-pelan, yang penting jalan.</h2><p>Semua rencana, kebiasaan, jurnal, dan uangmu dalam satu tempat.</p></div><button className="primary" onClick={()=>setTab("todos")}><Plus size={17}/> Tambah tugas</button></div>
  <div className="grid cards">
   <Card title="To-do selesai" value={`${done}/${data.todos.length}`} icon={<ListTodo/>}/>
   <Card title="Habit hari ini" value={`${data.habits.filter(x=>x.done).length}/${data.habits.length}`} icon={<Check/>}/>
   <Card title="Saldo" value={money(totals.balance)} icon={<Wallet/>}/>
   <Card title="Jurnal" value={`${data.journal.length} entri`} icon={<BookOpen/>}/>
  </div>
  <div className="grid two">
   <div className="panel"><h3>Tugas hari ini</h3>{data.todos.slice(0,5).map(t=><div className="row" key={t.id}><span className={t.done?"strike":""}>{t.title}</span><button className="iconbtn" onClick={()=>{}}>{t.done?<Check/>:<Circle/>}</button></div>)}</div>
   <div className="panel"><h3>Ringkasan finansial</h3><div className="finance-big">{money(totals.balance)}</div><div className="mini"><span><TrendingUp/> {money(totals.income)}</span><span><TrendingDown/> {money(totals.expense)}</span></div></div>
  </div>
 </section>
}
function Card({title,value,icon}){return <div className="card"><div className="cardicon">{icon}</div><span>{title}</span><strong>{value}</strong></div>}

function Todos({data,update}){
 const [title,setTitle]=useState("");
 const add=()=>{if(!title.trim())return;update("todos",a=>[...a,{id:Date.now(),title,done:false,priority:"Sedang"}]);setTitle("")};
 return <section><div className="addbar"><input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Apa yang ingin kamu kerjakan?"/><button className="primary" onClick={add}><Plus/> Tambah</button></div><div className="panel list">{data.todos.map(t=><div className="todo" key={t.id}><button className="check" onClick={()=>update("todos",a=>a.map(x=>x.id===t.id?{...x,done:!x.done}:x))}>{t.done?<Check/>:<Circle/>}</button><div className={t.done?"strike":""}><b>{t.title}</b><small>{t.priority}</small></div><button className="iconbtn danger" onClick={()=>update("todos",a=>a.filter(x=>x.id!==t.id))}><Trash2/></button></div>)}</div></section>
}
function Habits({data,update}){
 return <section><div className="grid cards">{data.habits.map(h=><div className="habit card" key={h.id}><button className={"habitcheck "+(h.done?"done":"")} onClick={()=>update("habits",a=>a.map(x=>x.id===h.id?{...x,done:!x.done}:x))}>{h.done?<Check/>:<Circle/>}</button><b>{h.name}</b><span>🔥 {h.streak} hari streak</span></div>)}</div><button className="secondary" onClick={()=>update("habits",a=>[...a,{id:Date.now(),name:"Habit baru",streak:0,done:false}])}><Plus/> Tambah habit</button></section>
}
function Journal({data,update}){
 const [text,setText]=useState(""); const [mood,setMood]=useState("🙂");
 const save=()=>{if(!text.trim())return;update("journal",a=>[{id:Date.now(),date:today(),mood,text},...a]);setText("")};
 return <section><div className="panel journalbox"><div className="moods">{["😄","🙂","😐","😔","😤"].map(x=><button className={mood===x?"sel":""} onClick={()=>setMood(x)}>{x}</button>)}</div><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Tulis apa yang sedang kamu pikirkan..."/><button className="primary" onClick={save}><BookOpen/> Simpan jurnal</button></div><div className="journal-list">{data.journal.map(j=><article className="panel" key={j.id}><div><b>{j.mood} {new Date(j.date).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}</b><button className="iconbtn danger" onClick={()=>update("journal",a=>a.filter(x=>x.id!==j.id))}><Trash2/></button></div><p>{j.text}</p></article>)}</div></section>
}
function Finance({data,update,totals}){
 const [form,setForm]=useState({type:"expense",category:"Makan",amount:"",note:""});
 const add=()=>{if(!form.amount)return;update("transactions",a=>[{id:Date.now(),date:today(),...form,amount:Number(form.amount)},...a]);setForm({...form,amount:"",note:""})};
 return <section><div className="grid cards"><Card title="Pemasukan" value={money(totals.income)} icon={<TrendingUp/>}/><Card title="Pengeluaran" value={money(totals.expense)} icon={<TrendingDown/>}/><Card title="Saldo" value={money(totals.balance)} icon={<Wallet/>}/></div><div className="panel"><h3>Tambah transaksi</h3><div className="formgrid"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select><input placeholder="Kategori" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/><input type="number" placeholder="Nominal" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/><input placeholder="Catatan" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/><button className="primary" onClick={add}><Plus/> Simpan</button></div></div><div className="panel"><h3>Transaksi</h3>{data.transactions.map(x=><div className="row" key={x.id}><span><b>{x.category}</b><small>{x.date} · {x.note}</small></span><strong className={x.type==="income"?"income":"expense"}>{x.type==="income"?"+":"-"}{money(x.amount)}</strong><button className="iconbtn danger" onClick={()=>update("transactions",a=>a.filter(t=>t.id!==x.id))}><Trash2/></button></div>)}</div></section>
}

createRoot(document.getElementById("root")).render(<App/>);
