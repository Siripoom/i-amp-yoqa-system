import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Plus, Eye, Download, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category: '',
    status: '',
    search: '',
    vendor: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0,
    per_page: 10
  });
  const [summary, setSummary] = useState({
    total_amount: 0,
    transaction_count: 0,
    formatted_total: '฿0.00'
  });

  const expenseCategories = [
    { value: 'rent', label: 'ค่าเช่า' },
    { value: 'salary', label: 'เงินเดือน' },
    { value: 'equipment', label: 'อุปกรณ์' },
    { value: 'utilities', label: 'ค่าสาธารณูปโภค' },
    { value: 'marketing', label: 'การตลาด' },
    { value: 'supplies', label: 'วัสดุสิ้นเปลือง' },
    { value: 'maintenance', label: 'ค่าบำรุงรักษา' },
    { value: 'training', label: 'ค่าฝึกอบรม' },
    { value: 'insurance', label: 'ค่าประกัน' },
    { value: 'transportation', label: 'ค่าเดินทาง' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  const statusOptions = [
    { value: 'approved', label: 'อนุมัติแล้ว' },
    { value: 'pending', label: 'รอการอนุมัติ' },
    { value: 'rejected', label: 'ปฏิเสธ' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'เงินสด' },
    { value: 'transfer', label: 'โอนเงิน' },
    { value: 'credit_card', label: 'บัตรเครดิต' },
    { value: 'check', label: 'เช็ค' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: 'other',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    receipt_number: '',
    notes: '',
    payment_method: 'transfer',
    is_tax_deductible: false,
    vat_amount: '',
    is_recurring: false,
    recurring_months: '1'
  });

  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      await fetchExpenses();
      await fetchSummary();
    };
    fetchData();
  }, [filters, pagination.current_page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current_page.toString(),
        limit: pagination.per_page.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/expenses?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.data.expenses);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      );

      const response = await fetch(`/api/expenses/total?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Add expense data
      Object.entries(newExpense).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add receipt file if selected
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetNewExpenseForm();
        fetchExpenses();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const resetNewExpenseForm = () => {
    setNewExpense({
      amount: '',
      description: '',
      category: 'other',
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      receipt_number: '',
      notes: '',
      payment_method: 'transfer',
      is_tax_deductible: false,
      vat_amount: '',
      is_recurring: false,
      recurring_months: '1'
    });
    setReceiptFile(null);
  };

  const handleApproveExpense = async (expenseId) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchExpenses();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };

  const handleRejectExpense = async (expenseId, reason) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        fetchExpenses();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error rejecting expense:', error);
    }
  };

  const downloadReceipt = async (expenseId) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${expenseId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', label: 'อนุมัติแล้ว' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'รอการอนุมัติ' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'ปฏิเสธ' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category) => {
    const categoryConfig = expenseCategories.find(cat => cat.value === category);
    return categoryConfig ? categoryConfig.label : category;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">จัดการรายจ่าย</h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรายจ่าย
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มรายจ่ายใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">จำนวนเงิน *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">หมวดหมู่ *</label>
                  <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">รายละเอียด *</label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่ *</label>
                  <Input
                    type="date"
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">ผู้จำหน่าย/ร้านค้า</label>
                  <Input
                    value={newExpense.vendor}
                    onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">หมายเลขใบเสร็จ</label>
                  <Input
                    value={newExpense.receipt_number}
                    onChange={(e) => setNewExpense({ ...newExpense, receipt_number: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">วิธีการชำระเงิน</label>
                  <Select value={newExpense.payment_method} onValueChange={(value) => setNewExpense({ ...newExpense, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_tax_deductible"
                    checked={newExpense.is_tax_deductible}
                    onChange={(e) => setNewExpense({ ...newExpense, is_tax_deductible: e.target.checked })}
                  />
                  <label htmlFor="is_tax_deductible" className="text-sm font-medium">หักลดหย่อนภาษีได้</label>
                </div>
                
                {newExpense.is_tax_deductible && (
                  <div>
                    <label className="block text-sm font-medium mb-1">ภาษีมูลค่าเพิ่ม</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpense.vat_amount}
                      onChange={(e) => setNewExpense({ ...newExpense, vat_amount: e.target.value })}
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={newExpense.is_recurring}
                    onChange={(e) => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
                  />
                  <label htmlFor="is_recurring" className="text-sm font-medium">แบ่งงวดการจ่าย</label>
                </div>
                
                {newExpense.is_recurring && (
                  <div>
                    <label className="block text-sm font-medium mb-1">จำนวนงวด</label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={newExpense.recurring_months}
                      onChange={(e) => setNewExpense({ ...newExpense, recurring_months: e.target.value })}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">ใบเสร็จ/หลักฐาน</label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                />
                <p className="text-xs text-gray-500 mt-1">รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 5MB</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
                <Input
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">บันทึก</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>ยกเลิก</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">รายจ่ายรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.formatted_total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">จำนวนธุรกรรม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transaction_count}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ค่าเฉลี่ยต่อธุรกรรม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.transaction_count > 0 ? formatCurrency(summary.total_amount / summary.transaction_count) : '฿0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ทั้งหมด</SelectItem>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">สถานะ</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ทั้งหมด</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">ผู้จำหน่าย</label>
              <Input
                placeholder="ชื่อผู้จำหน่าย..."
                value={filters.vendor}
                onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">ค้นหา</label>
              <Input
                placeholder="ค้นหา..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการรายจ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">วันที่</th>
                      <th className="text-left p-2">รายละเอียด</th>
                      <th className="text-left p-2">หมวดหมู่</th>
                      <th className="text-left p-2">ผู้จำหน่าย</th>
                      <th className="text-right p-2">จำนวนเงิน</th>
                      <th className="text-left p-2">สถานะ</th>
                      <th className="text-center p-2">ใบเสร็จ</th>
                      <th className="text-center p-2">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: th })}
                        </td>
                        <td className="p-2">{expense.description}</td>
                        <td className="p-2">{getCategoryLabel(expense.category)}</td>
                        <td className="p-2">{expense.vendor || '-'}</td>
                        <td className="p-2 text-right font-semibold text-red-600">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="p-2">{getStatusBadge(expense.status)}</td>
                        <td className="p-2 text-center">
                          {expense.receipt_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReceipt(expense._id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {expense.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600"
                                  onClick={() => handleApproveExpense(expense._id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleRejectExpense(expense._id, 'ปฏิเสธโดยผู้ดูแลระบบ')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  แสดง {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total_records)} จาก {pagination.total_records} รายการ
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.current_page === 1}
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                  >
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.current_page === pagination.total_pages}
                    onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รายละเอียดรายจ่าย</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">วันที่</label>
                <p>{format(new Date(selectedExpense.expense_date), 'dd/MM/yyyy HH:mm', { locale: th })}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">รายละเอียด</label>
                <p>{selectedExpense.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">หมวดหมู่</label>
                <p>{getCategoryLabel(selectedExpense.category)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">จำนวนเงิน</label>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(selectedExpense.amount)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">สถานะ</label>
                <p>{getStatusBadge(selectedExpense.status)}</p>
              </div>
              
              {selectedExpense.vendor && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">ผู้จำหน่าย</label>
                  <p>{selectedExpense.vendor}</p>
                </div>
              )}
              
              {selectedExpense.receipt_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">หมายเลขใบเสร็จ</label>
                  <p>{selectedExpense.receipt_number}</p>
                </div>
              )}
              
              {selectedExpense.vat_amount > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">ภาษีมูลค่าเพิ่ม</label>
                  <p>{formatCurrency(selectedExpense.vat_amount)}</p>
                </div>
              )}
              
              {selectedExpense.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">หมายเหตุ</label>
                  <p>{selectedExpense.notes}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-600">ผู้สร้าง</label>
                <p>{selectedExpense.created_by?.name || 'ระบบ'}</p>
              </div>
              
              {selectedExpense.approved_by && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">ผู้อนุมัติ</label>
                  <p>{selectedExpense.approved_by.name}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManagement;
