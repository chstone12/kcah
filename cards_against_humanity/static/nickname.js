async function setNick() {
    let nickInput = document.getElementById('NICKNAME_INPUT').value;
    const playing = await fetch('/static/rooms.txt');
    const k = await playing.text()
    let currentNick = localStorage.getItem('nick');


    if(nickInput.includes(';')) {
        document.getElementById('NICKNAME_INFO').innerText = '닉네임에 세미콜론이 들어가면 안 됩니다!'
        return;
    }
    else if(nickInput.includes(':')) {
        document.getElementById('NICKNAME_INFO').innerText = '닉네임에 콜론이 들어가면 안 됩니다!'
        return;
    }
    else if(nickInput.includes(',')) {
        document.getElementById('NICKNAME_INFO').innerText = '닉네임에 쉼표가 들어가면 안 됩니다!'
        return;
    }
    else if(nickInput.includes(' ') || nickInput.includes('　')) {
        document.getElementById('NICKNAME_INFO').innerText = '닉네임에 띄어쓰기가 들어가면 안 됩니다!'
        return;
    }
    else if(getByteLength(nickInput) > 20) {
        document.getElementById('NICKNAME_INFO').innerText = '닉네임은 20바이트 이하여야 됩니다!'
        return;
    }
    else if(!(localStorage.getItem('ignoreAndJoin') === '1') && (k.includes(',' + currentNick + ';') || k.includes(',' + currentNick + ',') || k.includes(';' + currentNick + '\n') || k.includes(';' + currentNick + ';'))) {
        document.getElementById('NICKNAME_INFO').innerText = '플레이 도중에는 닉을 바꿀 수 없습니다!'
        return;
    }

    let isThisHisFirstTime = false;
    if(currentNick == null) {
        currentNick = '';
        isThisHisFirstTime = true;
    }

    if(nickInput === '') {
        console.log('a')
        document.getElementById('NICKNAME_INFO').innerText = '닉네임을 입력해 주세요!'
    }
    else if(currentNick === nickInput) {
        document.getElementById('NICKNAME_INFO').innerText = '당신의 닉네임은 이미 ' + currentNick + '입니다!'
    }
    else {

        // Foxified <- 이새끼 때문에 console.log 비활성화돼서 버그 찾는다고 2시간 반을 날렸다
        // 어떤 개 발자가 console.log를 덮어씌울 생각을 한 거냐?

        const response = await fetch('/static/nicknames.txt');
        const data = await response.text();
        const nicks = data.split("\n").map(name => name.trim()); // 공백 제거 추가


        let nickInput = document.getElementById('NICKNAME_INPUT').value;
        if (nicks.includes(nickInput)) {
            document.getElementById('NICKNAME_INFO').innerText = '중복된 닉네임입니다!'
        } else {
            document.getElementById('NICKNAME_INFO').innerText = '닉네임이 설정되었습니다!'
            localStorage.setItem('nick', nickInput);

            for(let i = 0; i < nicks.length; i++) {
                if(nicks[i] === currentNick) nicks[i] = nickInput;
            }

            let newNicks = nicks[0];
            for(let i = 1; i < nicks.length; i++) {
                newNicks = newNicks + '\n' + nicks[i];
            }

            if(isThisHisFirstTime) {
                newNicks = newNicks + '\n' + nickInput;
            }

            await fetch('/set_nickname', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nickname: newNicks.trimEnd() })
            });

            document.getElementById('CURRENT_NICK').innerText = '닉네임: ' + localStorage.getItem('nick');



        }

    }
}

function createRoom() {
    if(localStorage.getItem('nick') == null) {
        document.getElementById('NICKNAME_INFO').innerText = '닉네임을 정해야 방을 만들 수 있습니다!';
        return;
    }
    window.open(location.toString().replace('main', '') + 'room', '_blank')
}


function joinRoom() {
    if(localStorage.getItem('nick') == null) {
        document.getElementById('NICKNAME_INFO').innerText = '닉네임을 정해야 참여할 수 있습니다!';
        return;
    }
    let n = document.getElementById('ROOM_NUMBER').value;
    window.open(location.toString().replace('main', '') + 'room?n=' + n, '_blank')
}


document.getElementById('NICKNAME_INPUT').addEventListener("keydown", function(e) {
    if(e.key === 'Enter') {
        e.preventDefault();
        setNick();
    }
})
document.getElementById('ROOM_NUMBER').addEventListener("keydown", function(e) {
    if(e.key === 'Enter') {
        e.preventDefault();
        joinRoom();
    }
})

if(localStorage.getItem('nick') == null) {
    document.getElementById('CURRENT_NICK').innerText = '닉네임: -'
}
else {
    document.getElementById('CURRENT_NICK').innerText = '닉네임: ' + localStorage.getItem('nick');
}



const getByteLength = (str) => {
    return new TextEncoder().encode(str).length;
};

