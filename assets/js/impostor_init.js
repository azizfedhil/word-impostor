'use strict';
// ============================================================
// IMPOSTOR — game-specific initializer
// ============================================================
async function initImpostor() {
    await initSharedSetup('impostor');

    document.getElementById('start-game-btn')?.addEventListener('click', startImpostorOffline);
    document.getElementById('coup-guide-from-setup-btn')?.classList.add('hidden');
}

function startImpostorOffline() {
    _cleanupOnlineGameUI();
    saveSettings();
    const namesInput = Array.from(document.querySelectorAll('.player-input')).map((inp,idx)=>inp.value.trim()||`لاعب ${idx+1}`);
    if (namesInput.length < 3) { document.getElementById('setup-error').innerText='يجب أن يكون هناك 3 لاعبين على الأقل.'; _sfx.error(); return; }

    const isRand = _togActive('t-random');
    let impCount = isRand ? Math.floor(Math.random()*Math.floor(namesInput.length/2))+1 : impostorConfig;
    if (!isRand && impCount >= namesInput.length) { document.getElementById('setup-error').innerText='عدد الكذابين يجب أن يكون أقل من عدد اللاعبين.'; _sfx.error(); return; }

    wordsDB = currentLang==='x18' ? adultWordsDB : regularWordsDB;
    if (wordsDB.length===0) { document.getElementById('setup-error').innerText='جاري تحميل الكلمات، يرجى الانتظار والمحاولة مجدداً.'; _sfx.error(); return; }
    document.getElementById('setup-error').innerText='';

    isEliminationMode = _togActive('t-elimination');
    noHintsMode = _togActive('t-nohint') || currentLang==='x18';
    const allCorrectHints = _togActive('t-allhint');

    players = namesInput.map(name=>({name,isImpostor:false,customHint:'',eliminated:false,viewedCard:false}));
    currentWordObj = wordsDB[Math.floor(Math.random()*wordsDB.length)];

    const isChaosRound = _togActive('t-chaos') && Math.random()<0.15;
    if (isChaosRound) { players.forEach(p=>{p.isImpostor=true;}); }
    else {
        const shuffled = [...Array(players.length).keys()].sort(()=>0.5-Math.random());
        for(let i=0;i<impCount;i++) players[shuffled[i]].isImpostor=true;
    }

    const impostorPlayers = players.filter(p=>p.isImpostor);
    if (allCorrectHints) { impostorPlayers.forEach(p=>{p.customHint=currentWordObj.hint;}); }
    else if (impostorPlayers.length<=1) { if(impostorPlayers.length===1) impostorPlayers[0].customHint=currentWordObj.hint; }
    else {
        const lucky=Math.floor(Math.random()*impostorPlayers.length);
        const wrong=wordsDB.filter(w=>w.word!==currentWordObj.word).map(w=>w.hint).sort(()=>0.5-Math.random());
        let hi=0; for(let i=0;i<impostorPlayers.length;i++){impostorPlayers[i].customHint=(i===lucky)?currentWordObj.hint:(wrong[hi%wrong.length]||'');hi++;}
    }

    remainingTime=timerConfig*60; currentRevealIndex=0;
    renderSingleCard(); showScreen('reveal-screen'); _sfx.gameStart();
}

document.addEventListener('DOMContentLoaded', initImpostor);
