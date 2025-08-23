import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const IncomeManagement = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    income_type: '',
    status: '',
    search: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
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

  const incomeTypes = [
    { value: 'package', label: 'แพ็คเกจ' },
    { value: 'product', label: 'ผลิตภัณฑ์' },
    { value: 'goods', label: 'สินค้า' },
    { value: 'session', label: 'เซสชัน' },
    { value: 'manual', label: 'บันทึกด้วยตนเอง' }
  ];

  const statusOptions = [
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'cancelled', label: 'ยกเลิก' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'เงินสด' },
    { value: 'transfer', label: 'โอนเงิน' },
    { value: 'qr_code', label: 'QR Code' },
    { value: 'credit_card', label: 'บัตรเครดิต' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  const [newIncome, setNewIncome] = useState({
    amount: '',
    description: '',
    income_type: 'manual',
    income_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    reference_number: '',
    notes: '',
    category: 'manual'
  });

  useEffect(() => {
    const fetchData = async () => {
      await fetchIncomes();
      await fetchSummary();
    };
    fetchData();
  }, [filters, pagination.current_page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current_page.toString(),
        limit: pagination.per_page.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });

      const response = await fetch(`/api/income?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIncomes(data.data.incomes);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      );

      const response = await fetch(`/api/income/total?${queryParams}`, {
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

  const handleCreateIncome = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/income/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newIncome)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewIncome({
          amount: '',
          description: '',
          income_type: 'manual',
          income_date: new Date().toISOString().split('T')[0],
          payment_method: 'transfer',
          reference_number: '',
          notes: '',
          category: 'manual'
        });
        fetchIncomes();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error creating income:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { color: 'bg-green-100 text-green-800', label: 'ยืนยันแล้ว' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'รอดำเนินการ' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'ยกเลิก' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getIncomeTypeLabel = (type) => {
    const typeConfig = {
      package: 'แพ็คเกจ',
      product: 'ผลิตภัณฑ์',
      goods: 'สินค้า',
      session: 'เซสชัน',
      manual: 'บันทึกด้วยตนเอง'
    };
    return typeConfig[type] || type;
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
        <h1 className="text-3xl font-bold">จัดการรายรับ</h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรายรับ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มรายรับใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateIncome} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">จำนวนเงิน</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                <Input
                  value={newIncome.description}
                  onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">ประเภทรายรับ</label>
                <Select value={newIncome.income_type} onValueChange={(value) => setNewIncome({ ...newIncome, income_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">วันที่</label>
                <Input
                  type="date"
                  value={newIncome.income_date}
                  onChange={(e) => setNewIncome({ ...newIncome, income_date: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">วิธีการชำระเงิน</label>
                <Select value={newIncome.payment_method} onValueChange={(value) => setNewIncome({ ...newIncome, payment_method: value })}>
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
              
              <div>
                <label className="block text-sm font-medium mb-1">หมายเลขอ้างอิง</label>
                <Input
                  value={newIncome.reference_number}
                  onChange={(e) => setNewIncome({ ...newIncome, reference_number: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
                <Input
                  value={newIncome.notes}
                  onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
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
            <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.formatted_total}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium mb-1">ประเภทรายรับ</label>
              <Select value={filters.income_type} onValueChange={(value) => setFilters({ ...filters, income_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ทั้งหมด</SelectItem>
                  {incomeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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

      {/* Income Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการรายรับ</CardTitle>
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
                      <th className="text-left p-2">ประเภท</th>
                      <th className="text-right p-2">จำนวนเงิน</th>
                      <th className="text-left p-2">สถานะ</th>
                      <th className="text-left p-2">การชำระเงิน</th>
                      <th className="text-center p-2">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map((income) => (
                      <tr key={income._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {format(new Date(income.income_date), 'dd/MM/yyyy', { locale: th })}
                        </td>
                        <td className="p-2">{income.description}</td>
                        <td className="p-2">{getIncomeTypeLabel(income.income_type)}</td>
                        <td className="p-2 text-right font-semibold text-green-600">
                          {formatCurrency(income.amount)}
                        </td>
                        <td className="p-2">{getStatusBadge(income.status)}</td>
                        <td className="p-2">
                          {paymentMethods.find(m => m.value === income.payment_method)?.label || income.payment_method}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedIncome(income);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
            <DialogTitle>รายละเอียดรายรับ</DialogTitle>
          </DialogHeader>
          {selectedIncome && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">วันที่</label>
                <p>{format(new Date(selectedIncome.income_date), 'dd/MM/yyyy HH:mm', { locale: th })}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">รายละเอียด</label>
                <p>{selectedIncome.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">ประเภทรายรับ</label>
                <p>{getIncomeTypeLabel(selectedIncome.income_type)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">จำนวนเงิน</label>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedIncome.amount)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">สถานะ</label>
                <p>{getStatusBadge(selectedIncome.status)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">วิธีการชำระเงิน</label>
                <p>{paymentMethods.find(m => m.value === selectedIncome.payment_method)?.label || selectedIncome.payment_method}</p>
              </div>
              
              {selectedIncome.reference_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">หมายเลขอ้างอิง</label>
                  <p>{selectedIncome.reference_number}</p>
                </div>
              )}
              
              {selectedIncome.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">หมายเหตุ</label>
                  <p>{selectedIncome.notes}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-600">ผู้สร้าง</label>
                <p>{selectedIncome.created_by?.name || 'ระบบ'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomeManagement;
