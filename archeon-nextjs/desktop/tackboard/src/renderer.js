/* Renderer stays offline-capable; the preload invokes secure Electron-main network calls.
 * All HTML content is DOM text, never untrusted innerHTML.
 */
(() => {
  'use strict';
  const { blankBoard, validateDoc, applyOperation, replay, COLORS, STATUSES } = globalThis.TackCore;
  const $=id=>document.getElementById(id);
  const E=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  let state={data:blankBoard(),revision:0,pending:[],settings:{theme:'dark',url:'https://archeon.vercel.app',expanded:false,pinned:true,boardId:''},paired:false,cloud:'local',busy:false};
  let showArchive=false,editingId=null,draft=null,syncTimer=null,refreshTimer=null,activePull=false;
  const id=()=>{ if(typeof crypto.randomUUID==='function')return crypto.randomUUID(); const b=new Uint8Array(16);crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
  const now=()=>Date.now();
  const activeBoard=()=>state.settings.boardId && state.data.boards.some(b=>b.id===state.settings.boardId) ? state.settings.boardId : state.data.activeBoardId;
  function quiet(label){state.cloud=label;const translations={local:'LOCAL',online:'CLOUD',syncing:'SYNCING',offline:'OFFLINE',conflict:'REVIEW',connecting:'CONNECTING'};const value=translations[label]||label.toUpperCase();$('quietSync').textContent=value;$('connection').textContent=value==='CLOUD'?'CLOUD / PERSONAL':value==='LOCAL'?'LOCAL / PERSONAL':value;}
  function noteList(){return state.data.notes.filter(n=>n.boardId===activeBoard() && Boolean(n.archivedAt)===showArchive).sort((a,b)=>b.layer-a.layer);}
  function applyTheme(){document.body.dataset.theme=state.settings.theme;$('themeBtn').textContent=state.settings.theme==='dark'?'☼':'☾';$('pinBtn').classList.toggle('active',state.settings.pinned);document.body.dataset.mode=state.settings.expanded?'expanded':'compact';$('expandBtn').textContent=state.settings.expanded?'⤡':'⤢';$('boardMode').textContent=showArchive?'COMPLETED NOTES':state.settings.expanded?'THE PINBOARD':'THE NOTE STACK';$('archiveBtn').classList.toggle('active',showArchive);}
  async function persist(){try{await window.tack.persist({data:state.data,pending:state.pending,revision:state.revision,settings:state.settings});}catch(error){quiet('conflict');$('footSync').textContent='Could not save locally';}}
  function commitOperation(op){
    try{state.data=applyOperation(state.data,op);state.pending.push(op);void persist();render();scheduleSync();}
    catch(error){$('footSync').textContent=error.message||'Unable to save change';}
  }
  function scheduleSync(ms=850){if(!state.paired)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>void pushPending(),ms);}
  async function pushPending(){
    if(!state.paired || state.busy || !state.pending.length)return;
    state.busy=true;quiet('syncing');
    let attempts=0;
    try {
      while(state.pending.length && attempts++<4){
        const captured=state.pending.slice();
        const payload=state.data;
        const result=await window.tack.write(payload,state.revision);
        if(result.ok){
          state.revision=result.revision;
          state.pending.splice(0,captured.length);
          await persist();quiet('online');
          continue;
        }
        if(result.status===409){
          try{
            const cloud=result.data || blankBoard();
            state.data=replay(cloud,state.pending);
            state.revision=result.revision;
            await persist();render();
          }catch(error){quiet('conflict');$('footSync').textContent='An edit needs review · export a backup from the website';return;}
          continue;
        }
        quiet(result.status===401?'conflict':'offline');return;
      }
    }catch{quiet('offline');}
    finally{state.busy=false;render();if(state.pending.length&&state.cloud!=='conflict')scheduleSync(5000);}
  }
  async function pullCloud(force=false){
    if(!state.paired || state.busy || activePull)return;
    if(state.pending.length){scheduleSync(200);return;}
    activePull=true;
    try{
      const res=await window.tack.read();
      if(!res.ok){quiet(res.status===401?'conflict':'offline');return;}
      if(res.data && validateDoc(res.data)){
        if(res.revision!==state.revision || force){state.data=res.data;state.revision=res.revision;await persist();render();}
        quiet('online');
      }else if(!res.data){
        if(!state.pending.length){state.pending.push({type:'new-board',board:state.data.boards[0],at:now()});await persist();scheduleSync(100);}
      }
    }finally{activePull=false;}
  }
  function render(){
    applyTheme();
    const boards=$('boards');const chosen=activeBoard();boards.replaceChildren();
    state.data.boards.forEach(board=>{const opt=E('option','',board.name);opt.value=board.id;boards.append(opt);});boards.value=chosen;
    const notes=noteList();$('noteCount').textContent=String(notes.length).padStart(2,'0')+' NOTES';
    const root=$('notes');root.replaceChildren();
    if(!notes.length){const empty=E('div','note empty',showArchive?'All clear. Your finished notes will collect here.':'Nothing pinned yet. Add a note below.');root.append(empty);return;}
    for(const note of notes){
      const card=E('article','note');card.dataset.color=COLORS.includes(note.color)?note.color:'butter';card.dataset.id=note.id;
      const head=E('div','noteHead'),status=E('span','noteFlag',STATUSES.includes(note.status)?note.status.replace('-',' '):'Planned'), tools=E('div','noteTools');
      const edit=E('button','', '⋯');edit.title=`Edit ${note.title}`;edit.setAttribute('aria-label',`Edit ${note.title}`);edit.onclick=()=>openEditor(note.id);
      const archive=E('button','',showArchive?'↶':'⌁');archive.title=showArchive?'Restore note':'Peel into completed';archive.setAttribute('aria-label',archive.title);
      archive.onclick=()=>{if(showArchive)commitOperation({type:'restore-note',noteId:note.id,at:now()});else peel(card,note.id);};
      tools.append(edit,archive);head.append(status,tools);card.append(head,E('h2','',note.title));
      if(note.body)card.append(E('p','',note.body));
      const list=E('div','noteTasks');for(const task of note.tasks.slice(0,state.settings.expanded?35:3)){
        const label=E('label',`task${task.done?' isDone':''}`);const check=E('input');check.type='checkbox';check.checked=!!task.done;check.setAttribute('aria-label',task.text);
        check.onchange=()=>{
          const checked=check.checked;
          commitOperation({type:'update-task',noteId:note.id,taskId:task.id,field:'done',value:checked,at:now()});
          const current=state.data.notes.find(n=>n.id===note.id);
          if(current?.tasks.length && current.tasks.every(t=>t.done)&&!current.archivedAt&&!showArchive){
            const visual=document.querySelector(`[data-id="${CSS.escape(note.id)}"]`);if(visual)peel(visual,note.id);
          }
        };
        label.append(check,E('span','',task.text));list.append(label);
      }
      card.append(list);
      if(note.tasks.length>3&&!state.settings.expanded)card.append(E('p','',`+ ${note.tasks.length-3} more tasks · edit to view`));
      const done=note.tasks.filter(t=>t.done).length;const foot=E('div','noteFoot');foot.append(E('span','',`${done}/${note.tasks.length} checked`),E('span','','↗'));card.append(foot);root.append(card);
    }
  }
  function peel(card,noteId){
    if(card.classList.contains('peeling'))return;
    card.classList.add('peeling');
    const ms=matchMedia('(prefers-reduced-motion: reduce)').matches?10:1150;
    setTimeout(()=>commitOperation({type:'archive-note',noteId,at:now()}),ms);
  }
  function toggleModal(open){$('modalBackdrop').classList.toggle('hidden',!open);}
  function openSettings(){editingId=null;$('modalTitle').textContent='Desktop connection';$('noteEditor').classList.add('hidden');$('settingsPanel').classList.remove('hidden');$('server').value=state.settings.url;$('pairingKey').value='';$('pairFeedback').textContent=state.paired?'Device connected. Paste a new key to change it.':'Connect to sync across devices.';toggleModal(true);}
  function openEditor(noteId){
    const note=state.data.notes.find(n=>n.id===noteId);if(!note)return;
    editingId=noteId;draft=structuredClone(note);
    $('modalTitle').textContent='Edit sticky note';$('settingsPanel').classList.add('hidden');$('noteEditor').classList.remove('hidden');
    $('editTitle').value=draft.title;$('editBody').value=draft.body;$('editColor').value=draft.color;$('editStatus').value=draft.status;
    renderTasks();toggleModal(true);
  }
  function renderTasks(){
    const root=$('taskEditor');root.replaceChildren();$('taskCount').textContent=`${draft.tasks.length} / 35`;
    for(const t of draft.tasks){
      const row=E('div','editTask');const check=E('input');check.type='checkbox';check.checked=t.done;check.onchange=()=>{t.done=check.checked;};
      const input=E('input');input.type='text';input.maxLength=180;input.value=t.text;input.oninput=()=>{t.text=input.value;};
      const remove=E('button','', '×');remove.title='Remove task';remove.onclick=()=>{draft.tasks=draft.tasks.filter(x=>x.id!==t.id);renderTasks();};
      row.append(check,input,remove);root.append(row);
    }
  }
  function saveEditing(){
    if(!draft)return;
    const old=state.data.notes.find(n=>n.id===editingId);if(!old)return;
    const ops=[];const at=now();
    const fields={title:$('editTitle').value.trim()||'Untitled',body:$('editBody').value,status:$('editStatus').value,color:$('editColor').value};
    for(const [field,value]of Object.entries(fields))if(value!==old[field])ops.push({type:'update-note',noteId:old.id,field,value,at});
    for(const oldTask of old.tasks){const latest=draft.tasks.find(t=>t.id===oldTask.id);
      if(!latest)ops.push({type:'remove-task',noteId:old.id,taskId:oldTask.id,at});
      else {if(latest.text!==oldTask.text)ops.push({type:'update-task',noteId:old.id,taskId:oldTask.id,field:'text',value:latest.text,at});
      if(latest.done!==oldTask.done)ops.push({type:'update-task',noteId:old.id,taskId:oldTask.id,field:'done',value:latest.done,at});}
    }
    for(const task of draft.tasks)if(!old.tasks.some(t=>t.id===task.id)){ops.push({type:'new-task',noteId:old.id,task:{id:task.id,text:task.text},at});if(task.done)ops.push({type:'update-task',noteId:old.id,taskId:task.id,field:'done',value:true,at});}
    for(const op of ops)commitOperation(op);
    toggleModal(false);draft=null;editingId=null;
  }
  async function setup(){
    const boot=await window.tack.load();
    state.settings={...state.settings,...(boot.settings||{})};
    state.data=validateDoc(boot.data)?boot.data:blankBoard();state.revision=boot.revision||0;state.pending=Array.isArray(boot.pending)?boot.pending:[];state.paired=!!boot.paired;
    if(!boot.data){state.pending.push({type:'new-board',board:state.data.boards[0],at:now()});await persist();}
    applyTheme();render();quiet(state.paired?'connecting':'local');
    if(state.paired){if(state.pending.length)scheduleSync(120);else await pullCloud();}
    refreshTimer=setInterval(()=>{if(state.paired){if(state.pending.length)scheduleSync(0);else void pullCloud();}},14000);
  }
  $('boards').onchange=()=>{state.settings.boardId=$('boards').value;void persist();render();};
  $('newBoardBtn').onclick=()=>{
    const name=prompt('What should we call this board?');if(!name?.trim())return;
    if(state.data.boards.length>=100)return;
    commitOperation({type:'new-board',board:{id:id(),name:name.trim().slice(0,58),createdAt:now()},at:now()});
    state.settings.boardId=state.data.activeBoardId;void persist();render();
  };
  $('archiveBtn').onclick=()=>{showArchive=!showArchive;render();};
  $('quickAdd').onsubmit=event=>{event.preventDefault();const title=$('quickTitle').value.trim();if(!title)return;
    const count=state.data.notes.filter(n=>n.boardId===activeBoard()).length;
    const note={id:id(),boardId:activeBoard(),title:title.slice(0,90),body:'',color:COLORS[count%COLORS.length],status:'planned',tasks:[{id:id(),text:title.slice(0,180),done:false}],x:26+(count%3)*272,y:28+Math.floor(count/3)*312,layer:count+1,archivedAt:null,createdAt:now(),updatedAt:now()};
    commitOperation({type:'new-note',note,at:now()});$('quickTitle').value='';
  };
  $('themeBtn').onclick=()=>{state.settings.theme=state.settings.theme==='light'?'dark':'light';applyTheme();void persist();};
  $('pinBtn').onclick=async()=>{state.settings.pinned=!state.settings.pinned;await window.tack.pin(state.settings.pinned);applyTheme();};
  $('expandBtn').onclick=async()=>{state.settings.expanded=!state.settings.expanded;await window.tack.layout(state.settings.expanded);applyTheme();render();};
  $('closeBtn').onclick=()=>void window.tack.close();
  $('settingsBtn').onclick=openSettings;
  $('webBtn').onclick=()=>void window.tack.openWeb();$('webSettings').onclick=()=>void window.tack.openWeb();
  $('modalClose').onclick=()=>toggleModal(false);
  $('modalBackdrop').onclick=e=>{if(e.target===$('modalBackdrop'))toggleModal(false);};
  window.addEventListener('keydown',e=>{if(e.key==='Escape')toggleModal(false);});
  $('taskForm').onsubmit=e=>{e.preventDefault();const text=$('taskText').value.trim();if(!text||draft.tasks.length>=35)return;draft.tasks.push({id:id(),text,done:false});$('taskText').value='';renderTasks();};
  $('saveNote').onclick=saveEditing;
  $('archiveNote').onclick=()=>{if(!editingId)return;commitOperation({type:'archive-note',noteId:editingId,at:now()});toggleModal(false);};
  $('connectBtn').onclick=async()=>{
    const token=$('pairingKey').value.trim();const url=$('server').value;
    if(state.pending.length && !confirm('This computer has '+state.pending.length+' unsynced changes. Connect and merge those notes into the selected Archeon account? Cancel to keep them only on this device.'))return;
    $('pairFeedback').textContent='Connecting…';$('pairFeedback').classList.remove('error');
    if(!token){$('pairFeedback').textContent='Paste a newly generated pairing key from your web account.';return;}
    const res=await window.tack.connect({url,token});
    if(!res.ok){$('pairFeedback').textContent=res.error||'Could not connect.';$('pairFeedback').classList.add('error');return;}
    state.settings.url=url;state.paired=true;state.revision=res.revision??0;
    if(state.pending.length){
      try{state.data=replay(res.data||blankBoard(),state.pending);}catch(error){$('pairFeedback').textContent='Local and cloud changes need review. Your local notes are safe.';quiet('conflict');return;}
      scheduleSync(60);
    }else if(res.data&&validateDoc(res.data))state.data=res.data;
    else {state.pending.push({type:'new-board',board:state.data.boards[0],at:now()});scheduleSync(60);}
    await persist();render();quiet('online');$('pairingKey').value='';toggleModal(false);
  };
  $('disconnect').onclick=async()=>{await window.tack.disconnect();state.paired=false;quiet('local');$('pairFeedback').textContent='Disconnected on this computer. Revoke the old pairing key from the website.';};
  void setup().catch(error=>{$('footSync').textContent='Startup failed: '+String(error?.message||error);});
})();
