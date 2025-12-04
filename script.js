// --- Variabel Permainan ---
const words = [
    "MEMBUANG", "MENGAMBIL", "MEMBERI", "MENERIMA", "MEMINJAM", "MENGEMBALIKAN",
    "MENGUNJUNGI", "BERTANYA", "MENJAWAB", "MENCARI", "DESA", "PASAR", "SEKOLAH",
    "GURU", "MURID", "ORANGTUA", "KELUARGA", "TEMAN", "MAKANAN", "MINUMAN",
    "MATAHARI", "BULAN", "BINTANG", "AWAN", "HUJAN", "LEMBUT", "PANAS",
    "DINGIN", "HANGAT", "TERANG", "GELAP", "BERSIH", "KOTOR", "BAIK",
    "BURUK", "CANTIK", "TAMPAN", "JELEK", "PINTAR"
];

let currentWord = '';
let hiddenIndices = [];
let guessedLetters = [];
let failures = 0;
let incorrectGuesses = [];
let gameActive = true;
let previousWords = []; // Untuk melacak kata sebelumnya

const MAX_FAILURES = 5;

// --- Elemen DOM ---
const wordDisplay = document.getElementById('word-display');
const guessInput = document.getElementById('guess-input');
const guessButton = document.getElementById('guess-button');
const failureCountSpan = document.getElementById('failure-count');
const incorrectGuessesSpan = document.getElementById('incorrect-guesses');
const resetButton = document.getElementById('reset-button');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseButton = document.getElementById('modal-close-button');

// --- Fungsi Utilitas ---

/**
 * Memilih kata acak yang belum pernah muncul 2x beruntun atau 3x total.
 * @returns {string} Kata yang dipilih.
 */
function selectRandomWord() {
    let word;
    let valid = false;

    // Filter array untuk hanya menyisakan 3 kata terakhir
    const recentWords = previousWords.slice(-3);
    
    while (!valid) {
        // Pilih kata acak dari daftar
        const randomIndex = Math.floor(Math.random() * words.length);
        word = words[randomIndex];
        
        // Cek kondisi:
        // 1. Tidak boleh sama dengan kata sebelumnya (index terakhir)
        const isRepeated = recentWords.length > 0 && word === recentWords[recentWords.length - 1];
        
        // 2. Tidak boleh muncul 3 kali dalam riwayat (cukup cek 3 kata terakhir)
        const count = recentWords.filter(w => w === word).length;
        const isTripleRepeated = count >= 2; // Sudah ada 2, jadi yang ini akan menjadi yang ke-3.

        if (!isRepeated && !isTripleRepeated) {
            valid = true;
        }
    }
    
    // Tambahkan kata yang dipilih ke riwayat dan batasi riwayat hingga 3 kata
    previousWords.push(word);
    if (previousWords.length > 3) {
        previousWords.shift(); // Hapus kata tertua
    }

    return word;
}


/**
 * Mengatur kata baru dan menyembunyikan huruf.
 */
function setupNewWord() {
    currentWord = selectRandomWord();
    guessedLetters = Array(currentWord.length).fill(null);
    hiddenIndices = [];

    // Tentukan jumlah huruf yang hilang (min 2, max 5)
    const numToHide = Math.min(Math.max(2, Math.floor(Math.random() * 4) + 2), 5); 
    
    // Pilih indeks secara acak untuk disembunyikan
    const allIndices = Array.from({ length: currentWord.length }, (_, i) => i);
    
    for (let i = 0; i < numToHide; i++) {
        // Pilih indeks secara acak dari yang tersisa
        const randomIndex = Math.floor(Math.random() * allIndices.length);
        const hiddenIndex = allIndices.splice(randomIndex, 1)[0];
        hiddenIndices.push(hiddenIndex);
    }
    
    // Pastikan huruf yang disembunyikan diatur sebagai null untuk proses tebakan berurutan
    // Semua huruf yang TIDAK disembunyikan dianggap sudah "tertebak"
    for(let i = 0; i < currentWord.length; i++) {
        if (!hiddenIndices.includes(i)) {
            guessedLetters[i] = currentWord[i];
        }
    }

    displayWord();
    findNextHiddenIndex();
    gameActive = true;
    guessInput.focus();
}

/**
 * Menampilkan kata di layar, dengan huruf yang disembunyikan diganti dengan underscore.
 */
function displayWord() {
    wordDisplay.innerHTML = '';
    
    guessedLetters.forEach((letter, index) => {
        const letterDiv = document.createElement('span');
        letterDiv.classList.add('word-letter');
        
        if (letter !== null) {
            letterDiv.textContent = letter;
            letterDiv.classList.add('revealed');
        } else {
            letterDiv.textContent = '_';
        }
        wordDisplay.appendChild(letterDiv);
    });
}

/**
 * Mencari indeks huruf tersembunyi berikutnya yang harus ditebak.
 * @returns {number | null} Indeks berikutnya yang harus ditebak, atau null jika sudah selesai.
 */
function findNextHiddenIndex() {
    for (let i = 0; i < currentWord.length; i++) {
        if (guessedLetters[i] === null) {
            return i;
        }
    }
    return null; // Semua huruf sudah tertebak
}

/**
 * Memproses tebakan huruf dari pengguna.
 */
function processGuess() {
    if (!gameActive) return;

    const input = guessInput.value.toUpperCase().trim();
    guessInput.value = ''; // Kosongkan input setelah mencoba

    if (input.length !== 1 || !/^[A-Z]$/.test(input)) {
        // Tidak perlu memberikan penalti gagal untuk input yang tidak valid.
        return; 
    }

    const guessedLetter = input;
    const nextIndexToGuess = findNextHiddenIndex();

    if (nextIndexToGuess === null) {
        // Seharusnya tidak terjadi jika gameActive
        return; 
    }

    // Cek apakah tebakan benar dan urut
    if (guessedLetter === currentWord[nextIndexToGuess]) {
        guessedLetters[nextIndexToGuess] = guessedLetter;
        displayWord();

        const nextIndex = findNextHiddenIndex();
        if (nextIndex === null) {
            handleWin();
        }
    } else {
        handleFailure(guessedLetter);
    }
    
    guessInput.focus();
}

/**
 * Menangani kasus tebakan salah.
 * @param {string} letter Huruf yang salah ditebak.
 */
function handleFailure(letter) {
    failures++;
    failureCountSpan.textContent = failures;

    // Tambahkan ke daftar kata salah
    if (!incorrectGuesses.includes(letter)) {
        incorrectGuesses.push(letter);
    }
    incorrectGuessesSpan.textContent = incorrectGuesses.join(', ');

    if (failures >= MAX_FAILURES) {
        handleLose();
    } else {
        // Beri petunjuk visual bahwa tebakan salah
        const incorrectLetters = document.querySelectorAll('.word-letter');
        incorrectLetters.forEach(el => el.style.backgroundColor = '#ffcdd2'); // Warna latar error sementara
        setTimeout(() => {
            incorrectLetters.forEach(el => el.style.backgroundColor = 'transparent');
        }, 300);
    }
}

/**
 * Menangani kemenangan.
 */
function handleWin() {
    gameActive = false;
    showModal("🎉 BERHASIL! 🎉", `Kata yang Benar: **${currentWord}**`);
}

/**
 * Menangani kekalahan.
 */
function handleLose() {
    gameActive = false;
    showModal("❌ GAGAL! ❌", `Anda Gagal Sebanyak ${MAX_FAILURES} kali. Kata yang Benar adalah: **${currentWord}**`);
    resetButton.classList.remove('hidden');
    guessInput.disabled = true;
    guessButton.disabled = true;
}

/**
 * Mengatur ulang permainan ke keadaan awal.
 */
function resetGame() {
    failures = 0;
    incorrectGuesses = [];
    failureCountSpan.textContent = 0;
    incorrectGuessesSpan.textContent = '';
    resetButton.classList.add('hidden');
    guessInput.disabled = false;
    guessButton.disabled = false;
    setupNewWord();
}

// --- Fungsi Modal ---

/**
 * Menampilkan modal (pop-up).
 * @param {string} title Judul modal.
 * @param {string} message Pesan di dalam modal.
 */
function showModal(title, message) {
    modalTitle.innerHTML = title;
    modalMessage.innerHTML = message;
    modal.classList.add('show');
    modalCloseButton.focus();
    guessInput.disabled = true;
    guessButton.disabled = true;
}

/**
 * Menyembunyikan modal dan memulai kata baru (jika menang).
 */
function closeModal() {
    modal.classList.remove('show');
    if (!gameActive) { // Jika modal muncul karena menang
        // Reset statistik gagal/salah, tapi jangan reset game
        failures = 0;
        incorrectGuesses = [];
        failureCountSpan.textContent = 0;
        incorrectGuessesSpan.textContent = '';
        setupNewWord();
    } else if (resetButton.classList.contains('hidden')) {
        // Jika belum kalah, fokuskan kembali input
        guessInput.focus();
    }
    guessInput.disabled = false;
    guessButton.disabled = false;
}

// --- Event Listeners ---

guessButton.addEventListener('click', processGuess);

guessInput.addEventListener('keydown', (e) => {
    // Memastikan hanya huruf yang masuk ke input dan langsung memproses tebakan
    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        guessInput.value = e.key;
        processGuess();
        e.preventDefault(); // Mencegah huruf yang diketik muncul di input
    } else if (e.key === 'Enter') {
        processGuess();
        e.preventDefault();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Biarkan backspace/delete jika user ingin menghapus, tapi karena kita hanya
        // menerima 1 huruf dan langsung memproses, ini mungkin tidak perlu.
        // Di sini kita tidak melakukan apa-apa untuk menjaga input tetap 1 karakter.
        e.preventDefault();
    }
});


resetButton.addEventListener('click', resetGame);

// Menambahkan event listener untuk tombol "Lanjut" (Spasi/Klik)
modalCloseButton.addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
    // Tombol Spasi untuk melanjutkan (Next)
    if (modal.classList.contains('show') && e.key === ' ') {
        closeModal();
        e.preventDefault(); // Mencegah scroll
    }
    
    // Tombol Enter pada input atau tombol tebak
    if (e.key === 'Enter' && gameActive) {
        processGuess();
    }
});


// --- Inisialisasi Permainan ---
document.addEventListener('DOMContentLoaded', () => {
    setupNewWord();
});