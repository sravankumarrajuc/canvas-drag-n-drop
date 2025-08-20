import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TriggerNodeProps {
  data: {
    label: string;
    config: {
      method?: string;
      path?: string;
    };
  };
  selected?: boolean;
}

export const TriggerNode = ({ data, selected }: TriggerNodeProps) => {
  return (
    <Card className={`p-3 min-w-[150px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="p-1 bg-green-100 dark:bg-green-900 rounded">
          <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.config.method} {data.config.path}
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