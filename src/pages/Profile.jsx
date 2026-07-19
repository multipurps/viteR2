import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signOut, uploadAvatar } from '../lib/supabase';
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
          <span className="profile-avatar-edit">{uploading ? '…' : 'Edit'}</span>
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
    </div>
  );
}
