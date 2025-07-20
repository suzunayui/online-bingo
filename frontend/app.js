/**
 * オンラインビンゴ - フロントエンド
 * マルチプレイヤー対応のビンゴゲーム
 */

class BingoApp {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.playerName = null;
        this.isHost = false;
        this.bingoCard = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.connectToServer();
    }
    
    setupEventListeners() {
        // ルーム作成
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.createRoom();
        });
        
        // ルーム参加
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.joinRoom();
        });
        
        // ルーム退出
        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });
        
        // 数字を呼ぶ（ホストのみ）
        document.getElementById('callNumberBtn').addEventListener('click', () => {
            this.callNumber();
        });
        
        // Enterキーでの操作
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createRoom();
        });
        
        document.getElementById('roomName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createRoom();
        });
        
        document.getElementById('joinPlayerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        
        document.getElementById('roomId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
    }
    
    connectToServer() {
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('📡 サーバーに接続しました');
                this.updateConnectionStatus(true, 'サーバーに接続済み');
            });
            
            this.socket.on('disconnect', () => {
                console.log('📡 サーバーから切断されました');
                this.updateConnectionStatus(false, 'サーバーから切断されました');
            });
            
            this.socket.on('roomCreated', (data) => {
                console.log('🏠 ルームが作成されました:', data);
                this.joinedRoom(data);
                this.isHost = true;
                this.showHostControls();
            });
            
            this.socket.on('roomJoined', (data) => {
                console.log('🎯 ルームに参加しました:', data);
                this.joinedRoom(data);
                this.isHost = false;
                this.hideHostControls();
            });
            
            this.socket.on('playerJoined', (data) => {
                console.log('👋 プレイヤーが参加しました:', data);
                this.updatePlayersList(data.players);
            });
            
            this.socket.on('playerLeft', (data) => {
                console.log('👋 プレイヤーが退出しました:', data);
                this.updatePlayersList(data.players);
            });
            
            this.socket.on('numberCalled', (data) => {
                console.log('📢 数字が呼ばれました:', data);
                this.handleNumberCalled(data.number);
            });
            
            this.socket.on('gameStarted', (data) => {
                console.log('🎮 ゲームが開始されました:', data);
                this.startGame(data);
            });
            
            this.socket.on('bingo', (data) => {
                console.log('🎊 ビンゴ！:', data);
                this.handleBingo(data);
            });
            
            this.socket.on('error', (error) => {
                console.error('❌ エラー:', error);
                alert(`エラー: ${error.message}`);
            });
            
        } catch (error) {
            console.error('❌ Socket接続エラー:', error);
            this.updateConnectionStatus(false, 'サーバー接続失敗');
        }
    }
    
    updateConnectionStatus(connected, message) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        indicator.textContent = connected ? '🟢' : '🔴';
        text.textContent = message;
    }
    
    createRoom() {
        const playerName = document.getElementById('playerName').value.trim();
        const roomName = document.getElementById('roomName').value.trim();
        
        if (!playerName) {
            alert('プレイヤー名を入力してください');
            return;
        }
        
        this.playerName = playerName;
        
        console.log('🏠 ルーム作成中...', { playerName, roomName });
        this.socket.emit('createRoom', {
            playerName: playerName,
            roomName: roomName || `${playerName}のルーム`
        });
    }
    
    joinRoom() {
        const playerName = document.getElementById('joinPlayerName').value.trim();
        const roomId = document.getElementById('roomId').value.trim();
        
        if (!playerName) {
            alert('プレイヤー名を入力してください');
            return;
        }
        
        if (!roomId) {
            alert('ルームIDを入力してください');
            return;
        }
        
        this.playerName = playerName;
        
        console.log('🎯 ルーム参加中...', { playerName, roomId });
        this.socket.emit('joinRoom', {
            roomId: roomId,
            playerName: playerName
        });
    }
    
    joinedRoom(roomData) {
        this.currentRoom = roomData.roomId;
        
        // 画面切り替え
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';
        
        // ルーム情報表示
        document.getElementById('currentRoomId').textContent = roomData.roomId;
        document.getElementById('currentPlayerName').textContent = this.playerName;
        
        // プレイヤーリスト更新
        this.updatePlayersList(roomData.players);
        
        // ビンゴカード生成
        if (!this.bingoCard) {
            this.bingoCard = new MultiplayerBingoCard();
        }
    }
    
    updatePlayersList(players) {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '<h4>👥 参加者一覧:</h4>';
        
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span class="player-name">${player.name}</span>
                ${player.isHost ? '<span class="host-badge">👑 ホスト</span>' : ''}
            `;
            playersList.appendChild(playerDiv);
        });
    }
    
    showHostControls() {
        document.getElementById('callNumberBtn').style.display = 'inline-block';
    }
    
    hideHostControls() {
        document.getElementById('callNumberBtn').style.display = 'none';
    }
    
    callNumber() {
        if (!this.isHost || !this.currentRoom) return;
        
        console.log('🎲 数字を呼びます...');
        this.socket.emit('callNumber', { roomId: this.currentRoom });
    }
    
    handleNumberCalled(number) {
        // 呼ばれた数字を表示
        this.showCalledNumber(number);
        
        // ビンゴカードの該当セルをマーク可能にする
        if (this.bingoCard) {
            this.bingoCard.markNumber(number);
        }
    }
    
    showCalledNumber(number) {
        const calledNumbers = document.getElementById('calledNumbers');
        const numbersGrid = document.getElementById('numbersGrid');
        
        calledNumbers.style.display = 'block';
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'called-number';
        numberSpan.textContent = number;
        numberSpan.style.animationDelay = '0.1s';
        
        numbersGrid.appendChild(numberSpan);
        
        // 最新の数字を強調
        const allNumbers = numbersGrid.querySelectorAll('.called-number');
        allNumbers.forEach(span => span.classList.remove('latest'));
        numberSpan.classList.add('latest');
    }
    
    startGame(gameData) {
        console.log('🎮 ゲーム開始:', gameData);
        // ゲーム開始時の処理
    }
    
    handleBingo(data) {
        alert(`🎊 ${data.playerName}がビンゴしました！ 🎊`);
    }
    
    leaveRoom() {
        if (!this.currentRoom) return;
        
        console.log('🚪 ルーム退出中...');
        this.socket.emit('leaveRoom', { roomId: this.currentRoom });
        
        // 画面をスタート画面に戻す
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
        
        // リセット
        this.currentRoom = null;
        this.isHost = false;
        this.bingoCard = null;
        
        // フォームクリア
        document.getElementById('playerName').value = '';
        document.getElementById('roomName').value = '';
        document.getElementById('joinPlayerName').value = '';
        document.getElementById('roomId').value = '';
        
        // 呼ばれた数字をクリア
        document.getElementById('calledNumbers').style.display = 'none';
        document.getElementById('numbersGrid').innerHTML = '';
    }
}

class MultiplayerBingoCard {
    constructor() {
        this.numbers = [];
        this.markedCells = new Set();
        this.generateCard();
        this.renderCard();
    }
    
    generateCard() {
        // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
        const ranges = [
            [1, 15],   // B
            [16, 30],  // I
            [31, 45],  // N
            [46, 60],  // G
            [61, 75]   // O
        ];
        
        this.numbers = [];
        
        for (let col = 0; col < 5; col++) {
            const columnNumbers = [];
            const [min, max] = ranges[col];
            const availableNumbers = [];
            
            for (let i = min; i <= max; i++) {
                availableNumbers.push(i);
            }
            
            // 各列から5個の数字をランダムに選択
            for (let row = 0; row < 5; row++) {
                if (col === 2 && row === 2) {
                    // 中央はFREE
                    columnNumbers.push('FREE');
                } else {
                    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
                    const number = availableNumbers.splice(randomIndex, 1)[0];
                    columnNumbers.push(number);
                }
            }
            
            this.numbers.push(columnNumbers);
        }
    }
    
    renderCard() {
        const cardGrid = document.getElementById('cardGrid');
        cardGrid.innerHTML = '';
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'bingo-cell';
                cell.textContent = this.numbers[col][row];
                cell.dataset.col = col;
                cell.dataset.row = row;
                cell.dataset.number = this.numbers[col][row];
                
                if (this.numbers[col][row] === 'FREE') {
                    cell.classList.add('marked', 'free');
                    this.markedCells.add(`${col}-${row}`);
                } else {
                    cell.addEventListener('click', () => {
                        this.toggleCell(col, row);
                    });
                }
                
                cardGrid.appendChild(cell);
            }
        }
    }
    
    markNumber(number) {
        // 呼ばれた数字がカードにある場合、クリック可能状態にする
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                if (this.numbers[col][row] === number) {
                    const cell = document.querySelector(`.bingo-cell[data-col="${col}"][data-row="${row}"]`);
                    if (cell && !cell.classList.contains('marked')) {
                        cell.classList.add('callable');
                        
                        // 自動的に3秒後にハイライトを消す
                        setTimeout(() => {
                            cell.classList.remove('callable');
                        }, 3000);
                    }
                }
            }
        }
    }
    
    toggleCell(col, row) {
        const cellKey = `${col}-${row}`;
        const cell = document.querySelector(`.bingo-cell[data-col="${col}"][data-row="${row}"]`);
        
        if (this.numbers[col][row] === 'FREE') return;
        
        if (this.markedCells.has(cellKey)) {
            this.markedCells.delete(cellKey);
            cell.classList.remove('marked');
        } else {
            this.markedCells.add(cellKey);
            cell.classList.add('marked');
        }
        
        this.checkBingo();
    }
    
    checkBingo() {
        const bingoLines = this.getBingoLines();
        
        for (let line of bingoLines) {
            if (line.every(cellKey => this.markedCells.has(cellKey))) {
                this.handleBingo(line);
                return true;
            }
        }
        
        return false;
    }
    
    getBingoLines() {
        const lines = [];
        
        // 横のライン
        for (let row = 0; row < 5; row++) {
            const line = [];
            for (let col = 0; col < 5; col++) {
                line.push(`${col}-${row}`);
            }
            lines.push(line);
        }
        
        // 縦のライン
        for (let col = 0; col < 5; col++) {
            const line = [];
            for (let row = 0; row < 5; row++) {
                line.push(`${col}-${row}`);
            }
            lines.push(line);
        }
        
        // 斜めのライン（左上から右下）
        const diagonal1 = [];
        for (let i = 0; i < 5; i++) {
            diagonal1.push(`${i}-${i}`);
        }
        lines.push(diagonal1);
        
        // 斜めのライン（右上から左下）
        const diagonal2 = [];
        for (let i = 0; i < 5; i++) {
            diagonal2.push(`${4-i}-${i}`);
        }
        lines.push(diagonal2);
        
        return lines;
    }
    
    handleBingo(line) {
        // ビンゴラインを強調表示
        line.forEach(cellKey => {
            const [col, row] = cellKey.split('-');
            const cell = document.querySelector(`.bingo-cell[data-col="${col}"][data-row="${row}"]`);
            if (cell) {
                cell.classList.add('bingo-line');
            }
        });
        
        // サーバーにビンゴを通知
        const app = window.bingoApp;
        if (app && app.socket && app.currentRoom) {
            app.socket.emit('bingo', {
                roomId: app.currentRoom,
                playerName: app.playerName
            });
        }
        
        // ユーザーに通知
        setTimeout(() => {
            alert('🎊 ビンゴ！ おめでとうございます！ 🎊');
        }, 500);
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.bingoApp = new BingoApp();
});
