// Transaction
class Transaction {
    constructor(id, amount, date, category, subCategory, description = '') {
        this.id = id;
        this.amount = parseFloat(amount);
        this.date = date;
        this.category = category;
        this.subCategory = subCategory;
        this.description = description;
        this.createdAt = new Date();
    }

    isIncome() {
        return this.category === 'Income';
    }

    isExpense() {
        return this.category === 'Expense';
    }

    getFormattedAmount() {
        return `$${this.amount.toFixed(2)}`;
    }

    getFormattedDate() {
        return new Date(this.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Storage
class TransactionStorage {
    constructor() {
        this.storageKey = 'moneyManagerTransactions';
        this.loadTransactions();
    }

    loadTransactions() {
        const stored = localStorage.getItem(this.storageKey);
        this.transactions = stored ? JSON.parse(stored) : [];
        this.transactions = this.transactions.map(t => 
            new Transaction(t.id, t.amount, t.date, t.category, t.subCategory, t.description)
        );
    }

    saveTransactions() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.transactions));
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
        this.saveTransactions();
    }

    updateTransaction(id, updatedData) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions[index] = new Transaction(
                id,
                updatedData.amount,
                updatedData.date,
                updatedData.category,
                updatedData.subCategory,
                updatedData.description
            );
            this.saveTransactions();
            return true;
        }
        return false;
    }

    deleteTransaction(id) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions.splice(index, 1);
            this.saveTransactions();
            return true;
        }
        return false;
    }

    getAllTransactions() {
        return [...this.transactions];
    }

    clearAllTransactions() {
        this.transactions = [];
        this.saveTransactions();
    }

    getTransactionById(id) {
        return this.transactions.find(t => t.id === id);
    }
}

// Validator
class FormValidator {
    static validateAmount(amount) {
        const errors = [];
        if (!amount || amount === '') {
            errors.push('Amount is required');
        } else if (isNaN(amount) || parseFloat(amount) <= 0) {
            errors.push('Amount must be a positive numeric value');
        }
        return errors;
    }

    static validateDate(date) {
        const errors = [];
        if (!date) {
            errors.push('Date is required');
        } else if (new Date(date) > new Date()) {
            errors.push('Date cannot be in the future');
        }
        return errors;
    }

    static validateCategory(category) {
        const errors = [];
        if (!category || category === '') {
            errors.push('Category is required');
        }
        return errors;
    }

    static validateSubCategory(subCategory) {
        const errors = [];
        if (!subCategory || subCategory === '') {
            errors.push('Sub-Category is required');
        }
        return errors;
    }

    static validateDescription(description) {
        const errors = [];
        if (description && description.length > 100) {
            errors.push('Description cannot exceed 100 characters');
        }
        return errors;
    }

    static validateForm(formData) {
        const errors = {
            amount: this.validateAmount(formData.amount),
            date: this.validateDate(formData.date),
            category: this.validateCategory(formData.category),
            subCategory: this.validateSubCategory(formData.subCategory),
            description: this.validateDescription(formData.description)
        };
        return Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v.length > 0)
        );
    }
}

// Filter
class TransactionFilter {
    static filterByCategory(transactions, category) {
        if (!category) return transactions;
        return transactions.filter(t => t.category === category);
    }

    static filterBySubCategory(transactions, subCategory) {
        if (!subCategory) return transactions;
        return transactions.filter(t => t.subCategory === subCategory);
    }

    static filterByDateRange(transactions, startDate, endDate) {
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && transactionDate < start) return false;
            if (end && transactionDate > end) return false;
            return true;
        });
    }

    static sortTransactions(transactions, sortBy) {
        const sorted = [...transactions];
        
        switch (sortBy) {
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'amount-asc':
                return sorted.sort((a, b) => a.amount - b.amount);
            case 'amount-desc':
                return sorted.sort((a, b) => b.amount - a.amount);
            default:
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    }

    static applyFilters(transactions, filters) {
        let result = transactions;
        
        if (filters.category) {
            result = this.filterByCategory(result, filters.category);
        }
        if (filters.subCategory) {
            result = this.filterBySubCategory(result, filters.subCategory);
        }
        if (filters.startDate || filters.endDate) {
            result = this.filterByDateRange(result, filters.startDate, filters.endDate);
        }
        
        result = this.sortTransactions(result, filters.sortBy || 'date-desc');
        return result;
    }
}

// Calculator
class FinancialCalculator {
    static calculateTotalIncome(transactions) {
        return transactions
            .filter(t => t.isIncome())
            .reduce((sum, t) => sum + t.amount, 0);
    }

    static calculateTotalExpense(transactions) {
        return transactions
            .filter(t => t.isExpense())
            .reduce((sum, t) => sum + t.amount, 0);
    }

    static calculateNetBalance(transactions) {
        const income = this.calculateTotalIncome(transactions);
        const expense = this.calculateTotalExpense(transactions);
        return income - expense;
    }

    static getCategoryWiseDistribution(transactions) {
        const expenses = transactions.filter(t => t.isExpense());
        const distribution = {};

        expenses.forEach(t => {
            if (!distribution[t.subCategory]) {
                distribution[t.subCategory] = 0;
            }
            distribution[t.subCategory] += t.amount;
        });

        return distribution;
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// Exporter
class CSVExporter {
    static exportToCSV(transactions, filename = 'transactions.csv') {
        if (transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        const headers = ['Date', 'Category', 'Sub-Category', 'Description', 'Amount'];
        const rows = transactions.map(t => [
            t.getFormattedDate(),
            t.category,
            t.subCategory,
            t.description || '',
            t.getFormattedAmount()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Chart
class ChartManager {
    static generateExpenseChart(transactions) {
        const distribution = FinancialCalculator.getCategoryWiseDistribution(transactions);
        const chartCanvas = document.getElementById('expenseChart');
        
        if (!chartCanvas) {
            return;
        }
        
        // Clear
        if (window.expenseChartInstance) {
            window.expenseChartInstance.destroy();
            window.expenseChartInstance = null;
        }
        
        if (Object.keys(distribution).length === 0) {
            return;
        }

        // Verify Chart
        if (typeof Chart === 'undefined') {
            return;
        }

        const labels = Object.keys(distribution);
        const data = Object.values(distribution);
        const colors = this.generateColors(labels.length);

        const ctx = chartCanvas.getContext('2d');
        try {
            window.expenseChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
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
                                label: function(context) {
                                    return context.label + ': ' + FinancialCalculator.formatCurrency(context.parsed);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            // silently handled
        }
    }

    static generateColors(count) {
        const baseColors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
            '#f97316', '#eab308', '#84cc16', '#22c55e',
            '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'
        ];

        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }
}

// UI
class UIManager {
    constructor() {
        this.storage = new TransactionStorage();
        this.initializeElements();
        this.initializeEventListeners();
        this.setupCategoryMappings();
        this.render();
    }

    initializeElements() {
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
            amountError: document.getElementById('amountError'),
            dateError: document.getElementById('dateError'),
            categoryError: document.getElementById('categoryError'),
            subCategoryError: document.getElementById('subCategoryError'),
            descriptionError: document.getElementById('descriptionError'),
            addBtn: document.getElementById('addTransactionBtn'),
            closeBtn: document.getElementById('closeModalBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            downloadCsvBtn: document.getElementById('downloadCsvBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            resetFiltersBtn: document.getElementById('resetFiltersBtn'),
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

    setupCategoryMappings() {
        this.subCategories = {
            'Income': [
                'Salary',
                'Freelance',
                'Investments',
                'Bonus',
                'Other Income'
            ],
            'Expense': [
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
    }

    initializeEventListeners() {
        this.elements.addBtn.addEventListener('click', () => this.openModal());
        this.elements.closeBtn.addEventListener('click', () => this.closeModal());
        this.elements.cancelBtn.addEventListener('click', () => this.closeModal());
        this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.elements.categorySelect.addEventListener('change', () => this.updateSubCategories());
        this.elements.descriptionInput.addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });
        this.elements.downloadCsvBtn.addEventListener('click', () => this.handleExportCSV());
        this.elements.clearAllBtn.addEventListener('click', () => this.handleClearAll());
        this.elements.resetFiltersBtn.addEventListener('click', () => this.handleResetFilters());
        this.elements.categoryFilter.addEventListener('change', () => this.applyFilters());
        this.elements.subCategoryFilter.addEventListener('change', () => this.applyFilters());
        this.elements.dateRangeStart.addEventListener('change', () => this.applyFilters());
        this.elements.dateRangeEnd.addEventListener('change', () => this.applyFilters());
        this.elements.sortBy.addEventListener('change', () => this.applyFilters());
        this.elements.cancelDeleteBtn.addEventListener('click', () => this.closeConfirmModal());
        const today = new Date().toISOString().split('T')[0];
        this.elements.dateInput.value = today;
    }

    openModal(transaction = null) {
        this.currentEditingId = transaction ? transaction.id : null;
        
        this.clearForm();
        
        if (transaction) {
            this.elements.modalTitle.textContent = 'Edit';
            this.elements.amountInput.value = transaction.amount;
            this.elements.dateInput.value = transaction.date;
            this.elements.categorySelect.value = transaction.category;
            this.updateSubCategories();
            this.elements.subCategorySelect.value = transaction.subCategory;
            this.elements.descriptionInput.value = transaction.description;
            this.updateCharCount(transaction.description.length);
        } else {
            this.elements.modalTitle.textContent = 'Add';
        }

        this.elements.modal.classList.add('active');
    }

    closeModal() {
        this.elements.modal.classList.remove('active');
        this.clearForm();
        this.currentEditingId = null;
    }

    clearForm() {
        this.elements.form.reset();
        this.clearErrorMessages();
        this.updateCharCount(0);
        const today = new Date().toISOString().split('T')[0];
        this.elements.dateInput.value = today;
    }

    clearErrorMessages() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.classList.remove('error');
        });
    }

    updateSubCategories() {
        const selectedCategory = this.elements.categorySelect.value;
        this.elements.subCategorySelect.innerHTML = '<option value="">Select Sub-Category</option>';

        if (selectedCategory && this.subCategories[selectedCategory]) {
            this.subCategories[selectedCategory].forEach(subCat => {
                const option = document.createElement('option');
                option.value = subCat;
                option.textContent = subCat;
                this.elements.subCategorySelect.appendChild(option);
            });
        }
    }

    updateCharCount(count) {
        if (this.elements.charCount) {
            this.elements.charCount.textContent = `${count}/100`;
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const formData = {
            amount: this.elements.amountInput.value,
            date: this.elements.dateInput.value,
            category: this.elements.categorySelect.value,
            subCategory: this.elements.subCategorySelect.value,
            description: this.elements.descriptionInput.value
        };
        const errors = FormValidator.validateForm(formData);
        if (Object.keys(errors).length > 0) {
            this.displayFormErrors(errors);
            return;
        }
        if (this.currentEditingId) {
            this.storage.updateTransaction(this.currentEditingId, formData);
            this.showToast('Transaction updated successfully!', 'success');
        } else {
            const newId = Date.now();
            const transaction = new Transaction(
                newId,
                formData.amount,
                formData.date,
                formData.category,
                formData.subCategory,
                formData.description
            );
            this.storage.addTransaction(transaction);
            this.showToast('Transaction added successfully!', 'success');
        }
        this.closeModal();
        this.render();
    }

    displayFormErrors(errors) {
        this.clearErrorMessages();
        Object.entries(errors).forEach(([field, errorMessages]) => {
            const errorElement = document.getElementById(`${field}Error`);
            const inputElement = document.querySelector(`[name="${field}"]`);
            if (errorElement) {
                errorElement.textContent = errorMessages[0];
            }
            if (inputElement) {
                inputElement.classList.add('error');
            }
        });
    }

    updateFilterOptions() {
        const transactions = this.storage.getAllTransactions();
        const categories = [...new Set(transactions.map(t => t.category))];
        this.elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            this.elements.categoryFilter.appendChild(option);
        });
        const subCategories = [...new Set(transactions.map(t => t.subCategory))];
        this.elements.subCategoryFilter.innerHTML = '<option value="">All Sub-Categories</option>';
        subCategories.forEach(subCat => {
            const option = document.createElement('option');
            option.value = subCat;
            option.textContent = subCat;
            this.elements.subCategoryFilter.appendChild(option);
        });
    }

    applyFilters() {
        const filters = {
            category: this.elements.categoryFilter.value,
            subCategory: this.elements.subCategoryFilter.value,
            startDate: this.elements.dateRangeStart.value,
            endDate: this.elements.dateRangeEnd.value,
            sortBy: this.elements.sortBy.value
        };
        const transactions = this.storage.getAllTransactions();
        const filtered = TransactionFilter.applyFilters(transactions, filters);
        this.renderTransactionsTable(filtered);
        this.updateSummary(filtered);
        ChartManager.generateExpenseChart(filtered);
    }

    handleResetFilters() {
        this.elements.categoryFilter.value = '';
        this.elements.subCategoryFilter.value = '';
        this.elements.dateRangeStart.value = '';
        this.elements.dateRangeEnd.value = '';
        this.elements.sortBy.value = 'date-desc';
        this.render();
    }

    handleExportCSV() {
        const transactions = this.storage.getAllTransactions();
        const timestamp = new Date().toISOString().split('T')[0];
        CSVExporter.exportToCSV(transactions, `money_manager_${timestamp}.csv`);
        this.showToast('Financial data downloaded successfully!', 'success');
    }

    handleClearAll() {
        if (confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
            this.storage.clearAllTransactions();
            this.render();
            this.showToast('All transactions deleted!', 'success');
        }
    }

    renderTransactionsTable(transactions) {
        this.elements.tableBody.innerHTML = '';
        if (transactions.length === 0) {
            this.elements.emptyState.style.display = 'block';
            return;
        }
        this.elements.emptyState.style.display = 'none';
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.getFormattedDate()}</td>
                <td>
                    <span class="category-badge ${transaction.category.toLowerCase()}">
                        ${transaction.category}
                    </span>
                </td>
                <td>${transaction.subCategory}</td>
                <td>${transaction.description || '-'}</td>
                <td class="${transaction.isIncome() ? 'text-success' : 'text-danger'}">
                    ${transaction.isIncome() ? '+' : '-'}${transaction.getFormattedAmount()}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="uiManager.handleEditTransaction(${transaction.id})">Edit</button>
                        <button class="delete-btn" onclick="uiManager.handleDeleteTransaction(${transaction.id})">Delete</button>
                    </div>
                </td>
            `;
            this.elements.tableBody.appendChild(row);
        });
    }

    handleEditTransaction(id) {
        const transaction = this.storage.getTransactionById(id);
        if (transaction) {
            this.openModal(transaction);
        }
    }

    handleDeleteTransaction(id) {
        this.deleteTransactionId = id;
        this.elements.confirmModal.classList.add('active');
        this.elements.confirmDeleteBtn.onclick = () => this.confirmDelete(id);
    }

    confirmDelete(id) {
        this.storage.deleteTransaction(id);
        this.closeConfirmModal();
        this.render();
        this.showToast('Transaction deleted successfully!', 'success');
    }

    closeConfirmModal() {
        this.elements.confirmModal.classList.remove('active');
        this.deleteTransactionId = null;
    }

    updateSummary(transactions) {
        const income = FinancialCalculator.calculateTotalIncome(transactions);
        const expense = FinancialCalculator.calculateTotalExpense(transactions);
        const balance = FinancialCalculator.calculateNetBalance(transactions);

        this.elements.totalIncome.textContent = FinancialCalculator.formatCurrency(income);
        this.elements.totalExpense.textContent = FinancialCalculator.formatCurrency(expense);
        this.elements.netBalance.textContent = FinancialCalculator.formatCurrency(balance);
    }

    showToast(message, type = 'info') {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.className = `toast ${type} show`;
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    }

    render() {
        const transactions = this.storage.getAllTransactions();
        this.updateFilterOptions();
        this.renderTransactionsTable(transactions);
        this.updateSummary(transactions);
        ChartManager.generateExpenseChart(transactions);
    }
}

// Initialize
let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    // Verify Chart
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
        script.onload = () => {
            uiManager = new UIManager();
        };
        document.head.appendChild(script);
    } else {
        uiManager = new UIManager();
    }
});
