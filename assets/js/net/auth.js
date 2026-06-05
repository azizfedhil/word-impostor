'use strict';

// ============================================================
// NET — Auth
// Handles Supabase Authentication and Profile management.
// ============================================================

let _currentUser = null;
let _userProfile = null;

async function _loginWithProvider(provider) {
    // Ensure redirect goes to index.html to avoid broken URLs on subpages.
    // Handles subpaths (like GitHub Pages /word-impostor/) correctly.
    let path = window.location.pathname;
    // Remove filename if present
    if (path.endsWith('.html')) {
        path = path.substring(0, path.lastIndexOf('/') + 1);
    }
    // If in /games/ folder, move up to root
    if (path.includes('/games/')) {
        path = path.split('/games/')[0] + '/';
    }
    // Ensure trailing slash
    if (!path.endsWith('/')) path += '/';

    const redirectUrl = window.location.origin + path + 'index.html';

    const { data, error } = await _supa.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: redirectUrl
        }
    });
    if (error) {
        console.error('Login error:', error.message);
        if (window._showToast) window._showToast('خطأ في تسجيل الدخول: ' + error.message);
    }
    return { data, error };
}

async function _logout() {
    const { error } = await _supa.auth.signOut();
    if (error) console.error('Logout error:', error.message);
    else {
        _currentUser = null;
        _userProfile = null;
        window.location.reload();
    }
}

async function _fetchProfile(userId) {
    try {
        const { data, error } = await _supa
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116' && _currentUser && userId === _currentUser.id) {
                // Profile doesn't exist in table, try to create it
                const meta = _currentUser.user_metadata || {};
                const { data: newProfile, error: createError } = await _supa
                    .from('profiles')
                    .insert([{
                        id: userId,
                        username: meta.username || meta.full_name || _currentUser.email.split('@')[0],
                        avatar_url: meta.avatar_url,
                        stats: meta.stats || {
                            impostor: { wins: 0, games: 0 },
                            spyfall: { wins: 0, games: 0 },
                            coup: { wins: 0, games: 0 },
                            chkobba: { wins: 0, games: 0 }
                        }
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                if (userId === _currentUser.id) {
                    _userProfile = newProfile;
                    window._userProfile = newProfile;
                }
                return newProfile;
            } else if (error.code === 'PGRST205' && _currentUser && userId === _currentUser.id) {
                // Table missing! Fallback to metadata for local user
                console.warn('Profiles table missing, using Auth metadata fallback.');
                const meta = _currentUser.user_metadata || {};
                const fallback = {
                    id: userId,
                    username: meta.username || meta.full_name || _currentUser.email?.split('@')[0] || 'لاعب',
                    avatar_url: meta.avatar_url,
                    stats: meta.stats || {
                        impostor: { wins: 0, games: 0 },
                        spyfall: { wins: 0, games: 0 },
                        coup: { wins: 0, games: 0 },
                        chkobba: { wins: 0, games: 0 }
                    }
                };
                if (userId === _currentUser.id) {
                    _userProfile = fallback;
                    window._userProfile = fallback;
                }
                return fallback;
            }
            throw error;
        }
        if (userId === _currentUser?.id) {
            _userProfile = data;
            window._userProfile = data;
        }
        return data;
    } catch (e) {
        console.error('Error fetching profile:', e);
        return null;
    }
}

async function _updateUsername(newName) {
    if (!_currentUser || !newName) return;
    const cleanName = newName.trim();
    if (!cleanName) return;

    try {
        // 1. Always update Auth metadata (reliable local fallback)
        await _supa.auth.updateUser({ data: { username: cleanName } });

        // 2. Try to update 'profiles' table
        const { data, error } = await _supa
            .from('profiles')
            .update({ username: cleanName })
            .eq('id', _currentUser.id)
            .select()
            .single();

        if (error && error.code !== 'PGRST205') throw error;

        if (data) {
            _userProfile = data;
            window._userProfile = data;
        } else {
            // If table missing or update failed, refresh from metadata
            const { data: { user } } = await _supa.auth.getUser();
            _currentUser = user;
            window._currentUser = user;
            await _fetchProfile(_currentUser.id);
        }

        _saveOnlineName(cleanName);
        if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
        if (window._showToast) window._showToast('تم تحديث الاسم بنجاح');
    } catch (e) {
        console.error('Update username error:', e);
        const msg = e.message || 'خطأ غير معروف';
        if (window._showToast) window._showToast('خطأ في تحديث الاسم: ' + msg);
    }
}

async function _updateStats(gameMode, won = false) {
    if (!_currentUser) return;
    const profile = await _fetchProfile(_currentUser.id);
    if (!profile) return;

    const stats = { ...(profile.stats || {}) };
    if (!stats[gameMode]) stats[gameMode] = { wins: 0, games: 0 };

    stats[gameMode].games++;
    if (won) stats[gameMode].wins++;

    try {
        // 1. Update Auth metadata
        await _supa.auth.updateUser({ data: { stats } });

        // 2. Try to update 'profiles' table
        const { data, error } = await _supa
            .from('profiles')
            .update({ stats })
            .eq('id', _currentUser.id)
            .select()
            .single();

        if (error && error.code !== 'PGRST205') throw error;

        if (data) {
            _userProfile = data;
            window._userProfile = data;
        } else {
            const { data: { user } } = await _supa.auth.getUser();
            _currentUser = user;
            window._currentUser = user;
            await _fetchProfile(_currentUser.id);
        }

        if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
    } catch (e) {
        console.error('Update stats error:', e);
    }
}

// Handle Auth State Changes
_supa.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event, session);
    if (session) {
        _currentUser = session.user;
        window._currentUser = _currentUser;
        _storeMyId(_currentUser.id);

        _userProfile = await _fetchProfile(_currentUser.id);
        window._userProfile = _userProfile;

        if (_userProfile && _userProfile.username) {
            _saveOnlineName(_userProfile.username);
        } else {
            const providerName = _currentUser.user_metadata.full_name || _currentUser.email.split('@')[0];
            _saveOnlineName(providerName);
        }

        // Update UI if on account screen
        if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
        // Update header avatar
        if (typeof _updateHeaderAvatar === 'function') _updateHeaderAvatar();
    } else {
        _currentUser = null;
        _userProfile = null;
        window._currentUser = null;
        window._userProfile = null;
    }
});

// Check current session on load
_supa.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        _currentUser = session.user;
        window._currentUser = _currentUser;
        _fetchProfile(_currentUser.id).then(profile => {
            _userProfile = profile;
            window._userProfile = _userProfile;
            if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
            if (typeof _updateHeaderAvatar === 'function') _updateHeaderAvatar();
        });
    }
});

window._loginWithProvider = _loginWithProvider;
window._logout = _logout;
window._updateUsername = _updateUsername;
window._updateStats = _updateStats;
