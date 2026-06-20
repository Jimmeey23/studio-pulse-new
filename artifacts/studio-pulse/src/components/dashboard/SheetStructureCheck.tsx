import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Database,
  Play,
  Loader2,
  ExternalLink,
  Info,
  Hash,
  Text,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchGoogleSheet } from '@/utils/googleAuth';

// ─── Schema definitions ───────────────────────────────────────────────────────

type MappingType = 'index' | 'header';

interface IndexColumn {
  index: number;
  fieldName: string;
  expectedLabel?: string;
}

interface HeaderColumn {
  header: string;
  aliases?: string[];
  fieldName: string;
  required?: boolean;
}

interface SheetDef {
  id: string;
  label: string;
  tabName: string;
  spreadsheetId: string;
  mappingType: MappingType;
  columns?: IndexColumn[];
  headers?: HeaderColumn[];
  note?: string;
}

const SHEETS: SheetDef[] = [
  {
    id: 'checkins',
    label: 'Checkins',
    tabName: 'Checkins',
    spreadsheetId: '1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q',
    mappingType: 'index',
    note: 'useCheckinsData — column ORDER is critical, headers are ignored.',
    columns: [
      { index: 0,  fieldName: 'memberId',           expectedLabel: 'Member ID' },
      { index: 1,  fieldName: 'firstName',           expectedLabel: 'First Name' },
      { index: 2,  fieldName: 'lastName',            expectedLabel: 'Last Name' },
      { index: 3,  fieldName: 'email',               expectedLabel: 'Email' },
      { index: 4,  fieldName: 'orderAt',             expectedLabel: 'Order At' },
      { index: 5,  fieldName: 'paid',                expectedLabel: 'Paid' },
      { index: 6,  fieldName: 'paymentMethodName',   expectedLabel: 'Payment Method Name' },
      { index: 7,  fieldName: 'checkedIn',           expectedLabel: 'Checked In' },
      { index: 8,  fieldName: 'complementary',       expectedLabel: 'Complementary' },
      { index: 9,  fieldName: 'isLateCancelled',     expectedLabel: 'Is Late Cancelled' },
      { index: 10, fieldName: 'sessionId',           expectedLabel: 'Session ID' },
      { index: 11, fieldName: 'sessionName',         expectedLabel: 'Session Name' },
      { index: 12, fieldName: 'capacity',            expectedLabel: 'Capacity' },
      { index: 13, fieldName: 'location',            expectedLabel: 'Location' },
      { index: 14, fieldName: 'dateIST',             expectedLabel: 'Date (IST)' },
      { index: 15, fieldName: 'dayOfWeek',           expectedLabel: 'Day of Week' },
      { index: 16, fieldName: 'time',                expectedLabel: 'Time' },
      { index: 17, fieldName: 'durationMinutes',     expectedLabel: 'Duration (Minutes)' },
      { index: 18, fieldName: 'teacherName',         expectedLabel: 'Teacher Name' },
      { index: 19, fieldName: 'cleanedProduct',      expectedLabel: 'Cleaned Product' },
      { index: 20, fieldName: 'cleanedCategory',     expectedLabel: 'Cleaned Category' },
      { index: 21, fieldName: 'cleanedClass',        expectedLabel: 'Cleaned Class' },
      { index: 22, fieldName: 'hostId',              expectedLabel: 'Host ID' },
      { index: 23, fieldName: 'month',               expectedLabel: 'Month' },
      { index: 24, fieldName: 'year',                expectedLabel: 'Year' },
      { index: 25, fieldName: 'classNo',             expectedLabel: 'Class No' },
      { index: 26, fieldName: 'isNew',               expectedLabel: 'Is New' },
    ],
  },
  {
    id: 'sessions',
    label: 'Sessions',
    tabName: 'Sessions',
    spreadsheetId: '1a7XKv2WCog7o8nYuV8YcFdqtfPYJNRO6DelJ6Hn_z6Q',
    mappingType: 'index',
    note: 'useSessionsData — column ORDER is critical, headers are ignored.',
    columns: [
      { index: 0,  fieldName: 'trainerId',                expectedLabel: 'Trainer ID' },
      { index: 1,  fieldName: 'trainerFirstName',         expectedLabel: 'Trainer First Name' },
      { index: 2,  fieldName: 'trainerLastName',          expectedLabel: 'Trainer Last Name' },
      { index: 3,  fieldName: 'trainerName',              expectedLabel: 'Trainer Name' },
      { index: 4,  fieldName: 'sessionId',                expectedLabel: 'Session ID' },
      { index: 5,  fieldName: 'sessionName',              expectedLabel: 'Session Name' },
      { index: 6,  fieldName: 'capacity',                 expectedLabel: 'Capacity' },
      { index: 7,  fieldName: 'checkedInCount',           expectedLabel: 'Checked In Count' },
      { index: 8,  fieldName: 'lateCancelledCount',       expectedLabel: 'Late Cancelled Count' },
      { index: 9,  fieldName: 'bookedCount',              expectedLabel: 'Booked Count' },
      { index: 10, fieldName: 'complimentaryCount',       expectedLabel: 'Complimentary Count' },
      { index: 11, fieldName: 'location',                 expectedLabel: 'Location' },
      { index: 12, fieldName: 'date',                     expectedLabel: 'Date' },
      { index: 13, fieldName: 'dayOfWeek',                expectedLabel: 'Day of Week' },
      { index: 14, fieldName: 'time',                     expectedLabel: 'Time' },
      { index: 15, fieldName: 'totalPaid / revenue',      expectedLabel: 'Total Paid' },
      { index: 16, fieldName: 'nonPaidCount',             expectedLabel: 'Non Paid Count' },
      { index: 17, fieldName: 'uniqueId1 / uniqueId',     expectedLabel: 'Unique ID 1' },
      { index: 18, fieldName: 'uniqueId2',                expectedLabel: 'Unique ID 2' },
      { index: 19, fieldName: 'checkedInsWithMemberships',expectedLabel: 'Checked Ins With Memberships' },
      { index: 20, fieldName: 'checkedInsWithPackages',   expectedLabel: 'Checked Ins With Packages' },
      { index: 21, fieldName: 'checkedInsWithIntroOffers',expectedLabel: 'Checked Ins With Intro Offers' },
      { index: 22, fieldName: 'checkedInsWithSingleClasses', expectedLabel: 'Checked Ins With Single Classes' },
      { index: 23, fieldName: 'classType',                expectedLabel: 'Class Type' },
      { index: 24, fieldName: 'cleanedClass',             expectedLabel: 'Cleaned Class' },
      { index: 25, fieldName: 'classes',                  expectedLabel: 'Classes' },
    ],
  },
  {
    id: 'recurring',
    label: 'Recurring',
    tabName: 'Recurring',
    spreadsheetId: '1sDPAX6OmGb48kL1pm0mhin2C9KD-Jykq8skJjNuQUNg',
    mappingType: 'index',
    note: 'useRecurringSessionsData — column ORDER is critical, headers are ignored.',
    columns: [
      { index: 0,  fieldName: 'trainerId',         expectedLabel: 'Trainer ID' },
      { index: 1,  fieldName: 'firstName',         expectedLabel: 'First Name' },
      { index: 2,  fieldName: 'lastName',          expectedLabel: 'Last Name' },
      { index: 3,  fieldName: 'trainer',           expectedLabel: 'Trainer' },
      { index: 4,  fieldName: 'sessionId',         expectedLabel: 'Session ID' },
      { index: 5,  fieldName: 'sessionName',       expectedLabel: 'Session Name' },
      { index: 6,  fieldName: 'capacity',          expectedLabel: 'Capacity' },
      { index: 7,  fieldName: 'checkedIn',         expectedLabel: 'Checked In' },
      { index: 8,  fieldName: 'lateCancelled',     expectedLabel: 'Late Cancelled' },
      { index: 9,  fieldName: 'booked',            expectedLabel: 'Booked' },
      { index: 10, fieldName: 'complimentary',     expectedLabel: 'Complimentary' },
      { index: 11, fieldName: 'location',          expectedLabel: 'Location' },
      { index: 12, fieldName: 'date',              expectedLabel: 'Date' },
      { index: 13, fieldName: 'day',               expectedLabel: 'Day' },
      { index: 14, fieldName: 'time',              expectedLabel: 'Time' },
      { index: 15, fieldName: 'revenue',           expectedLabel: 'Revenue' },
      { index: 16, fieldName: 'nonPaid',           expectedLabel: 'Non Paid' },
      { index: 17, fieldName: 'uniqueId1',         expectedLabel: 'Unique ID 1' },
      { index: 18, fieldName: 'uniqueId2',         expectedLabel: 'Unique ID 2' },
      { index: 19, fieldName: 'memberships',       expectedLabel: 'Memberships' },
      { index: 20, fieldName: 'packages',          expectedLabel: 'Packages' },
      { index: 21, fieldName: 'introOffers',       expectedLabel: 'Intro Offers' },
      { index: 22, fieldName: 'singleClasses',     expectedLabel: 'Single Classes' },
      { index: 23, fieldName: 'type',              expectedLabel: 'Type' },
      { index: 24, fieldName: 'class',             expectedLabel: 'Class' },
      { index: 25, fieldName: 'classes',           expectedLabel: 'Classes' },
      { index: 26, fieldName: 'totalSessions',     expectedLabel: 'Total Sessions' },
      { index: 27, fieldName: 'emptySessions',     expectedLabel: 'Empty Sessions' },
      { index: 28, fieldName: 'nonEmptySessions',  expectedLabel: 'Non Empty Sessions' },
      { index: 29, fieldName: 'totalCheckedInSum', expectedLabel: 'Total Checked In Sum' },
      { index: 30, fieldName: 'totalCapacitySum',  expectedLabel: 'Total Capacity Sum' },
      { index: 31, fieldName: 'totalRevenueSum',   expectedLabel: 'Total Revenue Sum' },
      { index: 32, fieldName: 'classAvgInclEmpty', expectedLabel: 'Class Avg Incl Empty' },
      { index: 33, fieldName: 'classAvgExclEmpty', expectedLabel: 'Class Avg Excl Empty' },
      { index: 34, fieldName: 'fillRate',          expectedLabel: 'Fill Rate' },
      { index: 35, fieldName: 'weightedAverage',   expectedLabel: 'Weighted Average' },
      { index: 36, fieldName: 'top5Trainers',      expectedLabel: 'Top 5 Trainers' },
    ],
  },
  {
    id: 'teacher-recurring',
    label: 'Teacher Recurring',
    tabName: 'Teacher Recurring',
    spreadsheetId: '1sDPAX6OmGb48kL1pm0mhin2C9KD-Jykq8skJjNuQUNg',
    mappingType: 'index',
    note: 'useRecurringSessionsData — same column structure as Recurring tab.',
    columns: [
      { index: 0,  fieldName: 'trainerId',         expectedLabel: 'Trainer ID' },
      { index: 1,  fieldName: 'firstName',         expectedLabel: 'First Name' },
      { index: 2,  fieldName: 'lastName',          expectedLabel: 'Last Name' },
      { index: 3,  fieldName: 'trainer',           expectedLabel: 'Trainer' },
      { index: 4,  fieldName: 'sessionId',         expectedLabel: 'Session ID' },
      { index: 5,  fieldName: 'sessionName',       expectedLabel: 'Session Name' },
      { index: 6,  fieldName: 'capacity',          expectedLabel: 'Capacity' },
      { index: 7,  fieldName: 'checkedIn',         expectedLabel: 'Checked In' },
      { index: 8,  fieldName: 'lateCancelled',     expectedLabel: 'Late Cancelled' },
      { index: 9,  fieldName: 'booked',            expectedLabel: 'Booked' },
      { index: 10, fieldName: 'complimentary',     expectedLabel: 'Complimentary' },
      { index: 11, fieldName: 'location',          expectedLabel: 'Location' },
      { index: 12, fieldName: 'date',              expectedLabel: 'Date' },
      { index: 13, fieldName: 'day',               expectedLabel: 'Day' },
      { index: 14, fieldName: 'time',              expectedLabel: 'Time' },
      { index: 15, fieldName: 'revenue',           expectedLabel: 'Revenue' },
      { index: 16, fieldName: 'nonPaid',           expectedLabel: 'Non Paid' },
      { index: 17, fieldName: 'uniqueId1',         expectedLabel: 'Unique ID 1' },
      { index: 18, fieldName: 'uniqueId2',         expectedLabel: 'Unique ID 2' },
      { index: 19, fieldName: 'memberships',       expectedLabel: 'Memberships' },
      { index: 20, fieldName: 'packages',          expectedLabel: 'Packages' },
      { index: 21, fieldName: 'introOffers',       expectedLabel: 'Intro Offers' },
      { index: 22, fieldName: 'singleClasses',     expectedLabel: 'Single Classes' },
      { index: 23, fieldName: 'type',              expectedLabel: 'Type' },
      { index: 24, fieldName: 'class',             expectedLabel: 'Class' },
      { index: 25, fieldName: 'classes',           expectedLabel: 'Classes' },
      { index: 26, fieldName: 'totalSessions',     expectedLabel: 'Total Sessions' },
      { index: 27, fieldName: 'emptySessions',     expectedLabel: 'Empty Sessions' },
      { index: 28, fieldName: 'nonEmptySessions',  expectedLabel: 'Non Empty Sessions' },
      { index: 29, fieldName: 'totalCheckedInSum', expectedLabel: 'Total Checked In Sum' },
      { index: 30, fieldName: 'totalCapacitySum',  expectedLabel: 'Total Capacity Sum' },
      { index: 31, fieldName: 'totalRevenueSum',   expectedLabel: 'Total Revenue Sum' },
      { index: 32, fieldName: 'classAvgInclEmpty', expectedLabel: 'Class Avg Incl Empty' },
      { index: 33, fieldName: 'classAvgExclEmpty', expectedLabel: 'Class Avg Excl Empty' },
      { index: 34, fieldName: 'fillRate',          expectedLabel: 'Fill Rate' },
      { index: 35, fieldName: 'weightedAverage',   expectedLabel: 'Weighted Average' },
      { index: 36, fieldName: 'top5Trainers',      expectedLabel: 'Top 5 Trainers' },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    tabName: 'Payroll',
    spreadsheetId: '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI',
    mappingType: 'index',
    note: 'usePayrollData — column ORDER is critical, headers are ignored.',
    columns: [
      { index: 0,  fieldName: 'teacherId',          expectedLabel: 'Teacher ID' },
      { index: 1,  fieldName: 'teacherName',         expectedLabel: 'Teacher Name' },
      { index: 2,  fieldName: 'teacherEmail',        expectedLabel: 'Teacher Email' },
      { index: 3,  fieldName: 'location',            expectedLabel: 'Location' },
      { index: 4,  fieldName: 'cycleSessions',       expectedLabel: 'Cycle Sessions' },
      { index: 5,  fieldName: 'emptyCycleSessions',  expectedLabel: 'Empty Cycle Sessions' },
      { index: 6,  fieldName: 'nonEmptyCycle',       expectedLabel: 'Non Empty Cycle Sessions' },
      { index: 7,  fieldName: 'cycleCustomers',      expectedLabel: 'Cycle Customers' },
      { index: 8,  fieldName: 'cyclePaid',           expectedLabel: 'Cycle Paid' },
      { index: 9,  fieldName: 'strengthSessions',    expectedLabel: 'Strength Sessions' },
      { index: 10, fieldName: 'emptyStrength',       expectedLabel: 'Empty Strength Sessions' },
      { index: 11, fieldName: 'nonEmptyStrength',    expectedLabel: 'Non Empty Strength Sessions' },
      { index: 12, fieldName: 'strengthCustomers',   expectedLabel: 'Strength Customers' },
      { index: 13, fieldName: 'strengthPaid',        expectedLabel: 'Strength Paid' },
      { index: 14, fieldName: 'barreSessions',       expectedLabel: 'Barre Sessions' },
      { index: 15, fieldName: 'emptyBarre',          expectedLabel: 'Empty Barre Sessions' },
      { index: 16, fieldName: 'nonEmptyBarre',       expectedLabel: 'Non Empty Barre Sessions' },
      { index: 17, fieldName: 'barreCustomers',      expectedLabel: 'Barre Customers' },
      { index: 18, fieldName: 'barrePaid',           expectedLabel: 'Barre Paid' },
      { index: 19, fieldName: 'totalSessions',       expectedLabel: 'Total Sessions' },
      { index: 20, fieldName: 'totalEmptySessions',  expectedLabel: 'Total Empty Sessions' },
      { index: 21, fieldName: 'totalNonEmpty',       expectedLabel: 'Total Non Empty Sessions' },
      { index: 22, fieldName: 'totalCustomers',      expectedLabel: 'Total Customers' },
      { index: 23, fieldName: 'totalPaid',           expectedLabel: 'Total Paid' },
      { index: 24, fieldName: 'monthYear',           expectedLabel: 'Month Year' },
      { index: 25, fieldName: 'unique',              expectedLabel: 'Unique' },
      { index: 26, fieldName: 'converted',           expectedLabel: 'Converted' },
      { index: 27, fieldName: 'conversionRate',      expectedLabel: 'Conversion Rate' },
      { index: 28, fieldName: 'retained',            expectedLabel: 'Retained' },
      { index: 29, fieldName: 'retentionRate',       expectedLabel: 'Retention Rate' },
      { index: 30, fieldName: 'newMembers',          expectedLabel: 'New Members' },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    tabName: '◉ Leads',
    spreadsheetId: '1dQMNF69WnXVQdhlLvUZTig3kL97NA21k6eZ9HRu6xiQ',
    mappingType: 'index',
    note: 'useLeadsData — column ORDER is critical, headers are ignored. Tab name includes special character.',
    columns: [
      { index: 0,  fieldName: 'id',                  expectedLabel: 'ID' },
      { index: 1,  fieldName: 'fullName',             expectedLabel: 'Full Name' },
      { index: 2,  fieldName: 'phone',                expectedLabel: 'Phone' },
      { index: 3,  fieldName: 'email',                expectedLabel: 'Email' },
      { index: 4,  fieldName: 'createdAt',            expectedLabel: 'Created At' },
      { index: 5,  fieldName: 'sourceId',             expectedLabel: 'Source ID' },
      { index: 6,  fieldName: 'source',               expectedLabel: 'Source' },
      { index: 7,  fieldName: 'memberId',             expectedLabel: 'Member ID' },
      { index: 8,  fieldName: 'convertedToCustomerAt',expectedLabel: 'Converted To Customer At' },
      { index: 9,  fieldName: 'stage',                expectedLabel: 'Stage' },
      { index: 10, fieldName: 'associate',            expectedLabel: 'Associate' },
      { index: 11, fieldName: 'remarks',              expectedLabel: 'Remarks' },
      { index: 12, fieldName: 'followUp1Date',        expectedLabel: 'Follow Up 1 Date' },
      { index: 13, fieldName: 'followUpComments1',    expectedLabel: 'Follow Up Comments 1' },
      { index: 14, fieldName: 'followUp2Date',        expectedLabel: 'Follow Up 2 Date' },
      { index: 15, fieldName: 'followUpComments2',    expectedLabel: 'Follow Up Comments 2' },
      { index: 16, fieldName: 'followUp3Date',        expectedLabel: 'Follow Up 3 Date' },
      { index: 17, fieldName: 'followUpComments3',    expectedLabel: 'Follow Up Comments 3' },
      { index: 18, fieldName: 'followUp4Date',        expectedLabel: 'Follow Up 4 Date' },
      { index: 19, fieldName: 'followUpComments4',    expectedLabel: 'Follow Up Comments 4' },
      { index: 20, fieldName: 'center',               expectedLabel: 'Center' },
      { index: 21, fieldName: 'classType',            expectedLabel: 'Class Type' },
      { index: 22, fieldName: 'hostId',               expectedLabel: 'Host ID' },
      { index: 23, fieldName: 'status',               expectedLabel: 'Status' },
      { index: 24, fieldName: 'channel',              expectedLabel: 'Channel' },
      { index: 25, fieldName: 'period',               expectedLabel: 'Period' },
      { index: 26, fieldName: 'purchasesMade',        expectedLabel: 'Purchases Made' },
      { index: 27, fieldName: 'ltv',                  expectedLabel: 'LTV' },
      { index: 28, fieldName: 'visits',               expectedLabel: 'Visits' },
      { index: 29, fieldName: 'trialStatus',          expectedLabel: 'Trial Status' },
      { index: 30, fieldName: 'conversionStatus',     expectedLabel: 'Conversion Status' },
      { index: 31, fieldName: 'retentionStatus',      expectedLabel: 'Retention Status' },
    ],
  },
  {
    id: 'late-cancellations',
    label: 'Late Cancellations',
    tabName: 'Late Cancellations',
    spreadsheetId: '149ILDqovzZA6FRUJKOwzutWdVqmqWBtWPfzG3A0zxTI',
    mappingType: 'header',
    note: 'useLateCancellationsData — header names matched flexibly (case-insensitive).',
    headers: [
      { header: 'Host ID',                             fieldName: 'hostId',           required: true },
      { header: 'Report Run ID',                       fieldName: 'reportRunId' },
      { header: 'Report Generated At (IST)',           fieldName: 'reportGeneratedAt' },
      { header: 'Member ID',                           fieldName: 'memberId',         required: true },
      { header: 'Customer Name',                       fieldName: 'customerName',     required: true },
      { header: 'Customer Email',                      fieldName: 'customerEmail' },
      { header: 'Cancelled Event',                     fieldName: 'cancelledEvent',   required: true },
      { header: 'Cancelled Date (IST)',                fieldName: 'cancelledDateIST',  required: true },
      { header: 'Cancelled Day',                       fieldName: 'cancelledDay' },
      { header: 'Cancelled Time',                      fieldName: 'cancelledTime' },
      { header: 'Session Date (IST)',                  fieldName: 'sessionDateIST',    required: true },
      { header: 'Session Day',                         fieldName: 'sessionDay' },
      { header: 'Session Time',                        fieldName: 'sessionTime' },
      { header: 'Paid',                                fieldName: 'paid' },
      { header: 'Payment Method',                      fieldName: 'paymentMethod' },
      { header: 'Membership Name',                     fieldName: 'membershipName' },
      { header: 'Home Location',                       fieldName: 'location',         required: true },
      { header: 'Charged Penalty Amount In Currency',  fieldName: 'chargedPenaltyAmount' },
    ],
  },
  {
    id: 'expirations',
    label: 'Expirations / Lapsed',
    tabName: 'Lapsed',
    spreadsheetId: '1x-0iFgnYmEqt-b2MfAgHVx5CErcX5NtZYB9p5Rh6f1I',
    mappingType: 'header',
    note: 'useExpirationsData — fuzzy header lookup; aliases accepted (any match is fine).',
    headers: [
      { header: 'Member ID',       aliases: ['Membership Id'],                          fieldName: 'memberId',        required: true },
      { header: 'Member Email',    aliases: ['Email'],                                  fieldName: 'email' },
      { header: 'Member Phone',    aliases: ['Phone'],                                  fieldName: 'phone' },
      { header: 'Host ID',         aliases: ['Id'],                                     fieldName: 'hostId' },
      { header: 'Amount Paid',     aliases: ['Paid'],                                   fieldName: 'amountPaid' },
      { header: 'Total Sessions Completed', aliases: ['Current Usage'],                fieldName: 'totalSessions' },
      { header: 'Primary Location',aliases: ['Home Location'],                          fieldName: 'primaryLocation', required: true },
      { header: 'Membership Name',                                                      fieldName: 'membershipName',  required: true },
      { header: 'Purchase Date',   aliases: ['Start Date'],                             fieldName: 'startDate',       required: true },
      { header: 'End Date',        aliases: ['Expiry Date'],                            fieldName: 'endDate',         required: true },
      { header: 'Renewal Status',                                                       fieldName: 'renewalStatus' },
      { header: 'Product',                                                              fieldName: 'product' },
      { header: 'Category',                                                             fieldName: 'category' },
      { header: 'Class',           aliases: ['Class Name'],                             fieldName: 'class' },
      { header: 'Trainer',         aliases: ['Instructor'],                             fieldName: 'trainer' },
      { header: 'Membership Type', aliases: ['Type'],                                   fieldName: 'membershipType' },
      { header: 'Month Year',                                                           fieldName: 'monthYear' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    tabName: 'Sales',
    spreadsheetId: '1HbGnJk-peffUp7XoXSlsL55924E9yUt8cP_h93cdTT0',
    mappingType: 'header',
    note: 'useGoogleSheets (sales) — fuzzy header lookup by name.',
    headers: [
      { header: 'Member ID',                   fieldName: 'memberId',            required: true },
      { header: 'Customer Name',               fieldName: 'customerName' },
      { header: 'Customer Email',              fieldName: 'customerEmail' },
      { header: 'Sale Item ID',                fieldName: 'saleItemId' },
      { header: 'Payment Category',            fieldName: 'paymentCategory',     required: true },
      { header: 'Membership Type',             fieldName: 'membershipType' },
      { header: 'Payment Date',                fieldName: 'paymentDate',         required: true },
      { header: 'Payment Value',               fieldName: 'paymentValue',        required: true },
      { header: 'Paid in Money Credits',       fieldName: 'paidInMoneyCredits' },
      { header: 'Payment VAT',                 fieldName: 'paymentVat' },
      { header: 'Payment Item',                fieldName: 'paymentItem' },
      { header: 'Payment Status',              fieldName: 'paymentStatus' },
      { header: 'Payment Method',              fieldName: 'paymentMethod' },
      { header: 'Payment Transaction ID',      fieldName: 'transactionId' },
      { header: 'Stripe Token',                fieldName: 'stripeToken' },
      { header: 'Sold By',                     fieldName: 'soldBy' },
      { header: 'Sale Reference',              fieldName: 'saleReference' },
      { header: 'Calculated Location',         fieldName: 'calculatedLocation',  required: true },
      { header: 'Cleaned Product',             fieldName: 'cleanedProduct',      required: true },
      { header: 'Cleaned Category',            fieldName: 'cleanedCategory',     required: true },
      { header: 'Mrp - Pre Tax',               fieldName: 'mrpPreTax' },
      { header: 'Mrp - Post Tax',              fieldName: 'mrpPostTax' },
      { header: 'Discount Amount',             fieldName: 'discountAmount' },
      { header: 'Discount Percentage',         fieldName: 'discountPercentage' },
      { header: 'Discount Code',               fieldName: 'discountCode' },
      { header: 'Host Id',                     fieldName: 'hostId' },
      { header: 'Sec. Membership Start Date',  fieldName: 'secMembershipStartDate' },
      { header: 'Sec. Membership End Date',    fieldName: 'secMembershipEndDate' },
    ],
  },
  {
    id: 'new-clients',
    label: 'New Clients',
    tabName: 'New',
    spreadsheetId: import.meta.env.VITE_NEW_CLIENTS_SPREADSHEET_ID || '(set VITE_NEW_CLIENTS_SPREADSHEET_ID env var)',
    mappingType: 'header',
    note: 'useNewClientData — fuzzy header lookup. Spreadsheet ID comes from VITE_NEW_CLIENTS_SPREADSHEET_ID env var.',
    headers: [
      { header: 'Member Id',                  fieldName: 'memberId',             required: true },
      { header: 'First Name',                 fieldName: 'firstName' },
      { header: 'Last Name',                  fieldName: 'lastName' },
      { header: 'Email',                      fieldName: 'email' },
      { header: 'Phone Number',               fieldName: 'phone' },
      { header: 'First Visit Date',           fieldName: 'firstVisitDate',       required: true },
      { header: 'First Visit Entity Name',    fieldName: 'firstVisitEntityName' },
      { header: 'First Visit Type',           fieldName: 'firstVisitType' },
      { header: 'First Visit Location',       fieldName: 'firstVisitLocation',   required: true },
      { header: 'Payment Method',             fieldName: 'paymentMethod' },
      { header: 'Membership Used',            fieldName: 'membershipUsed' },
      { header: 'Home Location',              fieldName: 'homeLocation' },
      { header: 'Class No',                   fieldName: 'classNo' },
      { header: 'Trainer Name',               fieldName: 'trainerName' },
      { header: 'Is New',                     fieldName: 'isNew',                required: true },
      { header: 'Visits Post Trial',          fieldName: 'visitsPostTrial' },
      { header: 'Memberships Bought Post Trial', fieldName: 'membershipsBoughtPostTrial' },
      { header: 'Purchase Count Post Trial',  fieldName: 'purchaseCountPostTrial' },
      { header: 'Ltv',                        fieldName: 'ltv' },
      { header: 'Retention Status',           fieldName: 'retentionStatus' },
      { header: 'Conversion Status',          fieldName: 'conversionStatus' },
      { header: 'First Purchase Post Trial',  fieldName: 'firstPurchasePostTrial' },
      { header: 'First Purchase Date',        fieldName: 'firstPurchaseDate' },
      { header: 'Conversion Span (Days)',     fieldName: 'conversionSpanDays' },
      { header: 'Month Year',                 fieldName: 'monthYear',            required: true },
    ],
  },
];

// ─── Check result types ──────────────────────────────────────────────────────

type ColumnStatus = 'ok' | 'mismatch' | 'missing' | 'unchecked';

interface IndexCheckResult {
  index: number;
  expected: string;
  actual: string;
  status: ColumnStatus;
}

interface HeaderCheckResult {
  header: string;
  aliases: string[];
  fieldName: string;
  required: boolean;
  found: boolean;
  matchedAs?: string;
  status: ColumnStatus;
}

interface SheetCheckResult {
  sheetId: string;
  status: 'idle' | 'loading' | 'ok' | 'error' | 'warning';
  error?: string;
  indexResults?: IndexCheckResult[];
  headerResults?: HeaderCheckResult[];
  totalColumns?: number;
  matchCount?: number;
  mismatchCount?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function checkSheet(sheet: SheetDef): Promise<SheetCheckResult> {
  const { id, spreadsheetId, tabName, mappingType, columns, headers } = sheet;

  if (!spreadsheetId || spreadsheetId.includes('env var')) {
    return {
      sheetId: id,
      status: 'error',
      error: 'Spreadsheet ID not configured — set the env var.',
    };
  }

  let rows: any[][];
  try {
    rows = await fetchGoogleSheet(spreadsheetId, tabName, {
      valueRenderOption: 'FORMATTED_VALUE',
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    return {
      sheetId: id,
      status: 'error',
      error: msg.includes('502') || msg.includes('token')
        ? 'API not connected — configure Google credentials to run a live check.'
        : msg,
    };
  }

  const headerRow: string[] = (rows[0] || []).map((v: any) => String(v ?? '').trim());

  if (mappingType === 'index' && columns) {
    const results: IndexCheckResult[] = columns.map((col) => {
      const actual = headerRow[col.index] ?? '(empty)';
      const expected = col.expectedLabel ?? col.fieldName;
      const match = actual.toLowerCase() === expected.toLowerCase() ||
                    norm(actual) === norm(expected);
      return {
        index: col.index,
        expected,
        actual,
        status: actual === '(empty)' ? 'missing' : match ? 'ok' : 'mismatch',
      };
    });
    const matchCount = results.filter(r => r.status === 'ok').length;
    const mismatchCount = results.filter(r => r.status === 'mismatch').length;
    return {
      sheetId: id,
      status: mismatchCount > 0 ? 'warning' : 'ok',
      indexResults: results,
      totalColumns: columns.length,
      matchCount,
      mismatchCount,
    };
  }

  if (mappingType === 'header' && headers) {
    const normHeaders = headerRow.map(norm);
    const results: HeaderCheckResult[] = headers.map((h) => {
      const allNames = [h.header, ...(h.aliases ?? [])];
      const matchIdx = normHeaders.findIndex(nh => allNames.some(n => norm(n) === nh));
      const found = matchIdx !== -1;
      return {
        header: h.header,
        aliases: h.aliases ?? [],
        fieldName: h.fieldName,
        required: !!h.required,
        found,
        matchedAs: found ? headerRow[matchIdx] : undefined,
        status: found ? 'ok' : (h.required ? 'missing' : 'mismatch'),
      };
    });
    const matchCount = results.filter(r => r.found).length;
    const mismatchCount = results.filter(r => !r.found && r.required).length;
    return {
      sheetId: id,
      status: mismatchCount > 0 ? 'warning' : 'ok',
      headerResults: results,
      totalColumns: headers.length,
      matchCount,
      mismatchCount,
    };
  }

  return { sheetId: id, status: 'ok' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, matchCount, total, mismatchCount }: {
  status: SheetCheckResult['status'];
  matchCount?: number;
  total?: number;
  mismatchCount?: number;
}) {
  if (status === 'idle') return (
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
      Not checked
    </span>
  );
  if (status === 'loading') return (
    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
      <Loader2 className="h-3 w-3 animate-spin" /> Checking…
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
      <XCircle className="h-3 w-3" /> Error
    </span>
  );
  if (status === 'warning') return (
    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-600">
      <AlertCircle className="h-3 w-3" /> {mismatchCount} issue{mismatchCount !== 1 ? 's' : ''}
    </span>
  );
  if (status === 'ok' && matchCount !== undefined) return (
    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
      <CheckCircle2 className="h-3 w-3" /> {matchCount}/{total} matched
    </span>
  );
  return null;
}

function RowStatus({ status }: { status: ColumnStatus }) {
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === 'mismatch') return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
  if (status === 'missing') return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  return <div className="h-4 w-4 rounded-full border-2 border-slate-200 shrink-0" />;
}

function SheetCard({
  sheet,
  result,
}: {
  sheet: SheetDef;
  result: SheetCheckResult;
}) {
  const [expanded, setExpanded] = useState(false);
  const isIndex = sheet.mappingType === 'index';

  return (
    <div className={cn(
      'rounded-2xl border bg-white overflow-hidden transition-all',
      result.status === 'ok' ? 'border-slate-200' :
      result.status === 'warning' ? 'border-amber-200' :
      result.status === 'error' ? 'border-red-200' :
      'border-slate-200'
    )}>
      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/60 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white',
          isIndex ? 'bg-gradient-to-br from-violet-600 to-violet-700' : 'bg-gradient-to-br from-teal-600 to-teal-700'
        )}>
          {isIndex ? <Hash className="h-4 w-4" /> : <Text className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{sheet.label}</span>
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
              {sheet.tabName}
            </code>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              isIndex ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'
            )}>
              {isIndex ? 'Index-based' : 'Header-based'}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
              {sheet.spreadsheetId.slice(0, 30)}{sheet.spreadsheetId.length > 30 ? '…' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge
            status={result.status}
            matchCount={result.matchCount}
            total={result.totalColumns}
            mismatchCount={result.mismatchCount}
          />
          <ChevronDown className={cn(
            'h-4 w-4 text-slate-400 transition-transform duration-200',
            expanded ? 'rotate-180' : ''
          )} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          {sheet.note && (
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{sheet.note}</span>
            </div>
          )}

          {result.status === 'error' && result.error && (
            <div className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-600">
              {result.error}
            </div>
          )}

          {isIndex && sheet.columns && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-12 px-3 py-2 text-left font-semibold text-slate-500">Col</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">App field</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Expected label</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Actual in sheet</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sheet.columns.map((col, i) => {
                    const r = result.indexResults?.[i];
                    return (
                      <tr
                        key={col.index}
                        className={cn(
                          'border-b border-slate-50 last:border-0',
                          r?.status === 'mismatch' ? 'bg-amber-50/40' :
                          r?.status === 'missing' ? 'bg-red-50/40' :
                          r?.status === 'ok' ? '' : ''
                        )}
                      >
                        <td className="px-3 py-1.5">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                            {col.index}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{col.fieldName}</td>
                        <td className="px-3 py-1.5 text-slate-700">{col.expectedLabel ?? '—'}</td>
                        <td className="px-3 py-1.5">
                          {r?.actual != null ? (
                            <span className={cn(
                              'font-medium',
                              r.status === 'ok' ? 'text-emerald-700' :
                              r.status === 'mismatch' ? 'text-amber-700' :
                              'text-red-600'
                            )}>
                              {r.actual}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {r ? <RowStatus status={r.status} /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isIndex && sheet.headers && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Expected header</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Aliases</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">App field</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Matched as</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sheet.headers.map((h, i) => {
                    const r = result.headerResults?.[i];
                    return (
                      <tr
                        key={h.header}
                        className={cn(
                          'border-b border-slate-50 last:border-0',
                          r?.status === 'missing' && h.required ? 'bg-red-50/40' :
                          r?.status === 'mismatch' ? 'bg-amber-50/40' :
                          r?.status === 'ok' ? '' : ''
                        )}
                      >
                        <td className="px-3 py-1.5">
                          <span className="font-medium text-slate-700">{h.header}</span>
                          {h.required && (
                            <span className="ml-1.5 rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold uppercase text-red-600">
                              req
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-slate-400">
                          {h.aliases?.length ? h.aliases.join(', ') : '—'}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">{h.fieldName}</td>
                        <td className="px-3 py-1.5">
                          {r ? (
                            r.found ? (
                              <span className="text-emerald-700 font-medium">{r.matchedAs}</span>
                            ) : (
                              <span className="text-red-500 italic">not found</span>
                            )
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {r ? <RowStatus status={r.status} /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <a
            href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Open spreadsheet in Google Sheets
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const SheetStructureCheck: React.FC = () => {
  const [results, setResults] = useState<Record<string, SheetCheckResult>>(() =>
    Object.fromEntries(SHEETS.map(s => [s.id, { sheetId: s.id, status: 'idle' }]))
  );
  const [running, setRunning] = useState(false);

  const runCheck = async () => {
    setRunning(true);

    setResults(prev => {
      const next = { ...prev };
      SHEETS.forEach(s => { next[s.id] = { sheetId: s.id, status: 'loading' }; });
      return next;
    });

    await Promise.all(
      SHEETS.map(async (sheet) => {
        const result = await checkSheet(sheet);
        setResults(prev => ({ ...prev, [sheet.id]: result }));
      })
    );

    setRunning(false);
  };

  const allOk = Object.values(results).every(r => r.status === 'ok');
  const anyError = Object.values(results).some(r => r.status === 'error');
  const anyWarning = Object.values(results).some(r => r.status === 'warning');
  const anyChecked = Object.values(results).some(r => r.status !== 'idle');

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50/80">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-600 text-white shadow-lg">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Sheet Structure Check</p>
              <p className="mt-1 text-sm text-slate-500">
                {anyChecked
                  ? anyError
                    ? 'API not connected — connect credentials to run a live check'
                    : anyWarning
                    ? 'Some column mismatches detected — expand a sheet to see details'
                    : allOk
                    ? 'All sheets verified — column mapping matches expectations'
                    : 'Checking sheets…'
                  : `${SHEETS.length} sheets across 7 spreadsheets · ${SHEETS.filter(s => s.mappingType === 'index').length} index-based, ${SHEETS.filter(s => s.mappingType === 'header').length} header-based`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                runCheck();
              }}
              disabled={running}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-all hover:bg-violet-100 disabled:opacity-50"
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {running ? 'Checking…' : 'Run Live Check'}
            </button>
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
          </div>
        </summary>

        <div className="border-t border-slate-200/80 bg-gradient-to-br from-slate-50/70 to-white p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-violet-100">
                <Hash className="h-3 w-3 text-violet-600" />
              </span>
              <span><strong className="text-slate-700">Index-based</strong> — column ORDER is critical. A reordered sheet will break data.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-teal-100">
                <Text className="h-3 w-3 text-teal-600" />
              </span>
              <span><strong className="text-slate-700">Header-based</strong> — columns can be reordered safely; only header names must match.</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {SHEETS.map(sheet => (
              <SheetCard
                key={sheet.id}
                sheet={sheet}
                result={results[sheet.id]}
              />
            ))}
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            Click <strong>Run Live Check</strong> to fetch the actual header row from each sheet and compare it to what the app expects.
            Requires Google API credentials to be configured.
          </p>
        </div>
      </details>
    </div>
  );
};
