import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import { buildPayrollRows, normalizePayrollPeriod } from '@/lib/payroll';
import { buildExcelXml, excelResponse, formatCurrency } from '@/lib/excelExport';

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const { month, year } = normalizePayrollPeriod(searchParams);
    const payroll = await buildPayrollRows({ month, year });

    const rows = payroll.map((item, index) => [
      index + 1,
      item.staffName,
      item.email,
      item.completedBookings,
      formatCurrency(item.revenue),
      formatCurrency(item.baseSalary),
      item.commissionRate,
      formatCurrency(item.commissionAmount),
      formatCurrency(item.bonus),
      formatCurrency(item.penalty),
      formatCurrency(item.totalSalary),
      item.status,
      item.note,
    ]);

    const xml = buildExcelXml({
      title: `Bang luong nhan vien ${month}-${year}`,
      sheets: [{
        name: 'Bang luong',
        title: `Bang luong nhan vien ${month}/${year}`,
        subtitle: `Tong nhan vien: ${payroll.length} | Tong luong: ${payroll.reduce((sum, item) => sum + item.totalSalary, 0).toLocaleString('vi-VN')}d`,
        headers: ['#', 'Nhan vien', 'Email', 'Don hoan thanh', 'Doanh thu', 'Luong co ban', 'Hoa hong %', 'Tien hoa hong', 'Thuong', 'Phat', 'Tong luong', 'Trang thai', 'Ghi chu'],
        rows,
      }],
    });

    return excelResponse(xml, `bang-luong-${month}-${year}.xls`);
  } catch (error) {
    console.error('Admin payroll export error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
