import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import User from '@/models/User';
import Service from '@/models/Service';
import { requireAdmin } from '@/lib/auth';

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateRange(searchParams) {
  const now = new Date();
  const today = startOfDay(now);
  const range = searchParams.get('range') || 'today';

  if (range === 'custom') {
    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const startDate = startParam ? startOfDay(new Date(startParam)) : today;
    const endDate = endParam ? addDays(startOfDay(new Date(endParam)), 1) : addDays(today, 1);
    return { range, startDate, endDate };
  }

  if (range === 'yesterday') {
    const startDate = addDays(today, -1);
    return { range, startDate, endDate: today };
  }

  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisWeekStart = addDays(today, mondayOffset);

  if (range === 'thisWeek') {
    return { range, startDate: thisWeekStart, endDate: addDays(thisWeekStart, 7) };
  }

  if (range === 'lastWeek') {
    const startDate = addDays(thisWeekStart, -7);
    return { range, startDate, endDate: thisWeekStart };
  }

  if (range === 'thisMonth') {
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    return { range, startDate, endDate: new Date(today.getFullYear(), today.getMonth() + 1, 1) };
  }

  if (range === 'lastMonth') {
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { range, startDate, endDate: new Date(today.getFullYear(), today.getMonth(), 1) };
  }

  return { range: 'today', startDate: today, endDate: addDays(today, 1) };
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const { range, startDate, endDate } = getDateRange(searchParams);
    const periodMatch = { bookingDate: { $gte: startDate, $lt: endDate } };

    const [
      totalBookings,
      activeServices,
      statusStats,
      revenueResult,
      staffStats,
      serviceStats,
      customerStats,
      timeStats,
      invoiceStats,
    ] = await Promise.all([
      Booking.countDocuments(periodMatch),
      Service.countDocuments({ isActive: true }),
      Booking.aggregate([
        { $match: periodMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { ...periodMatch, status: 'completed' } },
        {
          $lookup: {
            from: 'estimatedbills',
            localField: 'estimatedBillId',
            foreignField: '_id',
            as: 'bill',
          },
        },
        { $unwind: '$bill' },
        { $group: { _id: null, totalRevenue: { $sum: '$bill.totalPrice' }, invoiceCount: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { ...periodMatch, status: 'completed', staffId: { $ne: null } } },
        {
          $lookup: {
            from: 'estimatedbills',
            localField: 'estimatedBillId',
            foreignField: '_id',
            as: 'bill',
          },
        },
        { $unwind: '$bill' },
        {
          $lookup: {
            from: 'users',
            localField: 'staffId',
            foreignField: '_id',
            as: 'staff',
          },
        },
        { $unwind: '$staff' },
        {
          $group: {
            _id: '$staffId',
            staffName: { $first: '$staff.fullName' },
            email: { $first: '$staff.email' },
            revenue: { $sum: '$bill.totalPrice' },
            completedBookings: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1, completedBookings: -1 } },
      ]),
      Booking.aggregate([
        { $match: { ...periodMatch, status: { $ne: 'cancelled' } } },
        { $unwind: '$services' },
        {
          $lookup: {
            from: 'services',
            localField: 'services',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: '$service' },
        {
          $group: {
            _id: '$service._id',
            serviceName: { $first: '$service.serviceName' },
            serviceType: { $first: '$service.serviceType' },
            price: { $first: '$service.price' },
            bookingCount: { $sum: 1 },
            estimatedRevenue: { $sum: '$service.price' },
          },
        },
        { $sort: { bookingCount: -1, estimatedRevenue: -1 } },
      ]),
      Booking.aggregate([
        { $match: { ...periodMatch, status: 'completed' } },
        {
          $lookup: {
            from: 'estimatedbills',
            localField: 'estimatedBillId',
            foreignField: '_id',
            as: 'bill',
          },
        },
        { $unwind: '$bill' },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: '$customer' },
        {
          $group: {
            _id: '$userId',
            customerName: { $first: '$customer.fullName' },
            email: { $first: '$customer.email' },
            phone: { $first: '$customer.phone' },
            memberType: { $first: '$customer.memberType' },
            revenue: { $sum: '$bill.totalPrice' },
            invoiceCount: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1, invoiceCount: -1 } },
      ]),
      Booking.aggregate([
        { $match: { ...periodMatch, status: 'completed' } },
        {
          $lookup: {
            from: 'estimatedbills',
            localField: 'estimatedBillId',
            foreignField: '_id',
            as: 'bill',
          },
        },
        { $unwind: '$bill' },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
            revenue: { $sum: '$bill.totalPrice' },
            invoiceCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { ...periodMatch, status: 'completed' } },
        {
          $lookup: {
            from: 'estimatedbills',
            localField: 'estimatedBillId',
            foreignField: '_id',
            as: 'bill',
          },
        },
        { $unwind: '$bill' },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'customer',
          },
        },
        { $unwind: '$customer' },
        {
          $lookup: {
            from: 'users',
            localField: 'staffId',
            foreignField: '_id',
            as: 'staff',
          },
        },
        { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'services',
            localField: 'services',
            foreignField: '_id',
            as: 'serviceData',
          },
        },
        {
          $project: {
            bookingId: '$_id',
            bookingDate: 1,
            startTime: 1,
            customerName: '$customer.fullName',
            staffName: '$staff.fullName',
            services: '$serviceData.serviceName',
            totalPrice: '$bill.totalPrice',
            discountAmount: '$bill.discountAmount',
          },
        },
        { $sort: { totalPrice: -1, bookingDate: -1 } },
      ]),
    ]);

    const statusOrder = ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'];
    const statusSummary = statusOrder.map(status => ({
      status,
      count: statusStats.find(item => item._id === status)?.count || 0,
    }));
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalInvoices = revenueResult[0]?.invoiceCount || 0;
    const totalCustomers = customerStats.length;

    return NextResponse.json({
      range,
      startDate: toISODate(startDate),
      endDate: toISODate(addDays(endDate, -1)),
      summary: {
        totalBookings,
        totalRevenue,
        totalCustomers,
        totalServices: serviceStats.length,
        activeServices,
        totalInvoices,
      },
      statusStats: statusSummary,
      staffStats,
      serviceStats,
      customerStats,
      timeStats: timeStats.map(item => ({
        date: item._id,
        revenue: item.revenue,
        invoiceCount: item.invoiceCount,
      })),
      invoiceStats,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ message: 'Loi server' }, { status: 500 });
  }
}
