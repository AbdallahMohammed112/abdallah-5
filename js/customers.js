// تهيئة المتغيرات الأساسية
// استرجاع بيانات العملاء من التخزين المحلي، إذا لم تكن موجودة نستخدم مصفوفة فارغة
let customers = JSON.parse(localStorage.getItem('customers')) || [];

// دالة لحساب الرقم التسلسلي التالي للعميل الجديد
function getNextCustomerId() {
    if (customers.length === 0) return 1;
    const maxId = Math.max(...customers.map(c => parseInt(c.id)));
    return maxId + 1;
}

let nextCustomerId = getNextCustomerId();

// متغير لتخزين العميل المراد حذفه مؤقتاً
let customerToDelete = null;

// متغير لتخزين العميل المحدد حالياً
let selectedCustomer = null;

// دالة لتحسين أداء البحث باستخدام debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// إضافة مستمع لحدث البحث في الجدول
document.getElementById('searchInput').addEventListener('input', debounce(function(e) {
    const searchText = e.target.value.toLowerCase();
    const tbody = document.getElementById('customersTableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    // استخدام Fragment لتحسين الأداء
    const fragment = document.createDocumentFragment();
    const visibleRows = [];
    const hiddenRows = [];
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchText)) {
            row.style.display = '';
            visibleRows.push(row);
        } else {
            row.style.display = 'none';
            hiddenRows.push(row);
        }
    }
    
    // إعادة ترتيب الصفوف المرئية في المقدمة
    visibleRows.forEach(row => fragment.appendChild(row));
    hiddenRows.forEach(row => fragment.appendChild(row));
    
    tbody.appendChild(fragment);
}, 300));

// دالة لعرض نموذج إضافة عميل جديد
function showAddCustomerForm() {
    const form = document.getElementById('addCustomerForm');
    form.style.display = 'block';
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
    document.getElementById('customerForm').reset();
}

// دالة لإخفاء نموذج إضافة عميل جديد
function hideAddCustomerForm() {
    const form = document.getElementById('addCustomerForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.style.display = 'none';
    }, 300);
}

// دالة للتحقق من صحة رقم الهاتف
function validatePhone(phone) {
    // التحقق من أن رقم الهاتف يتكون من 11 رقم ويبدأ بـ 01
    const phoneRegex = /^01[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
}

// دالة للتحقق من صحة اسم العميل
function validateName(name) {
    // التحقق من أن الاسم يحتوي على حرفين على الأقل
    return name.trim().length >= 2;
}

// التحقق من صحة إدخال الرصيد الافتتاحي ونوع الحساب
function validateBalanceAndType() {
    const initialBalance = document.getElementById('initialBalance').value;
    const accountType = document.getElementById('accountType').value;
    
    if (initialBalance && !accountType) {
        alert('يرجى اختيار نوع الحساب عند إدخال الرصيد الافتتاحي');
        return false;
    }
    
    if (!initialBalance && accountType) {
        alert('يرجى إدخال الرصيد الافتتاحي عند اختيار نوع الحساب');
        return false;
    }
    
    return true;
}

// دالة لإضافة عميل جديد
function addNewCustomer(event) {
    event.preventDefault();
    
    try {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const balance = parseFloat(document.getElementById('initialBalance').value) || 0;
        const accountType = document.getElementById('accountType').value;
        const address = document.getElementById('customerAddress').value.trim();
        
        // التحقق من صحة الإدخال
        if (!validateBalanceAndType()) {
            return;
        }
        
        // التحقق من صحة البيانات
        if (!validateName(name)) {
            throw new Error('يجب أن يكون اسم العميل حرفين على الأقل');
        }
        
        if (!validatePhone(phone)) {
            throw new Error('رقم الهاتف غير صحيح');
        }
        
        // إنشاء كائن العميل الجديد
        const customer = {
            id: nextCustomerId,
            name: name,
            phone: phone,
            balance: balance,
            initialBalance: balance, // إضافة الرصيد الافتتاحي
            accountType: accountType,
            address: address
        };
        
        // إضافة العميل للمصفوفة
        customers.push(customer);
        
        // حفظ البيانات في التخزين المحلي
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // إضافة العميل للجدول
        addCustomerToTable(customer);
        
        // تحديث الرقم التسلسلي التالي
        nextCustomerId = getNextCustomerId();
        
        // إخفاء النموذج وعرض رسالة نجاح
        hideAddCustomerForm();
        showNotification('تم إضافة العميل بنجاح');
        
    } catch (error) {
        showNotification(error.message, true);
    }
}

// دالة لإضافة عميل للجدول
function addCustomerToTable(customer) {
    const tbody = document.getElementById('customersTableBody');
    const row = document.createElement('tr');
    row.setAttribute('data-id', customer.id);
    
    row.innerHTML = `
        <td>${customer.id}</td>
        <td onclick="showDropdownMenu(event, ${customer.id})" style="cursor: pointer">${customer.name}</td>
        <td>${customer.phone}</td>
        <td>${customer.balance.toFixed(2)} جنيه</td>
        <td>${customer.address}</td>
        <td>
            <div class="actions">
                <button class="send-btn" onclick="sendToCustomer(${customer.id})">إرسال</button>
                <button class="receive-btn" onclick="receiveFromCustomer(${customer.id})">استلام</button>
                <button class="edit-btn" onclick="editCustomer(${customer.id})">تعديل</button>
                <button class="delete-btn" onclick="showConfirmationModal(${customer.id})">حذف</button>
            </div>
        </td>
    `;
    
    // إضافة العميل الجديد في بداية الجدول
    if (tbody.firstChild) {
        tbody.insertBefore(row, tbody.firstChild);
    } else {
        tbody.appendChild(row);
    }
}

// دالة لعرض رسائل التنبيه
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // إزالة التنبيه بعد 3 ثواني
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// دالة لعرض نافذة تأكيد الحذف
function showConfirmationModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    customerToDelete = customer;
    document.getElementById('confirmationMessage').textContent = `هل أنت متأكد من حذف العميل "${customer.name}"؟`;
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'block';
    // إضافة تأخير صغير لضمان ظهور الحركة
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// دالة لإخفاء نافذة تأكيد الحذف
function hideConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('show');
    // انتظار انتهاء حركة الإغلاق قبل إخفاء العنصر
    setTimeout(() => {
        modal.style.display = 'none';
        customerToDelete = null;
    }, 500);
}

// دالة لتأكيد حذف العميل
function confirmDelete() {
    if (!customerToDelete) return;

    const id = customerToDelete.id;
    // حذف العميل من المصفوفة
    customers = customers.filter(c => c.id !== id);
    // تحديث التخزين المحلي
    localStorage.setItem('customers', JSON.stringify(customers));
    
    // حذف الصف من الجدول
    const row = document.querySelector(`#customersTableBody tr[data-id="${id}"]`);
    if (row) {
        row.remove();
    }
    
    // إخفاء النافذة وعرض رسالة نجاح
    hideConfirmationModal();
    showNotification('تم حذف العميل بنجاح');
}

// دالة لإرسال الأموال للعميل
function sendToCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    const amount = parseFloat(prompt('أدخل المبلغ المراد إرساله:'));
    if (isNaN(amount) || amount <= 0) {
        showNotification('خطأ: يرجى إدخال مبلغ صحيح', true);
        return;
    }

    try {
        customer.balance += amount;
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // إضافة المعاملة لسجل المعاملات
        const transaction = {
            date: new Date().toISOString(),
            type: 'send',
            amount: amount,
            balanceAfter: customer.balance
        };
        
        const transactions = JSON.parse(localStorage.getItem(`transactions_${id}`)) || [];
        transactions.unshift(transaction);
        localStorage.setItem(`transactions_${id}`, JSON.stringify(transactions));
        
        // تحديث عرض الرصيد في الجدول
        const row = document.querySelector(`#customersTableBody tr[data-id="${id}"]`);
        if (row) {
            row.querySelector('td:nth-child(4)').textContent = `${customer.balance.toFixed(2)} جنيه`;
        }
        
        showNotification(`تم إرسال ${amount.toFixed(2)} جنيه بنجاح إلى ${customer.name}`);
    } catch (error) {
        console.error('خطأ في عملية الإرسال:', error);
        showNotification('حدث خطأ أثناء عملية الإرسال', true);
    }
}

// دالة لاستلام الأموال من العميل
function receiveFromCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    const amount = parseFloat(prompt('أدخل المبلغ المراد استلامه:'));
    if (isNaN(amount) || amount <= 0) {
        showNotification('خطأ: يرجى إدخال مبلغ صحيح', true);
        return;
    }

    if (amount > customer.balance) {
        showNotification('خطأ: الرصيد غير كافي', true);
        return;
    }

    try {
        customer.balance -= amount;
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // إضافة المعاملة لسجل المعاملات
        const transaction = {
            date: new Date().toISOString(),
            type: 'receive',
            amount: amount,
            balanceAfter: customer.balance
        };
        
        const transactions = JSON.parse(localStorage.getItem(`transactions_${id}`)) || [];
        transactions.unshift(transaction);
        localStorage.setItem(`transactions_${id}`, JSON.stringify(transactions));
        
        // تحديث عرض الرصيد في الجدول
        const row = document.querySelector(`#customersTableBody tr[data-id="${id}"]`);
        if (row) {
            row.querySelector('td:nth-child(4)').textContent = `${customer.balance.toFixed(2)} جنيه`;
        }
        
        showNotification(`تم استلام ${amount.toFixed(2)} جنيه بنجاح من ${customer.name}`);
    } catch (error) {
        console.error('خطأ في عملية الاستلام:', error);
        showNotification('حدث خطأ أثناء عملية الاستلام', true);
    }
}

// دالة لعرض نموذج تعديل العميل
function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    const form = document.getElementById('addCustomerForm');
    form.style.display = 'block';
    setTimeout(() => {
        form.classList.add('show');
    }, 10);

    // تعبئة النموذج ببيانات العميل
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('initialBalance').value = customer.balance;
    document.getElementById('accountType').value = customer.accountType;
    document.getElementById('customerAddress').value = customer.address;

    // تغيير عنوان النموذج وزر الحفظ
    form.querySelector('h2').textContent = 'تعديل بيانات العميل';
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.textContent = 'حفظ التعديلات';

    // تعديل وظيفة الحفظ
    const customerForm = document.getElementById('customerForm');
    customerForm.onsubmit = function(event) {
        event.preventDefault();
        
        const name = document.getElementById('customerName').value;
        const phone = document.getElementById('customerPhone').value;
        
        // التحقق من صحة البيانات
        if (!validateName(name)) {
            showNotification('خطأ: يجب أن يكون اسم العميل حرفين على الأقل', true);
            return;
        }
        
        if (!validatePhone(phone)) {
            showNotification('خطأ: رقم الهاتف غير صحيح', true);
            return;
        }
        
        // التحقق من عدم تكرار الاسم ورقم الهاتف
        const existingCustomerByName = customers.find(c => c.id !== id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (existingCustomerByName) {
            showNotification(`خطأ: يوجد عميل بنفس الاسم "${name}"`, true);
            return;
        }

        const existingCustomerByPhone = customers.find(c => c.id !== id && c.phone === phone);
        if (existingCustomerByPhone) {
            showNotification(`خطأ: رقم الهاتف ${phone} مستخدم بالفعل للعميل "${existingCustomerByPhone.name}"`, true);
            return;
        }

        // تحديث بيانات العميل
        customer.name = name;
        customer.phone = phone;
        customer.balance = parseFloat(document.getElementById('initialBalance').value) || 0;
        customer.accountType = document.getElementById('accountType').value;
        customer.address = document.getElementById('customerAddress').value;

        // تحديث التخزين المحلي
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // تحديث صف العميل في الجدول
        const row = document.querySelector(`#customersTableBody tr[data-id="${id}"]`);
        if (row) {
            row.innerHTML = `
                <td>${customer.id}</td>
                <td onclick="showDropdownMenu(event, ${customer.id})" style="cursor: pointer">${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.balance.toFixed(2)} جنيه</td>
                <td>${customer.address}</td>
                <td>
                    <div class="actions">
                        <button class="send-btn" onclick="sendToCustomer(${customer.id})">إرسال</button>
                        <button class="receive-btn" onclick="receiveFromCustomer(${customer.id})">استلام</button>
                        <button class="edit-btn" onclick="editCustomer(${customer.id})">تعديل</button>
                        <button class="delete-btn" onclick="showConfirmationModal(${customer.id})">حذف</button>
                    </div>
                </td>
            `;
        }
        
        // إخفاء النموذج وعرض رسالة نجاح
        hideAddCustomerForm();
        showNotification('تم تحديث بيانات العميل بنجاح');
        
        // إعادة تعيين النموذج لحالته الأصلية
        form.querySelector('h2').textContent = 'إضافة عميل جديد';
        submitBtn.textContent = 'إضافة العميل';
        customerForm.onsubmit = addNewCustomer;
    };
}

// دالة لإظهار القائمة المنبثقة
function showDropdownMenu(event, customerId) {
    event.stopPropagation();
    
    // تحديد العميل المحدد
    selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) return;
    
    const dropdown = document.getElementById('customerDropdown');
    dropdown.style.display = 'block';
    
    // تحديد موقع القائمة المنبثقة
    const rect = event.target.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', hideDropdownMenu);
}

// دالة لإخفاء القائمة المنبثقة
function hideDropdownMenu() {
    const dropdown = document.getElementById('customerDropdown');
    dropdown.style.display = 'none';
    document.removeEventListener('click', hideDropdownMenu);
}

// دالة لعرض معلومات العميل
function showCustomerInfo() {
    if (!selectedCustomer) return;
    
    const modal = document.getElementById('customerInfoModal');
    const content = document.getElementById('customerInfoContent');
    
    content.innerHTML = `
        <div class="info-group">
            <div class="info-label">كود العميل</div>
            <div class="info-value">${selectedCustomer.id}</div>
        </div>
        <div class="info-group">
            <div class="info-label">اسم العميل</div>
            <div class="info-value">${selectedCustomer.name}</div>
        </div>
        <div class="info-group">
            <div class="info-label">رقم الهاتف</div>
            <div class="info-value">${selectedCustomer.phone}</div>
        </div>
        <div class="info-group">
            <div class="info-label">العنوان</div>
            <div class="info-value">${selectedCustomer.address}</div>
        </div>
        <div class="info-group">
            <div class="info-label">الرصيد الحالي</div>
            <div class="info-value">${selectedCustomer.balance.toFixed(2)} جنيه</div>
        </div>
    `;
    
    modal.classList.add('show');
    hideDropdownMenu();
}

// دالة لإخفاء معلومات العميل
function hideCustomerInfo() {
    const modal = document.getElementById('customerInfoModal');
    modal.classList.remove('show');
}

// دالة لعرض معاملات العميل
function showCustomerTransactions() {
    if (!selectedCustomer) return;
    
    const modal = document.getElementById('customerTransactionsModal');
    const content = document.getElementById('customerTransactionsContent');
    
    // استرجاع معاملات العميل من التخزين المحلي
    const transactions = JSON.parse(localStorage.getItem(`transactions_${selectedCustomer.id}`)) || [];
    
    content.innerHTML = transactions.length ? `
        <table class="transactions-table">
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>نوع المعاملة</th>
                    <th>المبلغ</th>
                    <th>الرصيد بعد المعاملة</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(t => `
                    <tr>
                        <td>${new Date(t.date).toLocaleDateString('ar-EG')}</td>
                        <td>
                            <span class="transaction-type ${t.type}">
                                ${t.type === 'send' ? 'إرسال' : 'استلام'}
                            </span>
                        </td>
                        <td>${t.amount.toFixed(2)} جنيه</td>
                        <td>${t.balanceAfter.toFixed(2)} جنيه</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : '<p>لا توجد معاملات لهذا العميل</p>';
    
    modal.classList.add('show');
    hideDropdownMenu();
}

// دالة لإخفاء معاملات العميل
function hideCustomerTransactions() {
    const modal = document.getElementById('customerTransactionsModal');
    modal.classList.remove('show');
}

// دالة لعرض نموذج تعديل العميل
function showEditCustomerForm() {
    if (!selectedCustomer) return;
    
    const modal = document.getElementById('editCustomerModal');
    
    // ملء النموذج ببيانات العميل الحالية
    document.getElementById('editCustomerId').value = selectedCustomer.id;
    document.getElementById('editCustomerName').value = selectedCustomer.name;
    document.getElementById('editCustomerPhone').value = selectedCustomer.phone;
    document.getElementById('editCustomerAddress').value = selectedCustomer.address;
    
    // عرض الرصيد الافتتاحي ونوع الحساب كحقول للقراءة فقط
    document.getElementById('editInitialBalance').value = selectedCustomer.initialBalance || selectedCustomer.balance;
    document.getElementById('editAccountType').value = selectedCustomer.accountType;
    
    modal.classList.add('show');
    hideDropdownMenu();
}

// دالة لإخفاء نموذج تعديل العميل
function hideEditCustomerForm() {
    const modal = document.getElementById('editCustomerModal');
    modal.classList.remove('show');
}

// دالة لتحديث بيانات العميل
function updateCustomer(event) {
    event.preventDefault();
    
    try {
        const name = document.getElementById('editCustomerName').value.trim();
        const phone = document.getElementById('editCustomerPhone').value.trim();
        const address = document.getElementById('editCustomerAddress').value.trim();
        
        if (!validateName(name)) {
            throw new Error('يجب أن يكون اسم العميل حرفين على الأقل');
        }
        
        if (!validatePhone(phone)) {
            throw new Error('رقم الهاتف غير صحيح');
        }
        
        // تحديث بيانات العميل
        selectedCustomer.name = name;
        selectedCustomer.phone = phone;
        selectedCustomer.address = address;
        
        // تحديث التخزين المحلي
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // تحديث عرض العميل في الجدول
        const row = document.querySelector(`tr[data-id="${selectedCustomer.id}"]`);
        if (row) {
            row.children[1].textContent = name;
            row.children[2].textContent = phone;
            row.children[4].textContent = address;
        }
        
        // إخفاء النموذج وعرض رسالة نجاح
        hideEditCustomerForm();
        showNotification('تم تحديث بيانات العميل بنجاح');
        
    } catch (error) {
        showNotification(error.message, true);
    }
}

// تحميل العملاء عند تحميل الصفحة
window.addEventListener('load', function() {
    // عرض العملاء بترتيب عكسي (الأحدث أولاً)
    customers.slice().reverse().forEach(customer => addCustomerToTable(customer));
    
    // التحقق من حالة القائمة الجانبية
    const iframe = document.querySelector('iframe');
    iframe.onload = function() {
        const sidebarState = iframe.contentWindow.document.querySelector('.sidebar').classList.contains('collapsed');
        document.body.classList.toggle('sidebar-collapsed', sidebarState);
    };
});

// الاستماع لرسائل من القائمة الجانبية
window.addEventListener('message', function(event) {
    if (event.data === 'toggleSidebar') {
        document.body.classList.toggle('sidebar-collapsed');
    }
});
