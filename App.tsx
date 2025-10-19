
import React, { useEffect, useMemo, useState } from "react";

type Txn = {
  id: string;
  date: string; // ISO date
  type: "income" | "expense";
  category: string;
  amount: number;
  note?: string;
};

type HealthEntry = {
  id: string;
  date: string;
  weightKg?: number;
  sleepHrs?: number;
  steps?: number;
  mood?: "😀" | "🙂" | "😐" | "😕" | "😞";
};

type Meal = {
  id: string;
  date: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  calories?: number;
};

type Task = {
  id: string;
  title: string;
  due?: string; // ISO
  done: boolean;
  recur?: "none" | "daily" | "weekly";
  area?: "Finance" | "Health" | "Diet" | "Life" | "Career";
};

type Note = { id: string; text: string; pinned?: boolean; created: string };

type ReadingItem = {
  id: string;
  title: string;
  status: "finished" | "current" | "upcoming";
};

type Store = {
  txns: Txn[];
  health: HealthEntry[];
  meals: Meal[];
  tasks: Task[];
  notes: Note[];
  emergencyFundTarget: number;
  emergencyFundName: string;
  nightShiftMode: boolean;
  weeklyHabits: {
    weekStart: string; // ISO Monday
    gym: boolean[]; // 7 slots
    swim: boolean[]; // 7 slots
    water: number[]; // glasses per day
    callFamily: boolean[]; // daily checkmark
  };
  reading: ReadingItem[];
};

const KEY = "lifehub.v2.javeed";

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

const fmtGBP = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

function useStore(): [Store, (s: Store) => void] {
  const blank: Store = {
    txns: [],
    health: [],
    meals: [],
    tasks: [
      { id: crypto.randomUUID(), title: "Daily WhatsApp call – Mum & Sis", done: false, recur: "daily", area: "Life" },
      { id: crypto.randomUUID(), title: "Swim (2x / week)", done: false, recur: "weekly", area: "Health" },
      { id: crypto.randomUUID(), title: "Gym (2x / week)", done: false, recur: "weekly", area: "Health" },
      { id: crypto.randomUUID(), title: "Update GitHub portfolio/screenshots", done: false, recur: "weekly", area: "Career" },
      { id: crypto.randomUUID(), title: "CompTIA A+: 2 hrs study", done: false, recur: "daily", area: "Career" },
    ],
    notes: [
      { id: crypto.randomUUID(), text: "Dream: IT Engineer / SysAdmin. ILR by Nov 2026. Healthy • Wealthy • Happy.", pinned: true, created: new Date().toISOString() },
    ],
    emergencyFundTarget: 2000,
    emergencyFundName: "Emergency Fund",
    nightShiftMode: true,
    weeklyHabits: {
      weekStart: startOfWeek(new Date()).toISOString().slice(0, 10),
      gym: Array(7).fill(false),
      swim: Array(7).fill(false),
      water: Array(7).fill(0),
      callFamily: Array(7).fill(false),
    },
    reading: [
      { id: crypto.randomUUID(), title: "Clear Thinking", status: "finished" },
      { id: crypto.randomUUID(), title: "The Psychology of Money", status: "finished" },
      { id: crypto.randomUUID(), title: "Atomic Habits", status: "current" },
      { id: crypto.randomUUID(), title: "Deep Work", status: "upcoming" },
    ],
  };

  const [store, setStore] = useState<Store>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank;
      const parsed = JSON.parse(raw);
      return { ...blank, ...parsed } as Store;
    } catch {
      return blank;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(store));
  }, [store]);

  // Reset weekly habits when a new week starts
  useEffect(() => {
    const nowMonday = startOfWeek(new Date()).toISOString().slice(0, 10);
    if (store.weeklyHabits.weekStart !== nowMonday) {
      setStore({
        ...store,
        weeklyHabits: {
          weekStart: nowMonday,
          gym: Array(7).fill(false),
          swim: Array(7).fill(false),
          water: Array(7).fill(0),
          callFamily: Array(7).fill(false),
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  return [store, setStore];
}

const Section: React.FC<{ title: string; right?: React.ReactNode; className?: string }>
  = ({ title, right, className, children }) => (
  <section className={`mb-6 ${className ?? ""}`}>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {right}
    </div>
    <div className="bg-white/70 dark:bg-zinc-900/60 rounded-2xl shadow p-4">
      {children}
    </div>
  </section>
);

const Chip: React.FC<{ label: string }>=({label})=> (
  <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">{label}</span>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }>=({active,onClick,label})=> (
  <button onClick={onClick} className={`px-3 py-2 rounded-xl text-sm font-medium border ${active?"bg-zinc-900 text-white border-zinc-900":"bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"}`}>{label}</button>
);

const ProgressBar: React.FC<{ value: number; max: number }>=({value,max})=>{
  const pct = Math.min(100, Math.max(0, (value/max)*100 || 0));
  return (
    <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-3 bg-emerald-500" style={{width: pct+"%"}} />
    </div>
  );
};

function download(filename: string, content: string, type="text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function App(){
  const [store, setStore] = useStore();
  const [tab, setTab] = useState<"Home"|"Finance"|"Health"|"Diet"|"Plan"|"Career"|"Reading"|"Notes">("Home");
  const [dark, setDark] = useState(true);
  const [showInstallTip, setShowInstallTip] = useState(false);

  // PWA install hint (basic)
  useEffect(()=>{
    let timeout = setTimeout(()=> setShowInstallTip(true), 2000);
    return ()=> clearTimeout(timeout);
  },[]);

  useEffect(()=>{
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.add("bg-zinc-50","dark:bg-zinc-950");
  },[dark]);

  const totals = useMemo(()=>{
    const income = store.txns.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
    const expense = store.txns.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);
    return { income, expense, net: income - expense };
  },[store.txns]);

  const emergencySaved = useMemo(()=>{
    return Math.max(0, totals.net);
  },[totals]);

  const ilrDate = new Date("2026-11-01T00:00:00");
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((ilrDate.getTime() - now.getTime())/ (1000*60*60*24)));

  const [txnDraft, setTxnDraft] = useState<Partial<Txn>>({ date: new Date().toISOString().slice(0,10), type:"expense", category: "General", amount: 0 });
  const [healthDraft, setHealthDraft] = useState<Partial<HealthEntry>>({ date: new Date().toISOString().slice(0,10) });
  const [mealDraft, setMealDraft] = useState<Partial<Meal>>({ date: new Date().toISOString().slice(0,10), mealType:"Breakfast" });
  const [taskTitle, setTaskTitle] = useState("");
  const [taskArea, setTaskArea] = useState<Task["area"]>("Life");
  const [readingDraft, setReadingDraft] = useState("");

  const addTxn = ()=>{
    if (!txnDraft.amount || !txnDraft.date || !txnDraft.type || !txnDraft.category){
      alert("Please fill amount, date, type and category"); return;
    }
    const t: Txn = { id: crypto.randomUUID(), date: txnDraft.date!, type: txnDraft.type!, category: txnDraft.category!, amount: Number(txnDraft.amount), note: txnDraft.note };
    setStore({ ...store, txns: [t, ...store.txns] });
    setTxnDraft({ date: new Date().toISOString().slice(0,10), type:"expense", category: "General", amount: 0 });
  };

  const addHealth = ()=>{
    const h: HealthEntry = { id: crypto.randomUUID(), date: healthDraft.date!, weightKg: healthDraft.weightKg?Number(healthDraft.weightKg):undefined, sleepHrs: healthDraft.sleepHrs?Number(healthDraft.sleepHrs):undefined, steps: healthDraft.steps?Number(healthDraft.steps):undefined, mood: healthDraft.mood as any };
    setStore({ ...store, health: [h, ...store.health] });
    setHealthDraft({ date: new Date().toISOString().slice(0,10) });
  };

  const addMeal = ()=>{
    if (!mealDraft.name){ alert("Add meal name"); return; }
    const m: Meal = { id: crypto.randomUUID(), date: mealDraft.date!, mealType: mealDraft.mealType as any, name: mealDraft.name!, calories: mealDraft.calories?Number(mealDraft.calories):undefined };
    setStore({ ...store, meals: [m, ...store.meals] });
    setMealDraft({ date: new Date().toISOString().slice(0,10), mealType:"Breakfast" });
  };

  const addTask = ()=>{
    if (!taskTitle.trim()) return;
    const t: Task = { id: crypto.randomUUID(), title: taskTitle.trim(), done:false, recur:"none", area: taskArea };
    setStore({ ...store, tasks: [t, ...store.tasks] });
    setTaskTitle("");
  };

  const toggleTask = (id: string)=>{
    setStore({ ...store, tasks: store.tasks.map(t=> t.id===id?{...t, done: !t.done}:t) });
  };

  const deleteTask = (id: string)=> setStore({ ...store, tasks: store.tasks.filter(t=>t.id!==id) });

  const exportJSON = ()=>{
    download(`lifehub-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(store, null, 2), "application/json");
  };

  const importJSON = async (file: File)=>{
    const text = await file.text();
    const parsed = JSON.parse(text);
    setStore(parsed);
  };

  const exportCSV = ()=>{
    const header = ["date","type","category","amount","note"];
    const rows = store.txns.map(t=> [t.date, t.type, t.category, t.amount, (t.note||"").replaceAll('"','""')]);
    const csv = [header, ...rows].map(r=> r.map(x=> typeof x === "string" ? `"${x}"` : x).join(",")).join("\\n");
    download(`lifehub-transactions-${new Date().toISOString().slice(0,10)}.csv`, csv, "text/csv");
  };

  const todayIdx = (new Date().getDay() + 6) % 7; // Monday=0

  const reading = {
    finished: store.reading.filter(r=> r.status==="finished"),
    current: store.reading.filter(r=> r.status==="current"),
    upcoming: store.reading.filter(r=> r.status==="upcoming"),
  };

  function suggestNextBooks(): string[] {
    const have = new Set(store.reading.map(r=> r.title.toLowerCase()));
    const pool = [
      "So Good They Can't Ignore You",
      "Make Time",
      "The Compound Effect",
      "UltraLearning",
      "Deep Work",
      "Digital Minimalism",
      "The Pragmatic Programmer",
      "Clean Code",
    ];
    return pool.filter(t=> !have.has(t.toLowerCase())).slice(0, 4);
  }

  return (
    <div className="min-h-dvh text-zinc-900 dark:text-zinc-100">
      {showInstallTip && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-3 py-2 rounded-xl shadow z-50">
          Tip: Open in Chrome → ⋮ → <b>Add to Home screen</b> to install LifeHub.
          <button className="ml-2 underline" onClick={()=>setShowInstallTip(false)}>Dismiss</button>
        </div>
      )}

      <header className="sticky top-0 z-10 backdrop-blur bg-white/60 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">💫</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold">LifeHub — Javeed</h1>
            <p className="text-xs opacity-70">Night‑shift HCA • Future IT Engineer • UK ILR in {Math.ceil(diffDays/30)} months ({diffDays} days)</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700" onClick={()=>setDark(!dark)}>{dark?"Light":"Dark"} mode</button>
            <button className="px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700" onClick={exportJSON}>Export</button>
            <button className="px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700" onClick={exportCSV}>Export CSV</button>
            <label className="px-3 py-2 rounded-xl text-sm border border-zinc-300 dark:border-zinc-700 cursor-pointer">
              Import
              <input type="file" accept=".json,application/json" className="hidden" onChange={(e)=>{ const f = e.target.files?.[1] ?? e.target.files?.[0]; if(f) importJSON(f); }}/>
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {["Home","Finance","Health","Diet","Plan","Career","Reading","Notes"].map((t)=> (
            <TabButton key={t} label={t} active={tab===t} onClick={()=>setTab(t as any)} />
          ))}
        </div>

        {tab==="Home" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="Snapshot" right={<Chip label={store.nightShiftMode?"Night shift mode":"Day mode"} />}>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow">
                  <div className="text-xs opacity-90 mb-1">Emergency Fund</div>
                  <div className="text-2xl font-bold">{fmtGBP(Math.min(emergencySaved, store.emergencyFundTarget))} / {fmtGBP(store.emergencyFundTarget)}</div>
                  <div className="mt-2"><ProgressBar value={emergencySaved} max={store.emergencyFundTarget} /></div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow">
                  <div className="text-xs opacity-90 mb-1">Net cash this month</div>
                  <div className="text-2xl font-bold">{fmtGBP(totals.net)}</div>
                  <div className="text-xs mt-1">Income {fmtGBP(totals.income)} • Spend {fmtGBP(totals.expense)}</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow">
                  <div className="text-xs opacity-90 mb-1">Health streaks</div>
                  <div className="text-sm">Swim ✓ {store.weeklyHabits.swim.filter(Boolean).length}/2 • Gym ✓ {store.weeklyHabits.gym.filter(Boolean).length}/2</div>
                  <div className="text-xs mt-1">Water today: {store.weeklyHabits.water[todayIdx]} glasses</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow">
                  <div className="text-xs opacity-90 mb-1">Countdown</div>
                  <div className="text-2xl font-bold">{diffDays} days</div>
                  <div className="text-xs">to ILR (Nov 2026)</div>
                </div>
              </div>
            </Section>

            <Section title="Today – Quick Actions">
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-2 rounded-xl text-sm border" onClick={()=> setStore({ ...store, weeklyHabits: { ...store.weeklyHabits, callFamily: store.weeklyHabits.callFamily.map((v,i)=> i===todayIdx?!v:v ) } })}>
                  {store.weeklyHabits.callFamily[todayIdx]?"✅ Called family":"☎️ Mark family call"}
                </button>
                <button className="px-3 py-2 rounded-xl text-sm border" onClick={()=> setStore({ ...store, weeklyHabits: { ...store.weeklyHabits, swim: store.weeklyHabits.swim.map((v,i)=> i===todayIdx?!v:v ) } })}>
                  {store.weeklyHabits.swim[todayIdx]?"✅ Swim done":"🏊 Swim done"}
                </button>
                <button className="px-3 py-2 rounded-xl text-sm border" onClick={()=> setStore({ ...store, weeklyHabits: { ...store.weeklyHabits, gym: store.weeklyHabits.gym.map((v,i)=> i===todayIdx?!v:v ) } })}>
                  {store.weeklyHabits.gym[todayIdx]?"✅ Gym done":"🏋️ Gym done"}
                </button>
                <button className="px-3 py-2 rounded-xl text-sm border" onClick={()=> setStore({ ...store, weeklyHabits: { ...store.weeklyHabits, water: store.weeklyHabits.water.map((v,i)=> i===todayIdx?Math.min(20,v+1):v ) } })}>💧 +1 glass</button>
                <button className="px-3 py-2 rounded-xl text-sm border" onClick={()=> setStore({ ...store, nightShiftMode: !store.nightShiftMode })}>
                  {store.nightShiftMode?"🌙 Switch to Day":"🌙 Switch to Night"}
                </button>
              </div>
            </Section>
          </div>
        )}

        {tab==="Finance" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Section title="Add transaction">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input" type="date" value={txnDraft.date||""} onChange={e=>setTxnDraft({...txnDraft, date:e.target.value})} />
                  <select className="input" value={txnDraft.type} onChange={e=>setTxnDraft({...txnDraft, type:e.target.value as any})}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <input className="input" placeholder="Category" value={txnDraft.category||""} onChange={e=>setTxnDraft({...txnDraft, category:e.target.value})} />
                  <input className="input" placeholder="Amount" type="number" step="0.01" value={txnDraft.amount?.toString()||""} onChange={e=>setTxnDraft({...txnDraft, amount:Number(e.target.value)})} />
                  <input className="input sm:col-span-2" placeholder="Note (optional)" value={txnDraft.note||""} onChange={e=>setTxnDraft({...txnDraft, note:e.target.value})} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn" onClick={addTxn}>Add</button>
                  <button className="btn" onClick={exportCSV}>Export CSV</button>
                </div>
              </Section>

              <Section title="Transactions">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left opacity-70">
                      <tr><th className="py-2">Date</th><th>Type</th><th>Category</th><th className="text-right">Amount</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                      {store.txns.map(t=> (
                        <tr key={t.id} className="border-t border-zinc-200 dark:border-zinc-800">
                          <td className="py-2">{t.date}</td>
                          <td>{t.type}</td>
                          <td>{t.category}</td>
                          <td className={`text-right ${t.type==="expense"?"text-rose-600 dark:text-rose-400":"text-emerald-600 dark:text-emerald-400"}`}>{t.type==="expense"?"-":"+"}{fmtGBP(Math.abs(t.amount))}</td>
                          <td className="opacity-80">{t.note}</td>
                        </tr>
                      ))}
                      {store.txns.length===0 && <tr><td className="py-2" colSpan={5}>No transactions yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>

            <div>
              <Section title="Summary">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Income</span><strong>{fmtGBP(totals.income)}</strong></div>
                  <div className="flex justify-between"><span>Spend</span><strong>{fmtGBP(totals.expense)}</strong></div>
                  <div className="flex justify-between"><span>Net</span><strong>{fmtGBP(totals.net)}</strong></div>
                  <hr className="border-zinc-200 dark:border-zinc-800" />
                  <div className="text-xs opacity-70">{store.emergencyFundName}</div>
                  <ProgressBar value={emergencySaved} max={store.emergencyFundTarget} />
                  <div className="text-xs opacity-70">Target: {fmtGBP(store.emergencyFundTarget)}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input className="input" type="number" value={store.emergencyFundTarget} onChange={e=> setStore({...store, emergencyFundTarget:Number(e.target.value)})} />
                    <input className="input" value={store.emergencyFundName} onChange={e=> setStore({...store, emergencyFundName:e.target.value})} />
                  </div>
                </div>
              </Section>
            </div>
          </div>
        )}

        {tab==="Health" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Section title="Add health entry">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input" type="date" value={healthDraft.date||""} onChange={e=>setHealthDraft({...healthDraft, date:e.target.value})} />
                  <select className="input" value={healthDraft.mood||""} onChange={e=>setHealthDraft({...healthDraft, mood:e.target.value as any})}>
                    <option value="">Mood</option>
                    {"😀🙂😐😕😞".split("").map(m=> <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input className="input" placeholder="Weight (kg)" type="number" step="0.1" value={healthDraft.weightKg?.toString()||""} onChange={e=>setHealthDraft({...healthDraft, weightKg:Number(e.target.value)})} />
                  <input className="input" placeholder="Sleep (hrs)" type="number" step="0.1" value={healthDraft.sleepHrs?.toString()||""} onChange={e=>setHealthDraft({...healthDraft, sleepHrs:Number(e.target.value)})} />
                  <input className="input sm:col-span-2" placeholder="Steps" type="number" value={healthDraft.steps?.toString()||""} onChange={e=>setHealthDraft({...healthDraft, steps:Number(e.target.value)})} />
                </div>
                <div className="mt-3"><button className="btn" onClick={addHealth}>Add</button></div>
              </Section>

              <Section title="Weekly habits (Mon–Sun)">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left opacity-70">
                      <tr>
                        <th className="py-2">Habit</th>
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=> <th key={d} className={`py-2 ${i===todayIdx?"underline":''}`}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {[{key:"swim", label:"Swim"}, {key:"gym", label:"Gym"}].map(row=> (
                        <tr key={row.key} className="border-t border-zinc-200 dark:border-zinc-800">
                          <td className="py-2">{row.label}</td>
                          {store.weeklyHabits[row.key as "swim"|"gym"].map((v,i)=> (
                            <td key={i}>
                              <input type="checkbox" checked={v} onChange={()=> setStore({...store, weeklyHabits: { ...store.weeklyHabits, [row.key]: store.weeklyHabits[row.key as "swim"|"gym"].map((x,idx)=> idx===i?!x:x) }})} />
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="py-2">Water (glasses)</td>
                        {store.weeklyHabits.water.map((v,i)=> (
                          <td key={i}>
                            <input className="input !p-1 w-16" type="number" value={v} onChange={(e)=> setStore({...store, weeklyHabits: { ...store.weeklyHabits, water: store.weeklyHabits.water.map((x,idx)=> idx===i?Number(e.target.value):x) }})} />
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="py-2">Call family</td>
                        {store.weeklyHabits.callFamily.map((v,i)=> (
                          <td key={i}>
                            <input type="checkbox" checked={v} onChange={()=> setStore({...store, weeklyHabits: { ...store.weeklyHabits, callFamily: store.weeklyHabits.callFamily.map((x,idx)=> idx===i?!x:x) }})} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Health history">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left opacity-70">
                      <tr><th className="py-2">Date</th><th>Weight</th><th>Sleep</th><th>Steps</th><th>Mood</th></tr>
                    </thead>
                    <tbody>
                      {store.health.map(h=> (
                        <tr key={h.id} className="border-t border-zinc-200 dark:border-zinc-800">
                          <td className="py-2">{h.date}</td>
                          <td>{h.weightKg??"—"}</td>
                          <td>{h.sleepHrs??"—"}</td>
                          <td>{h.steps??"—"}</td>
                          <td>{h.mood??"—"}</td>
                        </tr>
                      ))}
                      {store.health.length===0 && <tr><td className="py-2" colSpan={5}>No entries yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>

            <div>
              <Section title="Night‑shift mode">
                <p className="text-sm opacity-80">Shifts flip your day: track sleep after night duties and hydrate.</p>
                <div className="mt-2 flex items-center gap-2">
                  <button className="btn" onClick={()=> setStore({...store, nightShiftMode: !store.nightShiftMode})}>{store.nightShiftMode?"🌙 On":"☀️ Off"}</button>
                </div>
              </Section>

              <Section title="Diet – quick log">
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" type="date" value={mealDraft.date||""} onChange={e=>setMealDraft({...mealDraft, date:e.target.value})} />
                    <select className="input" value={mealDraft.mealType} onChange={e=>setMealDraft({...mealDraft, mealType: e.target.value as any})}>
                      {["Breakfast","Lunch","Dinner","Snack"].map(m=> <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <input className="input" placeholder="Meal name" value={mealDraft.name||""} onChange={e=>setMealDraft({...mealDraft, name:e.target.value})} />
                  <input className="input" placeholder="Calories (optional)" type="number" value={mealDraft.calories?.toString()||""} onChange={e=>setMealDraft({...mealDraft, calories: Number(e.target.value)})} />
                  <button className="btn" onClick={addMeal}>Add meal</button>
                </div>
              </Section>
            </div>
          </div>
        )}

        {tab==="Diet" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="Meal log">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left opacity-70">
                    <tr><th className="py-2">Date</th><th>Meal</th><th>Name</th><th>Calories</th></tr>
                  </thead>
                  <tbody>
                    {store.meals.map(m=> (
                      <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="py-2">{m.date}</td>
                        <td>{m.mealType}</td>
                        <td>{m.name}</td>
                        <td>{m.calories??"—"}</td>
                      </tr>
                    ))}
                    {store.meals.length===0 && <tr><td className="py-2" colSpan={4}>No meals yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="Daily water tracker">
              <div className="flex items-center gap-2">
                <button className="btn" onClick={()=> setStore({ ...store, weeklyHabits: { ...store.weeklyHabits, water: store.weeklyHabits.water.map((v,i)=> i===todayIdx?Math.max(0,v-1):v ) } })}>−1</button>
                <div className="text-2xl font-bold">{store.weeklyHabits.water[todayIdx]} glasses</div>
                <button className="btn" onClick={()=> setStore({ ...store, weeklyHabits: { ...store.weeklyHabits, water: store.weeklyHabits.water.map((v,i)=> i===todayIdx?Math.min(20,v+1):v ) } })}>+1</button>
              </div>
            </Section>
          </div>
        )}

        {tab==="Plan" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Section title="Tasks & goals" right={<Chip label={`ILR in ${diffDays} days`} />}>
                <div className="flex gap-2 mb-3">
                  <input className="input flex-1" placeholder="Add a task (e.g., Push to GitHub, Apply to 3 IT roles)" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} />
                  <select className="input" value={taskArea} onChange={e=>setTaskArea(e.target.value as any)}>
                    {(["Life","Finance","Health","Diet","Career"] as const).map(a=> <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button className="btn" onClick={addTask}>Add</button>
                </div>

                <div className="space-y-2">
                  {store.tasks.map(t=> (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} />
                      <div className={`flex-1 ${t.done?"line-through opacity-60":""}`}>
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="text-xs opacity-70">Area: {t.area ?? "Life"} {t.recur && t.recur!=="none"?`• ${t.recur}`:""}</div>
                      </div>
                      <button className="text-xs px-2 py-1 rounded-lg border" onClick={()=>deleteTask(t.id)}>Delete</button>
                    </div>
                  ))}
                  {store.tasks.length===0 && <div className="text-sm opacity-70">No tasks yet.</div>}
                </div>
              </Section>
            </div>

            <div>
              <Section title="Focus presets">
                <div className="grid gap-2 text-sm">
                  <button className="btn" onClick={()=> setStore({...store, tasks:[{id:crypto.randomUUID(), title:"Apply to 3 IT jobs today", done:false, area:"Career"}, ...store.tasks]})}>🎯 Job hunt sprint</button>
                  <button className="btn" onClick={()=> setStore({...store, tasks:[{id:crypto.randomUUID(), title:"Finish one lab & push to GitHub", done:false, area:"Career"}, ...store.tasks]})}>🧪 Lab → GitHub</button>
                  <button className="btn" onClick={()=> setStore({...store, tasks:[{id:crypto.randomUUID(), title:"Meal prep for night shifts", done:false, area:"Diet"}, ...store.tasks]})}>🥗 Meal prep</button>
                </div>
              </Section>
            </div>
          </div>
        )}

        {tab==="Career" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="CompTIA A+ roadmap (next)">
              <ol className="list-decimal ml-5 text-sm space-y-1">
                <li>Core 1 (220-1101): mobile devices, networking, hardware, virtualization/cloud, troubleshooting</li>
                <li>Core 2 (220-1102): OS (Windows, Linux, macOS), security, software troubleshooting, operational procedures</li>
                <li>Study routine: 2 hrs/day → practice labs → take practice tests (80%+)</li>
                <li>Exam plan: book Core 1 → 2–4 weeks later book Core 2</li>
              </ol>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {["Watch module & take notes","Do hands-on lab","Make Anki cards","Score 80% on practice test","Book exam"].map(t=>(
                  <button key={t} className="btn" onClick={()=> setStore({...store, tasks:[{id:crypto.randomUUID(), title:`A+: ${t}`, done:false, area:"Career"}, ...store.tasks]})}>{t}</button>
                ))}
              </div>
            </Section>

            <Section title="GitHub upload checklist">
              <ul className="text-sm space-y-1 list-disc ml-5">
                <li>Meaningful repo name (e.g., <code>windows-server-2022-lab</code>)</li>
                <li>README with: goal, architecture diagram/screenshot, steps, results</li>
                <li>Folder: <code>screenshots/</code> (numbered), <code>powershell/</code> (scripts), <code>configs/</code></li>
                <li>Use commits: one logical change per commit with clear message</li>
                <li>Pin top 6 repos on GitHub profile</li>
              </ul>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {["Create repo + README","Add screenshots","Push scripts/configs","Write results section","Pin repo"].map(t=>(
                  <button key={t} className="btn" onClick={()=> setStore({...store, tasks:[{id:crypto.randomUUID(), title:`GitHub: ${t}`, done:false, area:"Career"}, ...store.tasks]})}>{t}</button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {tab==="Reading" && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Section title="Reading list">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-semibold mb-1">Finished</div>
                    <ul className="space-y-1">{reading.finished.map(b=> <li key={b.id}>✅ {b.title}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Current</div>
                    <ul className="space-y-1">{reading.current.map(b=> <li key={b.id}>📖 {b.title}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Upcoming</div>
                    <ul className="space-y-1">{reading.upcoming.map(b=> <li key={b.id}>🗓️ {b.title}</li>)}</ul>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input className="input flex-1" placeholder="Add a book (title)" value={readingDraft} onChange={e=>setReadingDraft(e.target.value)} />
                  <button className="btn" onClick={()=>{ if(!readingDraft.trim()) return; setStore({...store, reading:[{id:crypto.randomUUID(), title:readingDraft.trim(), status:"upcoming"}, ...store.reading]}); setReadingDraft(""); }}>Add to Upcoming</button>
                </div>
              </Section>

              <Section title="Mark progress">
                <div className="text-xs opacity-70 mb-2">Click a book to cycle status: finished → current → upcoming</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {store.reading.map(b=> (
                    <button key={b.id} className="btn text-left" onClick={()=>{
                      const order: Record<ReadingItem["status"], ReadingItem["status"]> = { finished: "current", current: "upcoming", upcoming: "finished" } as any;
                      setStore({...store, reading: store.reading.map(x=> x.id===b.id?{...x, status: order[b.status]}:x)});
                    }}>{b.status==="finished"?"✅":b.status==="current"?"📖":"🗓️"} {b.title}</button>
                  ))}
                </div>
              </Section>
            </div>

            <div>
              <Section title="Suggestions for you">
                <div className="text-sm space-y-2">
                  {suggestNextBooks().map(s=> (
                    <div key={s} className="flex items-center justify-between border rounded-xl px-3 py-2">
                      <span>📚 {s}</span>
                      <button className="btn" onClick={()=> setStore({...store, reading:[{id:crypto.randomUUID(), title:s, status:"upcoming"}, ...store.reading]})}>Add</button>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}

        {tab==="Notes" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="Quick note">
              <NoteEditor onAdd={(text)=> setStore({...store, notes:[{ id:crypto.randomUUID(), text, created:new Date().toISOString(), pinned:false }, ...store.notes]})} />
            </Section>
            <Section title="All notes">
              <div className="space-y-2">
                {store.notes.sort((a,b)=> (b.pinned?1:0)-(a.pinned?1:0) || b.created.localeCompare(a.created)).map(n=> (
                  <div key={n.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs opacity-60 mb-1">{new Date(n.created).toLocaleString()}</div>
                    <div className="whitespace-pre-wrap text-sm">{n.text}</div>
                    <div className="mt-2 flex gap-2 text-xs">
                      <button className="px-2 py-1 rounded-lg border" onClick={()=> setStore({...store, notes: store.notes.map(x=> x.id===n.id?{...x, pinned:!x.pinned}:x)})}>{n.pinned?"Unpin":"Pin"}</button>
                      <button className="px-2 py-1 rounded-lg border" onClick={()=> setStore({...store, notes: store.notes.filter(x=> x.id!==n.id)})}>Delete</button>
                    </div>
                  </div>
                ))}
                {store.notes.length===0 && <div className="text-sm opacity-70">No notes yet.</div>}
              </div>
            </Section>
          </div>
        )}
      </main>

      <style>{`
        .input{ @apply w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 outline-none; }
        .btn{ @apply px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700; }
      `}</style>
    </div>
  );
}

// —— Tiny components ——
const NoteEditor: React.FC<{ onAdd: (text:string)=>void }>=({onAdd})=>{
  const [v,setV]=useState("");
  return (
    <div>
      <textarea className="input h-28" placeholder="Type your note (gratitude, ideas, plans)…" value={v} onChange={e=>setV(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button className="btn" onClick={()=>{ if(v.trim()) { onAdd(v.trim()); setV(""); } }}>Add note</button>
        <button className="btn" onClick={()=>setV("")}>Clear</button>
      </div>
    </div>
  );
};
