'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useBooks, useBookRecs, useLearning } from '@/hooks/useBooks';

const TABS = [
  { key: 'reading',      label: '📖 Reading'  },
  { key: 'want_to_read', label: '🔖 Want'      },
  { key: 'read',         label: '✅ Read'      },
] as const;

const STATUS_LABELS: Record<string, string> = { reading: '📖', want_to_read: '🔖', read: '✅' };

export default function BooksPage() {
  const { books, byStatus, addBook, updateStatus, deleteBook, getRecommendations } = useBooks();
  const { recs, addToList, dismiss } = useBookRecs();
  const { topics, addTopic, updateStatus: updateTopicStatus, deleteTopic } = useLearning();

  const [section, setSection]     = useState<'books'|'recs'|'learning'>('books');
  const [bookTab, setBookTab]     = useState<'reading'|'want_to_read'|'read'>('reading');
  const [showAddBook, setShowAddBook]   = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);

  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookStatus, setBookStatus] = useState<'reading'|'want_to_read'|'read'>('want_to_read');
  const [bookSaving, setBookSaving] = useState(false);

  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicSaving, setTopicSaving] = useState(false);

  const handleAddBook = async () => {
    if (!bookTitle.trim()) return;
    setBookSaving(true);
    try { await addBook.mutateAsync({ title: bookTitle.trim(), author: bookAuthor.trim() || undefined, status: bookStatus }); setBookTitle(''); setBookAuthor(''); setShowAddBook(false); }
    finally { setBookSaving(false); }
  };

  const handleAddTopic = async () => {
    if (!topicName.trim()) return;
    setTopicSaving(true);
    try { await addTopic.mutateAsync({ name: topicName.trim(), description: topicDesc.trim() || undefined, status: 'active' }); setTopicName(''); setTopicDesc(''); setShowAddTopic(false); }
    finally { setTopicSaving(false); }
  };

  const visibleBooks = byStatus[bookTab];

  return (
    <div className="px-4 pt-safe-or-4 pb-4">
      <div className="py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-tx tracking-tight">Books</h1>
        <div className="flex gap-2">
          {section === 'books' && <button onClick={() => setShowAddBook(true)} className="bg-books text-white font-semibold rounded-full px-3 py-1.5 text-sm">+ Add</button>}
          {section === 'learning' && <button onClick={() => setShowAddTopic(true)} className="bg-accent text-white font-semibold rounded-full px-3 py-1.5 text-sm">+ Topic</button>}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex bg-elevated rounded-xl p-1 mb-4 gap-1">
        {[{k:'books',l:'Library'},{k:'recs',l:'✦ Recs'},{k:'learning',l:'Learning'}].map(t => (
          <button key={t.k} onClick={() => setSection(t.k as typeof section)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${section === t.k ? 'bg-surface text-tx' : 'text-tm'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Books library */}
      {section === 'books' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {TABS.map(t => (
              <div key={t.key} className="bg-surface border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-books">{byStatus[t.key].length}</p>
                <p className="text-[10px] text-tm mt-0.5 leading-tight">{t.label.split(' ')[1]}</p>
              </div>
            ))}
          </div>
          {/* Status tabs */}
          <div className="flex bg-elevated rounded-xl p-1 mb-4 gap-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setBookTab(t.key)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${bookTab === t.key ? 'bg-surface text-tx' : 'text-tm'}`}>
                {t.label}
              </button>
            ))}
          </div>
          {visibleBooks.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-ts text-sm">Nothing here. {bookTab === 'reading' ? 'Add a book you\'re currently reading.' : bookTab === 'want_to_read' ? 'Add books you want to read.' : 'Mark books as read when you finish them.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleBooks.map(book => (
                <div key={book.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-books/20 flex items-center justify-center flex-shrink-0 text-xl">📚</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-tx leading-snug">{book.title}</p>
                      {book.author && <p className="text-xs text-ts mt-0.5">{book.author}</p>}
                    </div>
                    <button onClick={() => { if (confirm(`Remove "${book.title}"?`)) deleteBook.mutate(book.id); }} className="text-danger text-sm px-1">✕</button>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {TABS.filter(t => t.key !== book.status).map(t => (
                      <button key={t.key} onClick={() => updateStatus.mutateAsync({ id: book.id, status: t.key })}
                        className="text-xs text-ts bg-elevated border border-border rounded-lg px-2.5 py-1.5 active:bg-surface">
                        {STATUS_LABELS[t.key]} {t.label.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Recommendations */}
      {section === 'recs' && (
        <div className="flex flex-col gap-3">
          <button onClick={() => getRecommendations.mutateAsync()} disabled={getRecommendations.isPending}
            className="bg-surface border border-books/40 text-books rounded-xl py-3 text-sm font-medium disabled:opacity-40">
            {getRecommendations.isPending ? 'Generating…' : '✦ Get AI recommendations'}
          </button>
          {recs.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">✨</p>
              <p className="text-tx font-semibold mb-1">No recommendations yet</p>
              <p className="text-ts text-sm">Add books you&apos;ve read, then tap the button above.</p>
            </div>
          ) : (
            recs.map((rec, i) => (
              <div key={rec.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-books/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-books">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-tx">{rec.title}</p>
                    {rec.author && <p className="text-xs text-ts">{rec.author}</p>}
                  </div>
                </div>
                {rec.reason && <p className="text-xs text-ts leading-snug mb-3 italic">{rec.reason}</p>}
                <div className="flex gap-2">
                  <button onClick={() => addToList.mutateAsync(rec)} disabled={rec.added_to_list}
                    className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-colors ${rec.added_to_list ? 'bg-books/20 text-books' : 'bg-books text-white active:scale-95 transition-transform'}`}>
                    {rec.added_to_list ? '✓ Added' : '+ Want to read'}
                  </button>
                  <button onClick={() => dismiss.mutate(rec.id)} className="px-4 text-sm text-tm bg-elevated border border-border rounded-lg py-2">
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Learning topics */}
      {section === 'learning' && (
        <div className="flex flex-col gap-2">
          {topics.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">🎓</p>
              <p className="text-tx font-semibold mb-1">Nothing tracked yet</p>
              <p className="text-ts text-sm">Add skills or subjects you&apos;re learning.</p>
            </div>
          ) : (
            topics.map(topic => (
              <div key={topic.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${topic.status === 'active' ? 'bg-ok' : topic.status === 'paused' ? 'bg-warn' : 'bg-tm'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-tx">{topic.name}</p>
                    {topic.description && <p className="text-xs text-ts mt-0.5 leading-snug">{topic.description}</p>}
                  </div>
                  <button onClick={() => { if (confirm(`Delete "${topic.name}"?`)) deleteTopic.mutate(topic.id); }} className="text-danger text-sm px-1">✕</button>
                </div>
                <div className="flex gap-2 mt-3">
                  {(['active','paused','completed'] as const).filter(s => s !== topic.status).map(s => (
                    <button key={s} onClick={() => updateTopicStatus.mutateAsync({ id: topic.id, status: s })}
                      className="text-xs text-ts bg-elevated border border-border rounded-lg px-2.5 py-1.5 capitalize">
                      {s === 'active' ? '🔥' : s === 'paused' ? '⏸' : '✅'} {s}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add book modal */}
      <Modal open={showAddBook} onClose={() => setShowAddBook(false)} title="Add book">
        <input value={bookTitle} onChange={e => setBookTitle(e.target.value)} placeholder="Title" autoFocus
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-books mb-3" />
        <input value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} placeholder="Author (optional)"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-books mb-3" />
        <div className="flex gap-2 mb-5">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setBookStatus(t.key)} className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${bookStatus === t.key ? 'border-books bg-books/20 text-books' : 'border-border bg-elevated text-tm'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddBook(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Cancel</button>
          <button onClick={handleAddBook} disabled={!bookTitle.trim() || bookSaving} className="flex-1 bg-books text-white font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {bookSaving ? 'Adding…' : 'Add book'}
          </button>
        </div>
      </Modal>

      {/* Add topic modal */}
      <Modal open={showAddTopic} onClose={() => setShowAddTopic(false)} title="New learning topic">
        <input value={topicName} onChange={e => setTopicName(e.target.value)} placeholder="Topic / skill" autoFocus
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-base outline-none focus:border-accent mb-3" />
        <textarea value={topicDesc} onChange={e => setTopicDesc(e.target.value)} placeholder="What do you want to learn? (optional)"
          className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-tx text-sm outline-none focus:border-accent mb-5 h-24 resize-none" />
        <div className="flex gap-3">
          <button onClick={() => setShowAddTopic(false)} className="flex-1 bg-elevated border border-border rounded-xl py-3.5 text-ts text-sm">Cancel</button>
          <button onClick={handleAddTopic} disabled={!topicName.trim() || topicSaving} className="flex-1 bg-accent text-white font-semibold rounded-xl py-3.5 text-sm disabled:opacity-40">
            {topicSaving ? 'Adding…' : 'Add topic'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
