import { useState } from 'react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { BreakdownColumn } from './_components/breakdown-column';
import { FiltersDrawer } from './_components/filters-drawer';
import { Toolbar } from './_components/toolbar';
import { COLUMNS, ISSUING_HINT } from './_constants';
import { useTdData } from './_hooks/use-td-data';
import { useTdFilters } from './_hooks/use-td-filters';
import type { DisplayMode, Measure } from './_types';
import { mutedText } from './_utils';

const CardTransactionDetailedPage: React.FC = () => {
  const isDark = useShellTheme();
  const [measure, setMeasure] = useState<Measure>('amount');
  const [display, setDisplay] = useState<DisplayMode>('pct');

  const filters = useTdFilters();
  const data = useTdData({
    apiArgs: filters.apiArgs,
    measure,
    selections: filters.selections,
  });

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <FiltersDrawer filters={filters} />

      <Toolbar
        kpi={data.kpi}
        measure={measure}
        onMeasureChange={setMeasure}
        display={display}
        onDisplayChange={setDisplay}
        chips={filters.chips}
        onClearChip={filters.clearColumn}
      />

      <p className={['px-1 text-xs', mutedText(isDark)].join(' ')}>{ISSUING_HINT}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <BreakdownColumn
            key={col.key}
            title={col.title}
            subtitle={col.subtitle}
            rows={data.columnData[col.key]}
            measure={measure}
            display={display}
            onSelect={(value) => filters.toggleColumn(col.key, value)}
            hint={
              col.key === 'targetBank'
                ? 'Target bank bölgüsü üçün İssuing kateqoriya seçin'
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

export default CardTransactionDetailedPage;
