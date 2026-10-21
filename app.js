const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("hs_"+key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem("hs_"+key, JSON.stringify(value)); }
};
let water = store.get("water", {date:"", count:0});
let foods = store.get("foods", []);
let sports = store.get("sports", []);
let period = store.get("period", null);
let deferredInstall = null;

function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function formatDate(s){ if(!s) return "-"; return new Date(s+"T12:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function go(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===page));
  document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.classList.contains("navitem")&&b.dataset.page===page));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));

function renderHome(){
  const today=todayISO();
  if(water.date!==today){water={date:today,count:0};store.set("water",water);}
  $("todayLabel").textContent=new Date().toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short"});
  $("waterCount").textContent=`${water.count} / 8 gelas`;
  $("activityCount").textContent=`${sports.filter(s=>s.date===today).reduce((a,s)=>a+s.minutes,0)} menit`;
}
$("waterAdd").addEventListener("click",()=>{const today=todayISO();if(water.date!==today)water={date:today,count:0};water.count=Math.min(20,water.count+1);store.set("water",water);renderHome();});
function renderFoods(){
  const today=todayISO(), list=foods.filter(f=>f.date===today);
  $("foodSummary").textContent=list.reduce((a,f)=>a+f.calories,0)+" kkal";
  $("foodList").innerHTML=list.length?list.map(f=>`<div class="foodrow"><div><b>${escapeHtml(f.name)}</b><small>${f.protein} g protein • ${formatDate(f.date)}</small></div><b>${f.calories} kkal</b></div>`).join(""):'<div class="listempty">Belum ada makanan dicatat.</div>';
}
$("foodPhoto").addEventListener("change",e=>{const f=e.target.files?.[0];if(!f)return;const url=URL.createObjectURL(f);$("foodPreview").src=url;$("foodPreview").hidden=false;});
$("saveFood").addEventListener("click",()=>{
  const name=$("foodName").value.trim(), calories=Number($("foodCalories").value), protein=Number($("foodProtein").value)||0;
  if(!name){alert("Isi nama makanan dulu ya, Bestie.");return;}
  foods.unshift({id:Date.now(),name,calories:Math.max(0,calories||0),protein:Math.max(0,protein),date:todayISO()});
  store.set("foods",foods);$("foodName").value="";$("foodCalories").value="";$("foodProtein").value="";renderFoods();alert("Catatan makanan tersimpan di perangkat ini.");
});
function renderPeriod(){
 if(!period){$("periodResult").innerHTML='<h3>Perkiraan siklus</h3><p class="muted">Isi tanggal haid terakhir untuk melihat perkiraan.</p>';return;}
 const start=new Date(period.start+"T12:00:00"), next=new Date(start);next.setDate(next.getDate()+period.cycle);
 const ov=new Date(start);ov.setDate(ov.getDate()+period.cycle-14);
 const days=Math.round((next-new Date(todayISO()+"T12:00:00"))/86400000);
 $("periodResult").innerHTML=`<h3>Perkiraan siklusmu</h3><div class="resultbig">${days===0?"Perkiraan hari ini":days>0?`${days} hari lagi`:`${Math.abs(days)} hari lewat dari perkiraan`}</div><p class="muted">Tanggal haid berikutnya diperkirakan ${formatDate(next.toISOString().slice(0,10))}.</p><div class="resultmeta"><div>Perkiraan ovulasi<b>${formatDate(ov.toISOString().slice(0,10))}</b></div><div>Durasi haid tercatat<b>${period.length} hari</b></div></div><p class="tiny muted">Ini hanya estimasi kalender dan bukan penentuan masa subur yang pasti.</p>`;
}
$("savePeriod").addEventListener("click",()=>{
 const start=$("periodStart").value,cycle=Number($("cycleLength").value),length=Number($("periodLength").value);
 if(!start){alert("Pilih tanggal hari pertama haid terakhir.");return;}
 if(cycle<15||cycle>60||length<1||length>15){alert("Periksa kembali angka siklus dan lama haid.");return;}
 period={start,cycle,length};store.set("period",period);renderPeriod();alert("Catatan siklus tersimpan.");
});
function renderSports(){
 const today=todayISO(), todaySports=sports.filter(s=>s.date===today);
 $("sportTotal").textContent=sports.reduce((a,s)=>a+s.minutes,0)+" menit";
 $("distanceTotal").textContent=sports.reduce((a,s)=>a+s.distance,0).toFixed(1)+" km";
 $("sportList").innerHTML=sports.length?sports.slice(0,12).map(s=>`<div class="sportrow"><div><b>${escapeHtml(s.type)}</b><small>${formatDate(s.date)} • ${s.minutes} menit</small></div><b>${s.distance?`${s.distance} km`:"—"}</b></div>`).join(""):'<div class="listempty">Belum ada aktivitas.</div>';
 renderHome();
}
$("saveSport").addEventListener("click",()=>{
 const minutes=Number($("sportMinutes").value),distance=Number($("sportDistance").value)||0;
 if(minutes<1||!Number.isFinite(minutes)){alert("Masukkan durasi minimal 1 menit.");return;}
 sports.unshift({id:Date.now(),type:$("sportType").value,minutes,distance:Math.max(0,distance),date:todayISO()});store.set("sports",sports);$("sportDistance").value="";renderSports();alert("Aktivitas berhasil dicatat!");
});
function answer(q){
 const s=q.toLowerCase();
 if(/haid|menstruasi|telat|pms|siklus/.test(s))return "Siklus haid bisa berubah karena stres, perubahan berat badan, aktivitas, atau kondisi kesehatan. Kalau ada kemungkinan hamil, pertimbangkan tes kehamilan sesuai petunjuk. Jika haid tidak datang selama beberapa bulan, nyeri berat, atau perdarahan sangat banyak, konsultasikan ke tenaga kesehatan. Aku tidak bisa memastikan penyebab secara pribadi ya.";
 if(/hamil|kehamilan|bumil|trimester|nanas/.test(s))return "Saat hamil, utamakan makanan beragam dan matang dengan baik, serta kontrol rutin ke dokter atau bidan. Keamanan makanan bergantung pada cara pengolahan dan kondisi individu. Jangan memulai obat atau suplemen tanpa arahan tenaga kesehatan.";
 if(/olahraga|lari|jalan|workout|kalori|sport/.test(s))return "Mulai dari aktivitas yang nyaman, misalnya jalan kaki 10–20 menit, lalu tingkatkan bertahap sesuai kondisi tubuh. Minum cukup dan berhenti jika pusing, nyeri dada, atau sesak yang tidak biasa. Angka kalori aplikasi hanyalah perkiraan.";
 if(/diet|makan|nutrisi|protein|gula|kalori|seimbang/.test(s))return "Pola makan seimbang mencakup karbohidrat, protein, lemak sehat, sayur, dan buah. Coba prinsip Isi Piringku: setengah piring sayur dan buah, sisanya karbohidrat dan protein. Hindari diet ekstrem; kebutuhan energi setiap orang berbeda.";
 if(/air|minum|hidrasi/.test(s))return "Kebutuhan cairan berbeda menurut aktivitas, cuaca, dan kondisi tubuh. Jadikan air putih pilihan utama dan gunakan pengingat sebagai bantuan, bukan aturan kaku.";
 return "Aku bisa bantu edukasi umum tentang diet, menstruasi, olahraga, dan kehamilan. Coba tanyakan hal yang lebih spesifik. Untuk gejala berat atau keputusan medis, konsultasikan ke dokter atau bidan.";
}
function addMessage(text,kind){const d=document.createElement("div");d.className="bubble "+kind;d.textContent=text;$("chatbox").appendChild(d);$("chatbox").scrollTop=$("chatbox").scrollHeight;}
$("chatForm").addEventListener("submit",e=>{e.preventDefault();const q=$("chatInput").value.trim();if(!q)return;addMessage(q,"user");$("chatInput").value="";setTimeout(()=>addMessage(answer(q),"bot"),180);});
document.querySelectorAll("[data-question]").forEach(b=>b.addEventListener("click",()=>{const q=b.dataset.question;addMessage(q,"user");setTimeout(()=>addMessage(answer(q),"bot"),180);}));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").hidden=true;});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
$("periodStart").value=period?.start||"";
if(period){$("cycleLength").value=period.cycle;$("periodLength").value=period.length;}
renderHome();renderFoods();renderPeriod();renderSports();
