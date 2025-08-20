import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  Save, 
  FolderOpen, 
  Download, 
  Upload,
  Zap,
  Code,
  Globe,
  Settings,
  Brain
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkflowStore } from '@/stores/workflowStore';
import { toast } from 'sonner';

export const WorkflowToolbar: React.FC = () => {
  const { 
    nodes, 
    edges, 
    addNode, 
    isExecuting, 
    executeWorkflow, 
    clearExecution 
  } = useWorkflowStore();

  const createNode = (type: 'trigger' | 'function' | 'api' | 'utility' | 'llm') => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    const nodeConfig = {
      trigger: { label: 'HTTP Trigger', config: { method: 'POST', path: '/webhook' } },
      function: { label: 'Function', config: { code: 'return { result: input.value * 2 };' } },
      api: { label: 'API Call', config: { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' } },
      utility: { label: 'Transform', config: { operation: 'transform', parameters: '{}' } },
      llm: { label: 'LLM Processor', config: { prompt: 'Process this data and provide insights', model: 'gemini-1.5-flash' } },
    };

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: nodeConfig[type],
    };

    addNode(newNode);
    toast.success(`Added ${type} node`);
  };

  const saveWorkflow = () => {
    const workflow = { nodes, edges };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Workflow saved');
  };

  const loadWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        // In a real app, you'd validate the structure
        useWorkflowStore.setState({ 
          nodes: workflow.nodes || [], 
          edges: workflow.edges || [] 
        });
        toast.success('Workflow loaded');
      } catch (error) {
        toast.error('Failed to load workflow');
      }
    };
    reader.readAsText(file);
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      toast.error('Add some nodes first');
      return;
    }
    
    toast.info('Executing workflow...');
    await executeWorkflow();
    toast.success('Workflow execution completed');
  };

  return (
    <div className="border-b border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            Workflow Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Node Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => createNode('trigger')}>
                <Zap className="mr-2 h-4 w-4" />
                Trigger Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createNode('function')}>
                <Code className="mr-2 h-4 w-4" />
                Function Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createNode('api')}>
                <Globe className="mr-2 h-4 w-4" />
                API Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createNode('utility')}>
                <Settings className="mr-2 h-4 w-4" />
                Utility Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createNode('llm')}>
                <Brain className="mr-2 h-4 w-4" />
                LLM Processor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Execution Controls */}
          <Button 
            onClick={handleExecute} 
            disabled={isExecuting}
            variant="default"
            size="sm"
          >
            {isExecuting ? (
              <Square className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isExecuting ? 'Executing' : 'Run'}
          </Button>

          <Button 
            onClick={clearExecution} 
            variant="outline" 
            size="sm"
          >
            Clear Results
          </Button>

          {/* File Operations */}
          <Button onClick={saveWorkflow} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={loadWorkflow}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};