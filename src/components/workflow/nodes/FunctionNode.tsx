import { Handle, Position } from '@xyflow/react';
import { Code } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FunctionNodeProps {
  data: {
    label: string;
    config: {
      code?: string;
    };
  };
  selected?: boolean;
}

export const FunctionNode = ({ data, selected }: FunctionNodeProps) => {
  return (
    <Card className={`p-3 min-w-[150px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !border-primary-foreground"
      />
      
      <div className="flex items-center gap-2">
        <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
          <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-muted-foreground">
            JavaScript Function
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