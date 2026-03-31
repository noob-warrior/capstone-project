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

function validateTransaction(values) {
    const errors = {};

    if (!values.amount || values.amount === '') {
        errors.amount = ['Amount is required'];
    } else if (isNaN(values.amount) || parseFloat(values.amount) <= 0) {
        errors.amount = ['Amount must be a positive numeric value'];
    }

    if (!values.date) {
        errors.date = ['Date is required'];
    } else if (new Date(values.date) > new Date()) {
        errors.date = ['Date cannot be in the future'];
    }

    if (!values.category || values.category === '') {
        errors.category = ['Category is required'];
    }

    if (!values.subCategory || values.subCategory === '') {
        errors.subCategory = ['Sub-Category is required'];
    }

    if (values.description && values.description.length > 100) {
        errors.description = ['Description cannot exceed 100 characters'];
    }

    return errors;
}

function filterTransactions(transactions, filters) {
    let result = transactions;

    if (filters.category) {
        result = result.filter((transaction) => transaction.category === filters.category);
    }

    if (filters.subCategory) {
        result = result.filter((transaction) => transaction.subCategory === filters.subCategory);
    }

    if (filters.startDate || filters.endDate) {
        result = result.filter((transaction) => {
            const transactionDate = new Date(transaction.date);
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;

            if (start && transactionDate < start) {
                return false;
            }

            if (end && transactionDate > end) {
                return false;
            }

            return true;
        });
    }

    return [...result].sort((left, right) => {
        switch (filters.sortBy || DEFAULT_SORT) {
            case 'date-asc':
                return new Date(left.date) - new Date(right.date);
            case 'amount-asc':
                return left.amount - right.amount;
            case 'amount-desc':
                return right.amount - left.amount;
            case 'date-desc':
            default:
                return new Date(right.date) - new Date(left.date);
        }
    });
}

function calculateSummary(transactions) {
    const income = transactions
        .filter((transaction) => transaction.isIncome())
        .reduce((total, transaction) => total + transaction.amount, 0);

    const expense = transactions
        .filter((transaction) => transaction.isExpense())
        .reduce((total, transaction) => total + transaction.amount, 0);

    return {
        income,
        expense,
        balance: income - expense
    };
}

function getExpenseDistribution(transactions) {
    return transactions
        .filter((transaction) => transaction.isExpense())
        .reduce((distribution, transaction) => {
            if (!distribution[transaction.subCategory]) {
                distribution[transaction.subCategory] = 0;
            }

            distribution[transaction.subCategory] += transaction.amount;
            return distribution;
        }, {});
}

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

function exportTransactionsAsCsv(transactions, filename = 'transactions.csv') {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }

    const headers = ['Date', 'Category', 'Sub-Category', 'Description', 'Amount'];
    const rows = transactions.map((transaction) => [
        transaction.formatDate(),
        transaction.category,
        transaction.subCategory,
        transaction.description || '',
        transaction.formatAmount()
    ]);

    const csvBody = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const downloadLink = document.createElement('a');
    const url = URL.createObjectURL(blob);

    downloadLink.setAttribute('href', url);
    downloadLink.setAttribute('download', filename);
    downloadLink.style.visibility = 'hidden';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

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
            // If Chart.js fails, the rest of the app should still work.
        }
    },

    getColors(count) {
        const colors = [];

        for (let index = 0; index < count; index += 1) {
            colors.push(CHART_COLORS[index % CHART_COLORS.length]);
        }

        return colors;
    }
};

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
        this.elements.addButton.addEventListener('click', () => this.openModal());
        this.elements.closeButton.addEventListener('click', () => this.closeModal());
        this.elements.cancelButton.addEventListener('click', () => this.closeModal());
        this.elements.form.addEventListener('submit', (event) => this.handleFormSubmit(event));
        this.elements.categorySelect.addEventListener('change', () => this.updateSubCategoryOptions());
        this.elements.descriptionInput.addEventListener('input', (event) => {
            this.updateCharacterCount(event.target.value.length);
        });
        this.elements.downloadCsvButton.addEventListener('click', () => this.handleCsvDownload());
        this.elements.clearAllButton.addEventListener('click', () => this.handleClearAll());
        this.elements.resetFiltersButton.addEventListener('click', () => this.resetFilters());
        this.elements.categoryFilter.addEventListener('change', () => this.applyFilters());
        this.elements.subCategoryFilter.addEventListener('change', () => this.applyFilters());
        this.elements.dateRangeStart.addEventListener('change', () => this.applyFilters());
        this.elements.dateRangeEnd.addEventListener('change', () => this.applyFilters());
        this.elements.sortBy.addEventListener('change', () => this.applyFilters());
        this.elements.cancelDeleteButton.addEventListener('click', () => this.closeConfirmModal());
        this.elements.confirmDeleteButton.addEventListener('click', () => this.confirmDelete());
        this.elements.tableBody.addEventListener('click', (event) => this.handleTableClick(event));
    }

    setDefaultDate() {
        this.elements.dateInput.value = this.getTodayValue();
    }

    getTodayValue() {
        return new Date().toISOString().split('T')[0];
    }

    openModal(transaction = null) {
        this.editingId = transaction ? transaction.id : null;
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
        this.clearErrors();
        this.updateCharacterCount(0);
        this.elements.dateInput.value = this.getTodayValue();
    }

    clearErrors() {
        this.elements.form.querySelectorAll('.error-message').forEach((element) => {
            element.textContent = '';
        });

        this.elements.form.querySelectorAll('input, select, textarea').forEach((element) => {
            element.classList.remove('error');
        });
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

    readFormValues() {
        return {
            amount: this.elements.amountInput.value,
            date: this.elements.dateInput.value,
            category: this.elements.categorySelect.value,
            subCategory: this.elements.subCategorySelect.value,
            description: this.elements.descriptionInput.value
        };
    }

    handleFormSubmit(event) {
        event.preventDefault();

        const values = this.readFormValues();
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
                    amount: values.amount,
                    date: values.date,
                    category: values.category,
                    subCategory: values.subCategory,
                    description: values.description
                })
            );
            this.showToast('Transaction added successfully!', 'success');
        }

        this.closeModal();
        this.render();
    }

    showFormErrors(errors) {
        this.clearErrors();

        Object.entries(errors).forEach(([fieldName, messages]) => {
            const errorElement = document.getElementById(`${fieldName}Error`);
            const inputElement = this.elements.form.querySelector(`[name="${fieldName}"]`);

            if (errorElement) {
                errorElement.textContent = messages[0];
            }

            if (inputElement) {
                inputElement.classList.add('error');
            }
        });
    }

    updateFilterOptions() {
        const transactions = this.store.list();
        const categories = [...new Set(transactions.map((transaction) => transaction.category))];
        const subCategories = [...new Set(transactions.map((transaction) => transaction.subCategory))];

        this.elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.elements.categoryFilter.appendChild(option);
        });

        this.elements.subCategoryFilter.innerHTML = '<option value="">All Sub-Categories</option>';
        subCategories.forEach((subCategory) => {
            const option = document.createElement('option');
            option.value = subCategory;
            option.textContent = subCategory;
            this.elements.subCategoryFilter.appendChild(option);
        });
    }

    readFilters() {
        return {
            category: this.elements.categoryFilter.value,
            subCategory: this.elements.subCategoryFilter.value,
            startDate: this.elements.dateRangeStart.value,
            endDate: this.elements.dateRangeEnd.value,
            sortBy: this.elements.sortBy.value
        };
    }

    applyFilters() {
        const visibleTransactions = filterTransactions(this.store.list(), this.readFilters());
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

    render() {
        const transactions = this.store.list();
        this.updateFilterOptions();
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
