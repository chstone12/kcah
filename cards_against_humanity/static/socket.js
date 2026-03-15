
const socket = io();


socket.on('update_span', function(data) {
    const infoDiv = document.getElementById('PARTICIPANTS');
    infoDiv.innerHTML = data.text;
});

socket.on('update_bj', function(data) {
    BJ = data.text;
    areYouTheBj();
})

socket.on('czar_start_ready', function(data) {
    czarStart();
})

socket.on('see_another_sentence', function(data) {
    let r = Math.floor(Math.random() * 3);
    let r2 = Math.random() * 0.2 + 0.9;
    if(r === 1) {
        SOUND_PAPER_1.playbackRate = r2;
        SOUND_PAPER_1.play();
    }
    else if(r === 2) {
        SOUND_PAPER_2.playbackRate = r2;
        SOUND_PAPER_2.play();
    }
    else {
        SOUND_PAPER_3.playbackRate = r2;
        SOUND_PAPER_3.play();
    }

    let isThisNext = data.isThisNext
    if(isThisNext === 1) CURRENT_CARD_INDEX++;
    else CURRENT_CARD_INDEX--;
    let lastCard = PLAYER_COUNT-2;

    if(CURRENT_CARD_INDEX === -1) CURRENT_CARD_INDEX = lastCard
    else if(CURRENT_CARD_INDEX > lastCard) CURRENT_CARD_INDEX = 0;

    let displayThis = SENTENCES[CURRENT_CARD_INDEX];
    displayThis = displayThis.replace(/\^\^\^/g, '</span>')
        .replace(/\^\^/g, '<span style=\'color: yellow;\'>');

    document.getElementById('WHITE_CARD_TEXT').innerHTML = displayThis;

})

socket.on('give_score', async function(data) {
    document.getElementById('REROLL_BUTTON').disabled = true;
    SOUND_DNDDDDNDN.play();
    let nick = data.nick;
    let score = parseInt(data.currentScore) + 1;
    eval('SCORES.' + nick + ' = ' + score);
    update_scoreboard();
    let sent = document.getElementById('WHITE_CARD_TEXT');
    sent.innerHTML = sent.innerHTML + '<br><br><span style="color:lawngreen; font-family: noto, serif;">' + nick + ' +1점!</span>';
    document.getElementById('YOUR_SENTENCE').remove();
    CURRENT_TURN++;

    await sleep(5000)

    sent.innerHTML = '';
    let t = 0, w = 876, h = 188, top = 150, left = 572;
    const whiteCard = document.getElementById('WHITE_CARD').style;
    document.getElementById('COMPLETED_PLAYER_COUNT').innerText = ''
    while(t < 100) {
        t++;
        w -= 6;
        h += 2;
        top--;
        left += 2.5;
        whiteCard.height = h + 'px'
        whiteCard.width = w + 'px'
        whiteCard.left = left + 'px'
        whiteCard.top = top + 'px'
        await sleep(1)
    }

    SOUND_DING.playbackRate = 0.5
    SOUND_DING.play();
    SOUND_DING.playbackRate = 1

    if(END_COND === 2) {
        if(END_TIME === score) {
            endTheGame();
        }
        else {
            nextRound();
        }
    }
    else {
        if(END_TIME === CURRENT_TURN) {
            endTheGame();
        }
        else {
            nextRound();
        }
    }

})



socket.on('update_card_desc', async function(data) {
    let selected = data.text;
    document.getElementById('SELECT_CARD_ARRAY').value = selected;
    let using = '', using2 = '', writeThis = '';

    switch (selected) {
        case '한국어 EXTENDED':
            using = 'black';
            using2 = 'white';
            writeThis = '가장 완벽한 카드 배열.'
            break;
        case '한국어':
            using = 'orblack';
            using2 = 'orwhite';
            writeThis = '원본을 번역한 카드.'
            break;
        case '영어':
            using = 'enblack';
            using2 = 'enwhite';
            writeThis = '한국어 EXT.의 영어 버전.'
            break;
        case '한국어 전체이용가':
            using = 'softblack';
            using2 = 'softwhite';
            writeThis = '한국어 EXT.에서 노골적인 걸 없앤 카드.'
            break;
    }



    const k = await fetch('/static/cards/' + using + '.txt');
    const cards = await k.text();
    let temp = cards.split('\n');
    let count = temp.length;
    BLACK_CARDS = temp;

    const k2 = await fetch('/static/cards/' + using2 + '.txt');
    const cards2 = await k2.text();
    let temp2 = cards2.split('\n');
    let count2 = temp2.length;
    WHITE_CARDS = temp2;

    document.getElementById('CARD_DESC').innerText = writeThis + ' (' + count + ' + ' + count2 + '장)'


})

socket.on('update_condition_number', function(data) {
    document.getElementById('CONDITION_NUMBER').value = data.text;
})

socket.on('update_condition_option', function(data) {
    document.getElementById('CONDITION_OPTION').value = data.text;
})

socket.on('show_white_card', function(data) {
    CURRENT_WHITE_CARD = data.card;
    BLANK_COUNT = CURRENT_WHITE_CARD.split('_____').length - 1
    if(CURRENT_TURN >= 2) {
        localStorage.setItem('mySent', CURRENT_WHITE_CARD)
        document.getElementById('WHITE_CARD_TEXT').innerHTML = '<span id="WHITE_CARD_TEXT" style="color: white; font-size: 28px; font-family: \'noto\',serif;">' + CURRENT_WHITE_CARD + '</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 14px; color: white; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    }

})

socket.on('set_card_czar', function(data) {
    CURRENT_CARD_CZAR = data.czar;
    document.getElementById('CURRENT_CZAR').innerText = '카드 차르: ' + CURRENT_CARD_CZAR;
})

socket.on('sentence_maid', function(data) {
    COMPLETED_PLAYER_COUNT++;
    document.getElementById('COMPLETED_PLAYER_COUNT').innerText = COMPLETED_PLAYER_COUNT + ' / ' + (PLAYER_COUNT-1);
    if(COMPLETED_PLAYER_COUNT+1 === PLAYER_COUNT) {
        if(localStorage.getItem('nick') === CURRENT_CARD_CZAR) {
            czarsTurnReady();
        }
    }
})

socket.on('send_sentences', function(data) {
    NICKNAMES = data.nicks;
    SENTENCES = data.sentences;
})

socket.on('show_black_card', function(data) {
    let myNick = localStorage.getItem('nick')
    if(data.nick === myNick) {
        let currentMyCards = JSON.parse(localStorage.getItem('cards') || '[]');
        currentMyCards.push(data.card)
        localStorage.setItem('cards', JSON.stringify(currentMyCards));
    }
})

socket.on('remove_one_player', function(data) {
    PLAYER_COUNT--;
    if(data.did_he_complete === 1) COMPLETED_PLAYER_COUNT--;
    let elem = document.getElementById('COMPLETED_PLAYER_COUNT');

    if(elem.innerText !== '') elem.innerText = COMPLETED_PLAYER_COUNT + ' / ' + (PLAYER_COUNT-1);
})


socket.on('game_start', async function(data) {

    CARD_ARRAY = data.card_array;
    REROLLS = 2;

    document.getElementById('ROOM_SETTING').remove();
    let t = data.text.split('/');
    CURRENT_TURN = 1;
    COMPLETED_PLAYER_COUNT = 0;

    const roomId = location.toString().split('n=')[1];
    const k = await fetch('/static/rooms.txt');
    const rooms = await k.text();
    const roomsArray = rooms.split('\n')

    for(let i = 0; i < roomsArray.length; i++) {
        if(roomsArray[i].startsWith('[' + roomId + ']')) {
            PLAYER_COUNT = parseInt(roomsArray[i].split(',')[4]);
            NICKNAMES = roomsArray[i].split(',')[6].split(';');
            break;
        }
    }

    for(let i = 0; i < NICKNAMES.length; i++) {
        eval('SCORES.' + NICKNAMES[i] + ' = 0');
    }

    END_COND = parseInt(t[1]);
    END_TIME = END_COND === 1 ? parseInt(t[0]) * PLAYER_COUNT : parseInt(t[0]);

    document.getElementById('COMPLETED_PLAYER_COUNT').innerText = '0 / ' + (PLAYER_COUNT-1);

    let whiteCard;
    if(document.getElementById('WHITE_CARD') == null) {
        whiteCard = document.createElement('div');
        whiteCard.className = 'WHITE_CARD';
        whiteCard.id = 'WHITE_CARD'
        whiteCard.innerHTML = '<span style="color: white; font-size: 70px; font-family: \'noto\',serif; position:absolute; bottom: 45%; left: 45%">3</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 14px; color: white; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
        document.body.appendChild(whiteCard)
    }
    else {
        whiteCard = document.getElementById('WHITE_CARD');
        whiteCard.innerHTML = '<span style="color: white; font-size: 70px; font-family: \'noto\',serif; position:absolute; bottom: 45%; left: 45%">3</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 14px; color: white; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    }

    SOUND_DDN.play();
    await sleep(1000)
    whiteCard.innerHTML = '<span style="color: white; font-size: 70px; font-family: \'noto\',serif; position:absolute; bottom: 45%; left: 45%">2</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 14px; color: white; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    SOUND_DDN.play();
    await sleep(1000)
    whiteCard.innerHTML = '<span style="color: white; font-size: 70px; font-family: \'noto\',serif; position:absolute; bottom: 45%; left: 45%">1</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 14px; color: white; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    SOUND_DDN.play();
    await sleep(1000)

    SOUND_PORTAL.play();


    if(document.getElementById('SCOREBOARD') == null) {
        let scoreboard = document.createElement('div');
        scoreboard.className = 'SCOREBOARD DROPSHADOW';
        scoreboard.id = 'SCOREBOARD'
        document.body.appendChild(scoreboard);
        update_scoreboard();
    }

    if(document.getElementById('REROLL_BUTTON') == null) {
        let rerollButton = document.createElement('button');
        rerollButton.style = 'position:absolute; left:230px; top: 1000px; height:40px; width:200px; font-family: noto, serif; font-size: 25px;'
        rerollButton.innerText = '카드 리롤'
        rerollButton.id = 'REROLL_BUTTON'
        rerollButton.onclick = reroll;
        rerollButton.disabled = true;
        document.body.appendChild(rerollButton);

        let rerollInfo = document.createElement('span')
        rerollInfo.style = 'position:absolute; left: 450px; top: 1000px; width:200px; height:40px; font-family: noto, serif; font-size: 20px; color: #444444'
        rerollInfo.innerText = REROLLS + '턴 후 사용 가능'
        rerollInfo.id = 'REROLL_INFO'
        document.body.appendChild(rerollInfo)
    }

    whiteCard.innerHTML = '<span id="WHITE_CARD_TEXT" style="color: white; font-size: 28px; font-family: \'noto\',serif;">' + CURRENT_WHITE_CARD + '</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 14px; color: white; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'

    localStorage.setItem('mySent', CURRENT_WHITE_CARD);
    if(CURRENT_CARD_CZAR !== localStorage.getItem('nick')) {
        loadCards();
    }

    else {
        if(document.getElementById('YOUR_SENTENCE') == null) {
            const k = document.createElement('div')
            k.className = 'MY_SENTENCE DROPSHADOW'
            k.id = 'YOUR_SENTENCE'
            k.innerHTML = '<span id="YOU_ARE_THE_CZAR" style="color: lightyellow; font-family: noto, serif; font-size:30px;">당신이 카드 차르입니다!</span><br><br> <span id="YOU_ARE_THE_CZAR_DESC" style=\'color:white; font-size: 25px; font-family: noto, serif;\'>모두가 문장을 완성할 때까지 기다렸다가 완성된 문장을 보면서 가장 재밌는/맘에 드는/비인간적인 문장에 점수를 주세요!</span>';
            document.body.appendChild(k);
        }
    }


})



const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));



function clickCard(clickedCard, clickedCardId) {
    document.getElementById('REROLL_BUTTON').disabled = true;
    let currentSent = localStorage.getItem('mySent')
    currentSent = currentSent.replace('_____', '^^' + clickedCard + '^^^');
    localStorage.setItem('mySent', currentSent);


    if (!currentSent.includes('_____')) {
        let c1 = document.getElementById('BLACK_CARD_1')
        let c2 = document.getElementById('BLACK_CARD_2')
        let c3 = document.getElementById('BLACK_CARD_3')
        let c4 = document.getElementById('BLACK_CARD_4')
        let c5 = document.getElementById('BLACK_CARD_5')
        let c6 = document.getElementById('BLACK_CARD_6')
        let c7 = document.getElementById('BLACK_CARD_7')
        if(c1) c1.remove();
        if(c2) c2.remove();
        if(c3) c3.remove();
        if(c4) c4.remove();
        if(c5) c5.remove();
        if(c6) c6.remove();
        if(c7) c7.remove();

        SOUND_DING.play();

        let temp = JSON.parse(localStorage.getItem('cards'));
        const newCards = temp.filter(card => card !== clickedCard);
        localStorage.setItem('cards', JSON.stringify(newCards));

        let t = currentSent.replace(/\^\^\^/g, '</span>')
            .replace(/\^\^/g, '<span style=\'color: yellow;\'>')
        const k = document.createElement('div')
        k.className = 'MY_SENTENCE DROPSHADOW'
        k.id = 'YOUR_SENTENCE'
        k.innerHTML = '<span style="color: lightyellow; font-family: noto, serif; font-size:30px;">당신의 문장:</span><br><br> <span style=\'color:white; font-size: 25px; font-family: noto, serif;\'>' + t + '</span>';
        document.body.appendChild(k);

        socket.emit('sentence_maid', {
            roomNumber: location.toString().split('n=')[1],
            nick: localStorage.getItem('nick'),
            sentence: localStorage.getItem('mySent')
        })

    }
    else {

        SOUND_CLICK.play();

        switch (clickedCardId) {
            case 'BLACK_CARD_1':
                document.getElementById('BLACK_CARD_1').remove();
                let temp = JSON.parse(localStorage.getItem('cards'))
                const newCards = temp.filter(card => card !== temp[0]);
                localStorage.setItem('cards', JSON.stringify(newCards))
                break;
            case 'BLACK_CARD_2':
                document.getElementById('BLACK_CARD_2').remove();
                let temp2 = JSON.parse(localStorage.getItem('cards'))
                const newCards2 = temp2.filter(card => card !== temp2[1]);
                localStorage.setItem('cards', JSON.stringify(newCards2))
                break;
            case 'BLACK_CARD_3':
                document.getElementById('BLACK_CARD_3').remove();
                let temp3 = JSON.parse(localStorage.getItem('cards'))
                const newCards3 = temp3.filter(card => card !== temp3[2]);
                localStorage.setItem('cards', JSON.stringify(newCards3))
                break;
            case 'BLACK_CARD_4':
                document.getElementById('BLACK_CARD_4').remove();
                let temp4 = JSON.parse(localStorage.getItem('cards'))
                const newCards4 = temp4.filter(card => card !== temp4[3]);
                localStorage.setItem('cards', JSON.stringify(newCards4))
                break;
            case 'BLACK_CARD_5':
                document.getElementById('BLACK_CARD_5').remove();
                let temp5 = JSON.parse(localStorage.getItem('cards'))
                const newCards5 = temp5.filter(card => card !== temp5[4]);
                localStorage.setItem('cards', JSON.stringify(newCards5))
                break;
            case 'BLACK_CARD_6':
                document.getElementById('BLACK_CARD_6').remove();
                let temp6 = JSON.parse(localStorage.getItem('cards'))
                const newCards6 = temp6.filter(card => card !== temp6[5]);
                localStorage.setItem('cards', JSON.stringify(newCards6))
                break;
            case 'BLACK_CARD_7':
                document.getElementById('BLACK_CARD_7').remove();
                let temp7 = JSON.parse(localStorage.getItem('cards'))
                const newCards7 = temp7.filter(card => card !== temp7[6]);
                localStorage.setItem('cards', JSON.stringify(newCards7))
                break;
        }
    }
}

function update_scoreboard() {
    let innerhtml = '<span style="color: mediumpurple; font-size:30px; font-family: noto, serif;">점수판</span><br><br><span style="color: lightgray;">';

    const sortedScores = Object.entries(SCORES).sort((a, b) => b[1] - a[1]);

    sortedScores.forEach(([name, score]) => {
        innerhtml += `<strong>${name}</strong>: ${score}점<br>`;
    });

    document.getElementById('SCOREBOARD').innerHTML = innerhtml;
}


// 모두가 실행함
function endTheGame() {

    let k = document.createElement('div')
    k.id = 'ROOM_SETTING'
    document.body.appendChild(k);

    document.getElementById('REROLL_BUTTON').remove();
    document.getElementById('REROLL_INFO').remove();

    localStorage.setItem('cards', '');

    SOUND_PORTAL.play();

    let winner = document.getElementById('SCOREBOARD').innerHTML.split('<strong>')[1].split('</strong>')[0];
    document.getElementById('WHITE_CARD').innerHTML = '<span style="font-size: 30px; color:yellow;">' + winner + '</span><br><span style="font-size:30px; color:lawngreen;">' + '승리!</span>'
    if(localStorage.getItem('nick') === BJ) {
        let k = document.createElement('button');
        k.innerText = '다음판 시작하기'
        k.style = 'position:absolute; left:880px; top:520px; width:230px; height:50px; font-size:20px;'
        k.onclick = nextGame
        k.id = 'NEXT_ROUND_START'
        document.body.appendChild(k);
    }
}

// 마찬가지로 모두가 실행함
async function nextRound() {
    REROLLS--;
    if(REROLLS > 0) {
        document.getElementById('REROLL_INFO').innerText = REROLLS + '턴 후 사용 가능'
    }
    else {
        document.getElementById('REROLL_BUTTON').disabled = false;
        document.getElementById('REROLL_INFO').innerText = '';
    }
    let loc = location.toString().split('n=')[1];
    socket.emit('next_round_ready', {
        roomNumber: loc,
        nick: localStorage.getItem('nick'),
        playerCount: PLAYER_COUNT
    });
}


socket.on('next_round_2', function(data) {
    let myCards = JSON.parse(localStorage.getItem('cards') || '[]');
    let myCardCount = myCards.length;
    let needed = 7 - myCardCount;

    socket.emit('next_round_draw', {
        roomNumber: location.toString().split('n=')[1],
        blanks: needed > 0 ? needed : 0,
        nick: localStorage.getItem('nick'),
        playerCount: PLAYER_COUNT
    });
});


socket.on('next_round_3', function(data) {
    if(CURRENT_CARD_CZAR !== localStorage.getItem('nick')) {
        loadCards();
    }
    else {
        document.getElementById('REROLL_BUTTON').disabled = true;
        const k = document.createElement('div')
        k.className = 'MY_SENTENCE DROPSHADOW'
        k.id = 'YOUR_SENTENCE'
        k.innerHTML = '<span id="YOU_ARE_THE_CZAR" style="color: lightyellow; font-family: noto, serif; font-size:30px;">당신이 카드 차르입니다!</span><br><br> <span id="YOU_ARE_THE_CZAR_DESC" style=\'color:white; font-size: 25px; font-family: noto, serif;\'>모두가 문장을 완성할 때까지 기다렸다가 완성된 문장을 보면서 가장 재밌는/맘에 드는/비인간적인 문장에 점수를 주세요!</span>';
        document.body.appendChild(k);
    }
    document.getElementById('COMPLETED_PLAYER_COUNT').innerText =  '0 / ' + (PLAYER_COUNT-1);

    COMPLETED_PLAYER_COUNT = 0;
    SENTENCES = [];
    NICKNAMES = [];
    CURRENT_CARD_INDEX = 0;

})


socket.on('display_chat', function(data) {
    let chatting = data.chat
    let nick = data.nick
    document.querySelectorAll('.CHAT_DISPLAY').forEach(elem => {
        let temp = parseInt(elem.style.top.replace('px', ''));
        temp -= 27;
        if(temp < 450) {
            elem.remove();
        }
        else {
            elem.style.top = temp + 'px';
        }
    })
    let newChat = document.createElement('span')
    newChat.className = 'CHAT_DISPLAY'
    newChat.innerHTML = '<span style="color: lightyellow">' + nick + ': </span>' + chatting;
    newChat.style = 'left: 1180px; top: 600px; position:absolute; z-index: 1; font-family: noto, serif;'
    document.body.appendChild(newChat);
})



// 방장이 실행함
async function nextGame() {


    document.getElementById('NEXT_ROUND_START').remove();

    socket.emit('game_start', {
        roomNumber: location.toString().split('n=')[1],
        condition: END_COND,
        time: END_TIME,
        cards: CARD_ARRAY
    })

}




function reroll() {
    REROLLS = 12;
    document.getElementById('REROLL_BUTTON').disabled = true;
    let c1 = document.getElementById('BLACK_CARD_1')
    let c2 = document.getElementById('BLACK_CARD_2')
    let c3 = document.getElementById('BLACK_CARD_3')
    let c4 = document.getElementById('BLACK_CARD_4')
    let c5 = document.getElementById('BLACK_CARD_5')
    let c6 = document.getElementById('BLACK_CARD_6')
    let c7 = document.getElementById('BLACK_CARD_7')
    if(c1) c1.remove();
    if(c2) c2.remove();
    if(c3) c3.remove();
    if(c4) c4.remove();
    if(c5) c5.remove();
    if(c6) c6.remove();
    if(c7) c7.remove();

    localStorage.setItem('cards', '[]')

    socket.emit('reroll', {
        roomNumber: location.toString().split('n=')[1],
        nick: localStorage.getItem('nick')
    })
}


socket.on('reroll', function(data) {
    if(localStorage.getItem('nick') === data.nick) {
        SOUND_PAPER_1.play();
        loadCards();
    }
})



function loadCards() {

    let myCards = JSON.parse(localStorage.getItem('cards'));
    const blackCard1 = document.createElement('div');
    const blackCard2 = document.createElement('div');
    const blackCard3 = document.createElement('div');
    const blackCard4 = document.createElement('div');
    const blackCard5 = document.createElement('div');
    const blackCard6 = document.createElement('div');
    const blackCard7 = document.createElement('div');
    blackCard1.className = 'BLACK_CARD';
    blackCard2.className = 'BLACK_CARD';
    blackCard3.className = 'BLACK_CARD';
    blackCard4.className = 'BLACK_CARD';
    blackCard5.className = 'BLACK_CARD';
    blackCard6.className = 'BLACK_CARD';
    blackCard7.className = 'BLACK_CARD';
    blackCard1.id = 'BLACK_CARD_1'
    blackCard2.id = 'BLACK_CARD_2'
    blackCard3.id = 'BLACK_CARD_3'
    blackCard4.id = 'BLACK_CARD_4'
    blackCard5.id = 'BLACK_CARD_5'
    blackCard6.id = 'BLACK_CARD_6'
    blackCard7.id = 'BLACK_CARD_7'
    blackCard1.style = 'left: 150px; top: 600px; scale: 70% 70%;'
    blackCard2.style = 'left: 380px; top: 600px; scale: 70% 70%;'
    blackCard3.style = 'left: 610px; top: 600px; scale: 70% 70%;'
    blackCard4.style = 'left: 840px; top: 600px; scale: 70% 70%;'
    blackCard5.style = 'left: 1070px; top: 600px; scale: 70% 70%;'
    blackCard6.style = 'left: 1300px; top: 600px; scale: 70% 70%;'
    blackCard7.style = 'left: 1530px; top: 600px; scale: 70% 70%;'
    blackCard1.innerHTML = '<span style="color: black; font-size: 28px; font-family: \'noto\',serif; position:absolute;">' + myCards[0] + '.</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 5%; color: black; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    blackCard2.innerHTML = '<span style="color: black; font-size: 28px; font-family: \'noto\',serif; position:absolute;">' + myCards[1] + '.</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 5%; color: black; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    blackCard3.innerHTML = '<span style="color: black; font-size: 28px; font-family: \'noto\',serif; position:absolute;">' + myCards[2] + '.</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 5%; color: black; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    blackCard4.innerHTML = '<span style="color: black; font-size: 28px; font-family: \'noto\',serif; position:absolute;">' + myCards[3] + '.</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 5%; color: black; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    blackCard5.innerHTML = '<span style="color: black; font-size: 28px; font-family: \'noto\',serif; position:absolute;">' + myCards[4] + '.</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 5%; color: black; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    blackCard6.innerHTML = '<span style="color: black; font-size: 28px; font-family: \'noto\',serif; position:absolute;">' + myCards[5] + '.</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 5%; color: black; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    blackCard7.innerHTML = '<span style="color: black; font-size: 28px; font-family: \'noto\',serif; position:absolute;">' + myCards[6] + '.</span><span style="width: 100%; position:absolute; bottom: 3.57%; left: 5%; color: black; font-size:12px; font-family: \'noto\', serif">Korean Cards Against Humanity</span>'
    document.body.appendChild(blackCard1)
    document.body.appendChild(blackCard2)
    document.body.appendChild(blackCard3)
    document.body.appendChild(blackCard4)
    document.body.appendChild(blackCard5)
    document.body.appendChild(blackCard6)
    document.body.appendChild(blackCard7)


    // 아 귀찮아그냥이렇게할래

    document.getElementById('BLACK_CARD_1').addEventListener('mouseover', async function (e) {
        let y = 0, k = 0;
        while (y < 99.9) {
            k++;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_2').addEventListener('mouseover', async function (e) {
        let y = 0, k = 0;
        while (y < 99.9) {
            k++;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_3').addEventListener('mouseover', async function (e) {
        let y = 0, k = 0;
        while (y < 99.9) {
            k++;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_4').addEventListener('mouseover', async function (e) {
        let y = 0, k = 0;
        while (y < 99.9) {
            k++;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_5').addEventListener('mouseover', async function (e) {
        let y = 0, k = 0;
        while (y < 99.9) {
            k++;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_6').addEventListener('mouseover', async function (e) {
        let y = 0, k = 0;
        while (y < 99.9) {
            k++;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_7').addEventListener('mouseover', async function (e) {
        let y = 0, k = 0;
        while (y < 99.9) {
            k++;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })

    document.getElementById('BLACK_CARD_1').addEventListener('mouseleave', async function (e) {
        let y = 100, k = 40;
        while (y > 0.1) {
            k--;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_2').addEventListener('mouseleave', async function (e) {
        let y = 100, k = 40;
        while (y > 0.1) {
            k--;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_3').addEventListener('mouseleave', async function (e) {
        let y = 100, k = 40;
        while (y > 0.1) {
            k--;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_4').addEventListener('mouseleave', async function (e) {
        let y = 100, k = 40;
        while (y > 0.1) {
            k--;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_5').addEventListener('mouseleave', async function (e) {
        let y = 100, k = 40;
        while (y > 0.1) {
            k--;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_6').addEventListener('mouseleave', async function (e) {
        let y = 100, k = 40;
        while (y > 0.1) {
            k--;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })
    document.getElementById('BLACK_CARD_7').addEventListener('mouseleave', async function (e) {
        let y = 100, k = 40;
        while (y > 0.1) {
            k--;
            y = 100 * (Math.log(k + 1) / LOG41)
            this.style.top = (600 - y) + 'px';
            await sleep(5)
        }
    })



    document.getElementById('BLACK_CARD_1').addEventListener('mousedown', function (e) {
        clickCard(this.innerText.replace('.\nKorean Cards Against Humanity', ''), this.id)
    })
    document.getElementById('BLACK_CARD_2').addEventListener('mousedown', function (e) {
        clickCard(this.innerText.replace('.\nKorean Cards Against Humanity', ''), this.id)
    })
    document.getElementById('BLACK_CARD_3').addEventListener('mousedown', function (e) {
        clickCard(this.innerText.replace('.\nKorean Cards Against Humanity', ''), this.id)
    })
    document.getElementById('BLACK_CARD_4').addEventListener('mousedown', function (e) {
        clickCard(this.innerText.replace('.\nKorean Cards Against Humanity', ''), this.id)
    })
    document.getElementById('BLACK_CARD_5').addEventListener('mousedown', function (e) {
        clickCard(this.innerText.replace('.\nKorean Cards Against Humanity', ''), this.id)
    })
    document.getElementById('BLACK_CARD_6').addEventListener('mousedown', function (e) {
        clickCard(this.innerText.replace('.\nKorean Cards Against Humanity', ''), this.id)
    })
    document.getElementById('BLACK_CARD_7').addEventListener('mousedown', function (e) {
        clickCard(this.innerText.replace('.\nKorean Cards Against Humanity', ''), this.id)
    })
}