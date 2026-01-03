import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
// FIX: Added 'User' to the import list below
import { Layout, Users, Calendar, Clock, LogOut, Briefcase, Settings, ArrowRight, Mail, Send, FileText, BarChart2, Upload, Camera, AlertTriangle, User } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [page, setPage] = useState('landing'); 
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');

  // Handle Verification Link
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify/')) {
        const verifyToken = path.split('/')[2];
        axios.post(`${API_URL}/verify`, { token: verifyToken })
             .then(() => { alert("Email Verified! Please Login."); window.location.href = '/'; })
             .catch(() => alert("Verification Failed"));
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && !user) {
      axios.defaults.headers.common['Authorization'] = savedToken;
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`);
      setUser(res.data);
      setPage('app');
    } catch (err) { logout(); }
  };

  const login = async (email, password, isAdminLogin) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password, isAdminLogin });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = newToken;
      setUser(res.data.user);
      setPage('app');
    } catch (err) { alert(err.response?.data?.error || 'Login Failed'); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setPage('landing');
  };

  if (page === 'landing') return <LandingPage onEnter={() => setPage('auth')} />;
  if (page === 'auth') return <AuthScreen onLogin={login} onBack={() => setPage('landing')} />;
  if (!user && page === 'app') return null;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand"><div style={{width:16, height:16, background:'white', borderRadius:'2px'}}></div> DAYFLOW</div>
        <nav>
          <NavItem icon={<Users size={18}/>} label="Overview" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon={<Mail size={18}/>} label="Messages" active={view === 'messages'} onClick={() => setView('messages')} />
          {user.role === 'Admin' && <NavItem icon={<Briefcase size={18}/>} label="Payroll / Staff" active={view === 'employees'} onClick={() => setView('employees')} />}
          <NavItem icon={<Clock size={18}/>} label="Attendance" active={view === 'attendance'} onClick={() => setView('attendance')} />
          <NavItem icon={<Calendar size={18}/>} label="Time Off" active={view === 'leaves'} onClick={() => setView('leaves')} />
          {user.role === 'Admin' && <NavItem icon={<Settings size={18}/>} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <NavItem icon={<LogOut size={18}/>} label="Log Out" onClick={logout} />
        </div>
      </aside>

      <main className="main-content">
        <div className="spotlight-bg"></div>
        <header className="stagger-1">
          <h2 style={{color: 'white'}}>{user.role === 'Admin' ? 'Admin Console' : 'Employee Hub'}</h2>
          <p style={{color:'#525252'}}>Logged in as {user.name} <span style={{fontSize:'12px', border:'1px solid #333', padding:'2px 6px', borderRadius:'4px', marginLeft:'10px'}}>{user.employeeId}</span></p>
        </header>
        
        <div style={{marginTop:'40px'}}>
          {view === 'dashboard' && <Dashboard user={user} />}
          {view === 'messages' && <Messages user={user} />}
          {view === 'employees' && <EmployeeList user={user} />}
          {view === 'attendance' && <Attendance user={user} />}
          {view === 'leaves' && <Leaves user={user} />}
          {view === 'settings' && <Profile user={user} refresh={fetchProfile} />}
        </div>
      </main>
    </div>
  );
}

// --- COMPONENTS ---

function LandingPage({ onEnter }) {
  return (
    <div className="landing-container">
      <div className="spotlight-bg"></div>
      <h1 className="landing-title stagger-1">DAYFLOW</h1>
      <p className="landing-quote stagger-2">"STAY IN FLOW."</p>
      <button className="btn btn-primary stagger-3" style={{width:'auto', padding:'16px 60px', borderRadius:'30px'}} onClick={onEnter}>
        ENTER WORKSPACE <ArrowRight size={16} style={{marginLeft:'10px', verticalAlign:'middle'}}/>
      </button>
    </div>
  );
}

function Profile({ user, refresh }) {
    const handleUpload = (e, type) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        axios.post(`${API_URL}/upload`, formData).then(() => { alert("Uploaded!"); refresh(); });
    };

    return (
        <div className="grid-3 stagger-2">
            <div className="matte-card" style={{textAlign:'center'}}>
                <div style={{width:100, height:100, borderRadius:'50%', background:'#333', margin:'0 auto 15px', overflow:'hidden', position:'relative'}}>
                    {user.profilePic ? <img src={user.profilePic} alt="pic" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <User size={50} style={{marginTop:25, color:'#777'}}/>}
                </div>
                <label className="btn btn-secondary" style={{padding:'8px 16px', display:'inline-block', width:'auto'}}>
                    <Camera size={14} style={{marginRight:5}}/> Change Photo
                    <input type="file" hidden onChange={(e) => handleUpload(e, 'profile')}/>
                </label>
            </div>
            <div className="matte-card" style={{gridColumn:'span 2'}}>
                <h3>My Details</h3>
                <div className="grid-3">
                    <div><label style={{color:'#555', fontSize:12}}>Full Name</label><input disabled value={user.name}/></div>
                    <div><label style={{color:'#555', fontSize:12}}>Email</label><input disabled value={user.email}/></div>
                    <div>
                        <label style={{color:'#555', fontSize:12}}>Documents</label>
                        {user.document ? <a href={user.document} target="_blank" style={{color:'white', display:'block', marginTop:10, fontSize:14}}>View Document</a> : <p style={{color:'#333', marginTop:10}}>No docs uploaded</p>}
                        <label className="btn btn-secondary" style={{marginTop:10, display:'block'}}>
                            <Upload size={14} style={{marginRight:5}}/> Upload ID Proof
                            <input type="file" hidden onChange={(e) => handleUpload(e, 'doc')}/>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Attendance({ user }) {
  const [logs, setLogs] = useState([]);
  const [isHalfDay, setIsHalfDay] = useState(false);
  useEffect(() => { axios.get(`${API_URL}/attendance`).then(res => setLogs(res.data)) }, []);
  
  const mark = (type) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const url = type === 'in' ? `${API_URL}/attendance/checkin` : `${API_URL}/attendance/checkout`;
    axios[type === 'in' ? 'post' : 'put'](url, type === 'in' ? { date: today, checkIn: time, type: isHalfDay ? 'Half-day' : 'Present' } : { date: today, checkOut: time }).then(() => window.location.reload());
  };

  const processAbsentees = () => {
      if(!window.confirm("Mark all employees without records today as Absent?")) return;
      axios.post(`${API_URL}/attendance/mark-absent`).then(res => { alert(res.data.message); window.location.reload(); });
  };

  const presentCount = logs.filter(l => l.status === 'Present').length;
  const halfDayCount = logs.filter(l => l.status === 'Half-day').length;
  const absentCount = logs.filter(l => l.status === 'Absent').length;
  const total = logs.length || 1; 

  return (
    <div className="stagger-2">
      <div className="matte-card" style={{display:'flex', gap:'20px', alignItems:'center', marginBottom:'20px'}}>
        <BarChart2 size={24} color="#525252"/> 
        <div style={{flex:1}}>
             <p style={{fontSize:'11px', color:'#525252', marginBottom:'8px', textTransform:'uppercase'}}>Attendance Metrics</p>
             <div style={{height:'6px', width:'100%', background:'#1a1a1a', borderRadius:'3px', overflow:'hidden', display:'flex'}}>
                 <div style={{width: `${(presentCount/total)*100}%`, background:'#ffffff'}}></div>
                 <div style={{width: `${(halfDayCount/total)*100}%`, background:'#facc15'}}></div>
                 <div style={{width: `${(absentCount/total)*100}%`, background:'#ef4444'}}></div>
             </div>
             <div style={{display:'flex', gap:'15px', marginTop:'5px', fontSize:'10px', color:'#777'}}>
                 <span>Present: {presentCount}</span><span>Half-Day: {halfDayCount}</span><span style={{color:'#ef4444'}}>Absent: {absentCount}</span>
             </div>
        </div>
      </div>

      <div className="matte-card">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
          <h3>Log Book</h3>
          {user.role === 'Employee' ? (
             <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <label style={{fontSize:'12px', color:'#777', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                    <input type="checkbox" style={{width:'auto', margin:0}} onChange={e => setIsHalfDay(e.target.checked)}/> Half-Day
                </label>
                <button className="btn btn-primary" style={{width:'auto'}} onClick={() => mark('in')}>IN</button>
                <button className="btn btn-secondary" style={{width:'auto'}} onClick={() => mark('out')}>OUT</button>
             </div>
          ) : (
             <button className="btn btn-secondary" style={{width:'auto', color:'#ef4444', borderColor:'#ef4444'}} onClick={processAbsentees}>
                <AlertTriangle size={14} style={{marginRight:5}}/> Mark Absentees
             </button>
          )}
        </div>
        <table>
          <thead><tr><th>Date</th>{user.role === 'Admin' && <th>User</th>}<th>In</th><th>Out</th><th>Status</th></tr></thead>
          <tbody>{logs.map((log, i) => (<tr key={i}><td>{log.date}</td>{user.role === 'Admin' && <td>{log.name}</td>}<td>{log.checkIn}</td><td>{log.checkOut || '-'}</td><td><span className="status-badge" style={{background: log.status==='Half-day'?'#facc15': log.status==='Absent'?'#ef4444':'#fff', color: log.status==='Present'?'#000':'#fff'}}>{log.status}</span></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

function Messages({ user }) {
  const [inbox, setInbox] = useState([]);
  const [users, setUsers] = useState([]);
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
    axios.get(`${API_URL}/messages`).then(res => setInbox(res.data));
    if(user.role === 'Admin') axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
  }, [user.role]);

  const send = () => {
    let receiverId = 1, receiverName = 'HR Dept';
    if (user.role === 'Admin') {
        const u = users.find(u => u.id == compose.to);
        if(u) { receiverId = u.id; receiverName = u.name; }
    }
    axios.post(`${API_URL}/messages`, {
      senderName: user.name, receiverId: receiverId, receiverName: receiverName, subject: compose.subject, body: compose.body
    }).then(() => { alert('Message Sent'); setCompose({ to: '', subject: '', body: '' }); });
  };

  return (
    <div className="grid-3 stagger-2">
      <div className="matte-card" style={{gridColumn:'span 1'}}>
        <h3>Compose</h3>
        {user.role === 'Admin' ? (
           <select onChange={e => setCompose({...compose, to: e.target.value})}>
             <option>Select Employee</option>
             {users.filter(u => u.role !== 'Admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
           </select>
        ) : <p style={{fontSize:'14px', color:'white', marginBottom:'10px'}}>To: <b>HR Department</b></p>}
        <input placeholder="Subject" value={compose.subject} onChange={e => setCompose({...compose, subject: e.target.value})} />
        <textarea placeholder="Write your message..." rows={6} value={compose.body} onChange={e => setCompose({...compose, body: e.target.value})} />
        <button className="btn btn-primary" style={{marginTop:'20px'}} onClick={send}><Send size={14} style={{marginRight:5}}/> SEND</button>
      </div>
      <div className="matte-card" style={{gridColumn:'span 2'}}>
        <h3>Incoming</h3>
        {inbox.length === 0 ? <p style={{color:'#333'}}>No messages.</p> : inbox.map((msg, i) => (
          <div key={i} style={{borderBottom:'1px solid #262626', padding:'15px 0'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
              <span style={{color:'white', fontWeight:'600'}}>{msg.senderName}</span>
              <span style={{fontSize:'11px', color:'#525252'}}>{msg.date}</span>
            </div>
            <div style={{fontWeight:'500', marginBottom:'5px', color:'#a3a3a3'}}>{msg.subject}</div>
            <p style={{fontSize:'13px', color:'#525252'}}>{msg.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeeList({ user }) {
  const [employees, setEmployees] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { axios.get(`${API_URL}/users`).then(res => setEmployees(res.data)) }, []);
  const startEdit = (emp) => { setEditId(emp.id); setEditForm(emp); };
  const save = () => { axios.put(`${API_URL}/users/${editId}`, editForm).then(() => { setEditId(null); axios.get(`${API_URL}/users`).then(res => setEmployees(res.data)); }); };

  const printSlip = (emp) => {
      const win = window.open('', '', 'width=800,height=600');
      win.document.write(`
        <html><head><title>Salary Slip</title><style>body{font-family:'Courier New', monospace; padding:40px; border:1px solid #000; max-width:600px; margin:auto;} .header{text-align:center; border-bottom:1px solid #000; padding-bottom:20px; margin-bottom:20px;} table{width:100%;} td{padding:5px 0;}</style></head>
        <body><div class="header"><h1>DAYFLOW INC.</h1><p>OFFICIAL PAYSLIP</p></div>
        <table><tr><td>NAME:</td><td>${emp.name}</td></tr><tr><td>ID:</td><td>${emp.employeeId}</td></tr><tr><td>ROLE:</td><td>${emp.jobTitle}</td></tr></table>
        <hr/><table><tr><td>EARNINGS</td><td style="text-align:right">$${emp.salary.toLocaleString()}</td></tr></table><hr/>
        <script>window.print();</script></body></html>
      `);
  };

  return (
    <div className="matte-card stagger-2">
      <h3>Staff Directory & Payroll</h3>
      <table>
        <thead><tr><th>Employee</th><th>Role</th><th>Dept</th><th>Comp (USD)</th><th>Controls</th></tr></thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr key={i}>
              <td style={{color:'white'}}>{emp.name} <br/><span style={{fontSize:'10px', color:'#525252'}}>{emp.employeeId}</span></td>
              <td><span className="status-badge">{emp.role}</span></td>
              <td>{editId === emp.id ? <input value={editForm.department} onChange={e=>setEditForm({...editForm, department:e.target.value})}/> : emp.department}</td>
              <td>{editId === emp.id ? <input type="number" value={editForm.salary} onChange={e=>setEditForm({...editForm, salary:e.target.value})}/> : `$${emp.salary.toLocaleString()}`}</td>
              <td style={{display:'flex', gap:'10px'}}>
                {user.role === 'Admin' && (
                  <>
                  {editId === emp.id ? <button className="btn btn-primary" style={{padding:'6px 12px', width:'auto'}} onClick={save}>SAVE</button> : <button className="btn btn-secondary" style={{padding:'6px 12px', width:'auto'}} onClick={() => startEdit(emp)}>EDIT</button>}
                  <button className="btn btn-secondary" style={{padding:'6px 12px', width:'auto'}} onClick={() => printSlip(emp)}><FileText size={14}/></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Leaves({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ type: 'Sick', start: '', end: '', remarks: '' });
  const refresh = () => axios.get(`${API_URL}/leaves`).then(res => setLeaves(res.data));
  useEffect(() => { refresh() }, []);
  const apply = () => axios.post(`${API_URL}/leaves`, form).then(() => { alert('Applied'); refresh(); });
  
  const update = (id, status) => {
      const reason = prompt(`Enter remarks for ${status}:`, "Processed by Admin");
      if(reason !== null) {
          axios.put(`${API_URL}/leaves/${id}`, { status, adminRemarks: reason }).then(refresh);
      }
  };

  return (
    <div className="grid-3 stagger-2">
      {user.role === 'Employee' && (
        <div className="matte-card"><h3>New Request</h3><select onChange={e=>setForm({...form, type:e.target.value})}><option>Sick</option><option>Casual</option></select><input type="date" onChange={e=>setForm({...form, start:e.target.value})}/><input type="date" onChange={e=>setForm({...form, end:e.target.value})}/><input placeholder="Reason" onChange={e=>setForm({...form, remarks:e.target.value})}/><button className="btn btn-primary" style={{marginTop:'20px'}} onClick={apply}>SUBMIT</button></div>
      )}
      <div className="matte-card" style={{gridColumn: user.role === 'Employee' ? 'span 2' : 'span 3'}}>
        <h3>History</h3>
        <table><thead><tr><th>Type</th>{user.role === 'Admin' && <th>User</th>}<th>Remarks</th><th>Admin Note</th><th>Status</th><th>Controls</th></tr></thead><tbody>
        {leaves.map((l, i) => (
            <tr key={i}>
                <td>{l.type}</td>
                {user.role === 'Admin' && <td>{l.name}</td>}
                <td style={{fontSize:'12px', color:'#777'}}>{l.remarks}</td>
                <td style={{fontSize:'12px', color:'#fff'}}>{l.adminRemarks || '-'}</td>
                <td><span className="status-badge">{l.status}</span></td>
                <td>{user.role === 'Admin' && l.status === 'Pending' ? <div style={{display:'flex', gap:'5px'}}><button className="btn btn-secondary" style={{padding:'4px 8px'}} onClick={()=>update(l.id,'Approved')}>✓</button><button className="btn btn-secondary" style={{padding:'4px 8px'}} onClick={()=>update(l.id,'Rejected')}>✕</button></div> : '-'}</td>
            </tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  return (
    <div className="grid-3 stagger-2">
      <div className="matte-card"><h3>Compensation</h3><div className="stat-val">${user.salary?.toLocaleString() || 0}</div></div>
      <div className="matte-card"><h3>Designation</h3><div className="stat-val" style={{fontSize:'24px'}}>{user.jobTitle || 'N/A'}</div><p style={{color:'#525252', marginTop:'5px'}}>{user.department}</p></div>
      <div className="matte-card"><h3>Access</h3><div className="stat-val" style={{fontSize:'24px'}}>{user.role}</div></div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) { return <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon} <span>{label}</span></div>; }

function AuthScreen({ onLogin, onBack }) {
  const [mode, setMode] = useState('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({});

  const submit = async () => {
    try {
      if (mode === 'login') await onLogin(form.email, form.password, isAdmin);
      else if (mode === 'signup') {
        if(form.password.length < 8) return alert("Password must be 8+ chars.");
        await axios.post(`${API_URL}/signup`, { ...form, role: isAdmin ? 'Admin' : 'Employee' });
        alert('Registered! Please check your Server Console for the Verify Link.'); setMode('login');
      } else { await axios.post(`${API_URL}/reset-password`, form); alert('Password Reset'); setMode('login'); }
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  return (
    <div className="landing-container">
      <div className="login-box stagger-1">
        {mode === 'login' && <div className="toggle-switch"><div className={`toggle-opt ${!isAdmin?'active':''}`} onClick={()=>setIsAdmin(false)}>EMPLOYEE</div><div className={`toggle-opt ${isAdmin?'active':''}`} onClick={()=>setIsAdmin(true)}>ADMINISTRATOR</div></div>}
        <h2 style={{fontSize:'24px', marginBottom:'20px', letterSpacing:'-1px'}}>{mode === 'login' ? 'ACCESS' : mode === 'signup' ? 'REGISTER' : 'RECOVER'}</h2>
        {mode === 'signup' && <><input placeholder="FULL NAME" onChange={e=>setForm({...form, name:e.target.value})}/><input placeholder="EMPLOYEE ID" onChange={e=>setForm({...form, employeeId:e.target.value})}/></>}
        {mode === 'forgot' && <input placeholder="EMPLOYEE ID" onChange={e=>setForm({...form, employeeId:e.target.value})}/>}
        <input placeholder="EMAIL ADDRESS" onChange={e=>setForm({...form, email:e.target.value})}/>
        <input type="password" placeholder="PASSWORD" onChange={e=>setForm({...form, password:e.target.value})}/>
        <button className="btn btn-primary" style={{marginTop:'25px'}} onClick={submit}>SUBMIT</button>
        <div style={{marginTop:'20px', display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#525252', letterSpacing:'0.5px', textTransform:'uppercase'}}><span style={{cursor:'pointer'}} onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?"CREATE ACCOUNT":"LOGIN"}</span><span style={{cursor:'pointer'}} onClick={onBack}>BACK TO HOME</span></div>
      </div>
    </div>
  );
}