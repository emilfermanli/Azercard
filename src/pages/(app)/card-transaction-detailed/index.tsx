import { Fragment, useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { BreakdownColumn } from './_components/breakdown-column';
import { FiltersDrawer } from './_components/filters-drawer';
import { ParameterRail } from './_components/parameter-rail';
import { Toolbar } from './_components/toolbar';
import { COLUMNS, ISSUING_HINT } from './_constants';
import { useTdData } from './_hooks/use-td-data';
import { useTdFilters } from './_hooks/use-td-filters';
import type { ColumnKey, DisplayMode, Measure } from './_types';
import { mutedText } from './_utils';

const CardTransactionDetailedPage: React.FC = () => {
  const isDark = useShellTheme();
  const [measure, setMeasure] = useState<Measure>('amount');
  const [display, setDisplay] = useState<DisplayMode>('pct');

  // Soldakı paneldən hansı sütunların görünməsi (default: Bank açıq).
  const [visible, setVisible] = useState<Record<ColumnKey, boolean>>({
    bank: true,
    device: false,
    issuing: false,
    targetBank: false,
  });
  const toggleVisible = (key: ColumnKey) =>
    setVisible((current) => ({ ...current, [key]: !current[key] }));

  const filters = useTdFilters();
  const data = useTdData({
    apiArgs: filters.apiArgs,
    measure,
    selections: filters.selections,
  });

  const shownColumns = COLUMNS.filter((col) => visible[col.key]);

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

      <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
        <ParameterRail visible={visible} onToggle={toggleVisible} />

        {shownColumns.length === 0 ? (
          <div
            className={['flex flex-1 items-center justify-center rounded-xl border border-dashed py-16 text-sm', mutedText(isDark)].join(
              ' '
            )}
          >
            Soldan ən azı bir parametr seçin
          </div>
        ) : (
          shownColumns.map((col) => (
            <Fragment key={col.key}>
              {/* Sütunlar arası ox işarəsi. */}
              <div className="flex shrink-0 items-center">
                <ChevronRight className={['h-6 w-6', mutedText(isDark)].join(' ')} />
              </div>
              <div className="min-w-[14rem] flex-1">
                <BreakdownColumn
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
              </div>
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default CardTransactionDetailedPage;
