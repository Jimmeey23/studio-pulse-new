import React from 'react';
import { shallowEqual } from '@/utils/performanceUtils';

/**
 * Higher-order component to wrap table components with memoization
 */
export const withTableMemoization = <P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
): React.MemoExoticComponent<React.ComponentType<P>> => {
  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison for better performance
    return shallowEqual(prevProps, nextProps);
  });
  
  MemoizedComponent.displayName = displayName || Component.displayName || Component.name;
  
  return MemoizedComponent;
};

/**
 * Memoized table row component
 */
export const MemoizedTableRow = React.memo<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}>(
  ({ children, className, onClick, style }) => (
    <tr className={className} onClick={onClick} style={style}>
      {children}
    </tr>
  ),
  (prev, next) => 
    prev.className === next.className &&
    prev.onClick === next.onClick &&
    shallowEqual(prev.style, next.style)
);

MemoizedTableRow.displayName = 'MemoizedTableRow';

/**
 * Memoized table cell component
 */
export const MemoizedTableCell = React.memo<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  colSpan?: number;
  title?: string;
}>(
  ({ children, className, onClick, colSpan, title }) => (
    <td className={className} onClick={onClick} colSpan={colSpan} title={title}>
      {children}
    </td>
  ),
  (prev, next) => 
    prev.children === next.children &&
    prev.className === next.className &&
    prev.onClick === next.onClick &&
    prev.colSpan === next.colSpan &&
    prev.title === next.title
);

MemoizedTableCell.displayName = 'MemoizedTableCell';

/**
 * Memoized header cell component
 */
export const MemoizedTableHeader = React.memo<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}>(
  ({ children, className, onClick, title }) => (
    <th className={className} onClick={onClick} title={title}>
      {children}
    </th>
  )
);

MemoizedTableHeader.displayName = 'MemoizedTableHeader';
