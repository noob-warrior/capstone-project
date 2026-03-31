const STORAGE_KEY = 'moneyManagerTransactions';
const DEFAULT_SORT = 'date-desc';
const CATEGORY_OPTIONS = {
    Income: ['Salary', 'Freelance', 'Investments', 'Bonus', 'Other Income'],
    Expense: [
        'Rent',
        'Food',
        'Shopping',
        'Entertainment',
        'Transportation',
        'Utilities',
        'Healthcare',
        'Education',
        'Other Expense'
    ]
};
const CHART_COLORS = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#0ea5e9'
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
});

// Transaction class
class Transaction {
    constructor({ id, amount, date, category, subCategory, description = '' }) {
        this.id = id;
        this.amount = parseFloat(amount);
        this.date = date;
        this.category = category;
        this.subCategory = subCategory;
        this.description = description;
        this.createdAt = new Date();
    }

    static fromSaved(raw) {
        return new Transaction({
            id: raw.id,
            amount: raw.amount,
            date: raw.date,
            category: raw.category,
            subCategory: raw.subCategory,
            description: raw.description
        });
    }

    isIncome() {
        return this.category === 'Income';
    }

    isExpense() {
        return this.category === 'Expense';
    }

    formatAmount() {
        return `$${this.amount.toFixed(2)}`;
    }

    formatDate() {
        return dateFormatter.format(new Date(this.date));
    }
}

// Data store
function createTransactionStore() {
    return {
        items: [],

        load() {
            const savedTransactions = localStorage.getItem(STORAGE_KEY);
            const parsedTransactions = savedTransactions ? JSON.parse(savedTransactions) : [];
            this.items = parsedTransactions.map((entry) => Transaction.fromSaved(entry));
        },

        save() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
        },

        list() {
            return [...this.items];
        },

        add(transaction) {
            this.items.push(transaction);
            this.save();
        },

        update(id, values) {
            const index = this.items.findIndex((transaction) => transaction.id === id);

            if (index === -1) {
                return false;
            }

            this.items[index] = new Transaction({
                id,
                amount: values.amount,
                date: values.date,
                category: values.category,
                subCategory: values.subCategory,
                description: values.description
            });
            this.save();
            return true;
        },

        remove(id) {
            const index = this.items.findIndex((transaction) => transaction.id === id);

            if (index === -1) {
                return false;
            }

            this.items.splice(index, 1);
            this.save();
            return true;
        },

        clear() {
            this.items = [];
            this.save();
        },

        find(id) {
            return this.items.find((transaction) => transaction.id === id);
        }
    };
}

// Validation
function validateTransaction(v) {
    const err = {};
    if (!v.amount || isNaN(v.amount) || v.amount <= 0) err.amount = ['Valid amount needed'];
    if (!v.date || new Date(v.date) > new Date()) err.date = ['Valid date needed'];
    if (!v.category) err.category = ['Pick category'];
    if (!v.subCategory) err.subCategory = ['Pick subcategory'];
    if (v.description?.length > 100) err.description = ['Max 100 chars'];
    return err;
}

// Filter transactions
function filterTransactions(transactions, filters) {
    let result = transactions;
    if (filters.category) result = result.filter(t => t.category === filters.category);
    if (filters.subCategory) result = result.filter(t => t.subCategory === filters.subCategory);
    if (filters.startDate || filters.endDate) {
        result = result.filter(t => {
            const tDate = new Date(t.date);
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            return (!start || tDate >= start) && (!end || tDate <= end);
        });
    }
    const sortMap = { 
        'date-asc': (l, r) => new Date(l.date) - new Date(r.date),
        'amount-asc': (l, r) => l.amount - r.amount,
        'amount-desc': (l, r) => r.amount - l.amount,
        'date-desc': (l, r) => new Date(r.date) - new Date(l.date)
    };
    return [...result].sort(sortMap[filters.sortBy] || sortMap['date-desc']);
}

// Summary calculation
function calculateSummary(transactions) {
    const income = transactions.filter(t => t.isIncome()).reduce((n, t) => n + t.amount, 0);
    const expense = transactions.filter(t => t.isExpense()).reduce((n, t) => n + t.amount, 0);
    return { income, expense, balance: income - expense };
}

// Expense breakdown
function getExpenseDistribution(transactions) {
    return transactions.filter(t => t.isExpense()).reduce((dist, t) => {
        dist[t.subCategory] = (dist[t.subCategory] || 0) + t.amount;
        return dist;
    }, {});
}

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

// CSV export
function exportTransactionsAsCsv(transactions, filename = 'transactions.csv') {
    if (!transactions.length) { alert('No transactions'); return; }
    const headers = ['Date', 'Category', 'Sub-Category', 'Description', 'Amount'];
    const rows = transactions.map(t => [t.formatDate(), t.category, t.subCategory, t.description || '', t.formatAmount()]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Chart rendering
const expenseChart = {
    instance: null,

    render(transactions) {
        const canvas = document.getElementById('expenseChart');

        if (!canvas) {
            return;
        }

        if (this.instance) {
            this.instance.destroy();
            this.instance = null;
        }

        const distribution = getExpenseDistribution(transactions);

        if (!Object.keys(distribution).length || typeof Chart === 'undefined') {
            return;
        }

        const context = canvas.getContext('2d');

        try {
            this.instance = new Chart(context, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(distribution),
                    datasets: [
                        {
                            data: Object.values(distribution),
                            backgroundColor: this.getColors(Object.keys(distribution).length),
                            borderColor: '#fff',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: { size: 12 },
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label(context) {
                                    return `${context.label}: ${formatCurrency(context.parsed)}`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            // Fail gracefully
        }
    },

    getColors(count) {
        return Array.from({ length: count }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]);
    }
};

// Main app
class MoneyManagerApp {
    constructor() {
        this.store = createTransactionStore();
        this.store.load();
        this.editingId = null;
        this.pendingDeleteId = null;
        this.subCategories = CATEGORY_OPTIONS;

        this.cacheElements();
        this.bindEvents();
        this.setDefaultDate();
        this.render();
    }

    cacheElements() {
        this.elements = {
            totalIncome: document.getElementById('totalIncome'),
            totalExpense: document.getElementById('totalExpense'),
            netBalance: document.getElementById('netBalance'),
            modal: document.getElementById('transactionModal'),
            confirmModal: document.getElementById('confirmModal'),
            form: document.getElementById('transactionForm'),
            modalTitle: document.getElementById('modalTitle'),
            amountInput: document.getElementById('amount'),
            dateInput: document.getElementById('date'),
            categorySelect: document.getElementById('category'),
            subCategorySelect: document.getElementById('subCategory'),
            descriptionInput: document.getElementById('description'),
            addButton: document.getElementById('addTransactionBtn'),
            closeButton: document.getElementById('closeModalBtn'),
            cancelButton: document.getElementById('cancelBtn'),
            confirmDeleteButton: document.getElementById('confirmDeleteBtn'),
            cancelDeleteButton: document.getElementById('cancelDeleteBtn'),
            downloadCsvButton: document.getElementById('downloadCsvBtn'),
            clearAllButton: document.getElementById('clearAllBtn'),
            resetFiltersButton: document.getElementById('resetFiltersBtn'),
            categoryFilter: document.getElementById('categoryFilter'),
            subCategoryFilter: document.getElementById('subCategoryFilter'),
            dateRangeStart: document.getElementById('dateRangeStart'),
            dateRangeEnd: document.getElementById('dateRangeEnd'),
            sortBy: document.getElementById('sortBy'),
            tableBody: document.getElementById('tableBody'),
            emptyState: document.getElementById('emptyState'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage'),
            charCount: document.querySelector('.char-count')
        };
    }

    bindEvents() {
        const { addButton, closeButton, cancelButton, form, categorySelect, descriptionInput,
                 downloadCsvButton, clearAllButton, resetFiltersButton, categoryFilter,
                 subCategoryFilter, dateRangeStart, dateRangeEnd, sortBy, cancelDeleteButton,
                 confirmDeleteButton, tableBody } = this.elements;

        addButton.addEventListener('click', () => this.openModal());
        [closeButton, cancelButton].forEach(btn => btn.addEventListener('click', () => this.closeModal()));
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        categorySelect.addEventListener('change', () => this.updateSubCategoryOptions());
        descriptionInput.addEventListener('input', (e) => this.updateCharacterCount(e.target.value.length));
        downloadCsvButton.addEventListener('click', () => this.handleCsvDownload());
        clearAllButton.addEventListener('click', () => this.handleClearAll());
        resetFiltersButton.addEventListener('click', () => this.resetFilters());
        [categoryFilter, subCategoryFilter, dateRangeStart, dateRangeEnd, sortBy].forEach(el =>
            el.addEventListener('change', () => this.applyFilters())
        );
        cancelDeleteButton.addEventListener('click', () => this.closeConfirmModal());
        confirmDeleteButton.addEventListener('click', () => this.confirmDelete());
        tableBody.addEventListener('click', (e) => this.handleTableClick(e));
    }

    setDefaultDate() {
        this.elements.dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Modal controls
    openModal(transaction = null) {
        this.editingId = transaction?.id ?? null;
        this.clearForm();

        if (transaction) {
            this.elements.modalTitle.textContent = 'Edit';
            this.elements.amountInput.value = transaction.amount;
            this.elements.dateInput.value = transaction.date;
            this.elements.categorySelect.value = transaction.category;
            this.updateSubCategoryOptions();
            this.elements.subCategorySelect.value = transaction.subCategory;
            this.elements.descriptionInput.value = transaction.description;
            this.updateCharacterCount(transaction.description.length);
        } else {
            this.elements.modalTitle.textContent = 'Add';
        }

        this.elements.modal.classList.add('active');
    }

    closeModal() {
        this.elements.modal.classList.remove('active');
        this.clearForm();
        this.editingId = null;
    }

    clearForm() {
        this.elements.form.reset();
        this.elements.form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        this.elements.form.querySelectorAll('input, select, textarea').forEach(el => el.classList.remove('error'));
        this.updateCharacterCount(0);
        this.elements.dateInput.value = new Date().toISOString().split('T')[0];
    }

    updateSubCategoryOptions() {
        const selectedCategory = this.elements.categorySelect.value;
        this.elements.subCategorySelect.innerHTML = '<option value="">Select Sub-Category</option>';

        if (!selectedCategory || !this.subCategories[selectedCategory]) {
            return;
        }

        this.subCategories[selectedCategory].forEach((subCategory) => {
            const option = document.createElement('option');
            option.value = subCategory;
            option.textContent = subCategory;
            this.elements.subCategorySelect.appendChild(option);
        });
    }

    updateCharacterCount(count) {
        if (this.elements.charCount) {
            this.elements.charCount.textContent = `${count}/100`;
        }
    }

    // Submit form
    handleFormSubmit(event) {
        event.preventDefault();

        const values = {
            amount: this.elements.amountInput.value,
            date: this.elements.dateInput.value,
            category: this.elements.categorySelect.value,
            subCategory: this.elements.subCategorySelect.value,
            description: this.elements.descriptionInput.value
        };
        const errors = validateTransaction(values);

        if (Object.keys(errors).length > 0) {
            this.showFormErrors(errors);
            return;
        }

        if (this.editingId) {
            this.store.update(this.editingId, values);
            this.showToast('Transaction updated successfully!', 'success');
        } else {
            this.store.add(
                new Transaction({
                    id: Date.now(),
                    ...values
                })
            );
            this.showToast('Transaction added successfully!', 'success');
        }

        this.closeModal();
        this.render();
    }

    showFormErrors(errors) {
        this.elements.form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        this.elements.form.querySelectorAll('input, select, textarea').forEach(el => el.classList.remove('error'));
        Object.entries(errors).forEach(([fieldName, messages]) => {
            const errorEl = document.getElementById(`${fieldName}Error`);
            const inputEl = this.elements.form.querySelector(`[name="${fieldName}"]`);
            if (errorEl) errorEl.textContent = messages[0];
            if (inputEl) inputEl.classList.add('error');
        });
    }

    // Apply filters
    applyFilters() {
        const filters = {
            category: this.elements.categoryFilter.value,
            subCategory: this.elements.subCategoryFilter.value,
            startDate: this.elements.dateRangeStart.value,
            endDate: this.elements.dateRangeEnd.value,
            sortBy: this.elements.sortBy.value
        };
        const visibleTransactions = filterTransactions(this.store.list(), filters);
        this.renderTransactionsTable(visibleTransactions);
        this.renderSummary(visibleTransactions);
        expenseChart.render(visibleTransactions);
    }

    resetFilters() {
        this.elements.categoryFilter.value = '';
        this.elements.subCategoryFilter.value = '';
        this.elements.dateRangeStart.value = '';
        this.elements.dateRangeEnd.value = '';
        this.elements.sortBy.value = DEFAULT_SORT;
        this.render();
    }

    handleCsvDownload() {
        const transactions = this.store.list();
        const timestamp = new Date().toISOString().split('T')[0];
        exportTransactionsAsCsv(transactions, `money_manager_${timestamp}.csv`);
        this.showToast('Financial data downloaded successfully!', 'success');
    }

    handleClearAll() {
        const message = 'Are you sure you want to delete all transactions? This action cannot be undone.';

        if (confirm(message)) {
            this.store.clear();
            this.render();
            this.showToast('All transactions deleted!', 'success');
        }
    }

    handleTableClick(event) {
        const button = event.target.closest('button[data-action]');

        if (!button) {
            return;
        }

        const transactionId = Number(button.dataset.id);

        if (button.dataset.action === 'edit') {
            this.handleEditTransaction(transactionId);
        }

        if (button.dataset.action === 'delete') {
            this.handleDeleteTransaction(transactionId);
        }
    }

    // Render table
    renderTransactionsTable(transactions) {
        this.elements.tableBody.innerHTML = '';

        if (transactions.length === 0) {
            this.elements.emptyState.style.display = 'block';
            return;
        }

        this.elements.emptyState.style.display = 'none';

        transactions.forEach((transaction) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.formatDate()}</td>
                <td>
                    <span class="category-badge ${transaction.category.toLowerCase()}">
                        ${transaction.category}
                    </span>
                </td>
                <td>${transaction.subCategory}</td>
                <td>${transaction.description || '-'}</td>
                <td class="${transaction.isIncome() ? 'text-success' : 'text-danger'}">
                    ${transaction.isIncome() ? '+' : '-'}${transaction.formatAmount()}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-action="edit" data-id="${transaction.id}">Edit</button>
                        <button class="delete-btn" data-action="delete" data-id="${transaction.id}">Delete</button>
                    </div>
                </td>
            `;

            this.elements.tableBody.appendChild(row);
        });
    }

    handleEditTransaction(id) {
        const transaction = this.store.find(id);

        if (transaction) {
            this.openModal(transaction);
        }
    }

    handleDeleteTransaction(id) {
        this.pendingDeleteId = id;
        this.elements.confirmModal.classList.add('active');
    }

    confirmDelete() {
        if (this.pendingDeleteId === null) {
            return;
        }

        this.store.remove(this.pendingDeleteId);
        this.closeConfirmModal();
        this.render();
        this.showToast('Transaction deleted successfully!', 'success');
    }

    closeConfirmModal() {
        this.elements.confirmModal.classList.remove('active');
        this.pendingDeleteId = null;
    }

    // Update totals
    renderSummary(transactions) {
        const summary = calculateSummary(transactions);

        this.elements.totalIncome.textContent = formatCurrency(summary.income);
        this.elements.totalExpense.textContent = formatCurrency(summary.expense);
        this.elements.netBalance.textContent = formatCurrency(summary.balance);
    }

    showToast(message, type = 'info') {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.className = `toast ${type} show`;

        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    }

    // Full refresh
    render() {
        const transactions = this.store.list();
        const categories = [...new Set(transactions.map(t => t.category))];
        const subCategories = [...new Set(transactions.map(t => t.subCategory))];
        
        this.elements.categoryFilter.innerHTML = '<option value="">All</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = cat;
            this.elements.categoryFilter.appendChild(opt);
        });
        
        this.elements.subCategoryFilter.innerHTML = '<option value="">All</option>';
        subCategories.forEach(subCat => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = subCat;
            this.elements.subCategoryFilter.appendChild(opt);
        });
        
        this.renderTransactionsTable(transactions);
        this.renderSummary(transactions);
        expenseChart.render(transactions);
    }
}

let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        script.onload = () => {
            uiManager = new MoneyManagerApp();
        };
        document.head.appendChild(script);
        return;
    }

    uiManager = new MoneyManagerApp();
});
