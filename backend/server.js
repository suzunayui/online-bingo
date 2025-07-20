const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ゲーム状態管理
const gameRooms = new Map();
const players = new Map();

// ビンゴカード生成関数
function generateBingoCard() {
    const ranges = [
        [1, 15],   // B列: 1-15
        [16, 30],  // I列: 16-30
        [31, 45],  // N列: 31-45
        [46, 60],  // G列: 46-60
        [61, 75]   // O列: 61-75
    ];

    const numbers = [];
    ranges.forEach(([min, max]) => {
        const columnNumbers = [];
        while (columnNumbers.length < 5) {
            const num = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!columnNumbers.includes(num)) {
                columnNumbers.push(num);
            }
        }
        numbers.push(columnNumbers);
    });

    return numbers;
}

// ビンゴ判定関数
function checkBingo(card, markedCells) {
    const lines = [];

    // 横のライン
    for (let row = 0; row < 5; row++) {
        const line = [];
        for (let col = 0; col < 5; col++) {
            line.push(`${row}-${col}`);
        }
        lines.push(line);
    }

    // 縦のライン
    for (let col = 0; col < 5; col++) {
        const line = [];
        for (let row = 0; row < 5; row++) {
            line.push(`${row}-${col}`);
        }
        lines.push(line);
    }

    // 斜めのライン
    const diagonal1 = [];
    const diagonal2 = [];
    for (let i = 0; i < 5; i++) {
        diagonal1.push(`${i}-${i}`);
        diagonal2.push(`${i}-${4-i}`);
    }
    lines.push(diagonal1, diagonal2);

    // ビンゴラインをチェック
    const bingoLines = lines.filter(line => 
        line.every(cellId => markedCells.has(cellId) || cellId === '2-2') // FREEセルは常にマーク済み
    );

    return bingoLines.length > 0;
}

// ルーム作成
function createRoom() {
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    gameRooms.set(roomId, {
        id: roomId,
        players: new Map(),
        calledNumbers: [],
        gameStarted: false,
        currentCaller: null,
        createdAt: new Date()
    });
    return roomId;
}

// Socket.io接続処理
io.on('connection', (socket) => {
    console.log(`👤 ユーザー接続: ${socket.id}`);

    // ルーム作成
    socket.on('createRoom', (playerName) => {
        const roomId = createRoom();
        const room = gameRooms.get(roomId);
        
        const player = {
            id: socket.id,
            name: playerName || `プレイヤー${Math.floor(Math.random() * 1000)}`,
            card: generateBingoCard(),
            markedCells: new Set(['2-2']), // FREEセルは最初からマーク
            isReady: false,
            isCaller: true
        };

        room.players.set(socket.id, player);
        room.currentCaller = socket.id;
        players.set(socket.id, { roomId, playerId: socket.id });

        socket.join(roomId);
        socket.emit('roomCreated', { roomId, player });
        
        console.log(`🏠 ルーム作成: ${roomId} by ${player.name}`);
    });

    // ルーム参加
    socket.on('joinRoom', (data) => {
        const { roomId, playerName } = data;
        const room = gameRooms.get(roomId);

        if (!room) {
            socket.emit('error', 'ルームが見つかりません');
            return;
        }

        if (room.players.size >= 8) { // 最大8人
            socket.emit('error', 'ルームが満員です');
            return;
        }

        const player = {
            id: socket.id,
            name: playerName || `プレイヤー${Math.floor(Math.random() * 1000)}`,
            card: generateBingoCard(),
            markedCells: new Set(['2-2']), // FREEセルは最初からマーク
            isReady: false,
            isCaller: false
        };

        room.players.set(socket.id, player);
        players.set(socket.id, { roomId, playerId: socket.id });

        socket.join(roomId);
        socket.emit('roomJoined', { roomId, player });
        
        // 他のプレイヤーに通知
        socket.to(roomId).emit('playerJoined', player);
        
        // 現在のルーム状態を送信
        socket.emit('gameState', {
            players: Array.from(room.players.values()),
            calledNumbers: room.calledNumbers,
            gameStarted: room.gameStarted
        });

        console.log(`👥 ${player.name} がルーム ${roomId} に参加`);
    });

    // セルマーク
    socket.on('markCell', (data) => {
        const playerInfo = players.get(socket.id);
        if (!playerInfo) return;

        const room = gameRooms.get(playerInfo.roomId);
        const player = room.players.get(socket.id);

        const { row, col } = data;
        const cellId = `${row}-${col}`;

        if (player.markedCells.has(cellId)) {
            player.markedCells.delete(cellId);
        } else {
            player.markedCells.add(cellId);
        }

        // ビンゴチェック
        const hasBingo = checkBingo(player.card, player.markedCells);
        
        if (hasBingo) {
            io.to(playerInfo.roomId).emit('bingo', {
                playerId: socket.id,
                playerName: player.name
            });
            console.log(`🎉 ビンゴ！ ${player.name} in room ${playerInfo.roomId}`);
        }

        // 他のプレイヤーに更新を通知
        socket.to(playerInfo.roomId).emit('playerUpdate', {
            playerId: socket.id,
            markedCells: Array.from(player.markedCells),
            hasBingo
        });
    });

    // 数字コール（司会者のみ）
    socket.on('callNumber', () => {
        const playerInfo = players.get(socket.id);
        if (!playerInfo) return;

        const room = gameRooms.get(playerInfo.roomId);
        const player = room.players.get(socket.id);

        if (!player.isCaller) return; // 司会者のみ

        // まだ呼ばれていない数字からランダム選択
        const allNumbers = [];
        for (let i = 1; i <= 75; i++) {
            allNumbers.push(i);
        }
        
        const availableNumbers = allNumbers.filter(num => !room.calledNumbers.includes(num));
        
        if (availableNumbers.length === 0) {
            socket.emit('gameEnded', 'すべての数字が呼ばれました');
            return;
        }

        const calledNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        room.calledNumbers.push(calledNumber);

        // ルーム全体に数字を通知
        io.to(playerInfo.roomId).emit('numberCalled', {
            number: calledNumber,
            calledNumbers: room.calledNumbers
        });

        console.log(`📢 数字コール: ${calledNumber} in room ${playerInfo.roomId}`);
    });

    // 新しいゲーム開始
    socket.on('newGame', () => {
        const playerInfo = players.get(socket.id);
        if (!playerInfo) return;

        const room = gameRooms.get(playerInfo.roomId);
        const player = room.players.get(socket.id);

        if (!player.isCaller) return; // 司会者のみ

        // ゲーム状態リセット
        room.calledNumbers = [];
        room.gameStarted = true;

        // 全プレイヤーの状態リセット
        room.players.forEach((p) => {
            p.card = generateBingoCard();
            p.markedCells = new Set(['2-2']); // FREEセルのみマーク
        });

        // ルーム全体にゲーム開始を通知
        io.to(playerInfo.roomId).emit('gameStarted', {
            players: Array.from(room.players.values())
        });

        console.log(`🎮 新しいゲーム開始 in room ${playerInfo.roomId}`);
    });

    // 切断処理
    socket.on('disconnect', () => {
        const playerInfo = players.get(socket.id);
        if (playerInfo) {
            const room = gameRooms.get(playerInfo.roomId);
            if (room) {
                const player = room.players.get(socket.id);
                room.players.delete(socket.id);

                // 他のプレイヤーに通知
                socket.to(playerInfo.roomId).emit('playerLeft', {
                    playerId: socket.id,
                    playerName: player?.name
                });

                // ルームが空になったら削除
                if (room.players.size === 0) {
                    gameRooms.delete(playerInfo.roomId);
                    console.log(`🗑️  空のルーム削除: ${playerInfo.roomId}`);
                }

                console.log(`👋 ${player?.name} がルーム ${playerInfo.roomId} から退出`);
            }
            players.delete(socket.id);
        }
    });
});

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        rooms: gameRooms.size,
        players: players.size
    });
});

// ルーム一覧API
app.get('/api/rooms', (req, res) => {
    const roomList = Array.from(gameRooms.values()).map(room => ({
        id: room.id,
        playerCount: room.players.size,
        gameStarted: room.gameStarted,
        createdAt: room.createdAt
    }));
    res.json(roomList);
});

// サーバー起動
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 オンラインビンゴサーバー起動: http://0.0.0.0:${PORT}`);
    console.log(`📊 管理画面: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🐳 Docker環境で実行中`);
});

// 定期的なクリーンアップ（24時間以上古いルームを削除）
setInterval(() => {
    const now = new Date();
    for (const [roomId, room] of gameRooms.entries()) {
        const hoursSinceCreated = (now - room.createdAt) / (1000 * 60 * 60);
        if (hoursSinceCreated > 24 && room.players.size === 0) {
            gameRooms.delete(roomId);
            console.log(`🧹 古いルーム削除: ${roomId}`);
        }
    }
}, 60000 * 60); // 1時間ごとにチェック
