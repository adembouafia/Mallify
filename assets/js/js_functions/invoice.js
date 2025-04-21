document.addEventListener('DOMContentLoaded', function() {
    const timeBtn = document.getElementById('timeBtn');
    const timeOptions = document.getElementById('timeOptions');
    const timeBtnText = document.getElementById('timeBtnText');
    const periodText = document.getElementById('periodText');
    const downloadBtn = document.getElementById('downloadBtn');
    const tableBody = document.getElementById('invoiceTableBody');
    const totalSalesEl = document.getElementById('totalSales');
    const totalOrdersEl = document.getElementById('totalOrders');
    const averageOrderEl = document.getElementById('averageOrder');
    const customRangeOption = document.getElementById('customRangeOption');
    const dateRangeModal = document.getElementById('dateRangeModal');
    const dateRangeClose = document.getElementById('dateRangeClose');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyDateRangeBtn = document.getElementById('applyDateRange');
    const orderModal = document.getElementById('orderModal');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalOrderTitle');
    const modalCustomerName = document.getElementById('modalCustomerName');
    const modalCustomerEmail = document.getElementById('modalCustomerEmail');
    const modalCustomerPhone = document.getElementById('modalCustomerPhone');
    const modalCustomerAddress = document.getElementById('modalCustomerAddress');
    const modalItemsBody = document.getElementById('modalItemsBody');
    const modalSubtotal = document.getElementById('modalSubtotal');
    const modalShipping = document.getElementById('modalShipping');
    const modalTax = document.getElementById('modalTax');
    const modalTotal = document.getElementById('modalTotal');
    const allOrders = generateFixedOrders(365); 
    let currentPeriod = 'day';
    let currentOrders = filterOrdersByPeriod(allOrders, currentPeriod);
    updateInvoiceDisplay();
    timeBtn.addEventListener('click', toggleTimeOptions);
    document.querySelectorAll('.time-option').forEach(option => {
        option.addEventListener('click', function() {
            if (this === customRangeOption) {
                openDateRangePicker();
            } else {
                currentPeriod = this.textContent.toLowerCase();
                timeBtnText.textContent = this.textContent;
                currentOrders = filterOrdersByPeriod(allOrders, currentPeriod);
                updateInvoiceDisplay();
            }
            timeOptions.style.display = 'none';
        });
    });
    
    dateRangeClose.addEventListener('click', closeDateRangePicker);
    applyDateRangeBtn.addEventListener('click', applyDateRange);
    downloadBtn.addEventListener('click', downloadAsPDF);
    modalClose.addEventListener('click', closeOrderModal);
    
    window.addEventListener('click', function(event) {
        if (event.target === timeOptions.parentElement) return;
        if (event.target === orderModal) closeOrderModal();
        if (event.target === dateRangeModal) closeDateRangePicker();
    });
    
    // Set default dates
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    startDateInput.valueAsDate = oneMonthAgo;
    endDateInput.valueAsDate = today;
    
    // Functions
    function toggleTimeOptions() {
        timeOptions.style.display = timeOptions.style.display === 'block' ? 'none' : 'block';
    }
    
    function openDateRangePicker() {
        dateRangeModal.style.display = 'flex';
    }
    
    function closeDateRangePicker() {
        dateRangeModal.style.display = 'none';
    }
    
    function applyDateRange() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        if (startDate > endDate) {
            alert('End date must be after start date');
            return;
        }
        
        currentPeriod = 'custom';
        timeBtnText.textContent = formatDateRange(startDate, endDate);
        currentOrders = filterOrdersByDateRange(allOrders, startDate, endDate);
        updateInvoiceDisplay();
        closeDateRangePicker();
    }
    
    function updateInvoiceDisplay() {
        // Update period text
        if (currentPeriod === 'custom') {
            periodText.textContent = timeBtnText.textContent;
        } else {
            periodText.textContent = getPeriodText(currentPeriod);
        }
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Calculate totals
        let totalSales = 0;
        const totalOrders = currentOrders.length;
        
        // Add rows to table
        currentOrders.forEach(order => {
            totalSales += order.amount;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.date}</td>
                <td>${order.id}</td>
                <td>${order.name}</td>
                <td>${order.amount.toFixed(2)} DT</td>
                <td><span class="badge ${order.status}">${order.status}</span></td>
                <td><button class="detail-btn" data-order='${JSON.stringify(order)}'>🔍</button></td>
            `;
            tableBody.appendChild(row);
        });
        
        // Update summary
        totalSalesEl.textContent = `${totalSales.toFixed(2)} DT`;
        totalOrdersEl.textContent = totalOrders;
        averageOrderEl.textContent = totalOrders > 0 
            ? `${(totalSales / totalOrders).toFixed(2)} DT` 
            : '0.00 DT';
        
        // Add event listeners to detail buttons
        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const order = JSON.parse(this.getAttribute('data-order'));
                showOrderDetails(order);
            });
        });
    }
    
    function showOrderDetails(order) {
        // Update customer info
        modalCustomerName.textContent = order.details.name;
        modalCustomerEmail.textContent = order.details.email;
        modalCustomerPhone.textContent = order.details.phone;
        modalCustomerAddress.textContent = order.details.address || 'Not specified';
        
        // Update order items
        modalItemsBody.innerHTML = '';
        let subtotal = 0;
        
        order.details.items.forEach(item => {
            const total = item.price * item.quantity;
            subtotal += total;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.price.toFixed(2)} DT</td>
                <td>${item.quantity}</td>
                <td>${total.toFixed(2)} DT</td>
            `;
            modalItemsBody.appendChild(row);
        });
        const shipping = Math.max(5, subtotal * 0.05);
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;
        
        // Update summary
        modalSubtotal.textContent = `${subtotal.toFixed(2)} DT`;
        modalShipping.textContent = `${shipping.toFixed(2)} DT`;
        modalTax.textContent = `${tax.toFixed(2)} DT`;
        modalTotal.textContent = `${total.toFixed(2)} DT`;
        modalTitle.textContent = `${order.id} Details - ${order.date}`;
        
        // Show modal
        orderModal.style.display = 'flex';
    }
    
    function closeOrderModal() {
        orderModal.style.display = 'none';
    }
    
    function downloadAsPDF() {
        window.print();
    }
    
    function getPeriodText(period) {
        const now = new Date();
        switch(period) {
            case 'day': return now.toLocaleDateString();
            case 'week': return `Week ${getWeekNumber(now)} of ${now.getFullYear()}`;
            case 'month': 
                return now.toLocaleDateString('default', { month: 'long', year: 'numeric' });
            case 'year': return now.getFullYear().toString();
            default: return 'Custom Period';
        }
    }
    
    function formatDateRange(startDate, endDate) {
        return `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
    }
    
    function filterOrdersByPeriod(orders, period) {
        const now = new Date();
        let startDate = new Date(now);
        
        switch(period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return orders;
        }
        
        return filterOrdersByDateRange(orders, startDate, now);
    }
    
    function filterOrdersByDateRange(orders, startDate, endDate) {
        return orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }
    
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    }
    function generateFixedOrders(daysRange) {
        const names = [
            'koussay abroud', 'adem bouafia', 'foued ben hhlima', 'abdou abdou',
            'nour limen', 'tayssir jalloul'
        ];

        const products = [
            { name: 'T-Shirt', price: 25.00 },
            { name: 'Hoodie', price: 45.00 },
            { name: 'Coffee Mug', price: 12.50 },
            { name: 'Notebook', price: 15.00 },
            { name: 'Pen Set', price: 8.00 },
            { name: 'Sticker Pack', price: 5.00 },
            { name: 'Desk Organizer', price: 32.00 },
            { name: 'Keychain', price: 5.00 }
        ];

        const statuses = ['paid', 'pending', 'cancelled'];
        const orders = [];
        const now = new Date();
        if (!window.fixedOrders) {
            for (let i = 0; i < 12; i++) {
                const randomOffset = Math.floor(Math.random() * 365);   
                const randomDate = new Date(now);
                randomDate.setDate(randomDate.getDate() - randomOffset);
                const order = generateOrder(randomDate, names, products, statuses);
                orders.push(order);
            }
            window.fixedOrders = orders;
        } else {
            return window.fixedOrders;
        }
        return orders;
    }
    
    function generateOrder(date, names, products, statuses) {
        const name = names[Math.floor(Math.random() * names.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const numItems = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let totalAmount = 0;

        for (let i = 0; i < numItems; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const total = product.price * quantity;
            totalAmount += total;
            items.push({ name: product.name, price: product.price, quantity });
        }
        
        return {
            id: `ORD${Math.floor(Math.random() * 1000000)}`,
            date: date.toLocaleDateString(),
            name,
            amount: totalAmount,
            status,
            details: {
                name,
                email: `${name.split(' ').join('.')}@gmail.com`,
                phone: '+216 26 788 694',
                address: 'hammamet, Tunisia',
                items
            }
        };
    }
});
