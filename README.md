# 💰 Money Manager App

A comprehensive web application built with HTML, CSS, and JavaScript (OOP) for managing personal finances. Track income and expenses, analyze spending patterns, and generate financial reports.

## 📋 Features

### Core Features
- ✅ **Add Transactions** - Create income and expense entries with detailed information
- ✅ **View Transactions** - Display organized transaction history in a table format
- ✅ **Edit Transactions** - Update existing transaction details
- ✅ **Delete Transactions** - Remove transactions with confirmation prompt
- ✅ **Financial Summary** - Real-time income, expense, and balance calculations
- ✅ **Data Persistence** - LocalStorage integration to save all transactions

### Filtering & Sorting
- 🔍 **Filter by Category** - Income or Expense
- 🏷️ **Filter by Sub-Category** - Specific transaction types
- 📅 **Date Range Filter** - View transactions within selected dates
- 📊 **Sort Options** - By date (newest/oldest) or amount (highest/lowest)

### Data Management
- 📥 **Export to CSV** - Download financial data as CSV file
- 🗑️ **Clear All** - Reset all transactions (with confirmation)
- 📈 **Category Distribution** - Visual pie chart of expenses by category
- 📝 **Transaction Details** - Date, category, sub-category, description, and amount

### Form Features
- ✔️ **Form Validation** - Real-time validation with error messages
- 🔴 **Error Handling** - Clear feedback for invalid inputs
- 📝 **Character Count** - Description field count (max 100 characters)
- 🗓️ **Auto Date** - Default to today's date

### UI/UX
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🎨 **Modern Styling** - Clean, professional interface with gradient backgrounds
- 💫 **Animations** - Smooth transitions and modal effects
- 🔔 **Toast Notifications** - Success and error message notifications

## 📂 Project Structure

```
capstone project/
├── index.html      # Main HTML file with semantic structure
├── styles.css      # Comprehensive CSS styling (responsive)
├── app.js          # JavaScript application with OOP principles
└── README.md       # Project documentation
```

## 🛠️ Technical Specifications

### Object-Oriented Programming Classes

1. **Transaction** - Represents individual transactions with methods for formatting
2. **TransactionStorage** - Manages LocalStorage operations for data persistence
3. **FormValidator** - Validates form inputs with comprehensive error checking
4. **TransactionFilter** - Filters and sorts transactions dynamically
5. **FinancialCalculator** - Calculates income, expenses, balance, and distributions
6. **CSVExporter** - Exports transaction data to CSV format
7. **ChartManager** - Generates expense distribution charts using Chart.js
8. **UIManager** - Orchestrates all UI interactions and rendering

### Key Technologies
- **HTML5** - Semantic markup
- **CSS3** - Flexbox, Grid, Gradients, Animations
- **JavaScript ES6+** - OOP, Arrow Functions, Array Methods
- **Chart.js** - Data visualization library
- **LocalStorage API** - Client-side data persistence

## 🚀 How to Use

### Getting Started
1. Open `index.html` in a web browser
2. The app will load with an empty transaction history
3. Click "+ Add Transaction" to begin

### Adding a Transaction
1. Click the "+ Add Transaction" button
2. Fill in all required fields:
   - **Amount**: Enter a positive number
   - **Date**: Select a date (defaults to today)
   - **Category**: Choose "Income" or "Expense"
   - **Sub-Category**: Select from available options
   - **Description**: Add optional notes (max 100 characters)
3. Click "Save Transaction"

### Managing Transactions
- **Edit**: Click the "Edit" button in any row to modify the transaction
- **Delete**: Click the "Delete" button and confirm in the modal
- **View**: Transactions automatically update in the history table

### Filtering & Sorting
1. Use the filter section to narrow down transactions:
   - Select category or sub-category
   - Choose date range
   - Sort by preference
2. Click "Reset Filters" to clear all filters

### Exporting Data
- Click "📥 Download CSV" to export all filtered transactions
- File will be named with the current date

### Clearing Data
- Click "🗑️ Clear All" to remove all transactions (with confirmation)

## 📊 Category Structure

### Income Sub-Categories
- Salary
- Freelance
- Investments
- Bonus
- Other Income

### Expense Sub-Categories
- Rent
- Food
- Shopping
- Entertainment
- Transportation
- Utilities
- Healthcare
- Education
- Other Expense

## 📝 Form Validation Rules

| Field | Rules |
|-------|-------|
| **Amount** | Required, must be positive, numeric |
| **Date** | Required, cannot be future date |
| **Category** | Must select Income or Expense |
| **Sub-Category** | Must select a valid sub-category |
| **Description** | Optional, max 100 characters |

## 💾 Data Storage

- All transactions are stored in browser's LocalStorage
- Data persists even after refreshing the page
- Clear browser data/cache to remove stored transactions
- No server-side storage required

## 📱 Responsive Breakpoints

- **Desktop** (1200px+): Full multi-column layout
- **Tablet** (768px-1199px): Adjusted grid layout
- **Mobile** (below 768px): Single column, optimized for touch
- **Small Mobile** (below 480px): Minimal layout

## 🎨 Styling Features

- **CSS Variables** - Centralized color and spacing management
- **Gradients** - Beautiful linear gradients for headers and cards
- **Shadows** - Depth with shadow effects at multiple levels
- **Transitions** - Smooth animations on interactions
- **Flexbox/Grid** - Modern layout system for responsiveness

## ⚡ Performance

- **Lightweight** - No heavy dependencies (except Chart.js for visualization)
- **Fast Operations** - Instant filtering and sorting
- **Efficient Rendering** - DOM updates only when necessary
- **LocalStorage** - Quick data retrieval and persistence

## 🔐 Data Security

- All data stored locally in browser (no cloud storage)
- No external API calls for personal data
- User has complete control over their financial data
- Clear All option for immediate data deletion

## 🐛 Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎓 Learning Outcomes

This project demonstrates:
- Object-Oriented Programming principles
- DOM manipulation and event handling
- Form validation and error handling
- LocalStorage API usage
- Data filtering and sorting algorithms
- Chart.js library integration
- CSV file generation
- Responsive web design
- CSS Grid and Flexbox
- ES6+ JavaScript features

## 🚀 Future Enhancements

- Budget goals and alerts
- Monthly/yearly reports
- Data import from CSV
- Multiple user accounts
- Cloud synchronization
- Dark mode theme
- Advanced analytics dashboard

## 📄 License

This project is open source and available for educational purposes.

---

**Happy Money Managing! 💰**
