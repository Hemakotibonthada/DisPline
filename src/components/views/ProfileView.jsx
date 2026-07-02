import { useEffect, useMemo, useRef, useState } from 'react';
import { AVATAR_COLORS, REWARDS, THEMES } from '../../store/defaults.js';
import { useStore } from '../../store/StoreContext.jsx';

const initials = (name) => name?.trim()?.[0]?.toUpperCase() || 'U';

export default function ProfileView() {
  const { state, actions, user } = useStore();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user.name || '');
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || AVATAR_COLORS[0]);
  const [bio, setBio] = useState(state.profile?.bio || '');

  const unlockedTitles = state.gamification.titles || [];
  const unlockedThemes = state.gamification.unlockedThemes || [];
  const purchases = state.purchases || [];
  const coins = state.gamification.coins || 0;

  const themes = useMemo(() => Object.values(THEMES), []);

  useEffect(() => {
    setName(user.name || '');
    setAvatarColor(user.avatarColor || AVATAR_COLORS[0]);
  }, [user.name, user.avatarColor]);

  useEffect(() => {
    setBio(state.profile?.bio || '');
  }, [state.profile?.bio]);

  const saveProfile = (event) => {
    event.preventDefault();
    const nextName = name.trim() || user.name || 'Operator';
    actions.updateProfile(nextName, avatarColor);
    actions.setBio(bio);
    setName(nextName);
  };

  const exportData = () => {
    const data = actions.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `des-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        actions.importData(JSON.parse(String(reader.result)));
      } catch {
        alert('Import failed. Choose a valid Daily Execution System JSON backup.');
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      input.value = '';
      alert('Import failed. The selected file could not be read.');
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (window.confirm('Reset all data for this account? This cannot be undone.')) {
      actions.resetData();
    }
  };

  const rewardOwned = (reward) => {
    if (reward.type === 'title') return purchases.includes(reward.id) || unlockedTitles.includes(reward.value);
    if (reward.type === 'theme') return purchases.includes(reward.id) || unlockedThemes.includes(reward.value);
    return false;
  };

  return (
    <div className="view">
      <div className="vtitle">
        <h2>Profile</h2>
      </div>
      <div className="view-sub">Your account, look &amp; data.</div>

      <div className="stack">
        <section className="panel panel-p">
          <div className="section-h">
            <h3>Profile</h3>
            <span className="hint">{user.email}</span>
          </div>

          <form className="stack" onSubmit={saveProfile}>
            <div className="grid g2" style={{ alignItems: 'start' }}>
              <div className="stack">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar lg" style={{ background: avatarColor }}>
                    {initials(name || user.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{name || user.name}</div>
                    <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {user.isGuest ? (
                  <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>
                    You're using a guest account — data is stored on this device.
                  </div>
                ) : null}
              </div>

              <div>
                <div className="field">
                  <label htmlFor="profile-name">Display name</label>
                  <input
                    id="profile-name"
                    className="input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="field">
                  <label>Avatar color</label>
                  <div className="avatar-picker" aria-label="Choose avatar color">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        className={`avatar-dot${avatarColor === color ? ' sel' : ''}`}
                        style={{ background: color }}
                        aria-label={`Use avatar color ${color}`}
                        onClick={() => setAvatarColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                className="input"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="What are you executing on right now?"
                rows={4}
              />
            </div>

            <button type="submit" className="btn solid">
              Save profile
            </button>
          </form>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Active title</h3>
            <span className="hint">{state.gamification.activeTitle}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {unlockedTitles.map((title) => (
              <button
                type="button"
                key={title}
                className={`chip${state.gamification.activeTitle === title ? ' active' : ''}`}
                onClick={() => actions.setActiveTitle(title)}
              >
                {title}
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Appearance</h3>
            <span className="hint">Theme &amp; motion</span>
          </div>

          <div className="theme-swatches">
            {themes.map((theme) => {
              const unlocked = unlockedThemes.includes(theme.id);
              const selected = state.settings.theme === theme.id;

              return (
                <button
                  type="button"
                  key={theme.id}
                  className={`theme-swatch${selected ? ' sel' : ''}${unlocked ? '' : ' locked'}`}
                  disabled={!unlocked}
                  onClick={() => actions.setTheme(theme.id)}
                  title={unlocked ? theme.label : `${theme.label} · ${theme.cost} coins`}
                  style={{ background: 'transparent', border: 0, padding: 0, color: 'inherit' }}
                >
                  <span className="sw" style={{ background: theme.accent }} />
                  <span className="swl">{unlocked ? theme.label : `🔒 ${theme.cost}`}</span>
                </button>
              );
            })}
          </div>

          <div className="settings-row">
            <div>
              <div className="sr-l">Reduce motion</div>
              <div className="sr-d">Minimize animations across the interface.</div>
            </div>
            <button
              type="button"
              className={`toggle${state.settings.reduceMotion ? ' on' : ''}`}
              aria-label="Toggle reduce motion"
              aria-pressed={state.settings.reduceMotion}
              onClick={() => actions.setSetting('reduceMotion', !state.settings.reduceMotion)}
            />
          </div>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Rewards shop</h3>
            <span className="hint">
              🪙 <span className="num">{coins}</span>
            </span>
          </div>

          <div className="grid g3">
            {REWARDS.map((reward) => {
              const owned = rewardOwned(reward);
              const canBuy = !owned && coins >= reward.cost;

              return (
                <div key={reward.id} className={`panel shop-item${owned ? ' owned' : ''}`}>
                  <div className="si-ic">{reward.icon}</div>
                  <div className="si-n">{reward.name}</div>
                  <div className="si-d">{reward.desc}</div>
                  <div className="si-cost">{reward.cost} 🪙</div>
                  <button
                    type="button"
                    className="btn sm solid"
                    disabled={owned || !canBuy}
                    onClick={() => actions.buyReward(reward)}
                  >
                    {owned ? 'Owned' : 'Buy'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel panel-p">
          <div className="section-h">
            <h3>Data</h3>
            <span className="hint">Backup &amp; restore</span>
          </div>

          <div className="settings-row">
            <div>
              <div className="sr-l">Export data</div>
              <div className="sr-d">Download a JSON backup for this account.</div>
            </div>
            <button type="button" className="btn primary" onClick={exportData}>
              Export
            </button>
          </div>

          <div className="settings-row">
            <div>
              <div className="sr-l">Import data</div>
              <div className="sr-d">Restore from a Daily Execution System JSON backup.</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              hidden
              onChange={importData}
            />
            <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
              Import
            </button>
          </div>

          <div className="settings-row">
            <div>
              <div className="sr-l">Reset all data</div>
              <div className="sr-d">Wipe this account back to a fresh start.</div>
            </div>
            <button type="button" className="btn danger" onClick={resetData}>
              Reset
            </button>
          </div>
        </section>

        <button type="button" className="btn danger block" onClick={actions.logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
