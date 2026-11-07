
/* =====================================
   ZAKI FINANCE - SUPABASE APPLICATION
===================================== */

// 1. Menghubungkan Supabase
const supabaseClient = window.supabaseClient;

// Memeriksa konfigurasi
if (!supabaseClient) {
    throw new Error("Supabase belum terhubung. Periksa supabase-config.js");
}

// 2. Mengambil elemen HTML
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const showLoginButton = document.getElementById("show-login");
const showRegisterButton = document.getElementById("show-register");

const authMessage = document.getElementById("auth-message");
const logoutButton = document.getElementById("logout-button");

const userNameDisplay = document.getElementById("user-name");
const userAvatar = document.getElementById("user-avatar");

const transactionForm = document.getElementById("transaction-form");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const transactionList = document.getElementById("transaction-list");

// 3. Variabel aplikasi
let currentUser = null;
let transactions = [];

// 4. Format Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}

// 5. Mengatur tanggal hari ini
function getTodayDate() {
    const today = new Date();

    return new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];
}

dateInput.value = getTodayDate();

// 6. Mengganti tampilan Login dan Register
showLoginButton.addEventListener("click", () => {
    loginForm.hidden = false;
    registerForm.hidden = true;

    showLoginButton.classList.add("active");
    showRegisterButton.classList.remove("active");

    authMessage.textContent = "";
});

showRegisterButton.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;

    showRegisterButton.classList.add("active");
    showLoginButton.classList.remove("active");

    authMessage.textContent = "";
});

// 7. Registrasi pengguna
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;

    if (!name) {
        authMessage.textContent = "Nama lengkap wajib diisi.";
        return;
    }

    authMessage.textContent = "Sedang membuat akun...";

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) throw error;

        if (data.session) {
            authMessage.textContent = "Registrasi berhasil. Menghubungkan akun...";
        } else {
            authMessage.textContent =
                "Registrasi berhasil. Silakan periksa email untuk konfirmasi akun sebelum login.";
            registerForm.reset();
        }

    } catch (error) {
        console.error("Registrasi gagal:", error);
        authMessage.textContent = error.message;
    }
});

// 8. Login pengguna
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    authMessage.textContent = "Sedang login...";

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        authMessage.textContent = "Login berhasil.";

    } catch (error) {
        console.error("Login gagal:", error);
        authMessage.textContent = error.message;
    }
});

// 9. Logout
logoutButton.addEventListener("click", async () => {
    const confirmation = confirm("Apakah kamu yakin ingin logout?");

    if (!confirmation) return;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Gagal logout: " + error.message);
    }
});

// 10. Mengambil profil pengguna
async function loadProfile() {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", currentUser.id)
        .single();

    if (error) {
        console.error("Gagal mengambil profil:", error);
        throw error;
    }

    const name = data.full_name || currentUser.email;

    userNameDisplay.textContent = name;
    userAvatar.textContent = name.charAt(0).toUpperCase();

    console.log("Role pengguna:", data.role);
}

// 11. Mengambil transaksi dari Supabase
async function loadTransactions() {
    transactionList.textContent = "Memuat transaksi...";

    const { data, error } = await supabaseClient
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gagal mengambil transaksi:", error);
        transactionList.textContent = "Gagal memuat transaksi.";
        return;
    }

    transactions = data || [];

    updateDashboard();
}

// 12. Menghitung saldo dan total transaksi
function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
        const amount = Number(transaction.amount);

        if (transaction.type === "income") {
            totalIncome += amount;
        } else {
            totalExpense += amount;
        }
    });

    const balance = totalIncome - totalExpense;

    balanceDisplay.textContent = formatRupiah(balance);
    incomeDisplay.textContent = formatRupiah(totalIncome);
    expenseDisplay.textContent = formatRupiah(totalExpense);

    renderTransactions();
}

// 13. Menampilkan daftar transaksi
function renderTransactions() {
    transactionList.replaceChildren();

    if (transactions.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Belum ada transaksi.";

        transactionList.appendChild(empty);
        return;
    }

    transactions.forEach((transaction) => {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const title = document.createElement("p");
        title.textContent = transaction.note || transaction.category;

        const details = document.createElement("small");
        details.textContent =
            `${transaction.category} • ${transaction.transaction_date}`;

        info.append(title, details);

        const amount = document.createElement("span");
        amount.className =
            transaction.type === "income"
                ? "income-text"
                : "expense-text";

        const sign = transaction.type === "income" ? "+" : "-";

        amount.textContent =
            sign + formatRupiah(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Hapus";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        item.append(info, amount, deleteButton);
        transactionList.appendChild(item);
    });
}

// 14. Menambahkan transaksi
transactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const note = noteInput.value.trim();

    if (!["income", "expense"].includes(type)) {
        alert("Jenis transaksi tidak valid.");
        return;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
        alert("Masukkan nominal yang valid.");
        return;
    }

    if (!category || !date) {
        alert("Lengkapi kategori dan tanggal.");
        return;
    }

    const { error } = await supabaseClient
        .from("transactions")
        .insert({
            user_id: currentUser.id,
            type: type,
            amount: amount,
            category: category,
            note: note,
            transaction_date: date
        });

    if (error) {
        console.error("Gagal menyimpan transaksi:", error);
        alert("Gagal menyimpan transaksi: " + error.message);
        return;
    }

    alert("Transaksi berhasil disimpan!");

    transactionForm.reset();
    dateInput.value = getTodayDate();

    await loadTransactions();
});

// 15. Menghapus transaksi
async function deleteTransaction(id) {
    const confirmation = confirm(
        "Apakah kamu yakin ingin menghapus transaksi ini?"
    );

    if (!confirmation) return;

    const { error } = await supabaseClient
        .from("transactions")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Gagal menghapus transaksi:", error);
        alert("Gagal menghapus transaksi: " + error.message);
        return;
    }

    alert("Transaksi berhasil dihapus!");

    await loadTransactions();
}

// 16. Mengatur tampilan berdasarkan status login
async function handleAuthState(session) {
    currentUser = session ? session.user : null;

    if (!currentUser) {
        transactions = [];

        appSection.hidden = true;
        authSection.hidden = false;

        loginForm.reset();
        registerForm.reset();

        balanceDisplay.textContent = formatRupiah(0);
        incomeDisplay.textContent = formatRupiah(0);
        expenseDisplay.textContent = formatRupiah(0);

        return;
    }

    authSection.hidden = true;
    appSection.hidden = false;

    try {
        await loadProfile();
        await loadTransactions();
    } catch (error) {
        console.error("Gagal memuat aplikasi:", error);
        alert("Gagal memuat profil. Periksa konfigurasi database Supabase.");
    }
}

// 17. Memeriksa sesi login saat halaman dibuka
async function initializeApp() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Gagal memeriksa sesi:", error);
        authMessage.textContent = "Gagal memeriksa sesi login.";
        return;
    }

    await handleAuthState(data.session);
}

// 18. Memantau perubahan status autentikasi
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;

    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        handleAuthState(session);
    }
});

// 19. Menjalankan aplikasi
initializeApp();

console.log("Zaki Finance berhasil dijalankan!");
