'use strict';

// ============================================================
// NET — Auth
// Handles Supabase Authentication and Profile management.
// ============================================================

let _currentUser = null;
let _userProfile = null;

const _DEFAULT_STATS = {
    impostor: { wins: 0, games: 0 },
    spyfall:  { wins: 0, games: 0 },
    coup:     { wins: 0, games: 0 },
    chkobba:  { wins: 0, games: 0 }
};

async function _loginWithProvider(provider) {
    let path = window.location.pathname;
    if (path.endsWith('.html')) {
        path = path.substring(0, path.lastIndexOf('/') + 1);
    }
    if (path.includes('/games/')) {
        path = path.split('/games/')[0] + '/';
    }
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
            // Handle PGRST205 (table missing) or empty result
            if (error.code === 'PGRST205' || error.code === 'PGRST116') {
                if (userId === _currentUser?.id) {
                    // Fallback for self: try to create profile from auth metadata
                    const { data: profile, error: upsertError } = await _supa
                        .from('profiles')
                        .upsert({
                            id: _currentUser.id,
                            display_name: _currentUser.user_metadata.full_name || _currentUser.user_metadata.name || _currentUser.email.split('@')[0],
                            avatar_url: _currentUser.user_metadata.avatar_url
                        })
                        .select()
                        .single();

                    if (!upsertError && profile) {
                        _userProfile = profile;
                        window._userProfile = profile;
                        return profile;
                    }
                }
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
        // Last resort fallback: return a fake profile object from metadata if it's the current user
        if (userId === _currentUser?.id) {
            const fallback = {
                id: _currentUser.id,
                display_name: _currentUser.user_metadata.full_name || _currentUser.user_metadata.name || _currentUser.email.split('@')[0],
                avatar_url: _currentUser.user_metadata.avatar_url,
                stats: { ..._DEFAULT_STATS }
            };
            _userProfile = fallback;
            window._userProfile = fallback;
            return fallback;
        }
        return null;
    }
}

async function _updateUsername(newName) {
    if (!_currentUser || !newName) return;
    const cleanName = newName.trim();
    if (!cleanName) return;

    try {
        const { data, error } = await _supa
            .from('profiles')
            .update({ display_name: cleanName })
            .eq('id', _currentUser.id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            _userProfile = data;
            window._userProfile = data;
            _saveOnlineName(cleanName);
            if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
            if (window._showToast) window._showToast('تم تحديث الاسم بنجاح');
        }
    } catch (e) {
        console.error('Update username error:', e);
        const msg = e.message || 'خطأ غير معروف';
        if (window._showToast) window._showToast('خطأ في تحديث الاسم: ' + msg);
    }
}

async function _updateStats(gameMode, won = false) {
    if (!_userProfile || !_currentUser) return;

    const stats = { ...(_DEFAULT_STATS), ...(_userProfile.stats || {}) };
    if (!stats[gameMode]) stats[gameMode] = { wins: 0, games: 0 };

    stats[gameMode].games++;
    if (won) stats[gameMode].wins++;

    try {
        const { data, error } = await _supa
            .from('profiles')
            .update({ stats })
            .eq('id', _currentUser.id)
            .select()
            .single();

        if (error) throw error;
        if (data) {
            _userProfile = data;
            window._userProfile = data;
            if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
        }
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

        if (_userProfile && _userProfile.display_name) {
            _saveOnlineName(_userProfile.display_name);
        } else {
            const providerName = _currentUser.user_metadata.full_name || _currentUser.user_metadata.name || _currentUser.email.split('@')[0];
            _saveOnlineName(providerName);
        }

        if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
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
