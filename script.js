let board = null;
let game = new Chess();
let playerColor = 'white';

const $status = $('#status');
const $difficulty = $('#difficulty');

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};
board = Chessboard('myBoard', config);

function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight-hint');
}

function highlightSquares(from, to) {
    removeHighlights();
    $('#myBoard .square-' + from).addClass('highlight-hint');
    $('#myBoard .square-' + to).addClass('highlight-hint');
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;

    if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
        (playerColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    removeHighlights();
    updateStatus();
    
    window.setTimeout(makeBotMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
}

// Gọi API lấy nước đi của Bot
function makeBotMove() {
    if (game.game_over()) return;

    $status.html('Bot đang suy nghĩ...');
    let fen = game.fen();
    let level = $difficulty.val();

    // Sử dụng API Stockfish trực tuyến miễn phí công khai
    fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${level * 3}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.bestmove) {
                // Parse chuỗi "bestmove e2e4 ..." thành các ô cụ thể
                let bestMove = data.bestmove.split(' ')[1]; 
                let fromSquare = bestMove.substring(0, 2);
                let toSquare = bestMove.substring(2, 4);
                let promotionPiece = bestMove.substring(4, 5) || 'q';

                game.move({
                    from: fromSquare,
                    to: toSquare,
                    promotion: promotionPiece
                });
                board.position(game.fen());
                updateStatus();
            } else {
                $status.html('Lỗi kết nối với Bot, vui lòng thử lại!');
            }
        })
        .catch(err => {
            console.error(err);
            $status.html('Không thể kết nối tới máy chủ Bot.');
        });
}

function updateStatus() {
    let status = '';
    let moveColor = game.turn() === 'b' ? 'Đen' : 'Trắng';

    if (game.in_checkmate()) {
        status = 'Trò chơi kết thúc! ' + (game.turn() === 'w' ? 'Đen' : 'Trắng') + ' thắng (Checkmate).';
    } else if (game.in_draw()) {
        status = 'Trò chơi kết thúc! Hòa cờ.';
    } else {
        status = 'Lượt đi: ' + moveColor;
        if (game.in_check()) {
            status += ' (Đang bị Chiếu!)';
        }
    }
    $status.html(status);
}

// Gợi ý nước đi bằng API
$('#hintBtn').on('click', () => {
    if (game.game_over()) return;
    
    let isWhiteTurn = game.turn() === 'w';
    if ((playerColor === 'white' && !isWhiteTurn) || (playerColor === 'black' && isWhiteTurn)) {
        $status.html('Chờ đến lượt của bạn đã nhé!');
        return;
    }

    $status.html('Đang tìm nước đi tối ưu nhất cho bạn...');
    let fen = game.fen();
    
    fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=8`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.bestmove) {
                let bestMove = data.bestmove.split(' ')[1];
                let fromSquare = bestMove.substring(0, 2);
                let toSquare = bestMove.substring(2, 4);

                $status.html(`💡 Gợi ý: Di chuyển từ <b>${fromSquare.toUpperCase()}</b> đến <b>${toSquare.toUpperCase()}</b>`);
                highlightSquares(fromSquare, toSquare);
            }
        });
});

$('#restartBtn').on('click', () => {
    removeHighlights();
    game.reset();
    board.start();
    if (playerColor === 'black') {
        board.flip();
        makeBotMove();
    }
    updateStatus();
});

$('#flipBtn').on('click', () => {
    removeHighlights();
    playerColor = playerColor === 'white' ? 'black' : 'white';
    board.flip();
    game.reset();
    board.start();
    if (playerColor === 'black') {
        makeBotMove();
    }
    updateStatus();
});
