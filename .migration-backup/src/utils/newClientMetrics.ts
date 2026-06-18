
import { NewClientData } from '@/types/dashboard';
import { format, parseISO, isValid } from 'date-fns';
import { logger } from './logger';

export const calculateNewClientMetrics = (data: NewClientData[]) => {
  logger.debug('Calculating new client metrics for:', data.length, 'records');

  // Group data by month and trainer
  const monthlyData = data.reduce((acc, client) => {
    try {
      // Parse the date from various formats
      let date: Date;
      const dateStr = client.firstVisitDate;
      
      if (dateStr.includes('/')) {
        // Handle DD/MM/YYYY HH:MM:SS format
        const [datePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        date = parseISO(dateStr);
      }

      if (!isValid(date)) {
        logger.warn('Invalid date:', dateStr);
        return acc;
      }

      const monthKey = format(date, 'MMM-yyyy');
      const trainerName = client.trainerName || 'Unknown';

      if (!acc[monthKey]) {
        acc[monthKey] = {};
      }

      if (!acc[monthKey][trainerName]) {
        acc[monthKey][trainerName] = {
          monthYear: monthKey,
          trainerName,
          newMembers: 0,
          retainedMembers: 0,
          convertedMembers: 0,
          totalLtv: 0,
          totalConversionSpan: 0,
          conversionSpanCount: 0,
          totalMembers: 0,
        };
      }

      const trainer = acc[monthKey][trainerName];
      trainer.totalMembers += 1;

      // Count new members
      if (client.isNew.includes('New')) {
        trainer.newMembers += 1;
      }

      // Count retained members
      if (client.retentionStatus === 'Retained') {
        trainer.retainedMembers += 1;
      }

      // Count converted members
      if (client.conversionStatus === 'Converted') {
        trainer.convertedMembers += 1;
      }

      // Sum LTV
      trainer.totalLtv += client.ltv;

      // Sum conversion span for average calculation
      if (client.conversionSpan > 0) {
        trainer.totalConversionSpan += client.conversionSpan;
        trainer.conversionSpanCount += 1;
      }

    } catch (error) {
      logger.error('Error processing client:', { client, error });
    }

    return acc;
  }, {} as Record<string, Record<string, any>>);

  // Flatten and calculate percentages
  const metrics = Object.values(monthlyData).flatMap(monthData =>
    Object.values(monthData).map((trainer: any) => ({
      ...trainer,
      retentionPercentage: trainer.totalMembers > 0 ? (trainer.retainedMembers / trainer.totalMembers) * 100 : 0,
      conversionPercentage: trainer.totalMembers > 0 ? (trainer.convertedMembers / trainer.totalMembers) * 100 : 0,
      averageLtv: trainer.totalMembers > 0 ? trainer.totalLtv / trainer.totalMembers : 0,
      averageConversionSpan: trainer.conversionSpanCount > 0 ? trainer.totalConversionSpan / trainer.conversionSpanCount : 0,
    }))
  );

  logger.debug('Calculated metrics:', metrics.length, 'trainer-month combinations');
  return metrics;
};

export const getNewClientMetrics = (data: NewClientData[]) => {
  const totalClients = data.length;
  const convertedClients = data.filter(client => client.conversionStatus === 'Converted').length;
  const retainedClients = data.filter(client => client.retentionStatus === 'Retained').length;
  const totalLtv = data.reduce((sum, client) => sum + client.ltv, 0);
  const avgLtv = totalClients > 0 ? totalLtv / totalClients : 0;
  const conversionRate = totalClients > 0 ? (convertedClients / totalClients) * 100 : 0;
  const retentionRate = totalClients > 0 ? (retainedClients / totalClients) * 100 : 0;

  return [
    {
      title: "Total New Clients",
      value: totalClients.toString(),
      change: 12.5,
      description: "New customer acquisitions this period",
      calculation: "Total count of new client records",
      icon: "users"
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
      change: 8.3,
      description: "Percentage of clients who converted to memberships",
      calculation: "Converted clients / Total clients",
      icon: "target"
    },
    {
      title: "Retention Rate",
      value: `${retentionRate.toFixed(1)}%`,
      change: 15.7,
      description: "Clients retained after trial period",
      calculation: "Retained clients / Total clients",
      icon: "trending-up"
    },
    {
      title: "Average LTV",
      value: `$${avgLtv.toFixed(0)}`,
      change: 9.2,
      description: "Average lifetime value per client",
      calculation: "Total LTV / Total clients",
      icon: "credit-card"
    }
  ];
};

export const getUniqueTrainers = (data: NewClientData[]) => {
  const trainers = [...new Set(data.map(client => client.trainerName).filter(Boolean))];
  return trainers.sort();
};

export const getUniqueLocations = (data: NewClientData[]) => {
  const locations = [...new Set(data.map(client => client.firstVisitLocation).filter(Boolean))];
  return locations.sort();
};

export const getTopBottomTrainers = (metrics: any[], criterion: string, limit = 5) => {
  const trainerSummary = metrics.reduce((acc, metric) => {
    const trainer = metric.trainerName;
    if (!acc[trainer]) {
      acc[trainer] = {
        trainerName: trainer,
        totalNewMembers: 0,
        totalRetainedMembers: 0,
        totalConvertedMembers: 0,
        totalMembers: 0,
        totalLtv: 0,
        totalConversionSpan: 0,
        conversionSpanCount: 0,
        monthCount: 0,
      };
    }

    acc[trainer].totalNewMembers += metric.newMembers;
    acc[trainer].totalRetainedMembers += metric.retainedMembers;
    acc[trainer].totalConvertedMembers += metric.convertedMembers;
    acc[trainer].totalMembers += metric.totalMembers;
    acc[trainer].totalLtv += metric.totalLtv;
    acc[trainer].totalConversionSpan += metric.totalConversionSpan;
    acc[trainer].conversionSpanCount += metric.conversionSpanCount;
    acc[trainer].monthCount += 1;

    return acc;
  }, {} as Record<string, any>);

  const summaryArray = Object.values(trainerSummary).map((trainer: any) => ({
    ...trainer,
    averageRetentionRate: trainer.totalMembers > 0 ? (trainer.totalRetainedMembers / trainer.totalMembers) * 100 : 0,
    averageConversionRate: trainer.totalMembers > 0 ? (trainer.totalConvertedMembers / trainer.totalMembers) * 100 : 0,
    averageLtv: trainer.totalMembers > 0 ? trainer.totalLtv / trainer.totalMembers : 0,
    averageConversionSpan: trainer.conversionSpanCount > 0 ? trainer.totalConversionSpan / trainer.conversionSpanCount : 0,
  }));

  const sortKey = {
    'newMembers': 'totalNewMembers',
    'retentionRate': 'averageRetentionRate',
    'conversionRate': 'averageConversionRate',
    'ltv': 'averageLtv',
    'conversionSpan': 'averageConversionSpan',
  }[criterion] || 'totalNewMembers';

  const sorted = summaryArray.sort((a, b) => b[sortKey] - a[sortKey]);

  return {
    top: sorted.slice(0, limit),
    bottom: sorted.slice(-limit).reverse(),
  };
};
