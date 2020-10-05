var noteId = 0

if (localStorage.getItem("notes") === null) {
    localStorage.setItem("notes", JSON.stringify([]));
}

class Note{
    constructor({id, title, body, date}, notesManager){
        if (id == undefined){
            id = 'nt' + noteId
        }
        this.id = id;
        this.active = null;
        noteId++;
        this.title = title;
        this.body = body;
        this.date = date;
        this.el = null;
        this.notesManager = notesManager;
    }
    getElement(){
        const tpl = this.getTemplate();
        const tmpDiv = document.createElement('li');
        tmpDiv.innerHTML = tpl.replace('{{date}}', this.date).replace('{{id}}', this.id);
        this.el = tmpDiv.children[0];

        this.attachEventListeners();
        
        return this.el;
    }

    getTemplate(){
        return `
            <li id={{id}}>
                <span class="remove-note">
                    <i class="fas fa-times"></i>
                </span>
                <p class="note-title" contenteditable></p>
                <span class="date">{{date}}</span>
            </li>
        `
    }

    attachEventListeners(){
        const btnClose = this.el.querySelector('.remove-note');
        btnClose.onclick = () => {
            this.notesManager.removeNote(this);
        }; 
        const noteTitle = this.el.querySelector('.note-title');
        noteTitle.innerHTML = this.notesManager.notes.filter((nt) => {return nt.id == this.id})[0]['title'];
        noteTitle.oninput = () => {
            this.notesManager.pushToTop(this.id);
            this.notesManager.notes.filter((nt) => {return nt.id == this.id})[0]['title'] = noteTitle.innerHTML;
            this.notesManager.updateStorage();
        }
        
    }
}

class NotesManager{
    constructor({el, notes}){
        this.el = el;
        this.notes = notes.map(note => new Note(note, this));
        this.notesIds = [];
        this.renderNotes();
    }

    renderNotes(){
        this.notesIds = [];
        this.el.innerHTML = '';
        this.notes.forEach(note => {
            this.renderNote(note.getElement());
            this.notesIds.push(note.id)  
        });
        this.updateStorage();

    }

    renderNote(noteEl){
        this.el.appendChild(noteEl);
    }

    removeNote(note){
        this.notes.splice(this.notes.indexOf(note), 1);
        this.renderNotes();
        noteId -= 1

    }
    
    prependNote(note){
        const newNote = new Note(note, this);
        this.notes.unshift(newNote);
        this.renderNotes();

    }
    updateStorage(){
        var tmpNotes = [];
        this.notes.forEach(note => {
            tmpNotes.push({
                id: note.id,
                active: note.active,
                title: note.title,
                body: note.body,
                date: note.date,
            }) 
        });
        localStorage.setItem('notes', JSON.stringify(tmpNotes))
    }

    pushToTop(id){
        var first = this.notes.filter((note) => {return note.id == id})[0]
        this.notes = this.notes.sort(function(x,y){ return x == first ? -1 : y == first ? 1 : 0; });

    }
}

const noteManager = new NotesManager({
    el: document.querySelector('.notes-list'),
    notes: JSON.parse(localStorage.getItem('notes')),
})

const newNoteBtn = document.querySelector('.add-btn');
newNoteBtn.onclick = () => {
    noteManager.prependNote({

        title: 'New note',
        body: '',
        date: new Date().toLocaleString()
    })
}

function deactivateAll(){
    noteManager.notes.forEach(el => el.active = false)
    if (noteManager.notesIds){
        noteManager.notesIds.forEach(ntId => document.getElementById(ntId).classList.remove('active-note'));
    }
    
}

function markActiveNote(id){
    deactivateAll()
    for (el of noteManager.notes){
        if (el.id == id){
            el.active = true;
        }
    }
    document.getElementById(id).classList.add('active-note');
    noteManager.updateStorage();
}

function switchToEditActive(){
    var activeNoteId = noteManager.notes.filter((note) => {return note.active})[0].id
    const noteTextArea = document.querySelector('.note-text-area');
    noteTextArea.value = noteManager.notes.filter((note) => {return note.active})[0].body;
    noteTextArea.oninput = () => {
        noteManager.pushToTop(activeNoteId)
        noteManager.notes.filter((note) => {return note.active})[0].body = noteTextArea.value;
        noteManager.notes.filter((note) => {return note.active})[0].date = new Date().toLocaleString();
        noteManager.renderNotes();
        markActiveNote(activeNoteId);
        }
}

var _id;
const notesList = document.querySelector('.notes-container')
notesList.onclick = function(event) {
    _id = event['path'][0].id;
    if (!_id){
        _id = event['path'][1].id;
    }
    if (_id && noteManager.notesIds.includes(_id)){
        window.location.hash = '#' + _id;
        event.preventDefault();    
        markActiveNote(_id);
        switchToEditActive();
    }
    else{
        window.location.hash = '';
    }

};

const txtArea = document.querySelector('.note-text-area');
txtArea.onclick = () => {
    noteManager.renderNotes()
}


window.onhashchange = () => {
    var nt_id = window.location.hash.slice(1)
    if (noteManager.notesIds.includes(nt_id)){
        markActiveNote(nt_id);
        switchToEditActive();
    }
};

window.onload = () => {
    var nt_id = window.location.hash.slice(1)
    
    if (noteManager.notesIds.includes(nt_id)){
        markActiveNote(nt_id);
        switchToEditActive();
    }
}

