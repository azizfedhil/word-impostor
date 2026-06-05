'use strict';

// ============================================================
// NET — Friends
// Handles friend requests, online status, and friendships.
// ============================================================

let _friends = [];
let _incomingRequests = [];
let _onlineFriends = new Set();
let _friendsChannel = null;

async function _initFriends() {
    if (!window._currentUser) return;

    await _fetchFriends();
    await _fetchRequests();
    _subscribeToFriendsPresence();
    _renderFriendsList();
}

async function _fetchFriends() {
    try {
        const { data, error } = await _supa
            .from('friendships')
            .select(`
                friend_id,
                profiles:friend_id (id, display_name, avatar_url)
            `)
            .eq('user_id', window._currentUser.id);

        if (error) throw error;
        _friends = (data || []).map(f => f.profiles).filter(Boolean);
    } catch (e) {
        console.error('Error fetching friends:', e);
    }
}

async function _fetchRequests() {
    try {
        const { data, error } = await _supa
            .from('friend_requests')
            .select(`
                id,
                sender_id,
                profiles:sender_id (id, display_name, avatar_url)
            `)
            .eq('receiver_id', window._currentUser.id)
            .eq('status', 'pending');

        if (error) throw error;
        _incomingRequests = data || [];
    } catch (e) {
        console.error('Error fetching requests:', e);
    }
}

function _subscribeToFriendsPresence() {
    if (_friendsChannel) _supa.removeChannel(_friendsChannel);

    _friendsChannel = _supa.channel('friends_presence', {
        config: { presence: { key: window._currentUser.id } }
    });

    _friendsChannel
        .on('presence', { event: 'sync' }, () => {
            const state = _friendsChannel.presenceState();
            _onlineFriends = new Set(Object.keys(state));
            _renderFriendsList();
            if (typeof _renderLobbyInviteList === 'function') _renderLobbyInviteList();
        })
        .on('broadcast', { event: 'game-invite' }, ({ payload }) => {
            if (payload.targetId === window._currentUser.id) {
                _showGameInvite(payload);
            }
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await _friendsChannel.track({
                    id: window._currentUser.id,
                    username: window._myName,
                    online_at: new Date().toISOString()
                });
            }
        });
}

function _renderFriendsList() {
    const listCont = document.getElementById('friends-list');
    if (!listCont) return;

    if (!window._currentUser) {
        listCont.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">سجل دخولك باش تشوف أصحابك</p>';
        return;
    }

    listCont.innerHTML = '';

    // Render pending requests first
    if (_incomingRequests.length > 0) {
        const reqHeader = document.createElement('div');
        reqHeader.style.cssText = 'font-size: 0.8rem; font-weight: 800; color: var(--primary-color); margin: 10px 0 5px;';
        reqHeader.innerText = 'طلبات صداقة جديدة:';
        listCont.appendChild(reqHeader);

        _incomingRequests.forEach(req => {
            const p = req.profiles;
            const item = document.createElement('div');
            item.className = 'friend-item';
            item.style.border = '1px solid var(--primary-color)';
            item.innerHTML = `
                <div class="friend-avatar">
                    ${p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%; height:100%; object-fit:cover;"/>` : '👤'}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${_esc(p.display_name)}</div>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <button onclick="_acceptRequest(${req.id})" style="padding:2px 8px; font-size:0.7rem; background:var(--primary-color); color:#fff; border:none; border-radius:4px; cursor:pointer;">قبول</button>
                        <button onclick="_declineRequest(${req.id})" style="padding:2px 8px; font-size:0.7rem; background:var(--danger-color); color:#fff; border:none; border-radius:4px; cursor:pointer;">رفض</button>
                    </div>
                </div>
            `;
            listCont.appendChild(item);
        });
    }

    if (_friends.length === 0 && _incomingRequests.length === 0) {
        listCont.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">ما عندك حتى صاحب توّة. ابعث استدعاء لصحابك!</p>';
        return;
    }

    if (_friends.length > 0) {
        const friendsHeader = document.createElement('div');
        friendsHeader.style.cssText = 'font-size: 0.8rem; font-weight: 800; color: var(--text-muted); margin: 15px 0 5px;';
        friendsHeader.innerText = 'أصحابك:';
        listCont.appendChild(friendsHeader);

        _friends.forEach(friend => {
            const isOnline = _onlineFriends.has(friend.id);
            const item = document.createElement('div');
            item.className = 'friend-item';
            item.innerHTML = `
                <div class="friend-avatar">
                    ${friend.avatar_url ? `<img src="${friend.avatar_url}" style="width:100%; height:100%; object-fit:cover;"/>` : '👤'}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${_esc(friend.display_name)}</div>
                    <div class="friend-status">
                        <span class="status-dot ${isOnline ? 'status-online' : 'status-offline'}"></span>
                        ${isOnline ? 'متصل الآن' : 'غير متصل'}
                    </div>
                </div>
            `;
            listCont.appendChild(item);
        });
    }
}

async function _acceptRequest(requestId) {
    try {
        const { error } = await _supa.rpc('accept_friend_request', { request_id: requestId });
        if (error) throw error;
        if (window._showToast) window._showToast('وليتو أصحاب توّة!');
        _initFriends();
    } catch (e) {
        console.error('Accept error:', e);
        if (window._showToast) window._showToast('خطأ في قبول الطلب');
    }
}

async function _declineRequest(requestId) {
    try {
        const { error } = await _supa.from('friend_requests').delete().eq('id', requestId);
        if (error) throw error;
        _initFriends();
    } catch (e) {
        console.error('Decline error:', e);
    }
}

async function _sendGameInvite(friendId) {
    if (!window._room || !_friendsChannel) return;

    const payload = {
        fromId: window._currentUser.id,
        fromName: window._myName,
        targetId: friendId,
        roomCode: window._room.code,
        gameMode: _getRoomGameMode(window._room)
    };

    _friendsChannel.send({
        type: 'broadcast',
        event: 'game-invite',
        payload
    });

    if (window._showToast) window._showToast('تبعت الاستدعاء لـ ' + (_friends.find(f => f.id === friendId)?.display_name || 'صاحبك'));
}

function _showGameInvite(payload) {
    const gameNames = {
        impostor: 'شكونو هو؟',
        spyfall: 'ماناش هوني',
        coup: 'كول وبوّع',
        chkobba: 'شكبّة'
    };
    const gameName = gameNames[payload.gameMode] || 'اللعبة';
    const msg = `${payload.fromName} يستدعى فيك باش تلعب ${gameName}!`;

    const toast = document.getElementById('toast-msg');
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <span>${msg}</span>
            <button onclick="_joinFromInvite('${payload.roomCode}', '${payload.gameMode}')" style="background: var(--primary-color); color: #fff; border: none; padding: 5px 15px; border-radius: 10px; font-weight: bold; cursor: pointer;">انضم</button>
        </div>
    `;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.innerHTML = ''; }, 400);
    }, 8000);
}

window._joinFromInvite = (code, gameMode) => {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        window.location.href = `games/${gameMode}.html?room=${code}`;
        return;
    }
    const roomInput = document.getElementById('room-code-input');
    if (roomInput) roomInput.value = code;

    const onlineSetup = document.getElementById('online-setup-screen');
    if (onlineSetup) {
        showScreen('online-setup-screen');
        setTimeout(() => { if (typeof _joinRoom === 'function') _joinRoom(); }, 500);
    } else {
        if (typeof _joinRoom === 'function') _joinRoom();
    }
    document.getElementById('toast-msg').classList.remove('show');
};

function _renderLobbyInviteList() {
    const lobbyInviteCont = document.getElementById('lobby-invite-friends');
    if (!lobbyInviteCont || !window._room || window._room.state !== 'lobby') return;

    const onlineNotMe = _friends.filter(f => _onlineFriends.has(f.id));

    if (onlineNotMe.length === 0) {
        lobbyInviteCont.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted);">ما ثمة حتى صاحب متصل توّة.</p>';
        return;
    }

    lobbyInviteCont.innerHTML = '';
    onlineNotMe.forEach(friend => {
        const btn = document.createElement('button');
        btn.className = 'secondary-btn';
        btn.style.padding = '5px 12px';
        btn.style.fontSize = '0.85rem';
        btn.style.marginBottom = '5px';
        btn.innerHTML = `استدعى ${_esc(friend.display_name)}`;
        btn.onclick = () => _sendGameInvite(friend.id);
        lobbyInviteCont.appendChild(btn);
    });
}

_supa.auth.onAuthStateChange((event, session) => {
    if (session) {
        _initFriends();
    } else {
        _friends = [];
        _incomingRequests = [];
        _onlineFriends = new Set();
        if (_friendsChannel) _supa.removeChannel(_friendsChannel);
        _renderFriendsList();
    }
});

async function _addFriend() {
    if (!window._currentUser) {
        if (window._showToast) window._showToast('سجل دخولك باش تزيد أصحابك');
        return;
    }
    const friendId = prompt('أدخل الـ ID متاع صاحبك:');
    if (!friendId || friendId.trim() === '') return;
    if (friendId === window._currentUser.id) {
        if (window._showToast) window._showToast('ما تنجمش تزيد روحك صاحب');
        return;
    }

    try {
        const { data: profile, error: pError } = await _supa
            .from('profiles')
            .select('id, display_name')
            .eq('id', friendId)
            .single();

        if (pError || !profile) {
            if (window._showToast) window._showToast('الـ ID هذا موش موجود');
            return;
        }

        const { data: existing, error: eError } = await _supa
            .from('friendships')
            .select('*')
            .eq('user_id', window._currentUser.id)
            .eq('friend_id', friendId)
            .single();

        if (existing) {
            if (window._showToast) window._showToast('إنت وصاحبك هذا ديجا أصحاب');
            return;
        }

        const { error: iError } = await _supa
            .from('friend_requests')
            .insert([{ sender_id: window._currentUser.id, receiver_id: friendId }]);

        if (iError) {
             if (iError.code === '23505') {
                 if (window._showToast) window._showToast('بعثت استدعاء ديجا لهذا الصاحب');
                 return;
             }
             throw iError;
        }

        if (window._showToast) window._showToast('تبعت طلب صداقة لـ ' + profile.display_name);
    } catch (e) {
        console.error('Error adding friend:', e);
        if (window._showToast) window._showToast('خطأ في طلب الصداقة');
    }
}

window._initFriends = _initFriends;
window._sendGameInvite = _sendGameInvite;
window._renderLobbyInviteList = _renderLobbyInviteList;
window._addFriend = _addFriend;
window._acceptRequest = _acceptRequest;
window._declineRequest = _declineRequest;
