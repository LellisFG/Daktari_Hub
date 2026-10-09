(() => {
  "use strict";

  const STORAGE_KEY = "daktari-hub-demo-v1";
  let doctors = [
    {id:"doc-1",name:"Dr. Robert Chen, MD",shortName:"Dr. Robert Chen",department:"Cardiology",experience:"12 years",license:"MED-884920",title:"Senior Consultant",status:"Available",initials:"RC",username:"robert",password:"Doctor123!",bio:"Heart health, preventive cardiology, and cardiovascular assessments."},
    {id:"doc-2",name:"Dr. Amina Patel, MD",shortName:"Dr. Amina Patel",department:"Neurology",experience:"9 years",license:"MED-771204",title:"Consultant Neurologist",status:"Available",initials:"AP",username:"amina",password:"Doctor123!",bio:"Neurological assessments, headaches, and nervous-system health."},
    {id:"doc-3",name:"Dr. James Otieno, MD",shortName:"Dr. James Otieno",department:"Pediatrics",experience:"11 years",license:"MED-662817",title:"Pediatric Specialist",status:"Busy",initials:"JO",bio:"Child wellness, growth monitoring, and general pediatric care."},
    {id:"doc-4",name:"Dr. Grace Mwangi, MD",shortName:"Dr. Grace Mwangi",department:"General Medicine",experience:"8 years",license:"MED-508319",title:"General Practitioner",status:"Available",initials:"GM",bio:"Primary care, routine check-ups, and general health concerns."},
    {id:"doc-5",name:"Dr. Daniel Kimani, MD",shortName:"Dr. Daniel Kimani",department:"Orthopedics",experience:"10 years",license:"MED-439106",title:"Orthopedic Consultant",status:"In Surgery",initials:"DK",bio:"Bone, joint, mobility, and musculoskeletal assessments."}
  ];
  let pharmacy = [
    {id:"med-1",name:"Paracetamol",category:"Pain relief",usage:"Temporary relief of mild pain and fever",stock:180,reorder:40,price:80,unit:"pack"},
    {id:"med-2",name:"Oral Rehydration Salts",category:"Hydration",usage:"Helps replace fluids and electrolytes",stock:24,reorder:30,price:35,unit:"sachet"},
    {id:"med-3",name:"Antiseptic Solution",category:"First aid",usage:"External cleansing for minor first-aid needs",stock:56,reorder:15,price:160,unit:"bottle"},
    {id:"med-4",name:"Vitamin C",category:"Vitamins",usage:"Vitamin supplement",stock:12,reorder:20,price:220,unit:"bottle"},
    {id:"med-5",name:"Sterile Gauze",category:"Wound care",usage:"Sterile dressing material",stock:92,reorder:25,price:60,unit:"pack"},
    {id:"med-6",name:"Digital Thermometer",category:"Medical device",usage:"Measures body temperature",stock:8,reorder:10,price:450,unit:"unit"}
  ];
  const timeSlots = ["09:00 AM","10:30 AM","02:00 PM","04:00 PM"];
  const diagnosticTests = [
    {id:"cbc",name:"Complete Blood Count (CBC)",available:"Today · 10:30 AM"},
    {id:"glucose",name:"Blood Glucose",available:"Today · 11:00 AM"},
    {id:"urinalysis",name:"Urinalysis",available:"Today · 12:00 PM"},
    {id:"xray",name:"X-ray",available:"Today · 02:00 PM"},
    {id:"ultrasound",name:"Ultrasound",available:"Tomorrow · 09:00 AM"},
    {id:"ecg",name:"ECG",available:"Today · 01:30 PM"}
  ];
  let selectedAppointmentId = null;
  let toastTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const uid = () => `appt-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

  function initialState() {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2,"0")}`;
    return {
      appointments: [
        {id:"demo-1",patient:"Sarah Jenkins",doctorId:"doc-1",department:"Cardiology",date,time:"09:00 AM",symptoms:"Routine follow-up and general heart-health review.",status:"Scheduled",notes:"",prescription:"",createdAt:Date.now()},
        {id:"demo-2",patient:"Michael Brown",doctorId:"doc-4",department:"General Medicine",date,time:"10:30 AM",symptoms:"Routine wellness consultation.",status:"Completed",notes:"Demo consultation completed.",prescription:"",createdAt:Date.now()-86400000},
        {id:"demo-3",patient:"Aisha Njeri",doctorId:"doc-2",department:"Neurology",date,time:"02:00 PM",symptoms:"Discuss recurring headaches with clinician.",status:"Scheduled",notes:"",prescription:"",createdAt:Date.now()}
      ],
      doctorStatuses: Object.fromEntries(doctors.map(d => [d.id,d.status])),
      doctors, pharmacy,
      patients: [{id:"pat-demo-1",name:"Sarah Jenkins",age:32,gender:"Female",phone:"0700000000",email:"",bloodGroup:"",address:"",createdAt:Date.now()}]
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState();
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.appointments) || !parsed.doctorStatuses) return initialState();
      parsed.doctors = Array.isArray(parsed.doctors) && parsed.doctors.length ? parsed.doctors : doctors;
      parsed.pharmacy = Array.isArray(parsed.pharmacy) && parsed.pharmacy.length ? parsed.pharmacy : pharmacy;
      parsed.patients = Array.isArray(parsed.patients) ? parsed.patients : [{id:"pat-demo-1",name:"Sarah Jenkins",age:32,gender:"Female",phone:"0700000000",email:"",bloodGroup:"",address:"",createdAt:Date.now()}];
      doctors = parsed.doctors; pharmacy = parsed.pharmacy;
      return parsed;
    } catch (error) {
      return initialState();
    }
  }
  let state = loadState();
  function saveState() {
    state.doctors = doctors; state.pharmacy = pharmacy;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { toast("Unable to save to browser storage. Your changes may not persist.", true); }
  }
  function toast(message, isError = false) {
    const region = $("#toast-region");
    const item = document.createElement("div");
    item.className = `toast${isError ? " error" : ""}`;
    item.textContent = message;
    region.appendChild(item);
    window.setTimeout(() => item.remove(), 3600);
  }
  let currentUser = null;
  function doctorById(id) { return doctors.find(d => d.id === id) || doctors[0]; }
  function openLogin(role) { $("#staff-login-role").value = role; $("#staff-login-title").textContent = role === "supervisor" ? "Supervisor login" : role === "pharmacy" ? "Pharmacy portal login" : "Doctor login"; $("#staff-login-description").textContent = role === "supervisor" ? "Sign in to manage staff and hospital records." : role === "pharmacy" ? "Sign in with your dedicated pharmacy account." : "Sign in with your enrolled doctor account to access your schedule."; $("#staff-login-error").classList.add("hidden"); $("#staff-login-modal").classList.remove("hidden"); $("#staff-login-modal").classList.add("flex"); $("#staff-username").focus(); }
  function closeLogin() { $("#staff-login-modal").classList.add("hidden"); $("#staff-login-modal").classList.remove("flex"); $("#staff-login-form").reset(); }
  function statusClass(status) {
    if (status === "Completed") return "tag-teal";
    if (status === "Scheduled") return "tag-blue";
    if (status === "Cancelled") return "tag-red";
    return "tag-amber";
  }
  function dateLabel(value) {
    if (!value) return "Date not set";
    const date = new Date(`${value}T12:00:00`);
    return date.toLocaleDateString(undefined,{weekday:"short",year:"numeric",month:"short",day:"numeric"});
  }
  function fullAppointmentDate(appt) { return `${dateLabel(appt.date)} · ${appt.time}`; }
  function setRole(role, authorized = false) {
    // A signed-in user can only remain inside their own portal. Switching roles
    // requires an explicit logout/switch-portal action first.
    if (currentUser && currentUser.role !== role) {
      toast("You are signed in to the " + currentUser.role + " portal. Log out or switch portal before entering another role.", true);
      return;
    }
    if ((role === "doctor" || role === "supervisor" || role === "pharmacy") && !authorized && (!currentUser || currentUser.role !== role)) {
      openLogin(role);
      return;
    }
    if (role === "patient" && !currentUser && !authorized) currentUser = {role:"patient",name:"Patient"};
    $$(".role-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.role === role);
      btn.classList.toggle("hidden", Boolean(currentUser) && btn.dataset.role !== currentUser.role);
    });
    $$(".portal").forEach(view => view.classList.toggle("hidden", view.id !== `view-${role}`));
    const profile = {
      patient:[currentUser?.name || "Choose a portal","Patient Portal",(currentUser?.name || "PT").split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase()],
      doctor:[currentUser?.name || "Doctor","Doctor Portal",(currentUser?.name || "DR").split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase()],
      supervisor:[currentUser?.name || "Hospital Supervisor","Supervisor Portal","HS"],
      pharmacy:[currentUser?.name || "Pharmacy Desk","Pharmacy Portal","PH"]
    }[role];
    $("#user-display-name").textContent = profile[0];
    $("#user-display-role").textContent = profile[1];
    $("#user-avatar").textContent = profile[2];
    $("#user-avatar-mobile").textContent = profile[2];
    // The button is always available to end the current session; role options
    // are revealed only after the user explicitly logs out.
    $("#staff-logout").classList.remove("hidden");
    if (role === "doctor") renderDoctorPortal();
    if (role === "supervisor") renderSupervisor();
    if (role === "pharmacy") renderPharmacyCatalog();
    if (role === "patient") renderPatientAppointments();
  }
  function switchPortal() {
    currentUser = null;
    $$(".role-btn").forEach(btn => btn.classList.remove("hidden"));
    $$(".role-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.role === "patient"));
    $$(".portal").forEach(view => view.classList.toggle("hidden", view.id !== "view-patient"));
    $("#user-display-name").textContent = "Choose a portal";
    $("#user-display-role").textContent = "Signed out";
    $("#user-avatar").textContent = "DH";
    $("#user-avatar-mobile").textContent = "DH";
    $("#staff-logout").classList.remove("hidden");
    closeLogin();
  }
  function setPatientTab(tab) {
    $$(".patient-tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.ptab === tab));
    $$(".patient-tab-content").forEach(panel => panel.classList.toggle("hidden", panel.id !== `patient-tab-${tab}`));
    if (tab === "doctors") renderDoctorDirectory();
    if (tab === "report") { $("#patient-report-result").classList.add("hidden"); }
  }

  function populatePatientOptions() { /* Patient booking now uses direct entry fields, not a shared patient list. */ }
  function renderPatientDirectory() { /* Intentionally do not expose a directory of patient records in the patient portal. */ }
  function populateBookingDoctors() {
    const department = $("#book-department").value;
    const select = $("#book-doctor");
    const list = doctors.filter(d => (department === "All" || d.department === department) && state.doctorStatuses[d.id] !== "On Leave");
    select.innerHTML = list.map(d => `<option value="${esc(d.id)}">${esc(d.name)} · ${esc(d.department)}${state.doctorStatuses[d.id] !== "Available" ? ` (${esc(state.doctorStatuses[d.id])})` : ""}</option>`).join("");
    if (!list.length) select.innerHTML = `<option value="">No doctors available for this department</option>`;
  }

  function renderPatientAppointments() {
    const list = $("#patient-appointments-list");
    const patientId = currentUser?.role === "patient" ? currentUser.patientId : null;
    const appointments = patientId ? state.appointments.filter(a => a.patientId === patientId).sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)) : [];
    $("#patient-appointment-count").textContent = `${appointments.length} total`;
    if (!appointments.length) {
      list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-calendar-xmark block"></i><p class="font-bold text-slate-600">No appointments yet</p><p class="text-xs mt-1">Use the form to book your first consultation.</p></div>`;
      return;
    }
    list.innerHTML = appointments.map(a => {
      const doctor = doctorById(a.doctorId);
      return `<article class="appointment-card">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div class="flex gap-3"><div class="doctor-avatar"><i class="fa-solid fa-calendar-check"></i></div><div><div class="font-extrabold text-slate-900">${esc(doctor.shortName)}</div><div class="text-xs text-slate-500 mt-1">${esc(a.department)} · ${esc(fullAppointmentDate(a))}</div><p class="text-sm text-slate-600 mt-3">${esc(a.symptoms)}</p>${a.notes ? `<div class="mt-2 text-xs bg-slate-50 rounded-lg p-2 text-slate-600"><strong>Consultation note:</strong> ${esc(a.notes)}</div>` : ""}${a.prescription ? `<div class="mt-2 text-xs bg-teal-50 rounded-lg p-2 text-teal-800"><strong>Prescription note:</strong> ${esc(a.prescription)}</div>` : ""}</div></div>
          <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2"><span class="tag ${statusClass(a.status)}">${esc(a.status)}</span>${a.status === "Scheduled" ? `<button class="btn-danger cancel-appointment" data-id="${esc(a.id)}" type="button">Cancel</button>` : ""}</div>
        </div>
      </article>`;
    }).join("");
  }

  function renderDoctorDirectory() {
    const q = $("#doctor-search").value.trim().toLowerCase();
    const department = $("#doctor-dept-filter").value;
    const list = doctors.filter(d => (department === "All" || d.department === department) && `${d.name} ${d.department} ${d.bio}`.toLowerCase().includes(q));
    $("#doctor-directory-grid").innerHTML = list.length ? list.map(d => {
      const status = state.doctorStatuses[d.id];
      return `<article class="doctor-card"><div class="flex items-start gap-3"><div class="doctor-avatar">${esc(d.initials)}</div><div class="min-w-0 flex-1"><h3 class="font-extrabold text-slate-900">${esc(d.name)}</h3><p class="text-xs text-teal-700 font-semibold mt-1">${esc(d.department)}</p><div class="mt-2"><span class="tag ${status === "Available" ? "tag-teal" : status === "On Leave" ? "tag-red" : "tag-amber"}">${esc(status)}</span></div></div></div><p class="text-sm text-slate-600 mt-4">${esc(d.bio)}</p><div class="flex justify-between gap-2 mt-4 pt-3 border-t border-slate-100"><span class="mini-label"><i class="fa-regular fa-clock mr-1"></i>${esc(d.experience)}</span><button type="button" class="text-xs font-extrabold text-teal-700 hover:text-teal-900 book-this-doctor" data-id="${esc(d.id)}">Book consultation <i class="fa-solid fa-arrow-right ml-1"></i></button></div></article>`;
    }).join("") : `<div class="empty-state md:col-span-2 lg:col-span-3"><i class="fa-solid fa-user-doctor block"></i><p class="font-bold text-slate-600">No matching doctors</p><p class="text-xs mt-1">Try another name or department.</p></div>`;
  }

  function renderPharmacyCatalog() {
    const q = $("#pharmacy-search").value.trim().toLowerCase();
    const list = pharmacy.filter(m => `${m.name} ${m.category} ${m.usage}`.toLowerCase().includes(q));
    $("#pharmacy-catalog-grid").innerHTML = list.length ? list.map(m => {
      const low = m.stock <= m.reorder;
      return `<article class="medicine-card"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><div class="doctor-avatar"><i class="fa-solid fa-capsules"></i></div><div><h3 class="font-extrabold text-slate-900">${esc(m.name)}</h3><p class="text-xs text-slate-500 mt-1">${esc(m.category)}</p></div></div><span class="tag ${low ? "tag-amber" : "tag-teal"}">${low ? "Low stock" : "In stock"}</span></div><p class="text-sm text-slate-600 mt-4">${esc(m.usage)}</p><div class="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100"><div><p class="mini-label">Available quantity</p><p class="font-extrabold text-slate-900 mt-1">${m.stock} <span class="text-xs font-medium text-slate-500">${esc(m.unit)}(s)</span></p></div><div><p class="mini-label">Demo price</p><p class="font-extrabold text-slate-900 mt-1">KES ${m.price.toLocaleString()}</p></div></div></article>`;
    }).join("") : `<div class="empty-state md:col-span-2 lg:col-span-3"><i class="fa-solid fa-magnifying-glass block"></i><p class="font-bold text-slate-600">No matching items</p><p class="text-xs mt-1">Try a different search term.</p></div>`;
  }

  function renderDoctorPortal() {
    const activeDoctor = doctors.find(d => d.id === currentUser?.doctorId) || doctors[0];
    $("#doctor-active-name").textContent = activeDoctor.name;
    $("#doctor-department-badge").textContent = activeDoctor.department;
    $("#doctor-license").textContent = `License #${activeDoctor.license} · ${activeDoctor.title}`;
    $("#doctor-status-select").value = state.doctorStatuses[activeDoctor.id] || "Available";
    $("#doctor-status-text").textContent = $("#doctor-status-select").value;
    const queue = state.appointments.filter(a => a.doctorId === activeDoctor.id && a.status !== "Cancelled").sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    $("#doctor-queue-count").textContent = `${queue.length} scheduled`;
    $("#doctor-schedule-list").innerHTML = queue.length ? queue.map(a => `<button type="button" class="queue-card w-full text-left hover:border-teal-300 ${a.id === selectedAppointmentId ? "border-teal-500 bg-teal-50/50" : ""}" data-select-appointment="${esc(a.id)}"><div class="flex justify-between items-start gap-2"><div><p class="font-extrabold text-slate-900">${esc(a.patient)}</p><p class="text-xs text-slate-500 mt-1">${esc(dateLabel(a.date))}</p></div><span class="tag ${statusClass(a.status)}">${esc(a.status)}</span></div><div class="flex justify-between gap-2 mt-3 text-xs text-slate-600"><span><i class="fa-regular fa-clock mr-1"></i>${esc(a.time)}</span><span>${esc(a.department)}</span></div></button>`).join("") : `<div class="empty-state"><i class="fa-solid fa-calendar-xmark block"></i><p class="font-bold text-slate-600">No appointments</p><p class="text-xs mt-1">Appointments assigned to this doctor appear here.</p></div>`;
    if (selectedAppointmentId && queue.some(a => a.id === selectedAppointmentId)) renderConsultation(queue.find(a => a.id === selectedAppointmentId));
    else if (queue.length) { selectedAppointmentId = queue[0].id; renderConsultation(queue[0]); }
    else { selectedAppointmentId = null; $("#consultation-empty-state").classList.remove("hidden"); $("#consultation-active-panel").classList.add("hidden"); }
  }

  function renderConsultation(appt) {
    $("#consultation-empty-state").classList.add("hidden");
    $("#consultation-active-panel").classList.remove("hidden");
    $("#consultation-appointment-id").value = appt.id;
    $("#consultation-patient-name").textContent = appt.patient;
    $("#consultation-appointment-meta").textContent = `${appt.department} · ${fullAppointmentDate(appt)}`;
    $("#consultation-status").textContent = appt.status;
    $("#consultation-status").className = `tag ${statusClass(appt.status)}`;
    $("#consultation-symptoms").textContent = appt.symptoms;
    $("#consultation-notes").value = appt.notes || "";
    $("#consultation-prescription").value = appt.prescription || "";
    renderDoctorTestOptions(appt);
    renderDoctorMedicineOptions(appt);
    const serialPanel = $("#prescription-serial-panel");
    if (appt.pharmacySerial) { serialPanel.classList.remove("hidden"); serialPanel.innerHTML = `<strong>Pharmacy serial:</strong> <code>${esc(appt.pharmacySerial)}</code> <button type="button" class="btn-secondary ml-2" data-copy-serial="${esc(appt.pharmacySerial)}">Copy serial</button><p class="text-xs mt-1">Share this serial with the patient so they can view the medication report and total price.</p>`; }
    else { serialPanel.classList.add("hidden"); serialPanel.innerHTML = ""; }
    $("#mark-completed-btn").disabled = appt.status === "Completed" || appt.status === "Cancelled";
    $("#mark-completed-btn").classList.toggle("opacity-50", $("#mark-completed-btn").disabled);
  }

  function renderDoctorTestOptions(appt) {
    const selected = new Set((appt?.tests || []).map(t => t.id));
    $("#doctor-test-options").innerHTML = diagnosticTests.map(t => `<label class="flex items-start gap-2 rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-teal-300"><input type="checkbox" class="doctor-test-check mt-1" value="${esc(t.id)}" ${selected.has(t.id)?"checked":""}><span><span class="block text-sm font-bold text-slate-800">${esc(t.name)}</span><span class="block text-xs text-teal-700 mt-1"><i class="fa-regular fa-clock mr-1"></i>Available: ${esc(t.available)}</span></span></label>`).join("");
  }
  function renderDoctorMedicineOptions(appt) {
    const selected = new Map((appt?.medicines || []).map(m => [m.id,m]));
    $("#doctor-medicine-options").innerHTML = pharmacy.filter(m => m.stock > 0).map(m => {
      const chosen = selected.get(m.id); const max = Math.max(1, Number(m.stock)||1);
      return `<div class="border border-slate-200 rounded-lg p-3 space-y-2"><label class="flex items-start gap-2"><input type="checkbox" class="doctor-medicine-check mt-1" value="${esc(m.id)}" ${chosen?"checked":""}><span class="flex-1"><span class="block text-sm font-bold">${esc(m.name)} <span class="text-xs font-medium text-slate-500">· KES ${Number(m.price||0).toLocaleString()}</span></span><span class="block text-xs text-slate-500">${esc(m.category)} · stock ${m.stock} ${esc(m.unit)}(s)</span></span></label><div class="grid grid-cols-1 sm:grid-cols-2 gap-2"><div><label class="mini-label" for="med-qty-${esc(m.id)}">Quantity</label><input id="med-qty-${esc(m.id)}" data-med-qty="${esc(m.id)}" class="field !py-2" type="number" min="1" max="${max}" value="${chosen?esc(chosen.quantity):1}"></div><div><label class="mini-label" for="med-directions-${esc(m.id)}">Directions / frequency</label><input id="med-directions-${esc(m.id)}" data-med-directions="${esc(m.id)}" class="field !py-2" maxlength="180" placeholder="As directed by doctor" value="${chosen?esc(chosen.directions||""):""}"></div></div></div>`;
    }).join("") || `<p class="text-sm text-slate-500">No in-stock items are available. Ask the supervisor to add stock.</p>`;
  }
  function prescriptionReport(appt) {
    if (!appt) return `<div class="empty-state"><i class="fa-solid fa-file-circle-question block"></i><p class="font-bold">No prescription found</p><p class="text-xs mt-1">Check the serial number and try again.</p></div>`;
    const medicines = appt.medicines || [];
    const total = medicines.reduce((sum,m)=>sum+(Number(m.price)||0)*(Number(m.quantity)||0),0);
    const testList = (appt.tests||[]).length ? `<div class="mt-4"><h4 class="font-bold text-slate-800 mb-2">Requested tests</h4><ul class="space-y-1">${appt.tests.map(t=>`<li class="text-sm text-slate-600">${esc(t.name)} <span class="text-xs text-teal-700">· ${esc(t.available)}</span></li>`).join("")}</ul></div>` : "";
    return `<div class="border border-slate-200 rounded-xl p-4 mt-3"><div class="flex flex-wrap justify-between gap-2"><div><p class="text-xs text-slate-500 uppercase font-bold">Prescription report</p><h4 class="font-extrabold text-slate-900 mt-1">${esc(appt.patient)}</h4><p class="text-xs text-slate-500 mt-1">Serial: <code>${esc(appt.pharmacySerial||"Not issued")}</code></p><p class="text-xs text-slate-500">Doctor: ${esc(doctorById(appt.doctorId).shortName)} · ${esc(fullAppointmentDate(appt))}</p></div><span class="tag tag-teal">${medicines.length} medicine(s)</span></div><div class="overflow-x-auto mt-4"><table class="data-table w-full text-left"><thead><tr><th>Medicine</th><th>Quantity</th><th>Directions</th><th>Unit price</th><th>Subtotal</th></tr></thead><tbody>${medicines.length?medicines.map(m=>`<tr><td class="font-bold">${esc(m.name)}</td><td>${esc(m.quantity)}</td><td>${esc(m.directions||"As directed")}</td><td>KES ${Number(m.price||0).toLocaleString()}</td><td>KES ${(Number(m.price||0)*Number(m.quantity||0)).toLocaleString()}</td></tr>`).join(""):`<tr><td colspan="5">No medicines were included.</td></tr>`}</tbody></table></div><div class="flex justify-between items-center bg-teal-50 rounded-lg p-3 mt-3"><span class="font-bold text-slate-700">Estimated total price</span><strong class="text-lg text-teal-800">KES ${total.toLocaleString()}</strong></div>${appt.prescription?`<div class="mt-3"><p class="mini-label">Additional notes</p><p class="text-sm text-slate-700">${esc(appt.prescription)}</p></div>`:""}${testList}</div>`;
  }
  function showPrescriptionReport(serial, target) {
    const clean = serial.trim().toUpperCase();
    const appt = state.appointments.find(a => String(a.pharmacySerial||"").toUpperCase() === clean);
    target.innerHTML = prescriptionReport(appt); target.classList.remove("hidden");
  }

  function renderSupervisor() {
    const all = state.appointments;
    const scheduled = all.filter(a => a.status === "Scheduled").length;
    const available = doctors.filter(d => state.doctorStatuses[d.id] === "Available").length;
    const lowStock = pharmacy.filter(m => m.stock <= m.reorder).length;
    $("#stat-total").textContent = all.length;
    $("#stat-scheduled").textContent = scheduled;
    $("#stat-doctors").textContent = available;
    $("#stat-low-stock").textContent = lowStock;
    const statuses = ["Scheduled","Completed","Cancelled"];
    const counts = Object.fromEntries(statuses.map(s => [s,all.filter(a => a.status === s).length]));
    const colors = {"Scheduled":"#0284c7","Completed":"#0d9488","Cancelled":"#e11d48"};
    $("#status-chart").innerHTML = statuses.map(status => {
      const percent = all.length ? Math.round(counts[status] / all.length * 100) : 0;
      return `<div><div class="flex justify-between items-center text-sm mb-2"><span class="font-bold text-slate-700">${status}</span><span class="text-slate-500 text-xs">${counts[status]} · ${percent}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%;background:${colors[status]}"></div></div></div>`;
    }).join("");
    $("#supervisor-doctor-list").innerHTML = doctors.map(d => {
      const status = state.doctorStatuses[d.id];
      return `<div class="flex justify-between items-center gap-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0"><div class="flex items-center gap-3 min-w-0"><div class="doctor-avatar !w-9 !h-9 !rounded-xl text-xs">${esc(d.initials)}</div><div class="min-w-0"><p class="font-bold text-sm text-slate-800 truncate">${esc(d.shortName)}</p><p class="text-xs text-slate-500">${esc(d.department)}</p></div></div><span class="tag ${status === "Available" ? "tag-teal" : status === "On Leave" ? "tag-red" : "tag-amber"}">${esc(status)}</span></div>`;
    }).join("");
    const q = $("#supervisor-search").value.trim().toLowerCase();
    const filtered = all.filter(a => {
      const d = doctorById(a.doctorId);
      return `${a.patient} ${d.name} ${a.department} ${a.status} ${a.date}`.toLowerCase().includes(q);
    }).sort((a,b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    $("#supervisor-appointments-body").innerHTML = filtered.length ? filtered.map(a => {
      const d = doctorById(a.doctorId);
      return `<tr><td class="font-bold text-slate-800">${esc(a.patient)}</td><td>${esc(d.shortName)}</td><td>${esc(a.department)}</td><td>${esc(fullAppointmentDate(a))}</td><td><span class="tag ${statusClass(a.status)}">${esc(a.status)}</span></td><td>${a.status === "Scheduled" ? `<button type="button" class="btn-danger cancel-appointment" data-id="${esc(a.id)}">Cancel</button>` : "—"}</td></tr>`;
    }).join("") : `<tr><td colspan="6" class="text-center py-8 text-slate-400">No matching appointments.</td></tr>`;
    $("#enrolled-doctor-list").innerHTML = doctors.map(d=>`<div class="border border-slate-100 rounded-lg p-2 flex justify-between gap-2"><div><p class="font-bold text-sm">${esc(d.name)}</p><p class="text-xs text-slate-500">${esc(d.department)} · username: ${esc(d.username || "not set")}</p></div><span class="tag ${state.doctorStatuses[d.id] === "Available" ? "tag-teal" : "tag-amber"}">${esc(state.doctorStatuses[d.id] || d.status)}</span></div>`).join("");
    $("#stock-management-list").innerHTML = pharmacy.map(m=>`<div class="border border-slate-100 rounded-lg p-2 flex justify-between gap-2"><div><p class="font-bold text-sm">${esc(m.name)}</p><p class="text-xs text-slate-500">${esc(m.category)} · reorder at ${esc(m.reorder)}</p></div><span class="tag ${m.stock<=m.reorder ? "tag-amber" : "tag-teal"}">${esc(m.stock)} ${esc(m.unit)}</span></div>`).join("");
  }

  function rerenderAll() {
    populatePatientOptions(); renderPatientDirectory();
    populateBookingDoctors();
    renderPatientAppointments();
    renderDoctorDirectory();
    renderPharmacyCatalog();
    renderDoctorPortal();
    renderSupervisor();
  }

  $("#booking-form").addEventListener("submit", event => {
    event.preventDefault();
    const doctorId = $("#book-doctor").value;
    const date = $("#book-date").value;
    const time = $("#book-time").value;
    const symptoms = $("#book-symptoms").value.trim();
    const patientName = $("#book-patient-name").value.trim();
    const patientPhone = $("#book-patient-phone").value.trim();
    const patientAge = Number($("#book-patient-age").value);
    const patientGender = $("#book-patient-gender").value;
    const patientEmail = $("#book-patient-email").value.trim();
    if (!patientName || !patientPhone || !patientGender || !Number.isFinite(patientAge) || patientAge < 0 || patientAge > 120) { toast("Please enter valid patient details before booking.", true); return; }
    if (!doctorId || !date || !symptoms) { toast("Please complete all required booking fields.", true); return; }
    if (date < todayISO()) { toast("Please select today or a future date.", true); return; }
    const doctor = doctorById(doctorId);
    if (state.doctorStatuses[doctorId] === "On Leave") { toast("This doctor is currently on leave. Choose another doctor.", true); return; }
    const collision = state.appointments.some(a => a.doctorId === doctorId && a.date === date && a.time === time && a.status === "Scheduled");
    if (collision) { toast("That doctor already has a scheduled appointment in this time slot. Choose another slot.", true); return; }
    let patientProfile = state.patients.find(p => p.name.toLowerCase() === patientName.toLowerCase() && p.phone === patientPhone);
    if (!patientProfile) {
      patientProfile = {id:`pat-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name:patientName,age:patientAge,gender:patientGender,phone:patientPhone,email:patientEmail,bloodGroup:"",address:"",createdAt:Date.now()};
      state.patients.push(patientProfile);
    } else {
      patientProfile.age = patientAge; patientProfile.gender = patientGender; patientProfile.email = patientEmail || patientProfile.email;
    }
    if (currentUser?.role === "patient") { currentUser.patientId = patientProfile.id; currentUser.name = patientProfile.name; }
    const appointment = {id:uid(),patient:patientProfile.name,patientId:patientProfile.id,patientDetails:{age:patientProfile.age,gender:patientProfile.gender,phone:patientProfile.phone},doctorId,department:doctor.department,date,time,symptoms,status:"Scheduled",notes:"",prescription:"",createdAt:Date.now()};
    state.appointments.push(appointment);
    saveState();
    if (currentUser?.role === "patient") setRole("patient", true);
    $("#booking-form").reset();
    $("#book-date").value = todayISO();
    populateBookingDoctors();
    rerenderAll();
    toast("Appointment booked successfully. Your appointment history is linked to the details you entered.");
  });

  $("#book-department").addEventListener("change", populateBookingDoctors);
  $("#doctor-search").addEventListener("input", renderDoctorDirectory);
  $("#doctor-dept-filter").addEventListener("change", renderDoctorDirectory);
  $("#pharmacy-search").addEventListener("input", renderPharmacyCatalog);
  $("#patient-report-form").addEventListener("submit", event => { event.preventDefault(); showPrescriptionReport($("#patient-report-serial").value, $("#patient-report-result")); });
  $("#pharmacy-report-form").addEventListener("submit", event => { event.preventDefault(); showPrescriptionReport($("#pharmacy-report-serial").value, $("#pharmacy-report-result")); });
  $("#supervisor-search").addEventListener("input", renderSupervisor);

  $("#doctor-status-select").addEventListener("change", event => {
    const activeDoctor = doctors.find(d => d.id === currentUser?.doctorId) || doctors[0];
    state.doctorStatuses[activeDoctor.id] = event.target.value;
    saveState();
    $("#doctor-status-text").textContent = event.target.value;
    populateBookingDoctors();
    renderDoctorDirectory();
    renderSupervisor();
    toast(`Doctor status updated to ${event.target.value}.`);
  });

  $("#consultation-form").addEventListener("submit", event => {
    event.preventDefault();
    const id = $("#consultation-appointment-id").value;
    const appt = state.appointments.find(a => a.id === id);
    if (!appt) { toast("Appointment not found.", true); return; }
    appt.notes = $("#consultation-notes").value.trim();
    appt.prescription = $("#consultation-prescription").value.trim();
    appt.tests = $$(".doctor-test-check:checked").map(box => { const test=diagnosticTests.find(t=>t.id===box.value); return {id:test.id,name:test.name,available:test.available}; });
    appt.medicines = $$(".doctor-medicine-check:checked").map(box => { const med=pharmacy.find(m=>m.id===box.value); const quantity=Number($(`[data-med-qty="${CSS.escape(box.value)}"]`).value); const directions=$(`[data-med-directions="${CSS.escape(box.value)}"]`).value.trim(); return {id:med.id,name:med.name,quantity:Math.max(1,Math.min(quantity||1,med.stock)),directions,price:Number(med.price)||0}; });
    if (appt.medicines.length && !appt.pharmacySerial) appt.pharmacySerial = `PH-${todayISO().replaceAll("-","")}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    if (!appt.medicines.length) appt.pharmacySerial = "";
    saveState();
    rerenderAll();
    toast(appt.medicines.length ? `Consultation saved. Prescription serial: ${appt.pharmacySerial}` : "Consultation and selected tests saved.");
  });

  $("#mark-completed-btn").addEventListener("click", () => {
    const appt = state.appointments.find(a => a.id === $("#consultation-appointment-id").value);
    if (!appt || appt.status !== "Scheduled") return;
    appt.status = "Completed";
    saveState();
    rerenderAll();
    toast("Appointment marked as completed.");
  });

  $("#staff-login-close").addEventListener("click", () => { closeLogin(); });
  $("#staff-logout").addEventListener("click", () => { switchPortal(); toast("You have been signed out. Choose a portal to continue."); });
  $("#staff-login-form").addEventListener("submit", event => {
    event.preventDefault(); const role = $("#staff-login-role").value; const username = $("#staff-username").value.trim().toLowerCase(); const password = $("#staff-password").value;
    let account = null;
    if (role === "supervisor" && username === "supervisor" && password === "Admin123!") account = {role:"supervisor",name:"Hospital Supervisor"};
    if (role === "pharmacy" && username === "pharmacy" && password === "Pharmacy123!") account = {role:"pharmacy",name:"Pharmacy Desk"};
    if (role === "doctor") { const doctor = doctors.find(d => String(d.username || "").toLowerCase() === username && d.password === password); if (doctor) account = {role:"doctor",name:doctor.name,doctorId:doctor.id}; }
    if (!account || (account.role !== role && !(role === "pharmacy" && account.role === "pharmacy"))) { $("#staff-login-error").textContent = "Incorrect username or password for this portal."; $("#staff-login-error").classList.remove("hidden"); return; }
    currentUser = account; closeLogin(); setRole(role, true); toast(`Welcome, ${account.name}.`);
  });
  $("#patient-form").addEventListener("submit", event => {
    event.preventDefault(); const name=$("#patient-full-name").value.trim(); const phone=$("#patient-phone").value.trim();
    if (state.patients.some(p=>p.name.toLowerCase()===name.toLowerCase() && p.phone===phone)) { toast("That patient profile already exists.", true); return; }
    const profile = {id:`pat-${Date.now()}`,name,age:Number($("#patient-age").value),gender:$("#patient-gender").value,phone,email:$("#patient-email").value.trim(),bloodGroup:$("#patient-blood-group").value,address:$("#patient-address").value.trim(),createdAt:Date.now()};
    state.patients.push(profile);
    if (currentUser?.role === "patient") { currentUser.patientId = profile.id; currentUser.name = profile.name; }
    saveState(); renderPatientDirectory(); $("#patient-form").reset(); toast("Patient details saved to this session. You can now book an appointment using the same details.");
  });
  $("#doctor-enroll-form").addEventListener("submit", event => {
    event.preventDefault(); if (currentUser?.role !== "supervisor") { toast("Supervisor login required.", true); return; }
    const username=$("#new-doctor-username").value.trim().toLowerCase();
    if (doctors.some(d=>String(d.username||"").toLowerCase()===username) || username === "supervisor") { toast("That username is already in use.", true); return; }
    const name=$("#new-doctor-name").value.trim(); const department=$("#new-doctor-department").value; const license=$("#new-doctor-license").value.trim(); const experience=$("#new-doctor-experience").value.trim();
    const initials=name.split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase(); const id=`doc-${Date.now()}`;
    doctors.push({id,name,shortName:name,department,experience,license,title:"Doctor",status:"Available",initials,username,password:$("#new-doctor-password").value,bio:$("#new-doctor-bio").value.trim()||`${department} clinician.`}); state.doctorStatuses[id]="Available"; saveState(); $("#doctor-enroll-form").reset(); rerenderAll(); toast(`Enrolled ${name}. Give them their username and temporary password securely.`);
  });
  $("#stock-form").addEventListener("submit", event => {
    event.preventDefault(); if (currentUser?.role !== "supervisor") { toast("Supervisor login required.", true); return; }
    const name=$("#stock-name").value.trim(); const qty=Number($("#stock-quantity").value); const existing=pharmacy.find(m=>m.name.toLowerCase()===name.toLowerCase());
    if (!Number.isFinite(qty) || qty<1) { toast("Enter a valid stock quantity.", true); return; }
    if (existing) { existing.stock += qty; existing.reorder=Number($("#stock-reorder").value); existing.price=Number($("#stock-price").value)||existing.price; existing.unit=$("#stock-unit").value.trim(); existing.category=$("#stock-category").value.trim(); existing.usage=$("#stock-usage").value.trim()||existing.usage; }
    else pharmacy.push({id:`med-${Date.now()}`,name,category:$("#stock-category").value.trim(),usage:$("#stock-usage").value.trim()||"Hospital stock item",stock:qty,reorder:Number($("#stock-reorder").value),price:Number($("#stock-price").value)||0,unit:$("#stock-unit").value.trim()});
    saveState(); $("#stock-form").reset(); $("#stock-reorder").value=10; $("#stock-price").value=0; rerenderAll(); toast(existing ? "Stock quantity updated." : "New stock item added.");
  });

  document.addEventListener("click", event => {
    const copySerialBtn = event.target.closest("[data-copy-serial]");
    if (copySerialBtn) { navigator.clipboard?.writeText(copySerialBtn.dataset.copySerial).then(()=>toast("Prescription serial copied."),()=>toast("Serial: " + copySerialBtn.dataset.copySerial)); return; }
    const roleBtn = event.target.closest("[data-role]");
    if (roleBtn) { setRole(roleBtn.dataset.role); return; }
    const tabBtn = event.target.closest("[data-ptab]");
    if (tabBtn) { setPatientTab(tabBtn.dataset.ptab); return; }
    const cancelBtn = event.target.closest(".cancel-appointment");
    if (cancelBtn) {
      const appt = state.appointments.find(a => a.id === cancelBtn.dataset.id);
      if (!appt || appt.status !== "Scheduled") return;
      if (!window.confirm(`Cancel the appointment for ${appt.patient} with ${doctorById(appt.doctorId).shortName}?`)) return;
      appt.status = "Cancelled";
      saveState();
      rerenderAll();
      toast("Appointment cancelled.");
      return;
    }
    const bookBtn = event.target.closest(".book-this-doctor");
    if (bookBtn) {
      const doctor = doctorById(bookBtn.dataset.id);
      setPatientTab("appointments");
      $("#book-department").value = doctor.department;
      populateBookingDoctors();
      $("#book-doctor").value = doctor.id;
      $("#book-date").focus();
      return;
    }
    const queueBtn = event.target.closest("[data-select-appointment]");
    if (queueBtn) {
      selectedAppointmentId = queueBtn.dataset.selectAppointment;
      renderDoctorPortal();
    }
  });

  // Demo data reset can be triggered in the browser console with DaktariHubDemo.reset().
  window.DaktariHubDemo = {
    reset() {
      if (!window.confirm("Reset all Daktari Hub demo data in this browser?")) return;
      localStorage.removeItem(STORAGE_KEY);
      state = initialState();
      selectedAppointmentId = null;
      $("#supervisor-search").value = "";
      rerenderAll();
      toast("Demo data reset.");
    },
    exportData() {
      const blob = new Blob([JSON.stringify({appointments:state.appointments,doctorStatuses:state.doctorStatuses,patients:state.patients,doctors:doctors.map(({password,...doctor})=>doctor),pharmacy}, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "daktari-hub-demo-data.json"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  $("#book-date").min = todayISO();
  $("#book-date").value = todayISO();
  populatePatientOptions();
  populateBookingDoctors();
  rerenderAll();
  // Start at the patient portal chooser, but leave the role picker available until a role is selected.
  currentUser = null;
  $$(".role-btn").forEach(btn => btn.classList.remove("hidden"));
  $("#staff-logout").classList.remove("hidden");
  $("#user-display-name").textContent = "Choose a portal";
  $("#user-display-role").textContent = "Signed out";
  $("#user-avatar").textContent = "DH";
  $("#user-avatar-mobile").textContent = "DH";
})();