from flask import Flask, request, render_template, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import os, random

app = Flask(__name__)
socketio = SocketIO(app)

white_cards = {}
black_cards = {}

sentences = {}
nicks = {}

draw_completed_count = {}
ready_players = {}

current_dir = os.path.dirname(os.path.abspath(__file__))
rooms_file_path = os.path.join(current_dir, 'static', 'rooms.txt')

def shuffle_together(list1, list2):
    combined = list(zip(list1, list2))
    random.shuffle(combined)
    list1[:], list2[:] = zip(*combined)





@app.route("/main")
def index():
    return render_template("cah.html")



@app.route("/room")
def index2():
    return render_template("room.html")



@app.route("/room_not_found")
def index3():
    return render_template("room404.html")




@app.route("/set_nickname", methods=['POST'])
def set_nickname():
    data = request.json
    new_nick = data.get('nickname')

    if not new_nick:
        return "닉네임이 없습니다.", 400

    file_path = os.path.join(app.static_folder, 'nicknames.txt')

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_nick)
        return "저장 성공!", 200
    except Exception as e:
        print(f"에러 발생: {e}")
        return "서버 저장 실패", 500




@app.route("/leave", methods=['POST'])
def leave():
    left_players = ""
    bj = ""
    rn = request.json.get('roomNumber')
    leaver = request.json.get('leaver')
    room_file = []
    write_this = ""
    playing = False

    with open(rooms_file_path, 'r', encoding='utf-8') as f:
        room_file = f.read().split('\n')

    for i in range(0, len(room_file)):
        current_str = room_file[i]
        if '[' + str(rn) + ']' in current_str:
            current_str_split = current_str.split(",")
            playing = current_str_split[0].split(':')[1] == '1'
            players = int(current_str_split[4])
            players -= 1
            if players > 0:
                left_players = current_str_split[6].replace(";" + leaver, "").replace(leaver + ";", "")
                bj = current_str_split[5]

                if bj == leaver:
                    bj = left_players.split(";")[0]

                write_this += (current_str_split[0] + "," + current_str_split[1] + "," + current_str_split[2] + "," + current_str_split[3] + "," + str(players) + "," + bj + "," + left_players + "\n")
            else:
                white_cards[rn] = []
                black_cards[rn] = []
                sentences[rn] = []
                nicks[rn] = []

        else:
            write_this += current_str + "\n"

    with open(rooms_file_path, 'w', encoding='utf-8') as f:
        f.write(write_this.rstrip())

    temp = left_players.split(";")
    final_left_players = ""

    for i in range(0, len(temp)):
        if temp[i] == bj:
            final_left_players += (bj + " (방장)<br>")
        else:
            final_left_players += (temp[i] + "<br>")

    if playing:
        if rn not in nicks:
            socketio.emit('remove_one_player', {'did_he_complete': 0}, to=rn)
        elif leaver in nicks.get(rn):
            socketio.emit('remove_one_player', {'did_he_complete': 1}, to=rn)
        else:
            socketio.emit('remove_one_player', {'did_he_complete': 0}, to=rn)


    socketio.emit('update_span', {
        'text': final_left_players
    }, to=rn)

    socketio.emit('update_bj', {
        'text': bj
    }, to=rn)

    socketio.emit('display_chat', {'chat': '<span style="color: red;">(방을 나감)</span>', 'nick': leaver}, to=rn)


    return ''




@app.route("/create_room", methods=['POST'])
def create_room():
    data = request.json
    rn = data.get('roomNumber')
    nick = data.get('nick')

    with open(rooms_file_path, 'a', encoding='utf-8') as f:
        f.write('\n[' + str(rn) + ']:0,black;white,2,10,1,' + str(nick) + ',' + str(nick))

    return ""



@app.route("/join_room", methods=['POST'])
def jr():
    rn = request.json.get('roomNumber')
    joiner = request.json.get('joiner')
    room_file = []
    write_this = ""

    with open(rooms_file_path, 'r', encoding='utf-8') as f:
        room_file = f.read().split('\n')

    for i in range(0, len(room_file)):
        current_str = room_file[i]
        if '[' + rn + ']' in current_str:
            current_str_split = current_str.split(",")
            players = int(current_str_split[4]) + 1
            nicknames = current_str_split[6] + ";" + joiner
            write_this += (current_str_split[0] + "," + current_str_split[1] + "," + current_str_split[2] + "," + current_str_split[3] + "," + str(players) + "," + current_str_split[5] + "," + nicknames + "\n")

        else:
            write_this += current_str + "\n"

    with open(rooms_file_path, 'w', encoding='utf-8') as f:
        f.write(write_this.rstrip())

    return write_this.rstrip()




@socketio.on('join_check')
def on_join(data):
    room_id = data['roomNumber']  # 클라이언트가 보낸 n 값 (예: 100)
    join_room(room_id)         # 해당 n 값을 이름으로 하는 방에 입장
    print(f"User joined room: {room_id}")


@socketio.on('join_event')
def handle_click(data):
    room_id = data['roomNumber']  # 보낸 사람이 속한 n 값
    new_text = data['text']    # 바꿀 텍스트

    # 해당 room_id(방)에 있는 사람들에게만 전송!
    emit('update_span', {'text': new_text}, to=room_id)


@socketio.on('update_card_desc')
def ucd(data):
    room_id = data['roomNumber']
    new_text = data['selected']
    emit('update_card_desc', {'text': new_text}, to=room_id)


@socketio.on('update_condition_number')
def ucn(data):
    room_id = data['roomNumber']
    new_text = data['selected']
    emit('update_condition_number', {'text': new_text}, to=room_id)

@socketio.on('update_condition_option')
def uco(data):
    room_id = data['roomNumber']
    new_text = data['selected']
    emit('update_condition_option', {'text': new_text}, to=room_id)

@socketio.on('game_start')
def gs(data):
    global black_cards, white_cards
    room_id = data['roomNumber']
    condition = str(data['condition'])
    time = str(data['time'])
    card_array = data['cards']
    emit('game_start', {'text': time + "/" + condition, 'card_array': card_array}, to=room_id)

    players = []

    write_this = ""

    with open(rooms_file_path, 'r', encoding='utf-8') as f:
        room_file = f.read().split('\n')

        for i in range(0, len(room_file)):
            current_str = room_file[i]
            if '[' + str(room_id) + ']' in current_str:
                current_str_colon_split = current_str.split(":")
                room_number = current_str_colon_split[0]
                current_room_setting = current_str_colon_split[1].split(",")
                players = current_room_setting[6].split(';')
                write_this += (room_number + ":1," + current_room_setting[1] + "," + condition + "," + time + "," + current_room_setting[4] + "," + current_room_setting[5] + "," + current_room_setting[6])

            else:
                write_this += current_str + "\n"

    with open(rooms_file_path, 'w', encoding='utf-8') as f:
        f.write(write_this.rstrip())


    using_temp = str(data['cards']).split(';')

    sentences[room_id] = []
    
    using1 = using_temp[0]
    using2 = using_temp[1]

    black_cards_temp = []
    white_cards_temp = []

    using1path = os.path.join(current_dir, 'static', 'cards', using1 + '.txt')
    using2path = os.path.join(current_dir, 'static', 'cards', using2 + '.txt')

    with open(using1path, 'r', encoding='utf-8') as f:
        black_cards_temp = f.read().split('\n')

    with open(using2path, 'r', encoding='utf-8') as f:
        white_cards_temp = f.read().split('\n')


    random.shuffle(black_cards_temp)
    random.shuffle(white_cards_temp)
    random.shuffle(players)

    for i in range(0, len(white_cards_temp)):
        temp = white_cards_temp[i].replace('`', '_____')
        if '|' in temp:
            temp = temp.replace('|||', players[0])
            temp = temp.replace('||', players[1])
            temp = temp.replace('|', players[2])
            random.shuffle(players)

        white_cards_temp[i] = temp

    random.shuffle(players)

    for i in range(0, len(black_cards_temp)):
        temp = black_cards_temp[i]
        if '`' in temp:
            temp = temp.replace('```', players[0])
            temp = temp.replace('``', players[1])
            temp = temp.replace('`', players[2])
            random.shuffle(players)
            black_cards_temp[i] = temp


    black_cards[room_id] = black_cards_temp
    white_cards[room_id] = white_cards_temp



    card = white_cards[room_id].pop()
    emit('show_white_card', {'card': card}, to=room_id)

    emit('set_card_czar', {'czar': players[0]}, to=room_id)


    for i in players:
        for j in range(0, 7):
            emit('show_black_card', {
                'card': black_cards[room_id].pop(),
                'nick': i
            }, to=room_id)



@socketio.on('draw_black_card')
def draw1(data):
    global black_cards
    room_id = data['roomNumber']
    nick = data['nick']
    drawn_card = black_cards[room_id].pop()

    emit('show_black_card', {
        'card': drawn_card,
        'nick': nick
    }, to=room_id)


@socketio.on('draw_white_card')
def draw2(data):
    global white_cards

    room_id = data['roomNumber']
    drawn_card = white_cards[room_id].pop()

    emit('show_white_card', {
        'card': drawn_card
    }, to=room_id)



@socketio.on('sentence_maid')
def sm(data):
    room_id = data['roomNumber']
    nick = data['nick']
    sentence = data['sentence']

    if room_id not in nicks:
        nicks[room_id] = []

    if room_id not in sentences:
        sentences[room_id] = []

    nicks[room_id].append(nick)
    sentences[room_id].append(sentence)

    emit('sentence_maid', {}, to=room_id)


@socketio.on('req_sentences')
def rs(data):
    room_id = data['roomNumber']
    sentences_to_return = sentences.get(room_id, [])
    nicks_to_return = nicks.get(room_id, [])
    shuffle_together(sentences_to_return, nicks_to_return)

    emit('send_sentences', {'sentences': sentences_to_return, 'nicks': nicks_to_return}, to=room_id)


@socketio.on('czar_start_ready')
def csr(data):
    room_id = data['roomNumber']
    emit('czar_start_ready', {}, to=room_id)

@socketio.on('see_another_sentence')
def sas(data):
    room_id = data['roomNumber']
    is_this_next = data['isThisNext']
    emit('see_another_sentence', {'isThisNext': is_this_next}, to=room_id)

@socketio.on('give_score')
def gss(data):
    room_id = data['roomNumber']
    nick = data['nick']
    current_score = data['currentScore']
    emit('give_score', {'nick': nick, 'currentScore': current_score}, to=room_id)


@socketio.on('next_round_ready')
def handle_next_round(data):
    room_id = data['roomNumber']
    nick = data['nick']
    player_count = data['playerCount']

    if room_id not in ready_players:
        ready_players[room_id] = set()

    ready_players[room_id].add(nick)

    if len(ready_players[room_id]) >= int(player_count):
        nr({'roomNumber': room_id})
        ready_players[room_id].clear()


@socketio.on('next_round')
def nr(data):
    room_id = data['roomNumber']

    emit('show_white_card', {'card': white_cards[room_id].pop()}, to=room_id)
    r = len(nicks[room_id]) - 1

    emit('set_card_czar', {'czar': nicks[room_id][r]}, to=room_id)

    nicks[room_id] = []
    sentences[room_id] = []

    emit('next_round_2', {}, to=room_id)


@socketio.on('next_round_draw')
def nr2(data):
    room_id = data['roomNumber']
    blanks = int(data['blanks'])
    nick = data['nick']
    player_count = int(data['playerCount'])

    for i in range(blanks):
        if black_cards.get(room_id):
            emit('show_black_card', {
               'card': black_cards[room_id].pop(),
               'nick': nick
           }, to=room_id)

    if room_id not in draw_completed_count:
        draw_completed_count[room_id] = 0

    draw_completed_count[room_id] += 1

    if draw_completed_count[room_id] >= player_count:
        emit('next_round_3', {}, to=room_id)
        draw_completed_count[room_id] = 0


@socketio.on('chat')
def chat(data):
    room_id = data['roomNumber']
    chatting = data['chat']
    nickname = data['nick']

    emit('display_chat', {'chat': chatting, 'nick': nickname}, to=room_id)

@socketio.on('reroll')
def rr(data):
    room_id = data['roomNumber']
    nickname = data['nick']

    for i in range(0, 7):
        emit('show_black_card', {
        'card': black_cards[room_id].pop(),
            'nick': nickname
        }, to=room_id)


    emit('reroll', {
        'nick': nickname
    }, to=room_id)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)
