
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void;
  dateRange: DateRange;
}

const DateRangeFilter = ({ onDateRangeChange, dateRange }: DateRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (range: any) => {
    onDateRangeChange(range || { from: undefined, to: undefined });
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  };

  const clearDateRange = () => {
    onDateRangeChange({ from: undefined, to: undefined });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, 'MMM dd, yyyy')}`;
    }
    return 'Select date range';
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {(dateRange.from || dateRange.to) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearDateRange}
          className="h-10 w-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default DateRangeFilter;
