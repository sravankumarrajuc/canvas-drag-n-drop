import { Handle, Position } from '@xyflow/react';
import { Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UtilityNodeProps {
  data: {
    label: string;
    config: {
      type?: string;
      duration?: number;
    };
  };
  selected?: boolean;
}

export const UtilityNode = ({ data, selected }: UtilityNodeProps) => {
  return (
    <Card className={`p-3 min-w-[150px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !border-primary-foreground"
      />
      
      <div className="flex items-center gap-2">
        <div className="p-1 bg-orange-100 dark:bg-orange-900 rounded">
          <Settings className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.config.type || 'Utility'}
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !border-primary-foreground"
      />
    </Card>
  );
};