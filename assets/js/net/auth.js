'use strict';

// ============================================================
// NET — Auth
// Handles Supabase Authentication and Profile management.
// ============================================================

let _currentUser = null;
let _userProfile = null;

async function _loginWithProvider(provider) {
    const { data, error } = await _supa.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) {
        console.error('Login error:', error.message);
        _showToast('خطأ في تسجيل الدخول: ' + error.message);
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

        if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await _supa
                .from('profiles')
                .insert([{
                    id: userId,
                    username: _currentUser.user_metadata.full_name || _currentUser.email.split('@')[0],
                    avatar_url: _currentUser.user_metadata.avatar_url,
                    stats: {
                        impostor: { wins: 0, games: 0 },
                        spyfall: { wins: 0, games: 0 },
                        coup: { wins: 0, games: 0 },
                        chkobba: { wins: 0, games: 0 },
                        thief: { wins: 0, games: 0 }
                    }
                }])
                .select()
                .single();

            if (createError) throw createError;
            _userProfile = newProfile;
            window._userProfile = newProfile;
            return newProfile;
        } else if (error) {
            throw error;
        }
        return data;
    } catch (e) {
        console.error('Error fetching profile:', e);
        return null;
    }
}

async function _updateStats(gameMode, won = false) {
    if (!_userProfile) return;

    const stats = { ..._userProfile.stats };
    if (!stats[gameMode]) stats[gameMode] = { wins: 0, games: 0 };

    stats[gameMode].games++;
    if (won) stats[gameMode].wins++;

    const { data, error } = await _supa
        .from('profiles')
        .update({ stats })
        .eq('id', _currentUser.id)
        .select()
        .single();

    if (!error && data) {
        _userProfile = data;
        if (typeof _renderAccountScreen === 'function') _renderAccountScreen();
    }
}

// Handle Auth State Changes
_supa.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event, session);
    if (session) {
        _currentUser = session.user;
        window._currentUser = _currentUser;
        _storeMyId(_currentUser.id);
        const newName = _currentUser.user_metadata.full_name || _currentUser.email.split('@')[0];
        _saveOnlineName(newName);

        _userProfile = await _fetchProfile(_currentUser.id);
        window._userProfile = _userProfile;

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
window._updateStats = _updateStats;
