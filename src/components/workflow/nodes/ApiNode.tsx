import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ApiNodeProps {
  data: {
    label: string;
    config: {
      url?: string;
      method?: string;
    };
  };
  selected?: boolean;
}

export const ApiNode = ({ data, selected }: ApiNodeProps) => {
  return (
    <Card className={`p-3 min-w-[150px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !border-primary-foreground"
      />
      
      <div className="flex items-center gap-2">
        <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded">
          <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            {data.config.method} API Call
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