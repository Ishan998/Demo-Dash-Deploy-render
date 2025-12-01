import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Note } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { ICONS } from '../constants';
import * as api from '../services/apiService';

interface NotepadModalProps {
  onClose: () => void;
}

type SaveStatus = 'unsaved' | 'saving' | 'saved';

const NotepadModal: React.FC<NotepadModalProps> = ({ onClose }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Load notes from API on mount
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedNotes = await api.getNotes();
        setNotes(fetchedNotes);
        if (fetchedNotes.length > 0) {
          setSelectedNoteId(fetchedNotes[0].id);
          setEditorContent(fetchedNotes[0].content);
        }
      } catch (err) {
        setError('Failed to load notes. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, []);

  
  // Autosave logic
useEffect(() => {
  const originalContent = notes.find(n => n.id === selectedNoteId)?.content;
  if (originalContent === editorContent || !selectedNoteId) {
    return;
  }

  setSaveStatus('unsaved');

  if (debounceTimeoutRef.current) {
    clearTimeout(debounceTimeoutRef.current);
  }

  // capture noteId at this moment
  const noteId = selectedNoteId;

  debounceTimeoutRef.current = window.setTimeout(async () => {
    setSaveStatus('saving');
    setError(null);

    try {
      const updatedNote = await api.updateNote(noteId, editorContent);

      // Update the note in the local state and re-sort
      const updatedNotes = notes
        .map(note => note.id === noteId ? updatedNote : note)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setNotes(updatedNotes);
      setSaveStatus('saved');
    } catch (err) {
      console.error("Failed to save note:", err);
      setError('Could not save note.');
      setSaveStatus('unsaved');
    }
  }, 1500);

  return () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };
}, [editorContent, selectedNoteId, notes]);

  
  // Autosave logic
  // useEffect(() => {
  //   const originalContent = notes.find(n => n.id === selectedNoteId)?.content;
  //   if (originalContent === editorContent || !selectedNoteId) {
  //     return;
  //   }

  //   setSaveStatus('unsaved');
  //   if (debounceTimeoutRef.current) {
  //     clearTimeout(debounceTimeoutRef.current);
  //   }

  //   debounceTimeoutRef.current = window.setTimeout(async () => {
  //     setSaveStatus('saving');
  //     setError(null);
  //     try {
  //       const updatedNote = await api.updateNote(selectedNoteId, editorContent);
  //       // Update the note in the local state and re-sort
  //       const updatedNotes = notes
  //           .map(note => note.id === selectedNoteId ? updatedNote : note)
  //           .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  //       setNotes(updatedNotes);
  //       setSaveStatus('saved');
  //     } catch (err) {
  //       console.error("Failed to save note:", err);
  //       setError('Could not save note.');
  //       setSaveStatus('unsaved');
  //     }
  //   }, 1500);

  //   return () => {
  //     if (debounceTimeoutRef.current) {
  //       clearTimeout(debounceTimeoutRef.current);
  //     }
  //   };
  // }, [editorContent, selectedNoteId]);


  const filteredNotes = useMemo(() => {
      if (!searchTerm) return notes;
      return notes.filter(note => 
          note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [notes, searchTerm]);

  const handleSelectNote = (note: Note) => {
    if (saveStatus === 'saving') return;
    setSelectedNoteId(note.id);
    setEditorContent(note.content);
    setSaveStatus('saved');
    setError(null);
  };

  // const handleNewNote = async () => {
  //   if (saveStatus === 'saving') return;
  //   setError(null);
  //   try {
  //     const newNote = await api.createNote("");
  //     const updatedNotes = [newNote, ...notes];
  //     setNotes(updatedNotes);
  //     setSelectedNoteId(newNote.id);
  //     setEditorContent('');
  //     setSaveStatus('saved');
  //   } catch (err) {
  //     setError("Failed to create a new note.");
  //   }
  // };

  // New note creation

  
const handleNewNote = async () => {
  if (saveStatus === 'saving') return;
  setError(null);
  try {
    const newNote = await api.createNote("");  // ensure empty string
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setSelectedNoteId(newNote.id);
    setEditorContent(newNote.content); // use backend response
    setSaveStatus('saved');
  } catch (err) {
    setError("Failed to create a new note.");
  }
};


  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setError(null);
    try {
        await api.deleteNote(noteToDelete.id);
        
        const updatedNotes = notes.filter(note => note.id !== noteToDelete.id);
        setNotes(updatedNotes);
        
        if (selectedNoteId === noteToDelete.id) {
            const nextNote = updatedNotes[0] || null;
            if(nextNote) {
                handleSelectNote(nextNote);
            } else {
                setSelectedNoteId(null);
                setEditorContent('');
            }
        }
    } catch (err) {
        setError(`Failed to delete note: ${noteToDelete.id}`);
    } finally {
        setIsDeleteModalOpen(false);
        setNoteToDelete(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent).then(() => {
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    });
  };
  
  const getNoteTitle = (content: string) => {
    const firstLine = content.split('\n')[0].trim();
    return firstLine.substring(0, 40) || 'Untitled Note';
  };
  
  const getSaveStatusIndicator = () => {
    if (error) return <span className="text-sm text-red-600">{error}</span>;
    switch(saveStatus) {
        case 'unsaved': return <span className="text-sm text-yellow-600">Unsaved changes...</span>;
        case 'saving': return <span className="text-sm text-blue-600">Saving...</span>;
        case 'saved': return <span className="text-sm text-green-600">Saved</span>;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
        <div className="bg-card w-full max-w-4xl h-full max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-text-primary">My Notepad</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>

          <main className="flex flex-1 overflow-hidden">
            <aside className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
              <div className="p-2 border-b">
                <button onClick={handleNewNote} className="w-full text-left bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition">
                  + Create New Note
                </button>
              </div>
               <div className="p-2 border-b">
                 <div className="relative">
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 w-full rounded-md border bg-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {ICONS.search}
                    </div>
                 </div>
               </div>
              <nav className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading notes...</div>
                ) : filteredNotes.length > 0 ? filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-4 cursor-pointer border-l-4 group flex justify-between items-start ${selectedNoteId === note.id ? 'border-primary bg-blue-50' : 'border-transparent hover:bg-gray-100'}`}
                  >
                    <div>
                        <h3 className="font-semibold truncate text-text-primary">{getNoteTitle(note.content)}</h3>
                        <p className="text-xs text-text-secondary mt-1">{new Date(note.updatedAt).toLocaleString()}</p>
                    </div>
                     <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(note); }} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete note">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )) : (
                    <div className="text-center p-8 text-sm text-gray-500">
                        {searchTerm ? "No notes found." : "Create your first note!"}
                    </div>
                )}
              </nav>
            </aside>

            <section className="w-2/3 flex flex-col">
              {selectedNoteId ? (
                <textarea
                  key={selectedNoteId}
                  className="flex-1 w-full p-6 resize-none focus:outline-none text-base leading-relaxed"
                  placeholder="Start typing your note here..."
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                />
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <h3 className="mt-4 text-lg font-semibold">Select a note or create a new one</h3>
                    <p className="mt-1 max-w-xs">Your notes will be saved automatically as you type.</p>
                 </div>
              )}
            </section>
          </main>
          
          <footer className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div>{selectedNoteId && getSaveStatusIndicator()}</div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button onClick={handleCopy} disabled={!editorContent} className="text-text-secondary font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  Copy Note
                </button>
                {showCopiedMessage && <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2">Copied!</span>}
              </div>
            </div>
          </footer>

        </div>
      </div>
      {noteToDelete && (
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Note?"
            message={`Are you sure you want to permanently delete the note "${getNoteTitle(noteToDelete.content)}"? This action cannot be undone.`}
            confirmButtonText="Delete"
            confirmButtonVariant="danger"
        />
      )}
    </>
  );
};

export default NotepadModal;
