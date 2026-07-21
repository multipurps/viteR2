import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOut, uploadAvatar } from '../lib/supabase';
import EnterTvCode from '../components/EnterTvCode';
import FilmProfile from '../components/FilmProfile';
import './Profile.css';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError('');
    try {
      await uploadAvatar(user.id, file);
      await refreshProfile();
    } catch (err) {
      setError('Upload failed — make sure the "avatars" storage bucket exists (see README).');
      console.warn(err);
    } finally {
      setUploading(false);
    }
  }

  const initial = (user?.email || 'Z')[0].toUpperCase();

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <div className="profile-card glass">
        <button
          className="profile-avatar-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Change profile picture"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            <span>{initial}</span>
          )}
          <span className="profile-avatar-edit">
            {uploading ? '…' : (
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile}
        />

        <div className="profile-info">
          <span className="profile-email">{user?.email}</span>
          <span className={`profile-status status-${profile?.approved === true ? 'approved' : 'pending'}`}>
            {profile?.approved === true ? 'Approved' : 'Pending'}
          </span>
        </div>

        {error && <p className="profile-error">{error}</p>}

        <button className="profile-signout" onClick={() => signOut()}>Sign out</button>
      </div>

      <EnterTvCode />

      <FilmProfile userId={user?.id} />
    </div>
  );
}
