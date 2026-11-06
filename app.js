
// =====================================
// ZAKI FINANCE - JAVASCRIPT
// =====================================

// 1. Mengambil elemen HTML
const form = document.getElementById("transaction-form");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const transactionList = document.getElementById("transaction-list");

// 2. Format mata uang Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

// 3. Mengambil tanggal hari ini
const today = new Date();
const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().split("T")[0];

dateInput.value = localDate;

// 4. Mengambil transaksi dari Local Storage
let transactions = [];

try {
    const savedData = localStorage.getItem("zakiFinanceTransactions");
    const parsedData = savedData ? JSON.parse(savedData) : [];

    if (Array.isArray(parsedData)) {
        transactions = parsedData.filter(item =>
            item &&
            typeof item.id === "string" &&
            ["income", "expense"].includes(item.type) &&
            Number.isSafeInteger(item.amount) &&
            item.amount > 0 &&
            typeof item.category === "string" &&
            typeof item.date === "string"
        );
    }
} catch (error) {
    console.error("Gagal membaca data transaksi:", error);
}

// 5. Menyimpan transaksi ke Local Storage
function saveTransactions() {
    localStorage.setItem(
        "zakiFinanceTransactions",
        JSON.stringify(transactions)
    );
}

// 6. Menghitung saldo dan total transaksi
function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpense;

    balanceDisplay.textContent = formatRupiah(balance);
    incomeDisplay.textContent = formatRupiah(totalIncome);
    expenseDisplay.textContent = formatRupiah(totalExpense);

    renderTransactions();
}

// 7. Menampilkan riwayat transaksi
function renderTransactions() {
    transactionList.replaceChildren();

    if (transactions.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Belum ada transaksi.";

        transactionList.appendChild(empty);
        return;
    }

    const sortedTransactions = [...transactions].sort(
        (a, b) => b.date.localeCompare(a.date) ||
                  b.id.localeCompare(a.id)
    );

    sortedTransactions.forEach(transaction => {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const title = document.createElement("p");
        title.textContent = transaction.note || transaction.category;

        const details = document.createElement("small");
        details.textContent =
            `${transaction.category} • ${transaction.date}`;

        info.append(title, details);

        const amount = document.createElement("span");
        amount.className =
            transaction.type === "income"
                ? "income-text"
                : "expense-text";

        const sign = transaction.type === "income" ? "+" : "-";
        amount.textContent = sign + formatRupiah(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Hapus";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        item.append(info, amount, deleteButton);
        transactionList.appendChild(item);
    });
}

// 8. Menambahkan transaksi
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const note = noteInput.value.trim();

    if (!["income", "expense"].includes(type)) {
        alert("Jenis transaksi tidak valid.");
        return;
    }

    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        alert("Masukkan nominal yang valid.");
        return;
    }

    if (!category || !date) {
        alert("Lengkapi kategori dan tanggal.");
        return;
    }

    const transaction = {
        id: crypto.randomUUID(),
        type: type,
        amount: amount,
        category: category,
        date: date,
        note: note
    };

    transactions.push(transaction);

    try {
        saveTransactions();
    } catch (error) {
        transactions.pop();
        alert("Gagal menyimpan data. Penyimpanan browser mungkin penuh.");
        return;
    }

    updateDashboard();

    form.reset();
    dateInput.value = localDate;

    alert("Transaksi berhasil disimpan!");
});

// 9. Menghapus transaksi
function deleteTransaction(id) {
    const confirmation = confirm(
        "Apakah kamu yakin ingin menghapus transaksi ini?"
    );

    if (!confirmation) return;

    const previousTransactions = transactions;

    transactions = transactions.filter(
        transaction => transaction.id !== id
    );

    try {
        saveTransactions();
    } catch (error) {
        transactions = previousTransactions;
        alert("Gagal menghapus transaksi.");
        return;
    }

    updateDashboard();
}

// 10. Menampilkan data saat aplikasi dibuka
updateDashboard();

console.log("Zaki Finance berhasil dijalankan!");
