import { useMemo, useRef, useState } from 'react';
import { todayKey } from '../../lib/dateUtils.js';
import { useStore } from '../../store/storeContext.js';
import { CATEGORIES, JOURNAL_PROMPTS, pickDaily } from '../../store/defaults.js';

const MOOD_FACES = ['😞', '😕', '😐', '🙂', '😄'];
const ENERGY_FACES = ['🪫', '🔋', '🔋', '⚡', '⚡'];

const splitTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const splitLines = (value) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function JournalView() {
  const { state, actions } = useStore();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [tagText, setTagText] = useState('');
  const [gratitudeText, setGratitudeText] = useState('');
  const editorRef = useRef(null);

  const dailyPrompt = useMemo(() => pickDaily(JOURNAL_PROMPTS, todayKey()), []);
  const journal = state.journal || [];
  const totalWords = journal.reduce((sum, entry) => sum + (Number(entry.words) || 0), 0);
  const selectedTags = splitTags(tagText).map((tag) => tag.toLowerCase());
  const canSave = content.trim().length > 0;

  const focusEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    editorRef.current?.focus();
  };

  const usePrompt = () => {
    if (!content.trim()) setContent(`${dailyPrompt}\n\n`);
    focusEditor();
  };

  const toggleCategoryTag = (tag) => {
    const normalized = tag.toLowerCase();
    const next = selectedTags.includes(normalized)
      ? splitTags(tagText).filter((item) => item.toLowerCase() !== normalized)
      : [...splitTags(tagText), tag];
    setTagText(next.join(', '));
  };

  const resetForm = () => {
    setContent('');
    setMood(null);
    setEnergy(null);
    setTagText('');
    setGratitudeText('');
  };

  const saveEntry = (event) => {
    event.preventDefault();
    if (!canSave) return;

    actions.addJournal({
      content,
      mood,
      energy,
      tags: splitTags(tagText),
      gratitude: splitLines(gratitudeText),
    });
    resetForm();
  };

  const deleteEntry = (id) => {
    if (window.confirm('Delete this journal entry?')) actions.deleteJournal(id);
  };

  return (
    <div className="view">
      <div className="vtitle">
        <h2>Journal</h2>
      </div>
      <div className="view-sub">Reflect daily. Reflection compounds insight.</div>

      <div className="stack">
        <section className="panel panel-p">
          <div className="section-h">
            <h3>Today&apos;s prompt</h3>
            <button className="btn sm ghost" type="button" onClick={usePrompt}>
              Use prompt
            </button>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.55 }}>
            <span aria-hidden="true">💡</span> {dailyPrompt}
          </p>
        </section>

        <form className="panel panel-p stack" onSubmit={saveEntry}>
          <div className="field">
            <label htmlFor="journal-content">Reflection</label>
            <textarea
              ref={editorRef}
              id="journal-content"
              className="input"
              placeholder="What happened today? What did you learn?"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={7}
            />
          </div>

          <div className="grid g2">
            <div className="field">
              <label>Mood</label>
              <div className="mood-scale" aria-label="Mood">
                {MOOD_FACES.map((face, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={face}
                      className={`mood-face${mood === value ? ' sel' : ''}`}
                      type="button"
                      aria-label={`Mood ${value} of 5`}
                      aria-pressed={mood === value}
                      onClick={() => setMood(mood === value ? null : value)}
                    >
                      {face}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label>Energy</label>
              <div className="mood-scale" aria-label="Energy">
                {ENERGY_FACES.map((face, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={`${face}-${value}`}
                      className={`mood-face${energy === value ? ' sel' : ''}`}
                      type="button"
                      aria-label={`Energy ${value} of 5`}
                      aria-pressed={energy === value}
                      onClick={() => setEnergy(energy === value ? null : value)}
                    >
                      <span aria-hidden="true">{face}</span>
                      <span className="num" style={{ fontSize: 10 }}>{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="journal-tags">Tags</label>
            <input
              id="journal-tags"
              className="input"
              placeholder="learning, focus, health"
              value={tagText}
              onChange={(event) => setTagText(event.target.value)}
            />
            <div className="je-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {Object.values(CATEGORIES).map((category) => {
                const tag = category.label.toLowerCase();
                return (
                  <button
                    key={category.id}
                    className={`chip${selectedTags.includes(tag) ? ' active' : ''}`}
                    type="button"
                    onClick={() => toggleCategoryTag(tag)}
                  >
                    <span aria-hidden="true">{category.icon}</span> {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label htmlFor="journal-gratitude">Gratitude (one per line)</label>
            <textarea
              id="journal-gratitude"
              className="input"
              placeholder="One thing you appreciate&#10;Another good thing"
              value={gratitudeText}
              onChange={(event) => setGratitudeText(event.target.value)}
              rows={3}
            />
          </div>

          <button className="btn solid block" type="submit" disabled={!canSave}>
            Save entry
          </button>
        </form>

        <div className="panel panel-p">
          <div className="section-h">
            <h3>Reflection stats</h3>
          </div>
          <div className="je-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 0 }}>
            <span className="chip static">
              Entries <span className="num">{journal.length}</span>
            </span>
            <span className="chip static">
              Words <span className="num">{totalWords}</span>
            </span>
          </div>
        </div>

        <section className="stack" aria-label="Journal entries">
          {journal.length === 0 ? (
            <div className="panel empty">
              <div className="big">📝</div>
              No entries yet — write your first reflection above
            </div>
          ) : (
            journal.map((entry) => (
              <article className="panel journal-entry" key={entry.id}>
                <div className="je-top">
                  {entry.mood ? <span className="je-mood">{MOOD_FACES[entry.mood - 1]}</span> : null}
                  <span className="je-when">{formatWhen(entry.at)}</span>
                  <button
                    className="btn icon ghost sm"
                    type="button"
                    aria-label="Delete journal entry"
                    onClick={() => deleteEntry(entry.id)}
                    style={{ marginLeft: 'auto' }}
                  >
                    🗑
                  </button>
                </div>
                <div className="je-body">{entry.content}</div>

                {entry.tags?.length ? (
                  <div className="je-tags">
                    {entry.tags.map((tag, index) => (
                      <span className="tag" key={`${tag}-${index}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {entry.gratitude?.length ? (
                  <div className="je-tags" aria-label="Gratitude">
                    {entry.gratitude.map((item, index) => (
                      <span className="tag" key={`${item}-${index}`}>
                        🙏 {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
